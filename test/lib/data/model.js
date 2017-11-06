'use strict'

/**
 * @class NGN.DATA.Model
 * Represents a data model/record.
 * @fires field.update
 * Fired when a datafield value is changed.
 * @fires field.create
 * Fired when a datafield is created.
 * @fires field.remove
 * Fired when a datafield is deleted.
 * @fires field.invalid
 * Fired when an invalid value is detected in an data field.
 */
class NGNDataModel extends NGN.EventEmitter {
  constructor (config) {
    config = config || {}

    super()

    // A unique internal instance ID for referencing internal
    // data placeholders
    const INSTANCE = Symbol('instance')

    // Create private attributes & data placeholders
    Object.defineProperties(this, {
      /**
       * @property {Symbol} OID
       * A unique object ID assigned to the model. This is an
       * internal readon-only reference.
       * @private
       */
      OID: NGN.privateconst(Symbol('id')),

      METADATA: NGN.get(() => this[INSTANCE]),

      [INSTANCE]: NGN.privateconst({
        /**
         * @cfg {object} fields
         * Represents the data fields of the model.
         */
        fields: NGN.coalesce(config.fields),
        knownFieldNames: new Set(),

        /**
         * @property {Object}
         * Custom validation rules used to verify the integrity of the entire
         * model. This only applies to the full model. Individual data fields
         * may have their own validators.
         */
        validators: NGN.coalesce(config.rules, config.rule, config.validators, {}),

        /**
         * @cfgproperty {boolean} [validation=true]
         * Toggle data validation using this.
         */
        validation: NGN.coalesce(config.validation, true),

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
        autoid: NGN.coalesce(config.autoid, false),

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
        expiration: NGN.coalesce(config.expires),

        // Holds a setTimeout method for expiration events.
        expirationTimeout: null,

        created: Date.now(),
        changelog: null,
        store: null,

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
          if (this.METADATA.knownFieldNames.has(field)) {
            return NGN.WARN(`Duplicate field "${field}" detected.`)
          }

          this.METADATA.knownFieldNames.add(field)

          if (!(cfg instanceof NGN.DATA.Field)) {
            if (cfg instanceof NGN.DATA.Store || cfg instanceof NGN.DATA.Model) {
              this.METADATA.fields[field] = new NGN.DATA.Relationship({
                record: cfg,
                model: this
              })
            } else {
              switch (NGN.typeof(cfg)) {
                case 'object':
                  this.METADATA.fields[field] = new NGN.DATA.Field(cfg)
                  break

                case 'array':
                  this.METADATA.fields[field] = this.METADATA.fields[field] = new NGN.DATA.Relationship({
                    record: cfg,
                    model: this
                  })

                default:
                  this.METADATA.fields[field] = new NGN.DATA.Field({
                    type: cfg
                  })

                  break
              }
            }
          }
        }
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
}