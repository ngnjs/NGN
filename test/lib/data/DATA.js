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
   * @param {string} [name]
   * An optional name for the rule. This can be useful when debugging data issues.
   * @param {object} [scope]
   * Aplpy a custom scope to the validation functions (applicable to custom methods only).
   */
  constructor (validation, name = null, scope = null) {
    const RULE_INSTANCE = Symbol('rule')
    const type = NGN.typeof(validation)

    Object.defineProperties(this, {
      RULE: NGN.get(() => this[RULE_INSTANCE]),

      [RULE_INSTANCE]: NGN.private({
        type: type,
        validator: validation,
        name: NGN.coalesce(name, `Untitled ${type.toUpperCase()} Validation`),
        scope: NGN.coalesce(scope, this)
      })
    })
  }

  get name () {
    return this.RULE.name
  }

  get type () {
    return this.RULE.type
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
    if (NGN.isFn(this.RULE.validator)) {
      // Custom enforcement function
      return this.RULE.validator.apply(this.RULE.scope, [value])
    } else {
      switch (this.type) {
        // Enumeration
        case 'array':
          return this.RULE.validator.indexOf(value) !== -1

        // Pattern Matching
        case 'regexp':
          return this.RULE.validator.test(value)

        default:
          return this.RULE.validator === value
      }
    }
  }
}

  // [PARTIAL]
/**
 * @class NGN.DATA.RangeRule
 * A special rule to validate values within one or more ranges.
 * Supports numeric ranges, date ranges, and simple string-based
 * ranges (string length).
 */
class NGNDataRangeValidationRule extends NGNDataValidationRule {
  /**
   * Create a new range rule.
   * @param {string} [name]
   * An optional name for the rule. This can be useful when debugging data issues.
   * @param {object} [scope=null]
   * Apply a custom scope to the validation functions (applicable to custom methods only).
   * @param {Array} [range]
   * An enumeration of acceptable numeric ranges. For example, if
   * the value must be between 5-10 or from 25-50, the configuration
   * would look like:
   *
   * ```js
   * range: [
   *   [5, 10],
   *   ['25-50']
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
   *   ['25-50'],
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
  constructor (name, scope, range = []) {
    if (NGN.typeof(scope) === 'array') {
      range = scope
      scope = null
    }

    super(null, name, scope)

    this.RULE.prepareRange = function (value) {
      // If a simple range is specified (single array), format it for the rule processor.
      if (value.length === 2 && NGN.typeof(value[0]) !== 'array' && NGN.typeof(value[1]) !== 'array') {
        value = [value]
      }

      return value
    }

    // Initialize the range
    this.RULE.range = new Set()
    this.range = range

    // Create the validation function.
    this.RULE.validator = (value) => {
      let range = Array.from(this.RULE.range.values())
      for (let i = 0; i < range.length; i++) {
        let subrange = range[i]

        // Make sure there are two elements for the range.
        if (subrange.length !== 2) {
          subrange = subrange[0].replace(/[^0-9->]/gi, '').split(/->{1,100}/)

          if (subrange.length !== 2) {
            throw new Error(`Invalid range: "${this.RULE.range[i]}"`)
          }

          // Validate both elements of the range
          if (subrange[0].trim().toLowerCase() === 'null') {
            subrange[0] = null
          } else {
            subrange[0] = NGN.forceNumber(subrange[0])
          }

          if (subrange[1].trim().toLowerCase() === 'null') {
            subrange[1] = null
          } else {
            subrange[1] = NGN.forceNumber(subrange[1])
          }
        }

        let min = subrange[0]
        let max = subrange[1]

        if (NGN.typeof(value) === 'string') {
          if ((min !== null && value.length < min) || (max !== null && value.length > max)) {
            return false
          }
        } else if ((min !== null && value < min) || (max !== null && value > max)) {
          return false
        }
      }

      return true
    }
  }

  get range () {
    return this.RULE.range.values()
  }

  set range (value) {
    this.RULE.range = new Set()
    this.addRange(value)
  }

  /**
   * Add a range to the rule.
   * @param {array} value
   * A range can be a single array, such as `[min, max]`. An array of arrays is
   * also acceptable, such as `[[min1, max1], [min2, max2]]`.
   */
  addRange (value) {
    value = this.RULE.prepareRange(value)

    for (let i = 0; i < value.length; i++) {
      if (value[i][0] !== null && value[i][1] !== null && value[i][1] < value[i][0]) {
        throw new Error(`Invalid value "${value[i][0].toString()} -> ${value[i][1].toString()}". Minimum value cannot exceed maximum.`)
      }

      this.RULE.range.add(value[i])
    }
  }

  /**
   * Remove an existing range from the rule.
   * @param {array} value
   * A range can be a single array, such as `[min, max]`. An array of arrays is
   * also acceptable, such as `[[min1, max1], [min2, max2]]`.
   */
  removeRange (value) {
    value = this.RULE.prepareRange(value)

    for (let i = 0; i < value.length; i++) {
      this.RULE.range.delete(value[i])
    }
  }
}

  // [PARTIAL]

/**
 * @class NGN.DATA.Field
 * Represents a data field to be used in a model/record.
 * @fires hidden
 * Triggered when the field changes from unhidden to hidden.
 * @fires unhidden
 * Triggered when the field changes from hidden to unhidden.
 * @fires update {object}
 * Triggered when the field value is updated. The payload contains
 * an object with old and new values:
 *
 * ```js
 * {
 *   old: 'old value',
 *   new: 'new value'
 * }
 * ```
 * @fires invalid
 * Triggered when a previously valid value becomes invalid.
 * @fires valid
 * Triggered when a previously invalid value becomes valid.
 * @fires rule.add {NGN.DATA.Rule}
 * Triggered when a new validation rule is added. The rule is emitted
 * to event handlers.
 * @fires rule.remove {NGN.DATA.Rule}
 * Triggered when a validation rule is removed. The rule is emitted
 * to event handlers.
 * @fires keystatus.changed {boolean}
 * Triggered when the key (identifier) status changes. The boolean
 * payload indicates whether the field is considered an identifier.
 */
class NGNDataField extends NGN.EventEmitter {
  /**
   * @param {string|object} configuration
   * Accepts an object with all configuration objects, or a string representing
   * the name of the field.
   */
  constructor (cfg) {
    cfg = cfg || {}

    if (typeof cfg === 'string') {
      cfg = {
        name: cfg
      }
    }

    // Validate field configuration values
    if (cfg.hasOwnProperty('pattern') && NGN.typeof(cfg.pattern) !== 'regexp') {
      throw new Error('Invalid data field configuration. Pattern must be a valid JavaScript regular expression (RegExp).')
    }

    super(cfg)

    // const INSTANCE = Symbol('datafield')
    const EMPTYDATA = Symbol('empty')

    Object.defineProperties(this, {
      // METADATA: NGN.get(() => this[INSTANCE]),

      METADATA: NGN.privateconst({
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

        // Identifies the property as a standard data attribute.
        // Alternative options include `data`, `key`, `join`, `virtual`.
        fieldType: NGN.coalesce(cfg.identifier, false) ? 'key' : 'data',

        isIdentifier: NGN.coalesce(cfg.identifier, false),

        /**
         * @cfg {boolean} [autocorrectInput=true]
         * Attempt to automatically correct data type values. For example,
         * a numeric field receiving a value of `'10'` will automatically
         * convert the input to `10`. Only arrays, numbers, and booleans are
         * supported. See NGN#forceArray, NGN#forceBoolean, and NGN#forceNumber
         * for details.
         */
        autocorrectInput: NGN.coalesce(cfg.autocorrectInput, false),

        /**
         * @cfg {RegExp} [pattern]
         * A pattern, as defined by a standard RegExp, that the data must match.
         */
        pattern: NGN.coalesceb(cfg.pattern),

        /**
         * @cfgproperty {string} name
         * The field name.
         */
        name: NGN.coalesce(cfg.name),

        /**
         * @cfg {any} default
         * The default value of the field when no value is specified.
         */
        default: NGN.coalesce(cfg.default),

        lastValue: Symbol('no.value'),

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
        violatedRule: null,

        /**
         * @cfg {boolean} [allowInvalid=true]
         * If this is set to `false`, invalid values will throw an error.
         */
        allowInvalid: NGN.coalesce(cfg.allowInvalid, true),

        RAWDATAPLACEHOLDER: EMPTYDATA,
        RAW: EMPTYDATA,
        ENUMERABLE_VALUES: null,
        IS_NEW: true,

        EVENTS: new Set([
          'hidden',
          'unhidden',
          'update',
          'invalid',
          'valid',
          'rule.add',
          'rule.remove',
        ]),

        /**
         * @cfg {NGN.DATA.Model} [model]
         * Optionally specify the parent model.
         */
        model: null
      })
    })

    if (NGN.typeof(this.METADATA.rules) !== 'array') {
      this.METADATA.rules = NGN.forceArray(this.METADATA.rules)
    }

    if (this.METADATA.rules.length > 0) {
      for (let i = 0; i < this.METADATA.rules.length; i++) {
        if (NGN.isFn(this.METADATA.rules[i]) && !(this.METADATA.rules[i] instanceof NGN.DATA.Rule)) {
          this.METADATA.rules[i] = new NGN.DATA.Rule(this.METADATA.rules[i], `Custom Rule #${i+1}`)
        }
      }
    }

    // Apply pattern validation if specified.
    if (this.METADATA.dataType === String && this.METADATA.pattern !== null) {
      this.METADATA.rules.unshift(new NGN.DATA.Rule(cfg.pattern, `Pattern Match (${cfg.pattern.toString()})`))
    }

    if (this.METADATA.dataType === Number || this.METADATA.dataType === Date || this.METADATA.dataType === String) {
      if (NGN.objectHasAny(cfg, 'min', 'minimum', 'max', 'maximum')) {
        cfg.range = NGN.forceArray(NGN.coalesce(cfg.range))
        cfg.range.push([NGN.coalesce(cfg.min, cfg.minimum), NGN.coalesce(cfg.max, cfg.maximum)])
      }

      if (cfg.hasOwnProperty('range')) {
        this.METADATA.rules.unshift(new NGN.DATA.RangeRule('Numeric Range', cfg.range))
      }
    }

    /**
     * @cfg {Array} [enum]
     * An enumeration of available values this field is allowed to have.
     */
    if (NGN.objectHasAny(cfg, 'enum', 'enumeration')) {
      this.METADATA.ENUMERABLE_VALUES = new Set(NGN.forceArray(NGN.coalesce(cfg.enum, cfg.enumeration)))
      this.METADATA.rules.push(new NGN.DATA.Rule((value) => this.METADATA.ENUMERABLE_VALUES.has(value), 'Enumerable Values'))
    }

    /**
     * @cfg {Primitive} [type=String]
     * The type should be a JavaScript primitive, class, or constructor.
     * For example, `String`, `Number`, `Boolean`, `RegExp`, `Array`, or `Date`.
     */
    this.METADATA.rules.unshift(
      new NGN.DATA.Rule(
        (value) => NGN.typeof(value) === NGN.typeof(this.METADATA.dataType),
        `${this.type.toUpperCase()} Type Check`
      )
    )

    if (NGN.coalesce(cfg.model) !== null) {
      this.model = cfg.model
    }
  }

  /**
   * @property {NGN.DATA.Model} model
   * Represents the model/record the field is associated to.
   * The model may be configured once, after which this property
   * becomes read-only. This will also be read-only if #model is set
   * to a valid value.
   */
  get model () {
    return this.METADATA.model
  }

  set model (value) {
    if (this.METADATA.model === null) {
      if (value instanceof NGN.DATA.Model) {
        this.METADATA.model = value

        let events = Array.from(this.METADATA.EVENTS.values())
        events.slice(events.indexOf('update'), 1)

        this.on('update', (payload) => this.commitPayload(payload))

        for (let i = 0; i < events.length; i++) {
          this.on(events[i], () => this.METADATA.model.emit(`field.${events[i]}`, ...arguments))
        }

        this.METADATA.model.emit('field.create', this)
      } else {
        NGN.WARN('Invalid model.')
      }
    } else {
      NGN.WARN('Cannot set model multiple times.')
    }
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
    this.METADATA.required = NGN.forceBoolean(value)
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

  set hidden (value) {
    let originallyHidden = this.hidden
    let currentlyHidden = NGN.forceBoolean(value)

    if (originallyHidden !== currentlyHidden) {
      this.METADATA.hidden = currentlyHidden
      this.emit(originallyHidden ? 'unhidden' : 'hidden')
    }
  }

  /**
   * @property {boolean} virtual
   * Indicates the field should be considered virtual.
   */
  get virtual () {
    return this.METADATA.fieldType === 'virtual'
  }

  /**
   * @property {boolean} identifier
   * Indicates the field is considered an identifier.
   */
  get identifier () {
    return this.METADATA.isIdentifier
  }

  set identifier (value) {
    value = NGN.forceBoolean(value)

    if (value !== this.METADATA.isIdentifier) {
      this.METADATA.isIdentifier = value
      this.emit('keystatus.changed', value)
    }
  }

  get name () {
    return this.METADATA.name
  }

  /**
   * @property {Boolean}
   * Indicates the model is new or does not exist according to the persistence store.
   * @private
   * @readonly
   */
  get isNew () {
    return this.METADATA.IS_NEW
  }

  /**
   * @property {Any} default
   * The default field value.
   */
  get default () {
    return this.METADATA.default
  }

  /**
   * @property {Any} value
   * The value of the field.
   */
  get value () {
    if (typeof this.METADATA.RAW !== 'symbol') {
      return this.METADATA.RAW
    }

    return this.METADATA.default
  }

  set value (value) {
    // Ignore changes when the value hasn't been modified.
    if (value === this.value) {
      return
    }

    // Attempt to auto-correct input when possible.
    if (this.METADATA.autocorrectInput && this.type !== NGN.typeof(value)) {
      value = this.autoCorrectValue(value)
    }

    let change = {
      field: this.METADATA.name,
      old: typeof this.METADATA.RAW === 'symbol' ? undefined : this.METADATA.RAW,
      new: value
    }

    let priorValueIsValid = this.valid

    this.METADATA.RAW = value

    // Notify when an invalid value is detected.
    if (!this.valid) {
      // If invalid values are explicitly prohibited, throw an error.
      // The value is rolled back before throwing the error so developers may
      // catch the error and continue processing.
      if (!this.METADATA.allowInvalid) {
        this.METADATA.RAW = change.old
        throw new Error(`"${value}" did not pass the ${this.METADATA.violatedRule} rule.`)
      } else {
        change.reason = `"${value}" did not pass the ${this.METADATA.violatedRule} rule.`
        NGN.WARN(change.reason)
      }

      this.emit('invalid', change)
    } else if (priorValueIsValid !== null && priorValueIsValid) {
      // If the field BECAME valid (compared to prior value),
      // emit an event.
      this.emit('valid', change)
    }

    if (typeof this.METADATA.lastValue === 'symbol') {
      this.METADATA.lastValue = value
    }

    // Notify when the update is complete.
    this.emit('update', change)

    // Mark unnecessary code for garbage collection.
    priorValueIsValid = null
    change = null
  }

  get modified () {
    if (typeof this.META.lastValue === 'symbol') {
      return false
    }

    return this.METADATA.lastValue !== this.value
  }

  /**
   * @property {boolean} valid
   * Indicates the field value is valid.
   */
  get valid () {
    if (this.required && NGN.coalesce(this.METADATA.RAW) === null) {
      this.METADATA.violatedRule = 'Data Required'
      NGN.WARN(`${this.name} is a required field.`)
      return false
    }

    if (this.METADATA.rules.length > 0) {
      for (let rule = 0; rule < this.METADATA.rules.length; rule++) {
        if (!this.METADATA.rules[rule].test(this.METADATA.RAW)) {
          this.METADATA.violatedRule = this.METADATA.rules[rule].name
          return false
        }
      }
    }

    this.METADATA.violatedRule = null

    return true
  }

  /**
   * Name of the rule which was violated.
   * @return {string}
   */
  get violatedRule () {
    return NGN.coalesce(this.METADATA.violatedRule, 'None')
  }

  /**
   * Hide the field.
   */
  hide () {
    this.hidden = true
  }

  /**
   * Unhide the field.
   */
  unhide () {
    this.hidden = false
  }

  /**
   * Do not throw errors whan a value is marked as invalid.
   */
  allowInvalid () {
    this.METADATA.allowInvalid = true
  }

  /**
   * Throw errors whan a value is marked as invalid.
   */
  disallowInvalid () {
    this.METADATA.allowInvalid = false
  }

  /**
   * Attempt to automatically correct a value according to the
   * field's data type.
   * @param  {Any} value
   * The value to attempt to autocorrect.
   * @return {Any}
   * Returns the value after attempting to autocorrect the value.
   */
  autoCorrectValue (value) {
    try {
      switch (this.type) {
        case 'number':
          value = NGN.forceNumber(value)
          break

        case 'boolean':
          value = NGN.forceBoolean(value)
          break

        case 'array':
          value = NGN.forceArray(value)
          break

        case 'string':
          value = value.toString()
          break
      }
    } finally {
      return value
    }
  }

  // Submit the payload to the parent model (if applicable).
  commitPayload (payload) {
    if (this.METADATA.model) {
      payload.action = 'update'
      payload.join = true

      this.increaseMaxListeners(3)
      this.METADATA.model.emit(
        [
          'update',
          `${payload.field}.update`,
          `update.${payload.field}`
        ],
        payload
      )

      payload = null // Mark for garbage collection
    }
  }
}

  // [PARTIAL]

/**
 * @class NGN.DATA.VirtualField
 * A virtual field is a read-only ephemeral representation of data,
 * generated dynamically.
 * In other words, it's a made up data field that isn't part of what gets stored.
 * The value can be changed at any time, without warning or events. This is most
 * commonly used as an _internal class_ to support virtual fields within data
 * models. Consider the following:
 *
 * **Example:**
 *
 * ```js
 * let Person = new NGN.DATA.Model({
 *   fields: {
 *     dateOfBirth: Date
 *     age: function () {
 *       return YearsApart(new Date(), this.dateOfBirth)
 *     }
 *   }
 * })
 * ```
 *
 * The `age` example above (shorthand syntax) compares the `dateOfBirth` field
 * to the current date, expecting a numeric response. This particular virtual
 * field is useful for calculating a common value on the fly, and it is reusable
 * for any number of instances of the model.
 *
 * This functionality is available by implementing the NGN.DATA.VirtualField.
 * For example, the `age` virtual field would be created as:
 *
 * ```js
 * let age = new NGN.DATA.VirtualField(model, function () {
 *   return YearsApart(new Date(), this.dateOfBirth)
 * })
 * ```
 */
class NGNVirtualDataField extends NGNDataField {
  constructor (cfg) {
    cfg = cfg || {}

    if (!(cfg.model instanceof NGN.DATA.Entity)) {
      NGN.WARN('No model specified for the virtual field to reference.')
    }

    // Remove unnecessary config values
    delete cfg.required
    delete cfg.default
    delete cfg.min
    delete cfg.minimum
    delete cfg.max
    delete cfg.maximum
    delete cfg.range
    delete cfg.rule
    delete cfg.rules
    delete cfg.validators
    delete cfg.pattern

    super(cfg)

    this.METADATA.fieldType = 'virtual'

    /**
     * @cfg {NGN.DATA.Model|NGN.DATA.Store|Object} scope
     * The model, store, or object that will be referenceable within the
     * virtual field #method. The model will be available in the `this` scope.
     */
    this.METADATA.scope = NGN.coalesce(cfg.scope, this)

    /**
     * @cfg {Function} method
     * The method used to generate a value.
     * This is an asynchronous method the returns a value (of any type).
     */
    const me = this
    const handlerFn = cfg.method

    this.METADATA.virtualMethod = function () {
      return handlerFn.apply(me.METADATA.scope, ...arguments)
    }
  }

  /**
   * @property {any} value
   * This will always return the value of the virtual field, but it may only
   * be _set_ to a synchronous function that returns a value.
   */
  get value () {
    return this.METADATA.virtualMethod()
  }

  set value (value) {
    NGN.WARN('Cannot set the value of a virtual field (read only).')
  }

  get required () {
    NGN.WARN('Virtual fields do not support the required property.')
    return false
  }

  set required (value) {
    NGN.WARN('Virtual fields do not support the required property.')
  }

  get isNew () {
    NGN.WARN('Virtual fields do not support the isNew property.')
    return false
  }

  get default () {
    NGN.WARN('Virtual fields do not have default values.')
    return undefined
  }

  set default (value) {
    NGN.WARN('Virtual fields do not have default values.')
    return
  }

  get violatedRule () {
    return 'None'
  }

  get valid () {
    NGN.WARN('Virtual fields are always valid.')
    return true
  }

  get modified () {
    NGN.WARN('modified attribute does nothing on virtual fields.')
    return false
  }

  allowInvalid () {
    NGN.WARN('allowInvalid() unavailable for virtual fields.')
  }

  disallowInvalid () {
    NGN.WARN('disallowInvalid() unavailable for virtual fields.')
  }

  autocorrectInput () {
    NGN.WARN('autocorrectInput() unavailable for virtual fields.')
  }
}

  // [PARTIAL]

/**
 * @class NGN.DATA.Relationship
 * Represents a data field linked to another NGN.DATA.Model or
 * NGN.DATA.Store. This is used for nesting models/stores within a field,
 * supporting creation of complex data structures that are still easy
 * to work with.
 *
 * While there is no limit to how deeply nested fields can be, it is considered
 * a best practice to avoid circular relationships, which can lead to infinite
 * loops when serializing data.
 *
 * Nested models (i.e. records) each have their own data
 * @NGN.DATA.Model#validators, so relationship fields defer all validation to
 * the individual record/model.
 *
 * Relationships using NGN.DATA.Stores behave a little differently, since they
 * represent a collection of data instead of a single record/model. NGN manages
 * [referential integrity](https://en.wikipedia.org/wiki/Referential_integrity)
 * using simplistic
 * [cardinality](https://en.wikipedia.org/wiki/Cardinality_(data_modeling)).
 *
 * Referential integrity & cardinality rules are data modeling principles
 * designed to enforce data quality standards. The nature of JavaScript objects
 * naturally enforces rudimentary data linking/nesting. NGN data relationships
 * build upon this, using proven data modeling principles.
 *
 * This is done, very simply, by using the @cfg#min and @cfg#max configuration
 * options. However; these options don't always need to be enforced, depending
 * on what type of cardniality needs to be achieved.
 *
 * For more information, see the Data Modeling Guide.
 *
 * **Note to self, use this next part in the guide:**
 *
 * There are five (5) common types of cardinality.
 *
 * - **1 => 1**: One-to-One
 * - **0 => 1**: Zero-or-One
 * - **0 => N**: Zero-to-Many
 * - **1 => N**: One-to-Many
 * - **N => N**: Many-to-Many
 *
 * There are also more granular types of cardinality, which are less common in
 * web applications, but often used in data and ETL operations.
 *
 * - **0,1 => 0,N**: Zero-or-One to Zero-or-More
 * - **0,1 => 1,N**: Zero-or-One to One-or-More
 * - ... write the rest in the guide...
 */
class NgnRelationshipField extends NGNDataField {
  constructor (cfg) {
    cfg = cfg || {}

    // Create optional cardinality validations

    // Initialize
    super(cfg)

    this.METADATA.fieldType = 'join'
    this.METADATA.join = Symbol('relationship')
    this.METADATA.isIdentifier = false

    /**
     * @cfg join {NGN.DATA.Store|NGN.DATA.Model[]}
     * A relationship to another model/store is defined by a join.
     * The join may be a data store or data model. It is also possible
     * to specify a collection.
     *
     * For example, a join may be defined as:
     *
     * ```js
     * // Use of a model
     * let RelationshipField = new NGN.DATA.Relationship({
     *   record: new NGN.DATA.Model(...)
     * })
     *
     * // Use of a model collection
     * let RelationshipField = new NGN.DATA.Relationship({
     *   record: [new NGN.DATA.Model(...)]
     * })
     *
     * // Use of a store
     * let RelationshipField = new NGN.DATA.Relationship({
     *   record: new NGN.DATA.Store(...)
     * })
     * ```
     *
     * A store and a model collection are both a group of models,
     * Internally, model collections are converted to data stores.
     *
     * By supporting all three formats, it is possible to create complex
     * data models, such as:
     *
     * ```js
     * let Pet = new NGN.DATA.Model(...)
     * let Kid = new NGN.DATA.Model(...)
     * let Kids = new NGN.DATA.Model({
     *   model: Kid
     * })
     *
     * let Person = new NGN.DATA.Model({
     *   fields: {
     *     dateOfBirth: Date,
     *     spouse: Person,  // <== Join a Model
     *     kids: Kids,      // <== Join a Store
     *     pets: [Pet]      // <== Join a Collection
     *   }
     * })
     * ```
     *
     * The `pets` field contains a "collection". This shorthand notation is used
     * to help understand real data relationships. In this case, it is easy to
     * infer that a person may have zero or more pets.
     */
    this.record = NGN.coalesce(cfg.record)
  }

  /**
   * @property {string} manner
   * The manner of relationship. This can be one of 3 values: `store`
   * (NGN.DATA.Store), `model` (NGN.DATA.Model), or `collection`. A collection
   * is a special configuration shortcut used to represent a new store of models.
   *
   * For example, a model may be defined as:
   *
   * ```js
   * let Pet = new NGN.DATA.Model({
   *   fields: {
   *     name: String,
   *     animalType: String
   *   }
   * })
   *
   * let Person = new NGN.DATA.Model({
   *   fields: {
   *     dateOfBirth: Date
   *   },
   *   relationships: {
   *     pets: [Pet]        // <== Collection
   *   }
   * })
   * ```
   */
  get manner () {
    return NGN.coalesce(this.METADATA.manner, 'unknown')
  }

  // Override the default value setter
  set value (value) {
    // Short-circuit if the value hasn't changed.
    let currentValue = this.METADATA.join
    if (currentValue === value) {
      return
    }

    if (NGN.typeof(value) === 'array') {
      if (value.length !== 1) {
        throw new Error(`${name} cannot refer to an empty data store/model collection. A record must be provided.`)
      }

      this.METADATA.manner = value[0] instanceof NGN.DATA.Store ? 'store' : 'collection'
      this.METADATA.join = this.METADATA.manner === 'store'
        ? value[0]
        : new NGN.DATA.Store({
          model: value[0]
        })
    } else if (this.METADATA.join instanceof NGN.DATA.Entity) {
      this.METADATA.manner = 'model'
    } else {
      NGN.ERROR(`The "${name}" relationship has an invalid record type. Only instances of NGN.DATA.Store, NGN.DATA.Model, or [NGN.DATA.Model] are supported." .`)
      throw new Error(`Invalid record configuration for ${name} field.`)
    }

    if (this.manner === 'unknown') {
      throw new Error('Cannot set a relationship field to anything other than an NGN.DATA.Store, NGN.DATA.Model, or an array of NGN.DATA.Model collections. (Unknown manner of relationship)')
    }

    this.METADATA.join = value

    this.applyMonitor()

    // Notify listeners of change
    if (typeof currentValue === 'symbol') {
      this.emit('update', {
        old: currentValue,
        new: value
      })
    }
  }

  /**
   * Apply event monitoring to the #record.
   */
  applyMonitor () {
    if (this.manner === 'model') {
      // Model Event Relay
      this.METADATA.join.pool('field.', {
        create: this.commonModelEventHandler('field.create'),
        update: this.commonModelEventHandler('field.update'),
        remove: this.commonModelEventHandler('field.remove'),
        invalid: (data) => {
          this.emit(['invalid', `invalid.${this.name}.${data.field}`])
        },
        valid: (data) => {
          this.emit(['valid', `valid.${this.name}.${data.field}`])
        }
      })
    } else {
      // Store Event Relay
      this.raw.pool('record.', {
        create: this.commonStoreEventHandler('record.create'),
        update: this.commonStoreEventHandler('record.update'),
        remove: this.commonStoreEventHandler('record.remove'),
        invalid: (data) => {
          this.emit('invalid', `invalid.${this.name}.${data.field}`)
        },
        valid: (data) => {
          this.emit('valid', `valid.${this.name}.${data.field}`)
        }
      })
    }
  }

  commonStoreEventHandler (type) {
    const me = this

    return function (record, change) {
      let old = change ? NGN.coalesce(change.old) : me.data

      if (this.event === 'record.create') {
        old.pop()
      } else if (this.event === 'record.delete') {
        old.push(record.data)
      }

      me.commitPayload({
        field:  me.name + (change ? `.${change.field}` : ''),
        old: change ? NGN.coalesce(change.old) : old,
        new: change ? NGN.coalesce(change.new) : me.data,
        join: true,
        originalEvent: {
          event: this.event,
          record: record
        }
      })
    }
  }

  commonModelEventHandler (type) {
    const me = this

    return function (change) {
      me.commitPayload({
        field: `${me.name}.${change.field}`,
        old: NGN.coalesce(change.old),
        new: NGN.coalesce(change.new),
        join: true,
        originalEvent: {
          event: this.event,
          record: me.METADATA.record
        }
      })
    }
  }
}

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
  constructor (config) {
    config = config || {}

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
        idAttribute: NGN.privateconst(config.idAttribute || 'id'),

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

                // Type-based config.
                default:
                  if (NGN.isFn(cfg) || cfg === null) {
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

          Object.defineProperty(this, field, {
            get: () => this.METADATA.fields[field].value,
            set: (value) => this.METADATA.fields[field].value = value
          })

          this.METADATA.fields[field].relay('*', this, 'field.')

          if (!suppressEvents) {
            this.emit('field.create', this.METADATA.fields[field])
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
    RangeRule: NGN.privateconst(NGNDataRangeValidationRule),
    Field: NGN.const(NGNDataField),
    VirtualField: NGN.const(NGNVirtualDataField),
    Relationship: NGN.const(NgnRelationshipField),
    Entity: NGN.privateconst(NGNDataModel),
    Model: NGN.const(NGNModel),
    Index: NGN.privateconst(NGNDataIndex),
    Store: NGN.const(NGNDataStore)
  })))
})()