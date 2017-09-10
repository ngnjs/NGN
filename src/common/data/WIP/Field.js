'use strict'

class NgnDataField extends NGN.EventEmitter {
  constructor (cfg) {
    cfg = cfg || {}

    // Validate field configuration values
    if (cfg.hasOwnProperty('pattern') && NGN.typeof(cfg.pattern) !== 'regexp') {
      throw new Error('Invalid data field configuration. Pattern must be a valid JavaScript regular expression (RegExp).')
    }

    super()

    Object.defineProperties(this, {
      idAttribute: NGN.private(false),

      /**
       * @cfg {string} name
       * The field name.
       */
      fieldName: NGN.private(NGN.coalesce(cfg.name)),

      /**
       * @cfg {any} default
       * The default value of the field when no value is specified.
       */
      defaultValue: NGN.private(NGN.coalesce(cfg.default)),

      /**
       * @cfg {Primitive} [type=String]
       * The JS primitive representing the type of data represented
       * by the field.
       */
      dataType: NGN.private(NGN.coalesce(cfg.type, String)),

      raw: NGN.private(null),

      /**
       * @cfg {boolean} [required=false]
       * Indicates the value is required.
       */
      _required: NGN.public(NGN.coalesce(cfg.required, false)),

      /**
       * @cfgproperty {boolean} [hidden=false]
       * Indicates the field is hidden (metadata).
       */
      _hidden: NGN.private(NGN.coalesce(cfg.hidden, false)),

      /**
       * @cfg {function} [rule[]]
       * A function, or an array of functions, which determine whether the
       * field value is valid or not. These functions receive a single argument
       * (the data value) and must return a Boolean value.
       */
      rules: NGN.private(NGN.coalesce(cfg.rules, cfg.validators, [])),

      /**
       * @cfg {boolean} [allowInvalid=true]
       * If this is set to `false`, invalid values will throw an error.
       */
      allowInvalid: NGN.private(NGN.coalesce(cfg.allowInvalid, true)),

      _fieldType: NGN.private('data')
    })

    this.rules = NGN.typeof(this.rules) !== 'array' ? [this.rules] : this.rules

    /**
     * @cfg {RegExp} [pattern]
     * A pattern, as defined by a standard RegExp, that the data must match.
     */
    if (this.dataType === String && cfg.hasOwnProperty('pattern')) {
      this.rules.unshift(new NGN.DATA.Rule(cfg.pattern))
    }

    if (this.dataType === Number) {
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
        this.rules.unshift(new NGN.DATA.Rule(value) => {
          for (let subrange in cfg.range) {
            let min = cfg.range[subrange][0]
            let max = cfg.range[subrange][1]

            if (min !== null && min > value) {
              return false
            }

            if (max !== null && max < value) {
              return false
            }
          }

          return true
        })
      } else {
        /**
         * @cfg {number} [min]
         * The minimum accepted value.
         */
        if (cfg.hasOwnProperty('min') || cfg.hasOwnProperty('minimum')) {
          this.rules.unshift(new NGN.DATA.Rule((value) => {
            return value >= NGN.coalesce(cfg.min, cfg.minimum)
          }))
        }

        /**
         * @cfg {number} [max]
         * The maximum accepted value.
         */
        if (cfg.hasOwnProperty('max') || cfg.hasOwnProperty('maximum')) {
          this.rules.unshift(new NGN.DATA.Rule((value) => {
            return value <= NGN.coalesce(cfg.max, cfg.maximum)
          }))
        }
      }
    }

    /**
     * @cfg {Array} [enum]
     * An enumeration of available values this field is allowed to have.
     */
    if (cfg.hasOwnProperty('enum') || cfg.hasOwnProperty('enumeration')) {
      this.rules.unshift(new NGN.DATA.Rule(NGN.coalesce(cfg.enum, cfg.enumeration)))
    }

    /**
     * @cfg {Primitive} [type=String]
     * The type should be a JavaScript primitive, class, or constructor.
     * For example, `String`, `Number`, `Boolean`, `RegExp`, `Array`, or `Date`.
     */
    this.rules.unshift(new NGN.DATA.Rule(this.dataType))
  }

  /**
   * @property {string} fieldType
   * The type of field.
   */
  get fieldType () {
    return this._fieldType
  }

  /**
   * @property {boolean} required
   * Indicates the field must have a non-null value.
   */
  get required () {
    return this._required
  }

  set required (value) {
    switch (NGN.typeof(value)) {
      case 'boolean':
        this._required = value
        return

      case 'number':
        this._required = value === 0 ? false : true
        return

      case 'string':
        value = value.trim().toLowerCase()
        if (value === 'true') {
          this._required = true
          return
        } else if (value === 'false') {
          this._required = false
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
    return NGN.typeof(this.dataType)
  }

  /**
   * @property {boolean} hidden
   * Indicates the field should be considered hidden.
   */
  get hidden () {
    return this._hidden
  }

  /**
   * @property {Any} default
   * The default field value.
   */
  get 'default' () {
    return this.defaultValue
  }

  set 'default' (value) {
    this.defaultValue = value
  }

  /**
   * @property {Any} value
   * The value of the field.
   */
  get value () {
    return NGN.coalesce(this.raw, this.defaultValue)
  }

  set value (value) {
    let change = {
      old: this.raw,
      new: value
    }

    let priorValueIsValid = this.valid

    this.raw = value

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

    for (let rule in this.validators) {
      if (!this.validators[rule](value)) {
        return false
      }
    }

    return true
  }
}

NGN.DATA = NGN.DATA || {}
Object.defineProperty(NGN.DATA, 'Field', NGN.privateconst(NgnDataField))
