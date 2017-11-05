(function () {
  // [PARTIAL]

/**
  * @class NGN.DATA.Rule
  * A data validation rule.
  * @param {String} field
  * The data field to test.
  * @param {Function/String[]/Number[]/Date[]/RegExp/Array} validator
  *
  * @fires validator.add
  */
class NGNDataValidationRule {
  /**
   * Create a new data rule.
   * @param {Function/String[]/Number[]/Date[]/RegExp/Array} rule
   * * When rule is a _function_, the value is passed to it as an argument.
   * * When rule is a _String_, the value is compared for an exact match (case sensitive)
   * * When rule is a _Number_, the value is compared for equality.
   * * When rule is a _Date_, the value is compared for exact equality.
   * * When rule is a _RegExp_, the value is tested and the results of the RegExp#test are used to validate.
   * * When rule is an _Array_, the value is checked to exist in the array, regardless of data type. This is treated as an `enum`.
   * * When rule is _an array of dates_, the value is compared to each date for equality.
   */
  constructor (validation) {
    Object.defineProperties(this, {
      validator: NGN.privateconst(validation)
    })
  }

  get type () {
    return NGN.typeof(this.validator)
  }

  /**
   * @method test
   * Test a value against the validation rule.
   * @param {any} value
   * The value to test.
   * @returns {boolean}
   * Returns `true` when the value meets the rule expectations and `false` when it does not.
   */
  test (value) {
    switch (this.type) {
      // Custom enforcement function
      case 'function':
        return this.validator(value)

      // Enumeration
      case 'array':
        return this.validator.includes(value)

      // Pattern Matching
      case 'regexp':
        return this.validator.test(value)

      default:
        return this.validator === value
    }
  }
}

  // [PARTIAL]

/**
 * @class NGN.DATA.Field
 * Represents a data field within a model/record.
 */
class NGNDataField extends NGN.EventEmitter {
  constructor (cfg) {
    cfg = cfg || {}

    // Validate field configuration values
    if (cfg.hasOwnProperty('pattern') && NGN.typeof(cfg.pattern) !== 'regexp') {
      throw new Error('Invalid data field configuration. Pattern must be a valid JavaScript regular expression (RegExp).')
    }

    super()

    const INSTANCE = Symbol('datafield')

    Object.defineProperties(this, {
      METADATA: NGN.get(() => { return this[INSTANCE] }),

      [INSTANCE]: NGN.privateconst({
        /**
         * @cfg {boolean} [required=false]
         * Indicates the value is required.
         */
        required: NGN.coalesce(cfg.required, false),

        /**
         * @cfgproperty {boolean} [hidden=false]
         * Indicates the field is hidden (metadata).
         */
        hidden: NGN.coalesce(cfg.hidden, false),

        fieldType: 'data',

        isIdentifier: NGN.coalesce(cfg.identifier, false),

        /**
         * @cfg {RegExp} [pattern]
         * A pattern, as defined by a standard RegExp, that the data must match.
         */
        pattern: NGN.coalesceb(cfg.pattern),

        /**
         * @cfg {string} name
         * The field name.
         */
        name: NGN.coalesce(cfg.name),

        /**
         * @cfg {any} default
         * The default value of the field when no value is specified.
         */
        default: NGN.coalesce(cfg.default),

        /**
         * @cfg {Primitive} [type=String]
         * The JS primitive representing the type of data represented
         * by the field.
         */
        dataType: NGN.coalesce(cfg.type, String),

        /**
         * @cfg {function} [rule[]]
         * A function, or an array of functions, which determine whether the
         * field value is valid or not. These functions receive a single argument
         * (the data value) and must return a Boolean value.
         */
        rules: NGN.coalesce(cfg.rule, cfg.rules, cfg.validators, []),

        /**
         * @cfg {boolean} [allowInvalid=true]
         * If this is set to `false`, invalid values will throw an error.
         */
        allowInvalid: NGN.coalesce(cfg.allowInvalid, true),

        ENUMERABLE_VALUES: null
      })
    })

    this.METADATA.rules = NGN.forceArray(this.METADATA.rules)

    // Apply pattern validation if specified.
    if (this.METADATA.dataType === String && this.METADATA.pattern !== null) {
      this.METADATA.rules.unshift(new NGN.DATA.Rule(cfg.pattern))
    }

    if (this.METADATA.dataType === Number) {
      /**
       * @cfg {Array} [range]
       * An enumeration of acceptable numeric ranges. For example, if
       * the value must be between 5-10 or from 25-50, the configuration
       * would look like:
       *
       * ```js
       * range: [
       *   [5, 10],
       *   [25-50]
       * ]
       * ```
       *
       * To accept anything below a certain number or anything over a certain
       * number while also specifying one or more ranges, use a `null` value.
       *
       * For example:
       *
       * ```js
       * range: [
       *   [null, 0],
       *   [5, 10],
       *   [25-50],
       *   [100, null]
       * ]
       * ```
       *
       * The aforementioned example would accept a value less than `zero`,
       * between `5` and `10`, between `25` and `50`, or over `100`. Therefore,
       * acceptable values could be `-7`, `7`, `25`, `42`,  `10000`, or anything
       * else within the ranges. However, the values `3`, `19`, and `62` would
       * all fail because they're outside the ranges.
       */
      if (cfg.hasOwnProperty('range') && cfg.range.length > 1) {
        this.METADATA.rules.unshift(new NGN.DATA.Rule((value) => {
          for (let i = 0; i < cfg.range.length; i++) {
            let subrange = cfg.range[i]
            let min = cfg.range[subrange][0]
            let max = cfg.range[subrange][1]

            if ((min !== null && min > value) || (max !== null && max < value)) {
              return false
            }
          }

          return true
        }))
      } else {
        /**
         * @cfg {number} [min]
         * The minimum accepted value.
         */
        if (NGN.objectHasAny(cfg, 'min', 'minimum')) {
          this.METADATA.rules.unshift(new NGN.DATA.Rule((value) => {
            return value >= NGN.coalesce(cfg.min, cfg.minimum)
          }))
        }

        /**
         * @cfg {number} [max]
         * The maximum accepted value.
         */
        if (NGN.objectHasAny(cfg, 'max', 'maximum')) {
          this.METADATA.rules.unshift(new NGN.DATA.Rule((value) => {
            return value <= NGN.coalesce(cfg.max, cfg.maximum)
          }))
        }
      }
    }

    /**
     * @cfg {Array} [enum]
     * An enumeration of available values this field is allowed to have.
     */
    if (NGN.objectHasAny(cfg, 'enum', 'enumeration')) {
      this.METADATA.ENUMERABLE_VALUES = new Set(NGN.forceArray(NGN.coalesce(cfg.enum, cfg.enumeration)))
    }

    /**
     * @cfg {Primitive} [type=String]
     * The type should be a JavaScript primitive, class, or constructor.
     * For example, `String`, `Number`, `Boolean`, `RegExp`, `Array`, or `Date`.
     */
    this.METADATA.rules.unshift(new NGN.DATA.Rule(this.dataType))
  }

  /**
   * @property {string} fieldType
   * The type of field.
   */
  get fieldType () {
    return this.METADATA.fieldType
  }

  /**
   * @property {boolean} required
   * Indicates the field must have a non-null value.
   */
  get required () {
    return this.METADATA.required
  }

  set required (value) {
    switch (NGN.typeof(value)) {
      case 'boolean':
        this.METADATA.required = value
        return

      case 'number':
        this.METADATA.required = value === 0 ? false : true
        return

      case 'string':
        value = value.trim().toLowerCase()

        if (value === 'true') {
          this.METADATA.required = true
          return
        } else if (value === 'false') {
          this.METADATA.required = false
          return
        }

      default:
        throw new Error(`Must set a boolean value (received ${NGN.typeof(value)}).`)
    }
  }

  /**
   * @property {string} type
   * The type of data in string format.
   */
  get type () {
    return NGN.typeof(this.METADATA.dataType)
  }

  /**
   * @property {boolean} hidden
   * Indicates the field should be considered hidden.
   */
  get hidden () {
    return this.METADATA.hidden
  }

  /**
   * @property {boolean} virtual
   * Indicates the field should be considered virtual.
   */
  get virtual () {
    return this.METADATA.hidden
  }

  /**
   * @property {boolean} identifier
   * Indicates the field is considered an identifier.
   */
  get identifier () {
    return this.METADATA.isIdentifier
  }

  /**
   * @property {Any} default
   * The default field value.
   */
  get 'default' () {
    return this.METADATA.default
  }

  set 'default' (value) {
    this.METADATA.default = value
  }

  /**
   * @property {Any} value
   * The value of the field.
   */
  get value () {
    return NGN.coalesce(this.METADATA.raw, this.METADATA.default)
  }

  set value (value) {
    let change = {
      old: this.raw,
      new: value
    }

    let priorValueIsValid = this.valid

    this.METADATA.raw = value

    // Notify when an invalid value is detected.
    if (!this.valid) {
      // If invalid values are explicitly prohibited, throw an error.
      // The value is set before throwing the error because developers may
      // catch the error and continue processing.
      if (!this.allowInvalid) {
        this.raw = change.old
        throw new Error(`Invalid value (${value}) is not allowed.`)
      }

      this.emit('invalid', change)
    } else if (priorValueIsValid) {
      // If the field BECAME valid (compared to prior value),
      // emit an event.
      this.emit('valid', change)
    }

    // Notify when the update is complete.
    this.emit('update', change)

    // Mark unnecessary code for immediate garbage collection.
    priorValueIsValid = null
    change = null
  }

  /**
   * @property {boolean} valid
   * Indicates the field value is valid.
   */
  get valid () {
    if (this.required && NGN.coalesce(value) !== null) {
      return false
    }

    for (let rule in this.METADATA.validators) {
      if (!this.METADATA.validators[rule](value)) {
        return false
      }
    }

    return true
  }
}

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

      META: NGN.get(() => this[INSTANCE]),

      [INSTANCE]: NGN.privateconst({
        // Contains the raw data
        raw: {},

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
        validators: NGN.coalesce(config.validators, {}),

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
          'validator.add',
          'validator.remove',
          'relationship.create',
          'relationship.remove',
          'expired',
          'deleted',
          'reset',
          'load'
        ]),

        applyField: (field, cfg = null, suppressEvents = false) => {
          if (this.META.knownFieldNames.has(name)) {
            return NGN.WARN(`Duplicate field "${name}" detected.`)
          }

          this.META.knownFieldNames.add(name)

          if (!(cfg instanceof NGN.DATA.Field)) {
            if (NGN.isFn(cfg) || cfg === null) {
              this.META.fields[field] = new NGN.DATA.Field({
                dataType: cfg
              })
            } else if (NGN.typeof('object')) {
              this.META.fields[field] = new NGN.DATA.Field(cfg)
            }
          }
        }
      })
    })

    // Bubble events to the BUS
    for (let i = 0; i < this.META.EVENTS.length; i++) {
      this.on(this.META.EVENTS[i], function () {
        let args = NGN.slice(arguments)

        args.push(this)
        args.unshift(this.META.EVENTS[i])

        NGN.BUS.emit.apply(NGN.BUS, args)
      })
    }

    // Add data fields.
    let fields = Object.keys(this.META.fields)
    for (let i = 0; i < fields.length; i++) {
      let name = fields[i]

      if (this.META.knownFieldNames.has(name)) {
        NGN.WARN(`Duplicate field "${name}" detected.`)
      } else {
        // Configure a data field for each configuration.
        this.applyField(name, this.META.fields[name], true)
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
    return this.META.created
  }

  /**
   * Determines whether a field exists in the model or not.
   * @param  {string} field
   * Name of the field to check for.
   * @return {boolean}
   */
  fieldExists (field) {
    return this.META.knownFieldNames.has(field)
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
      field = this.META.IdentificationValue
    }

    if (this.META.knownFieldNames.has(field)) {
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
      field = this.META.IdentificationField
    }

    if (this.META.knownFieldNames.has(field)) {
      this[field] = value
    } else {
      NGN.WARN(`Cannot set "${field}". Unrecognized field name.`)
    }
  }
}

  // [PARTIAL]
/**
 * @class NGN.DATA.Index
 * Data indexes are a data structure that improves the speed
 * of data retrieval from an NGN.DATA.Store, at the cost of
 * additional memory usage. Even though memory usage is increased
 * for each index applied to a store, it tends to be a very small
 * fraction of the memory required for storing data.
 *
 * Indexes help locate data within a store without having to read
 * every record. They will, in the overwhelming majority of cases,
 * speed up queries. However; if overused or misused, they may
 * marginally _increase_ query processing time.
 *
 * NGN data indexes were designed to be used the same way relational
 * data indexes and graph data vertices are used.
 * @fires create {Symbol}
 * Triggered when a new record is indexed. The payload (Symbol)
 * represents the NGN.DATA.Model#oid.
 * @fires delete {Symbol}
 * Triggered when a record is de-indexed. The payload (Symbol)
 * represents the NGN.DATA.Model#oid.
 * @fires update {Symbol}
 * Triggered when a record is re-indexed (updated). The payload (Symbol)
 * represents the NGN.DATA.Model#oid.
 * @fires reset
 * Triggered when the index is completely cleared/reset to it's original state.
 * @private
 */
class NGNDataIndex extends NGN.EventEmitter {
  constructor () {
    super()

    Object.defineProperties(this, {
      // Private constants
      CREATE_EVENT: NGN.private(Symbol('create')),
      REMOVE_EVENT: NGN.private(Symbol('delete')),
      UPDATE_EVENT: NGN.private(Symbol('update')),

      // Private data attributes
      uniqueValues: NGN.private(new Set()),
      knownRecords: NGN.private([]) // Linked list of Sets
    })

    // Bubble up private events when applicable
    let me = this
    this.on([
      this.CREATE_EVENT,
      this.REMOVE_EVENT,
      this.UPDATE_EVENT
    ], function (oid, value, suppressEvent = false) {
      if (!suppressEvent) {
        me.emit(Symbol.keyFor(this.event).split('-')[0], oid)
      }
    })

    // When all known records for a given value are removed,
    // clear the unique value index.
    this.on(this.REMOVE_EVENT, (oid, value) => {
      if (this.recordsFor(value).length === 0) {
        let index = this.indexOf(value)

        if (index >= 0) {
          this.knownRecords.splice(index, 1)
          this.uniqueValues.delete(value)
        }
      }
    })
  }

  /**
   * Add a field/value to the index.
   * @param {any} value
   * The value of the model/record indexed field.
   * @param {Symbol} oid
   * The record's object ID (NGN.DATA.Model#oid)
   */
  add (value, oid, suppressEvent = false) {
    let valueIndex = -1

    // Create or identify the index of the unique value
    if (!this.uniqueValues.has(value)) {
      this.uniqueValues.add(value)
      this.knownRecords.push([new Set()])
      valueIndex += this.uniqueValues.size
    } else {
      valueIndex = this.indexOf(value)
    }

    this.knownRecords[valueIndex].add(oid)

    this.emit(this.CREATE_EVENT, oid, value, suppressEvent)
  }

  /**
   * Remove a record from the index.
   * @param  {Symbol} oid
   * The record's object ID (NGN.DATA.Model#oid)
   * @param  {any} [value=undefined]
   * When specified, the field value will be used to identify
   * the index value. Specifying this value will make the remove
   * operation faster.
   */
  remove (oid, value, suppressEvent = false) {
    // If a value is specified, attempt to lookup the OID by value.
    if (value !== undefined) {
      let index = this.recordsOf(value)

      // If a value index is found, remove the OID
      if (index) {
        if (index.delete(oid)) { // Returns false if nothing is actually deleted.
          this.emit(this.REMOVE_EVENT, oid, value, suppressEvent)
          return
        }
      }
    }

    // Iterate through all index values to remove the OID (slow)
    let removed = false
    for (let i = 0; i < this.knownRecords.length; i++) {
      if (this.knownRecords[i].delete(oid) && !removed) {
        removed = true
      }
    }

    if (removed) {
      this.emit(this.REMOVE_EVENT, oid, value, suppressEvent)
    }
  }

  /**
   * Update an index to reflect an updated value.
   * @param  {[type]} oid      [description]
   * @param  {[type]} oldvalue [description]
   * @param  {[type]} newvalue [description]
   * @return {[type]}          [description]
   */
  update (oid, oldValue, newValue, suppressEvent = false) {
    if (oldValue !== newValue) {
      this.remove(oid, oldValue, true)
      this.add(oid, newValue, true)
      this.emit(this.UPDATE_EVENT, oid, null, suppressEvent)
    }
  }

  /**
   * Forcibly reset the index (clears everything).
   */
  reset () {
    this.uniqueValues = new Set()
    this.knownRecords = []
    this.emit('reset')
  }

  /**
   * Retrive the index number of known records for the
   * specified value.
   * @private
   * @param  {any} value
   * The unique value for which records are known.
   * @return {numeric}
   * The 0-based index of known records. Returns `-1` if no
   * index exists.
   */
  indexOf (value) {
    return Array.from(this.uniqueValues.keys()).indexOf(value)
  }

  /**
   * The records of a particular value.
   * @private
   * @param  {any} value
   * The index field value to use as a lookup.
   * @return {Set.iterator}
   * An iterator of object ID's or `null` if none exist.
   */
  recordsOf (value) {
    let valueIndex = this.indexOf(value)

    return valueIndex < 0 ? null : this.knownRecords[valueIndex]
  }

  /**
   * Get the list of records for the given value.
   * @param  {any} value [description]
   * @return {[Symbol]}
   * The array contains NGN.DATA.Model#oid values.
   */
  recordsFor (value) {
    let index = this.recordsOf(value)

    if (index === 0) {
      return []
    }

    return index.values()
  }
}

  // [PARTIAL]

/**
 * @class NGN.DATA.Store
 * Represents a collection of data.
 * @fires record.create
 * Fired when a new record is created. The new
 * record is provided as an argument to the event
 * handler.
 * @fires record.delete
 * Fired when a record(s) is removed. The old record
 * is provided as an argument to the event handler.
 */
class NGNDataStore extends NGN.EventEmitter {
  constructor (cfg) {
    cfg = cfg || {}
    super(cfg)

    console.log('STORE')
  }
}


  let NGNModel = function (cfg) {
    const Model = function (data) {
      let model = new NGNDataModel(cfg)

      if (data) {
        model.load(data)
      }

      return model
    }

    return Model
  }

  NGN.extend('DATA', NGN.const(Object.defineProperties({}, {
    Rule: NGN.privateconst(NGNDataValidationRule),
    Field: NGN.const(NGNDataField),
    Entity: NGN.privateconst(NGNDataModel),
    Model: NGN.const(NGNModel),
    Index: NGN.privateconst(NGNDataIndex),
    Store: NGN.const(NGNDataStore)
  })))
})()