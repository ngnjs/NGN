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
class NGNDataEntity extends NGN.EventEmitter { // eslint-disable-line
  constructor (cfg) {
    cfg = NGN.coalesce(cfg, {})

    super()

    if (cfg.dataMap) {
      cfg.fieldmap = cfg.dataMap
      NGN.WARN('"dataMap" is deprecated. Use "map" instead.')
    }

    if (cfg.idAttribute) {
      cfg.IdentificationField = cfg.idAttribute
      NGN.WARN('"idAttribute" is deprecated. Use "IdentificationField" instead.')
    }

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
        fields: Object.assign({}, NGN.coalesce(cfg.fields, {})),
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
         * If the NGN.DATA.Model#IdentificationField/id is not provided for a record,
         * a unique ID will be automatically generated for it.
         *
         * An NGN.DATA.Store using a model with this set to `true` will never
         * have a duplicate record, since the #id or #IdentificationField will always
         * be unique.
         */
        autoid: NGN.coalesce(cfg.autoid, false),

        /**
         * @cfg {String} [IdentificationField='id']
         * Setting this allows an attribute of the object to be used as the ID.
         * For example, if an email is the ID of a user, this would be set to
         * `email`.
         */
        IdentificationField: NGN.coalesce(cfg.IdentificationField, cfg.idField, 'id'),

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
        expiration: null,

        // Holds a setTimeout method for expiration events.
        expirationTimeout: null,

        created: Date.now(),
        store: null,

        /**
         * @cfg {boolean} [audit=false]
         * Enable auditing to support #undo/#redo operations. This creates and
         * manages a NGN.DATA.TransactionLog.
         */
        AUDITABLE: false,
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
         * @param  {NGN.DATA.Field|Object|Primitive} [fieldConfiguration=null]
         * The configuration to apply. See #addField for details.
         * @param  {Boolean} [suppressEvents=false]
         * Optionally suppress the `field.create` event.
         * @private
         */
        applyField: (field, fieldcfg = null, suppressEvents = false) => {
          // Prevent duplicate fields
          if (this.METADATA.knownFieldNames.has(field)) {
            return NGN.WARN(`Duplicate field "${field}" detected.`)
          }

          // Prevent reserved words
          if (this.hasOwnProperty(field) && field.toLowerCase() !== 'id') {
            throw new ReservedWordError(`"${field}" cannot be used as a field name (reserved word).`)
          }

          // If the field config isn't already an NGN.DATA.Field, create it.
          if (!(fieldcfg instanceof NGN.DATA.Field)) {
            if (fieldcfg instanceof NGN.DATA.Store || fieldcfg instanceof NGN.DATA.Model) {
              if (this.METADATA.IdentificationField === field) {
                throw new InvalidConfigurationError(`"${field}" cannot be an ID. Relationship fields cannot be an identification field/attribute.`)
              }

              this.METADATA.fields[field] = new NGN.DATA.Relationship({
                name: field,
                record: fieldcfg,
                model: this
              })
            } else {
              switch (NGN.typeof(fieldcfg)) {
                // Custom config
                case 'object':
                  fieldcfg.model = this
                  fieldcfg.identifier = NGN.coalesce(fieldcfg.identifier, this.METADATA.IdentificationField === field)
                  fieldcfg.name = field

                  this.METADATA.fields[field] = new NGN.DATA.Field(fieldcfg)

                  break

                // Collection of models
                case 'array':
                  return this.applyField(field, fieldcfg[0], suppressEvents)

                // Type-based cfg.
                default:
                  if (NGN.isFn(fieldcfg) || fieldcfg === null) {
                    if (NGN.isFn(fieldcfg) && ['string', 'number', 'boolean', 'number', 'symbol', 'regexp', 'date', 'array', 'object'].indexOf(NGN.typeof(fieldcfg)) < 0) {
                      this.METADATA.fields[field] = new NGN.DATA.VirtualField({
                        name: field,
                        identifier: this.METADATA.IdentificationField === field,
                        model: this,
                        method: fieldcfg
                      })

                      break
                    }

                    this.METADATA.fields[field] = new NGN.DATA.Field({
                      name: field,
                      type: fieldcfg,
                      identifier: this.METADATA.IdentificationField === field,
                      model: this
                    })

                    break
                  }

                  this.METADATA.fields[field] = new NGN.DATA.Field({
                    name: field,
                    type: NGN.isFn(fieldcfg) ? fieldcfg : String,
                    identifier: NGN.isFn(fieldcfg)
                      ? false
                      : NGN.coalesce(fieldcfg.identifier, this.METADATA.IdentificationField === field),
                    model: this
                  })

                  break
              }
            }
          } else if (fieldcfg.model === null) {
            fieldcfg.name = field
            fieldcfg.identifier = fieldcfg.identifier = NGN.coalesce(fieldcfg.identifier, this.METADATA.IdentificationField === field)

            this.METADATA.fields[field] = fieldcfg
            this.METADATA.fields[field].model = this
          } else if (fieldcfg.model === this) {
            fieldcfg.identifier = NGN.coalesce(fieldcfg.identifier, this.METADATA.IdentificationField === field)

            this.METADATA.fields[field] = fieldcfg
          } else if (!(fieldcfg instanceof NGN.DATA.Field)) {
            return NGN.WARN(`The "${fieldcfg.name}" field cannot be applied because model is already specified.`)
          }

          // Add a direct reference to the model.
          Object.defineProperty(this, field, {
            enumerable: true,
            configurable: true,
            get: () => this.get(field),
            set: (value) => this.set(field, value)
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

          this.METADATA.fields[field].relay('*', this, 'field.')

          if (!suppressEvents) {
            this.emit('field.create', this.METADATA.fields[field])
          }

          return this.METADATA.fields[field]
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
        setSilent: NGN.deprecate(this.setSilentFieldValue, 'setSilent has been deprecated. Use setSilentFieldValue instead.'),

        /**
         * @cfgproperty {object} fieldmap
         * An object mapping model attribute names to data storage field names.
         *
         * _Example_
         * ```
         * {
         *   ModelFieldName: 'inputName',
         *   father: 'dad',
         *   email: 'eml',
         *   image: 'img',
         *   displayName: 'dn',
         *   firstName: 'gn',
         *   lastName: 'sn',
         *   middleName: 'mn',
         *   gender: 'sex',
         *   dob: 'bd'
         * }
         * ```
         */
        DATAMAP: null
      }),

      MAP: NGN.get(() => {
        return NGN.coalesce(
          this.METADATA.DATAMAP,
          this.METADATA.store instanceof NGN.DATA.Store
            ? this.METADATA.store.map
            : null
        )
      })
    })

    if (cfg.fieldmap instanceof NGN.DATA.FieldMap) {
      this.METADATA.DATAMAP = cfg.fieldmap
    } else if (NGN.typeof(cfg.fieldmap) === 'object') {
      this.METADATA.DATAMAP = new NGN.DATA.FieldMap(cfg.fieldmap)
    }

    // Bubble events to the BUS
    // this.relay('*', NGN.BUS, 'record.')

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

    // Apply automatic ID's when applicable
    if (this.METADATA.autoid) {
      let autoIdValue = null

      Object.defineProperty(this.METADATA, 'IdentificationValue', NGN.get(() => {
        if (autoIdValue === null) {
          autoIdValue = NGN.DATA.UTILITY.UUID()
        }

        return autoIdValue
      }))
    }

    // Apply auditing if configured
    this.auditable = NGN.coalesce(cfg.audit, false)

    // Clear any cached checksums when the model changes.
    this.on(['field.update', 'field.create', 'field.delete', 'field.hidden', 'field.unhidden'], () => {
      if (this.METADATA.checksum) {
        this.METADATA.checksum = null
      }
    })

    // Configure TTL/Expiration
    if (cfg.expires) {
      this.expires = cfg.expires
    }
  }

  get name () {
    return this.METADATA.name
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
        // Track Changes (if auditing enabled)
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
    return this.get(this.METADATA.IdentificationField)
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

  /**
   * @property {object} data
   * A serialized version of the data represented by the model. This
   * only includes non-virtual fields. See #representation to use
   * a representation of data containing virtual fields.
   */
  get data () {
    if (this.MAP) {
      return this.MAP.applyInverseMap(this.serializeFields())
    }

    return this.serializeFields()
  }

  /**
   * @property {object} unmappedData
   * Returns #data _without applying_ the data #map.
   */
  get unmappedData () {
    return this.serializeFields()
  }

  /**
   * @property {object} representation
   * A serialized version of the data represented by the model. This
   * includes virtual fields. See #data to use just the raw values.
   */
  get representation () {
    if (this.MAP) {
      return this.MAP.applyInverseMap(this.serializeFields(false, false))
    }

    return this.serializeFields(false, false)
  }

  /**
   * @property {object} unmappedRepresentation
   * Returns #representation _without applying_ the data #map.
   */
  get unmappedRepresentation () {
    return this.serializeFields(false, false)
  }

  /**
   * @property {string} checksum
   * The checksum is a unique "fingerprint" of the data stored in the model.
   * Please note that generating a checksum for an individual record is
   * usually a quick operation, but generating large quantities of checksums
   * simultaneously/sequentially can be computationally expensive. On average,
   * a checksum takes 3-125ms to generate.
   */
  get checksum () {
    this.METADATA.checksum = NGN.coalesce(this.METADATA.checksum, NGN.DATA.UTILITY.checksum(JSON.stringify(this.data)))

    return this.METADATA.checksum
  }

  /**
   * @property {Date} expires
   * The date/time when the record expires. This may be set to
   * a future date, or a numeric value. Numeric values
   * represent the number of milliseconds from the current time
   * before the record expires. For example, set this to `3000`
   * to force the record to expire 3 seconds from now.
   *
   * Set this to `0` to immediately expire the record. Set this to
   * `-1` or `null` to prevent the record from expiring.
   */
  get expires () {
    return this.METADATA.expiration
  }

  set expires (value) {
    if (value === null) {
      clearTimeout(this.METADATA.expirationTimeout)
      this.METADATA.expiration = null
      return
    }

    let now = new Date()

    if (!isNaN(value) && !(value instanceof Date)) {
      // Handle numeric (millisecond) expiration
      if (value < 0) {
        this.METADATA.expiration = null

        return
      }

      if (value === 0) {
        this.METADATA.expiration = now
        this.emit('expire')

        return
      }

      this.METADATA.expiration = new Date()
      this.METADATA.expiration.setTime(now.getTime() + value)
    } else if (!(value instanceof Date) || value <= now) {
      throw new Error(`${this.name} expiration (TTL) value must be a positive number (milliseconds) or future date.`)
    } else {
      // Handle date-based expiration
      this.METADATA.expiration = value
    }

    clearTimeout(this.METADATA.expirationTimeout)

    this.METADATA.expirationTimeout = setTimeout(() => this.emit('expire'), this.METADATA.expiration.getTime() - now.getTime())
  }

  get expired () {
    if (this.METADATA.expiration === null) {
      return false
    }

    return this.METADATA.expiration <= (new Date())
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
        (ignoreID && fieldname.value === this.IdentificationField) ||
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
    if (field === 'id' || field === 'ID' || field === this.METADATA.IdentificationField) {
      field = this.METADATA.IdentificationField

      if (this.METADATA.autoid) {
        if (!this.METADATA.knownFieldNames.has(field)) {
          return this.METADATA.IdentificationValue
        } else {
          return NGN.coalesce(this.METADATA.fields[field].value, this.METADATA.IdentificationValue)
        }
      }
    }

    if (this.METADATA.knownFieldNames.has(field)) {
      return this.METADATA.fields[field].value
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
      this.METADATA.fields[field].value = value
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
  addField (name, fieldConfiguration = null, suppressEvents = false) {
    if (name instanceof NGN.DATA.Field) {
      fieldConfiguration = name
      name = fieldConfiguration.name
    } else if (typeof name !== 'string') {
      throw new Error('Cannot add a non-string based field.')
    }

    this.METADATA.applyField(name, fieldConfiguration, suppressEvents)
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
      }

      if (this.METADATA.store !== null) {
        this.METADATA.store.emit(this.METADATA.store.PRIVATE.EVENT.DELETE_RECORD_FIELD, {
          record: this,
          field
        })
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
    if (name.toLowerCase() === 'id' && !this.METADATA.fields.hasOwnProperty(name) && this.METADATA.fields.hasOwnProperty(this.METADATA.IdentificationField)) {
      return this.METADATA.fields[this.METADATA.IdentificationField]
    }

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
  setSilentFieldValue (field, value) {
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

  /**
   * @method load
   * Load a data record.
   * @param {object} data
   * The data to apply to the model.
   * @param {boolean} [suppressEvents=false]
   * Do not emit a change event when the data is loaded.
   */
  load (data, suppressEvents = false) {
    if (this.MAP) {
      data = this.MAP.applyMap(data)
    }

    let keys = Object.keys(data)

    for (let i = 0; i < keys.length; i++) {
      if (this.METADATA.knownFieldNames.has(keys[i])) {
        this.METADATA.fields[keys[i]].METADATA.setValue(data[keys[i]], suppressEvents)
      } else {
        NGN.WARN(`Failed to load ${keys[i]} field of ${this.name} model. "${keys[i]}" is not a recognized field.`)
      }
    }

    if (!suppressEvents) {
      this.emit('load')
    }

    return this
  }

  /**
   * @info This method only works on records within a store. If this method is
   * called on a model that is not part of a store, the model itself will be
   * returned.
   *
   * Retrieve the next record (after this one) from the store.
   * This can be used to iterate through a store by calling `model.next()`.
   * This is operation acts as a linked list iterator.
   * @param  {Number}  [count=1]
   * The number of records to retrieve. For example, `1` retrieves the next record.
   * `2` retrieves the second record after this one. A negative number will
   * automatically use the #previous method to retrieve prior records. Setting this
   * to `0` will return the current record (i.e. no change).
   * @param  {Boolean}  [cycle=false] [description]
   * If this `next` is called on the last record, it will fail. Setting `cycle` to
   * `true` will automatically restart the iteration, returning the first record in
   * the store.
   * @return {NGN.DATA.Model}
   * Returns the next model in the store (after this one.)
   */
  next (count = 1, cycle = false) {
    if (count === 0) {
      return this
    }

    if (this.METADATA.store) {
      if (count < 0) {
        return this.previous(Math.abs(count), cycle)
      }

      let currentIndex = this.METADATA.store.indexOf(this)
      let nextRecord = this.METADATA.store.getRecord(currentIndex + count)

      if (nextRecord === null && cycle) {
        return this.METADATA.store.first
      }

      return nextRecord
    } else {
      return this
    }
  }

  /**
   * @info This method only works on records within a store. If this method is
   * called on a model that is not part of a store, the model itself will be
   * returned.
   *
   * Retrieve the previous record (before this one) from the store.
   * This can be used to iterate through a store in reverse by calling
   * `model.previous()`. This is operation acts as a doubly linked list iterator.
   * @param  {Number}  [count=1]
   * The number of records to retrieve. For example, `1` retrieves the prior record.
   * `2` retrieves the second record before this one. A negative number will
   * automatically use the #next method to retrieve forward records. Setting this
   * to `0` will return the current record (i.e. no change).
   * @param  {Boolean}  [cycle=false] [description]
   * If this `next` is called on the first record, it will fail. Setting `cycle` to
   * `true` will automatically restart the iteration, returning the last record in
   * the store.
   * @return {NGN.DATA.Model}
   * Returns the previous model in the store (before this one.)
   */
  previous (count = 1, cycle = false) {
    if (count === 0) {
      return this
    }

    if (this.METADATA.store) {
      if (count < 0) {
        return this.next(Math.abs(count), cycle)
      }

      let currentIndex = this.METADATA.store.indexOf(this)
      let priorRecord = this.METADATA.store.getRecord(currentIndex - count)

      if (priorRecord === null && cycle) {
        return this.METADATA.store.last
      }

      return priorRecord
    } else {
      return this
    }
  }
}
