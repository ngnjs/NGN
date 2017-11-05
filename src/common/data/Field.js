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
