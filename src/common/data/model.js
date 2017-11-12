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

    // A unique internal instance ID for referencing internal
    // data placeholders
    const INSTANCE = Symbol('model')

    // Create private attributes & data placeholders
    Object.defineProperties(this, {
      /**
       * @property {Symbol} OID
       * A unique object ID assigned to the model. This is an
       * internal readon-only reference.
       * @private
       */
      OID: NGN.privateconst(Symbol('model.id')),

      // METADATA: NGN.get(() => this[INSTANCE]),

      METADATA: NGN.privateconst({
        /**
         * @cfg {String} [idAttribute='id']
         * Setting this allows an attribute of the object to be used as the ID.
         * For example, if an email is the ID of a user, this would be set to
         * `email`.
         */
        idAttribute: NGN.privateconst(cfg.idAttribute || 'id'),

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

        applyField: (field, cfg = null, suppressEvents = false) => {
          // Prevent duplicate fields
          if (this.METADATA.knownFieldNames.has(field)) {
            return NGN.WARN(`Duplicate field "${field}" detected.`)
          }

          // Prevent reserved words
          if (this.hasOwnProperty(field) && field.toLowerCase() !== 'id') {
            throw new ReservedWordError(`"${field}" cannot be used as a field name (reserved word).`)
          }

          // Add the field to the list
          this.METADATA.knownFieldNames.add(field)

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

          this.METADATA.fields[field].auditable = this.METADATA.AUDITABLE

          Object.defineProperty(this, field, {
            configurable: true,
            get: () => this.METADATA.fields[field].value,
            set: (value) => this.METADATA.fields[field].value = value
          })

          // this.METADATA.fields[field].on('*', function () { console.log(this.event) })
          this.METADATA.fields[field].relay('*', this, 'field.')

          if (!suppressEvents) {
            this.emit('field.create', this.METADATA.fields[field])
          }
        },

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
   * @property {Number} createDate
   * The date/time when the model is created.
   */
  get createDate () {
    return this.METADATA.created
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
      let field = this.METADATA.fields[name]

      delete this[name]
      delete this.METADATA.fields[name] // eslint-disable-line no-undef

      this.METADATA.knownFieldNames.delete(name)
      this.METADATA.invalidFieldNames.delete(name)

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
}
