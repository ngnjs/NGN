// [PARTIAL]

/**
 * @class NGN.DATA.Model
 * Represents a data model/record.
 * @fires field.update
 * Fired when a datafield value is changed.
 * @fires field.create {NGN.DATA.Field}
 * Fired when a datafield is created.
 * @fires field.remove
 * Fired when a datafield is deleted.
 * @fires field.invalid
 * Fired when an invalid value is detected in an data field.
 */
class NGNDataModel extends NGN.EventEmitter {
  constructor (cfg) {
    cfg = cfg || {}

    super()

    const me = this

    // Create private attributes & data placeholders
    Object.defineProperties(this, {
      /**
       * @property {Symbol} OID
       * A unique object ID assigned to the model. This is an
       * internal readon-only reference.
       * @private
       */
      OID: NGN.privateconst(Symbol('model.id')),

      METADATA: NGN.privateconst({
        /**
         * @cfg {string} [name]
         * A descriptive name for the model. This is typically used for
         * debugging, logging, and (somtimes) data proxies.
         */
        name: NGN.coalesce(cfg.name, 'Untitled Model'),

        /**
         * @cfg {String} [idAttribute='id']
         * Setting this allows an attribute of the object to be used as the ID.
         * For example, if an email is the ID of a user, this would be set to
         * `email`.
         */
        idAttribute: NGN.coalesce(cfg.idField, cfg.idAttribute) || 'id',

        /**
         * @cfg {object} fields
         * A private object containing the data fields of the model.
         * Each key contains the field name, while each value can be one of
         * the following:
         *
         * - Primitive (String, Number, RegExp, Boolean)
         * - Standard Type (Array, Object, Date)
         * - Custom Class
         * - NGN.DATA.Field
         * - An NGN.DATA.Field configuration
         * - `null` (Defaults to String primitive)
         *
         * ```js
         * fields: {
         *   a: String,
         *   b: Date,
         *   c: MyCustomClass,
         *   d: new NGN.DATA.Field({
         *     required: true,
         *     type: String,
         *     default: 'some default value'
         *   }),
         *   e: {
         *     required: true,
         *     type: String,
         *     default: 'some default value'
         *   },
         *   f: null // Uses default field config (String)
         * }
         * ```
         *
         * Extensions of the NGN.DATA.Field are also supported,
         * such as NGN.DATA.VirtualField and NGN.DATA.Relationship.
         */
        fields: NGN.coalesce(cfg.fields),
        knownFieldNames: new Set(),
        invalidFieldNames: new Set(),
        auditFieldNames: NGN.coalesce(cfg.audit, false) ? new Set() : null,

        /**
         * @property {Object}
         * Custom validation rules used to verify the integrity of the entire
         * model. This only applies to the full model. Individual data fields
         * may have their own validators.
         */
        validators: NGN.coalesce(cfg.rules, cfg.rule, cfg.validators, {}),

        /**
         * @cfgproperty {boolean} [validation=true]
         * Toggle data validation using this.
         */
        validation: NGN.coalesce(cfg.validation, true),

        /**
         * @cfg {boolean} [autoid=false]
         * If the NGN.DATA.Model#idAttribute/id is not provided for a record,
         * unique ID will be automatically generated for it. This means there
         * will not be a `null` ID.
         *
         * An NGN.DATA.Store using a model with this set to `true` will never
         * have a duplicate record, since the #id or #idAttribute will always
         * be unique.
         */
        autoid: NGN.coalesce(cfg.autoid, false),

        IdentificationField: 'id',
        IdentificationValue: null,

        /**
         * @cfgproperty {Date|Number} [expires]
         * When this is set to a date/time, the model record will be marked
         * as expired at the specified time/date. If a number is specified
         * (milliseconds), the record will be marked as expired after the
         * specified time period has elapsed. When a record/model is marked as
         * "expired", it triggers the `expired` event. By default, expired
         * records/models within an NGN.DATA.Store will be removed from the store.
         *
         * Setting this to any value less than `0` disables expiration.
         * @fires expired
         * Triggered when the model/record expires.
         */
        expiration: NGN.coalesce(cfg.expires),

        // Holds a setTimeout method for expiration events.
        expirationTimeout: null,

        created: Date.now(),
        changelog: null,
        store: null,

        /**
         * @cfg {boolean} [audit=false]
         * Enable auditing to support #undo/#redo operations. This creates and
         * manages a NGN.DATA.TransactionLog.
         */
        AUDITABLE: NGN.coalesce(cfg.audit, false),
        AUDITLOG: NGN.coalesce(cfg.audit, false) ? new NGN.DATA.TransactionLog() : null,
        AUDIT_HANDLER: function (change) {
          if (change.hasOwnProperty('cursor')) {
            me.METADATA.AUDITLOG.commit(me.METADATA.getAuditMap())
          }
        },

        EVENTS: new Set([
          'field.update',
          'field.create',
          'field.remove',
          'field.invalid',
          'field.valid',
          'field.hidden',
          'field.unhidden',
          'field.rule.add',
          'field.rule.remove',
          'rule.add',
          'rule.remove',
          'relationship.create',
          'relationship.remove',
          'expired',
          'deleted',
          'reset',
          'load'
        ]),

        /**
         * An internal method used to apply field definitions to the model.
         * @param  {string} fieldname
         * Name of the field (as applied to the model).
         * @param  {NGN.DATA.Field|Object|Primitive} [cfg=null]
         * The configuration to apply. See #addField for details.
         * @param  {Boolean} [suppressEvents=false]
         * Optionally suppress the `field.create` event.
         * @private
         */
        applyField: (field, cfg = null, suppressEvents = false) => {
          // Prevent duplicate fields
          if (this.METADATA.knownFieldNames.has(field)) {
            return NGN.WARN(`Duplicate field "${field}" detected.`)
          }

          // Prevent reserved words
          if (this.hasOwnProperty(field) && field.toLowerCase() !== 'id') {
            throw new ReservedWordError(`"${field}" cannot be used as a field name (reserved word).`)
          }

          // If the field config isn't already an NGN.DATA.Field, create it.
          if (!(cfg instanceof NGN.DATA.Field)) {
            if (cfg instanceof NGN.DATA.Store || cfg instanceof NGN.DATA.Model) {
              if (this.METADATA.idAttribute === field) {
                throw new InvalidConfigurationError(`"${field}" cannot be an ID. Relationship fields cannot be an identification attribute.`)
              }

              this.METADATA.fields[field] = new NGN.DATA.Relationship({
                name: field,
                record: cfg,
                model: this
              })
            } else {
              switch (NGN.typeof(cfg)) {
                // Custom config
                case 'object':
                  cfg.model = this
                  cfg.identifier = NGN.coalesce(cfg.identifier, this.METADATA.idAttribute === field)
                  cfg.name = field

                  this.METADATA.fields[field] = new NGN.DATA.Field(cfg)

                  break

                // Collection of models
                case 'array':
                  return this.applyField(field, cfg[0], suppressEvents)

                // Type-based cfg.
                default:
                  if (NGN.isFn(cfg) || cfg === null) {
                    if (NGN.isFn(cfg) && ['string', 'number', 'boolean', 'number', 'symbol', 'regexp', 'date', 'array', 'object'].indexOf(NGN.typeof(cfg)) < 0) {
                      this.METADATA.fields[field] = new NGN.DATA.VirtualField({
                        name: field,
                        model: this,
                        method: cfg
                      })

                      break
                    }

                    this.METADATA.fields[field] = new NGN.DATA.Field({
                      name: field,
                      type: cfg,
                      model: this
                    })

                    break
                  }

                  this.METADATA.fields[field] = new NGN.DATA.Field({
                    name: field,
                    type: NGN.isFn(cfg) ? cfg : String,
                    identifier: NGN.isFn(cfg)
                      ? false
                      : NGN.coalesce(cfg.identifier, this.METADATA.idAttribute === field),
                    model: this
                  })

                  break
              }
            }
          } else if (cfg.model === null) {
            cfg.name = field
            cfg.identifier = cfg.identifier = NGN.coalesce(cfg.identifier, this.METADATA.idAttribute === field)

            this.METADATA.fields[field] = cfg
            this.METADATA.fields[field].model = this
          } else if (cfg.model === this) {
            cfg.identifier = NGN.coalesce(cfg.identifier, this.METADATA.idAttribute === field)

            this.METADATA.fields[field] = cfg
          } else {
            return NGN.WARN(`The "${cfg.name}" field cannot be applied because a model is already specified.`)
          }

          // Add a direct reference to the model.
          Object.defineProperty(this, field, {
            enumerable: true,
            configurable: true,
            get: () => this.METADATA.fields[field].value,
            set: (value) => this.METADATA.fields[field].value = value
          })

          // Enable auditing if necessary.
          if (this.METADATA.AUDITABLE) {
            if (this.METADATA.fields[field].fieldType !== 'virtual') {
              this.METADATA.fields[field].auditable = true
              this.METADATA.auditFieldNames.add(field)
            }
          }

          // Add the field to the list
          this.METADATA.knownFieldNames.add(field)

          // this.METADATA.fields[field].on('*', function () { console.log(this.event) })
          this.METADATA.fields[field].relay('*', this, 'field.')

          if (!suppressEvents) {
            this.emit('field.create', this.METADATA.fields[field])
          }
        },

        /**
         * An internal helper method for applying changes to the model.
         * @param  {String} [type='undo']
         * This can be `undo` or `redo`.
         * @param  {Number} [count=1]
         * The number of cursor indexes to shift
         * @param  {Boolean} [suppressEvents=false]
         * Indicates events should be suppressed.
         * @private
         */
        applyChange: (type = 'undo', count = 1, suppressEvents = false) => {
          if (!this.METADATA.AUDITABLE) {
            NGN.WARN(`The ${type} operation failed on the ${this.name} model because auditing is disabled.`)
            return
          }

          this.METADATA.AUDITLOG[type === 'undo' ? 'rollback' : 'advance'](count)

          let data = this.METADATA.AUDITLOG.currentValue

          if (data) {
            this.METADATA.auditFieldNames.forEach(fieldname => {
              let field = this.METADATA.fields[fieldname]
              let log = field.METADATA.AUDITLOG

              if (log.cursor !== data[fieldname]) {
                if (typeof data[fieldname] === 'symbol') {
                  log.cursor = data[fieldname]
                } else {
                  log.cursor = null
                }

                field.METADATA.setValue(NGN.coalesce(log.currentValue, field.default), suppressEvents, true)
              }
            })
          }
        },

        /**
         * Generates a key/value representation of the model where
         * each key represents an auditable field and each value is the
         * transaction cursor ID.
         * @return {Object}
         * @private
         */
        getAuditMap: () => {
          let map = {}

          this.METADATA.auditFieldNames.forEach(field => {
            map[field] = this.METADATA.fields[field].METADATA.AUDITLOG.cursor
          })

          return map
        },

        /**
         * Restore the model to a specific audit map (i.e. historical state
         * of multiple fields).
         * @param {Object} map
         * The audit map to restore.
         */
        // restore: (map) => {
        //   let keys = Object.keys(map)
        //
        //   for (let i = 0; i < keys.length; i++) {
        //     if (this.METADATA.knownFieldNames.has(keys[i]) && typeof map[keys[i]] === 'symbol') {
        //       console.log('Has', keys[i])
        //
        //     }
        //   }
        // },

        // Deprecations
        setSilent: NGN.deprecate(this.setSilentFieldValue, 'setSilent has been deprecated. Use setSilentFieldValue instead.')
      })
    })

    // Bubble events to the BUS
    // for (let i = 0; i < this.METADATA.EVENTS.length; i++) {
    //   this.on(this.METADATA.EVENTS[i], function () {
    //     let args = NGN.slice(arguments)
    //
    //     args.push(this)
    //     args.unshift(this.METADATA.EVENTS[i])
    //
    //     NGN.BUS.emit.apply(NGN.BUS, args)
    //   })
    // }

    // Add data fields.
    let fields = Object.keys(this.METADATA.fields)
    for (let i = 0; i < fields.length; i++) {
      let name = fields[i]

      if (this.METADATA.knownFieldNames.has(name)) {
        NGN.WARN(`Duplicate field "${name}" detected.`)
      } else {
        // Configure a data field for each configuration.
        this.METADATA.applyField(name, this.METADATA.fields[name], true)
      }
    }

    // Track Changes (if auditing enabled)
    if (this.METADATA.AUDITABLE) {
      this.on('field.update', this.METADATA.AUDIT_HANDLER)
    }
  }

  set auditable (value) {
    value = NGN.forceBoolean(value)

    if (value !== this.METADATA.AUDITABLE) {
      this.METADATA.AUDITABLE = value
      this.METADATA.AUDITLOG = value ? new NGN.DATA.TransactionLog() : null
      this.METADATA.auditFieldNames = value ? new Set() : null

      // Set each field to an auditable state (or not).
      this.METADATA.knownFieldNames.forEach(fieldname => {
        if (!this.METADATA.fields[fieldname].virtual) {
          this.METADATA.fields[fieldname].auditable = value

          if (value) {
            this.METADATA.auditFieldNames.add(fieldname)
          }
        }
      })

      if (value) {
        this.on('field.transaction.*', (id) => {
          this.METADATA.AUDIT_HANDLER({ cursor: id })
        })
      } else {
        this.METADATA.auditFieldNames.clear()
        this.off('field.transaction.*')
      }
    }
  }

  /**
   * The unique ID assigned to the model.
   * @return {string}
   */
  get id () {
    return this.get(this.IdentificationField)
  }

  set id (value) {
    this.set('id', value)
  }

  /**
   * @property ID
   * An alias for #id.
   */
  get ID () {
    return this.id
  }

  set ID (value) {
    this.set('id', value)
  }

  /**
   * @property {Array} changelog
   * The changelog returns the underlying NGN.DATA.TransactionLog#log if
   * auditing is available. The array will be empty if auditing is disabled.
   */
  get changelog () {
    return this.METADATA.AUDITLOG.log.map(entry => {
      let result = {
        timestamp: entry.timestamp,
        activeCursor: entry.activeCursor,
        value: {}
      }

      let data = entry.value
      let field = Object.keys(data)

      for (let i = 0; i < field.length; i++) {
        if (typeof data[field[i]] === 'symbol') {
          result.value[field[i]] = NGN.coalesce(
            this.METADATA.fields[field[i]].METADATA.AUDITLOG.getCommit(data[field[i]]).value,
            this.METADATA.fields[field[i]].default
          )
        } else {
          result.value[field[i]] = NGN.coalesce(this.METADATA.fields[field[i]].default)
        }
      }

      return result
    })
  }

  /**
   * @property {Number} createDate
   * The date/time when the model is created.
   */
  get createDate () {
    return this.METADATA.created
  }

  get data () {
    return this.serializeFields()
  }

  get representation () {
    return this.serializeFields(false, false)
  }

  serializeFields (ignoreID = false, ignoreVirtualFields = true) {
    if (this.METADATA.knownFieldNames.size === 0) {
      return {}
    }

    let fields = this.METADATA.knownFieldNames.keys()
    let result = {}
    let fieldname = fields.next()

    while (!fieldname.done) {
      let field = this.METADATA.fields[fieldname.value]

      // Ignore unserializable fields
      if ((

        field.value === undefined ||
        (ignoreID && fieldname.value === this.idAttribute) ||
        (!field.virtual || (!ignoreVirtualFields && field.virtual))
      )) {
        // Do not serialize hidden values or virtuals
        if (!field.hidden) {
          switch (NGN.typeof(field.value)) {
            case 'array':
            case 'object':
              result[fieldname.value] = NGN.DATA.UTILITY.serialize(field.value)
              break

            default:
              result[fieldname.value] = field.value
          }
        }
      }

      fieldname = fields.next()
    }

    return result
  }

  serialize () {
    return NGN.deprecate(this.serializeFields, 'serialize is now serializeFields. Use NGN.DATA.UTILITY.serialize for generic object serialization.')
  }

  /**
   * Determines whether a field exists in the model or not.
   * @param  {string} field
   * Name of the field to check for.
   * @return {boolean}
   */
  fieldExists (field) {
    return this.METADATA.knownFieldNames.has(field)
  }

  /**
   * Retrieve the value of the specified field.
   * @param  {string} field
   * Name of the field whose value should be returned.
   * @return {any}
   * Returns the value of the field.
   */
  get (field) {
    if (field === 'id' || field === 'ID') {
      field = this.METADATA.IdentificationValue
    }

    if (this.METADATA.knownFieldNames.has(field)) {
      return this[field]
    } else {
      NGN.WARN(`Cannot get "${field}". The field is not part of the model.`)
      return undefined
    }
  }

  /**
   * Set a new value for the specified field.
   * @param {string} field
   * Name of the field whose value will be changed.
   * @param {any} value
   * The new value of the field.
   */
  set (field, value) {
    if (field === 'id' || field === 'ID') {
      field = this.METADATA.IdentificationField
    }

    if (this.METADATA.knownFieldNames.has(field)) {
      this[field] = value
    } else {
      NGN.WARN(`Cannot set "${field}". Unrecognized field name.`)
    }
  }

  /**
   * Add a data field after the initial model definition.
   * @param {string} fieldname
   * The name of the field.
   * @param {NGN.DATA.Field|Object|Primitive} [fieldConfiguration=null]
   * The field configuration (see cfg#fields for syntax).
   * @param {boolean} [suppressEvents=false]
   * Set to `true` to prevent events from firing when the field is added.
   */
  addField (name, cfg = null, suppressEvents = false) {
    if (name instanceof NGN.DATA.Field) {
      cfg = name
      name = cfg.name
    } else if (typeof name !== 'string') {
      throw new Error('Cannot add a non-string based field.')
    }

    this.METADATA.applyField(name, cfg, suppressEvents)
  }

  /**
   * @method removeField
   * Remove a field from the data model.
   * @param {string} name
   * Name of the field to remove.
   * @param {boolean} [suppressEvents=false]
   * Set to `true` to prevent events from firing when the field is removed.
   */
  removeField (name, suppressEvents = false) {
    if (this.METADATA.knownFieldNames.has(name)) {
      this.METADATA.knownFieldNames.delete(name)
      this.METADATA.invalidFieldNames.delete(name)

      const field = this.METADATA.fields[name]

      delete this[name]
      delete this.METADATA.fields[name] // eslint-disable-line no-undef

      // let change = {
      //   action: 'delete',
      //   field: field.name,
      //   value: field,
      //   join: field instanceof NGN.DATA.Relationship
      // }

      if (!suppressEvents) {
        this.emit('field.remove', field)
        // this.emit('changelog.append', change)
      }
    }
  }

  /**
   * Returns the NGN.DATA.Field object for the specified field.
   * @param  {string} fieldName
   * Name of the field to retrieve.
   * @return {NGN.DATA.Field}
   * The raw field.
   */
  getField (name) {
    return this.METADATA.fields[name]
  }

  /**
   * @method setSilent
   * A method to set a field value without triggering an update event.
   * This is designed primarily for use with live update proxies to prevent
   * endless event loops.
   * @param {string} fieldname
   * The name of the #field to update.
   * @param {any} value
   * The new value of the field.
   * @private
   */
  setSilentFieldValue(field, value) {
    this.METADATA.fields[field].silentValue = value
  }

  /**
   * @method undo
   * A rollback function to undo changes. This operation affects
   * the changelog (transaction log). To "undo" an "undo", use #redo.
   * @param {number} [OperationCount=1]
   * The number of operations to "undo". Defaults to a single operation.
   * @param {boolean} [suppressEvents=false]
   * Set to `true` to quietly update the value (prevents `update` event from
   * firing).
   */
  undo (count = 1, suppressEvents = false) {
    this.METADATA.applyChange('undo', ...arguments)
  }

  /**
   * @method redo
   * A function to reapply known changes. This operation affects
   * the changelog (transaction log).
   *
   * The redo operation only works after an undo operation, but before a new
   * value is committed to the transaction log. In other words, `undo -> redo`
   * will work, but `undo -> update -> redo` will not. For details, see how
   * the NGN.DATA.TransactionLog cursor system works.
   * @param {number} [OperationCount=1]
   * The number of operations to "undo". Defaults to a single operation.
   * @param {boolean} [suppressEvents=false]
   * Set to `true` to quietly update the value (prevents `update` event from
   * firing).
   */
  redo (count = 1, suppressEvents = false) {
    this.METADATA.applyChange('redo', ...arguments)
  }
}
