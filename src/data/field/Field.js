import NGN from '../../core.js'
import EventEmitter from '../../emitter/core.js'

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
export default class NGNDataField extends EventEmitter { // eslint-disable-line
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
    if (cfg.hasOwnProperty('pattern') && NGN.typeof(cfg.pattern) !== 'regexp') { // eslint-disable-line no-prototype-builtins
      throw new Error('Invalid data field configuration. Pattern must be a valid JavaScript regular expression (RegExp).')
    }

    if (cfg.type === undefined) {
      if (cfg.default) {
        cfg.type = NGN.getType(NGN.typeof(cfg.default), String)
      }
    }

    super(cfg)

    const EMPTYDATA = Symbol('empty')

    Object.defineProperties(this, {
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
         * @cfgproperty {string} description
         * This is a metadata field, primarily used for documentation
         * or schema generation purposes.
         */
        description: NGN.coalesce(cfg.description, `${NGN.typeof(cfg.type)} field`),

        /**
         * @cfgproperty {string} [sourceName]
         * A source name represents the physical name of an attribute as it
         * would be recognized in a system of record. For example, a field
         * named `firstname` may need to be written to disk/memory as `gn`
         * (commonly used as shorthand for givenName in LDAP environments
         * and relational databases).
         *
         * By specifying `firstname` as the field name and `gn` as the source
         * name, the field will automatically map values from the source
         * to model name and vice versa.
         *
         * For instance, a JSON input may look like:
         *
         * ```js
         * {
         *   "gn": "John",
         *   "sn": "Doe"
         * }
         * ```
         *
         * When this data is applied to the field (or loaded in a
         * NGN.DATA.Model), the field #value for `firstname` would be `John`.
         * If the field #value is changed to `Jill` (i.e.
         * `firstname.value = 'Jill'`), the resulting data set would look like:
         *
         * ```js
         * {
         *   "gn": "Jill",
         *   "sn": "Doe"
         * }
         * ```
         */
        sourceName: NGN.coalesce(cfg.sourceName),

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

        /**
         * @cfg {function} transformer
         * A synchronous transformation function will be applied each time
         * the field value is set. This can be used to modify data _before_ it
         * is stored as a field value. The returned value from the function
         * will be the new value of the field.
         *
         * The transformation function will receive the input as it's only
         * aregument. For example:
         *
         * ```js
         * let field = new NGN.DATA.Field({
         *   name: 'testfield',
         *   transformer: function (input) {
         *     return input + '_test'
         *   }
         * })
         *
         * field.value = 'a'
         *
         * console.log(field.value) // Outputs "a_test"
         * ```
         *
         * **Transformations can affect performance.** In small data sets,
         * transformations are typically negligible, only adding a few
         * milliseconds to processing time. This may affect large data sets,
         * particularly data stores using defauly bulk recod loading.
         */
        TRANSFORM: NGN.coalesce(cfg.transformer),

        RAWDATAPLACEHOLDER: EMPTYDATA,
        RAW: EMPTYDATA,
        ENUMERABLE_VALUES: null,
        REVERSE_ENUMERABLE_VALUES: null,
        IS_NEW: true,

        EVENTS: new Set([
          'hidden',
          'unhidden',
          'update',
          'invalid',
          'valid',
          'rule.add',
          'rule.remove'
        ]),

        /**
         * @cfg {boolean} [audit=false]
         * Enable auditing to support #undo/#redo operations. This creates and
         * manages a NGN.DATA.TransactionLog.
         */
        AUDITABLE: NGN.coalesce(cfg.audit, false),

        /**
         * @cfg {Number} [auditMaxEntries=20]
         * The maximum number of historical records to maintain for the field.
         * See NGN.DATA.TransactionLog#constructor for details.
         */
        AUDITLOG: NGN.coalesce(cfg.audit, false)
          ? new NGN.DATA.TransactionLog(NGN.coalesce(cfg.auditMaxEntries, 10))
          : null,

        /**
         * @cfg {NGN.DATA.Model} [model]
         * Optionally specify the parent model.
         */
        model: null,

        // Set the value using a configuration.
        setValue: (value, suppressEvents = false, ignoreAudit = false) => {
          // Preprocessing (transform input)
          if (this.METADATA.TRANSFORM !== null && NGN.isFn(this.METADATA.TRANSFORM)) {
            value = this.METADATA.TRANSFORM.call(this, value)
          }

          // Attempt to auto-correct input when possible.
          if (this.METADATA.autocorrectInput && this.type !== NGN.typeof(value)) {
            value = this.autoCorrectValue(value)
          }

          // Ignore changes when the value hasn't been modified.
          if (value === this.value) {
            return
          }

          let change = {
            field: this,
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
          } else if (!suppressEvents && priorValueIsValid !== null && priorValueIsValid) {
            // If the field BECAME valid (compared to prior value),
            // emit an event.
            this.emit('valid', change)
          }

          if (typeof this.METADATA.lastValue === 'symbol') {
            this.METADATA.lastValue = value
          }

          // If auditing is enabled and not explicitly ignored by an internal
          // operation, commit the change.
          if (!ignoreAudit && !this.virtual && this.METADATA.AUDITABLE) {
            change.cursor = this.METADATA.AUDITLOG.commit(this.METADATA.RAW)
          }

          // Notify when the update is complete.
          if (!suppressEvents) {
            this.emit('update', change)
          }

          // Mark unnecessary code for garbage collection.
          priorValueIsValid = null
          change = null
        },

        // Submit the payload to the parent model (if applicable).
        commitPayload: (payload) => {
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
      })
    })

    // Apply common rules
    if (NGN.typeof(this.METADATA.rules) !== 'array') {
      this.METADATA.rules = NGN.forceArray(this.METADATA.rules)
    }

    if (this.METADATA.rules.length > 0) {
      for (let i = 0; i < this.METADATA.rules.length; i++) {
        if (NGN.isFn(this.METADATA.rules[i]) && !(this.METADATA.rules[i] instanceof NGN.DATA.Rule)) {
          this.METADATA.rules[i] = new NGN.DATA.Rule(this.METADATA.rules[i], `Custom Rule #${i + 1}`)
        }
      }
    }

    // Apply pattern validation if specified.
    if (this.METADATA.dataType === String) {
      if (this.METADATA.pattern !== null) {
        this.METADATA.rules.unshift(new NGN.DATA.Rule(cfg.pattern, `Pattern Match (${cfg.pattern.toString()})`))
      }

      /**
       * @cfg {Boolean} [nonempty]
       * @info This validation attribute applies to #String fields only.
       * Validates a value is not blank, `null`, or `undefined`.
       */
      if (cfg.nonempty) {
        this.METADATA.rules.unshift(new NGN.DATA.Rule(value => {
          return value.trim().length > 0
        }, `No Blanks (${cfg.pattern.toString()})`))
      }
    }

    /**
     * @cfg {Number} [min]
     * @info This validation attribute applies to #Array, #String, and #Number fields only.
     * Specify a minimum value:
     *
     * - For string values, this is a minimum number of characters.
     * - For numeric values, this is a minimum inclusive value (i.e. value must be greater than
     * or equal to the minimum).
     * - For arrays, this is a minimum number of items that must exist in the array.
     */
    /**
     * @cfg {Number} [max]
     * @info This validation attribute applies to #Array, #String, and #Number fields only.
     * Specify a maximum value:
     *
     * - For string values, this is a maximum number of characters.
     * - For numeric values, this is a maximum inclusive value (i.e. value must be less than
     * or equal to the maximum).
     * - For arrays, this is a maximum number of items that may exist in the array.
     */

    // Apply number-specific validations.
    if (this.METADATA.dataType === Number || this.METADATA.dataType === Date || this.METADATA.dataType === String) {
      // Support minimum/maximum range
      if (NGN.objectHasAny(cfg, 'min', 'minimum', 'max', 'maximum')) {
        cfg.range = NGN.forceArray(NGN.coalesce(cfg.range))
        cfg.range.push([NGN.coalesce(cfg.min, cfg.minimum), NGN.coalesce(cfg.max, cfg.maximum)])
      }

      /**
       * @cfg {Number} [range]
       * @info This validation attribute applies to #String and #Number fields only.
       * Specify a range of acceptable values:
       *
       * - For numbers, this implies inclusive ranges. For example, `1-10` means "between 1 and 10, where both 1 and 10 are valid."
       * - For strings, this implies inclusive ranges just like numbers, where the number is the character count.
       */
      if (cfg.hasOwnProperty('range')) { // eslint-disable-line no-prototype-builtins
        this.METADATA.rules.unshift(new NGN.DATA.RangeRule('Numeric Range', cfg.range))
      }

      if (this.METADATA.dataType === Number) {
        // Support numeric patterns (i.e. support for integers)
        if (NGN.coalesce(cfg.pattern)) {
          this.METADATA.rules.unshift(new NGN.DATA.Rule(value => {
            return cfg.pattern.test(value.toString())
          }, `Numeric Pattern (${cfg.pattern.toString().substr(0, 15) + (cfg.pattern.toString().length > 15 ? '...' : '')})`))
        }

        /**
         * @cfg {Number} [multipleOf]
         * @info This validation attribute applies to #Number fields only.
         * Insures the field value is a multiple of this number. For example,
         * if the multiple is `10` and the value is `100`, it is valid.
         * If the multiple is `10` and the value is `101`, it is invalid.
         */
        if (NGN.typeof(cfg.multipleOf) === 'number') {
          this.METADATA.rules.unshift(new NGN.DATA.Rule(value => {
            return Math.abs(value % cfg.multipleOf) === 0
          }, `Numeric Multiple of ${cfg.multipleOf}`))
        }
      }
    }

    // Apply array-specific native validations
    if (this.METADATA.dataType === Array) {
      // Enforce minimum number of array items
      if (NGN.objectHasAny(cfg, 'min', 'minimum')) {
        this.METADATA.rules.push(new NGN.DATA.Rule(value => value.length >= NGN.coalesce(cfg.min, cfg.minimum), `${NGN.coalesce(cfg.min, cfg.minimum)} count minimum`))
      }

      // Enforce maximum number of array items
      if (NGN.objectHasAny(cfg, 'max', 'maximum')) {
        this.METADATA.rules.push(new NGN.DATA.Rule(value => value.length <= NGN.coalesce(cfg.max, cfg.maximum), `${NGN.coalesce(cfg.max, cfg.maximum)} count maximum`))
      }

      /**
       * @cfg {Array} [unique]
       * @info This validation attribute applies to #Array fields only.
       * @warning This is a computationally expensive validation when used in NGN Data Stores.
       * Validates that all items are unique.
       */
      if (NGN.coalesce(cfg.unique, false)) {
        this.METADATA.rules.push(new NGN.DATA.Rule(value => NGN.dedupe(value).length === value.length, 'Unique value constraint'))
      }

      /**
       * @cfg {any} [listType]
       * @info This validation attribute applies to #Array fields only.
       * Require each element of the array to conform to the specified data
       * type. For example, setting `listType: Number` will validate that
       * each element of the array is a number.
       *
       * ```js
       * [1, 2, 3, 4, 5] // Valid
       * [1, 2, 'three', 4, 5] // Invalid
       * ```
       */
      if (cfg.hasOwnProperty('listType')) { // eslint-disable-line no-prototype-builtins
        this.METADATA.rules.push(new NGN.DATA.Rule(value => {
          for (let i = 0; i < value.length; i++) {
            if (NGN.typeof(value[i]) !== NGN.typeof(cfg.listType)) {
              return false
            }
          }

          return true
        }, `${NGN.typeof(cfg.listType).toUpperCase()} list type constraint`))
      }

      // Support enumerations in array values
      if (cfg.hasOwnProperty('enum')) { // eslint-disable-line no-prototype-builtins
        this.METADATA.rules.push(new NGN.DATA.Rule(value => {
          return cfg.enum.indexOf(value) >= 0
        }))
      }

      /**
       * @cfg {Array} [tuples]
       * @info This validation attribute applies to #Array fields only.
       * @warning This is a computationally expensive validation when used in NGN Data Stores.
       * Validate each item of an array according to a unique schema.
       * Each item is a key value object, which supports only the `type` and
       * `enum` validations.
       *
       * For example:
       *
       * ```js
       * {
       *   tuples: [{
       *     type: Number
       *   }, {
       *     type: String,
       *     enum: ['a', 'b', 'c']
       *   }, {
       *     enum: ['d', 1]
       *   }]
       * }
       * ```
       * The configuration above will make sure the first array item is a number,
       * while the second is either `a`, `b`, or `c`, and the third is either
       * the letter `d` or the number `1`. Only the first three items of the
       * array will be checked, but there must be at least 3 items.
       */
      if (cfg.hasOwnProperty('tuples')) { // eslint-disable-line no-prototype-builtins
        this.METADATA.rules.push(new NGN.DATA.Rule(value => {
          if (value.length < cfg.tuples.length) {
            return false
          }

          for (let i = 0; i < cfg.tuples.length; i++) {
            if (cfg.tuples[i].hasOwnProperty('type')) { // eslint-disable-line no-prototype-builtins
              if (NGN.typeof(value[i]) !== NGN.typeof(cfg.tuples[i].type)) {
                return false
              }
            }

            if (cfg.tuples[i].hasOwnProperty('enum')) { // eslint-disable-line no-prototype-builtins
              if (cfg.tuples[i].enum.indexOf(value[i]) < 0) {
                return false
              }
            }
          }

          return true
        }, 'Tuple constraint'))
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
     * @cfg {Array} [not]
     * A "reverse" enumeration, i.e. a list of values this field is **not** allowed to be.
     */
    if (NGN.objectHasAny(cfg, 'not', 'notin')) {
      this.METADATA.REVERSE_ENUMERABLE_VALUES = new Set(NGN.forceArray(NGN.coalesce(cfg.not, cfg.notin)))
      this.METADATA.rules.push(new NGN.DATA.Rule((value) => !this.METADATA.REVERSE_ENUMERABLE_VALUES.has(value), 'Rejected Values'))
    }

    // Check if the field type is an array, which indicates multiple
    // data types are considered valid.
    if (cfg.type instanceof Array) {
      // If the array has no values, assume the user meant to create an "Array" data type.
      // Warn them, in case this was not the intention.
      if (cfg.type.length === 0) {
        NGN.WARN(`No data type specified for ${this.name} field. Autoconverted to an array.`)
        cfg.type = Array
      } else if (cfg.type.length === 1) {
        // If there is only one data type, the array is extraneous and standard
        // datatype validation can be used.
        cfg.type = cfg.type[0]
      }
    }

    /**
     * @cfg {Primitive|Array} [type=String]
     * The type should be a JavaScript primitive, class, or constructor.
     * For example, `String`, `Number`, `Boolean`, `RegExp`, `Array`, or `Date`.
     * This can also be an array of primitive values. For example, `[String, Number]`
     * indicates the field could be a string or a numeric value.
     */
    if (cfg.type instanceof Array) {
      const typeList = cfg.type.map(type => NGN.typeof(type))

      this.METADATA.rules.unshift(
        new NGN.DATA.Rule(
          (value) => typeList.indexOf(NGN.typeof(value)) >= 0,
          `${this.type.toUpperCase()} Multitype Check`
        )
      )
    } else {
      this.METADATA.rules.unshift(
        new NGN.DATA.Rule(
          (value) => NGN.typeof(value) === NGN.typeof(this.METADATA.dataType),
          `${this.type.toUpperCase()} Type Check`
        )
      )
    }

    // Associate a model if one is defined.
    if (NGN.coalesce(cfg.model) !== null) {
      this.model = cfg.model
    }
  }

  get sourceName () {
    return this.METADATA.sourceName
  }

  get auditable () {
    return this.METADATA.AUDITABLE
  }

  set auditable (value) {
    value = NGN.forceBoolean(value)

    if (value !== this.METADATA.AUDITABLE) {
      this.METADATA.AUDITABLE = value
      this.METADATA.AUDITLOG = value ? new NGN.DATA.TransactionLog() : null
      this.METADATA.AUDITLOG.relay('*', this, 'transaction.')
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
      if (value instanceof NGN.DATA.Entity) {
        this.METADATA.model = value

        // let events = Array.from(this.METADATA.EVENTS.values())
        // events.splice(events.indexOf('update'), 1)
        //
        this.on('update', (payload) => this.METADATA.commitPayload(payload))
        //
        // for (let i = 0; i < events.length; i++) {
        //   this.on(events[i], () => this.METADATA.model.emit(`field.${events[i]}`, ...arguments))
        // }
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
    const originallyHidden = this.hidden
    const currentlyHidden = NGN.forceBoolean(value)

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
      this.emit('keystatus.changed', this)
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
    if (this.isIdentifier) {
      return NGN.coalesce(this.METADATA.autoid, this.METADATA.default)
    }

    if (NGN.isFn(this.METADATA.default) && this.type !== 'function') {
      return this.METADATA.default.apply(this)
    }

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
    this.METADATA.setValue(value)
  }

  /**
   * @property silentValue
   * A write-only attribute to set the value without triggering an update event.
   * This is designed primarily for use with live update proxies to prevent
   * endless event loops.
   * @param {any} value
   * The new value of the field.
   * @private
   * @writeonly
   */
  set silentValue (value) {
    this.METADATA.setValue(value, true)
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
      NGN.WARN(`${this.METADATA.name} is a required field.`)
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
   * @property {String}
   * Name of the rule which was violated.
   */
  get violatedRule () {
    return NGN.coalesce(this.METADATA.violatedRule, 'None')
  }

  /**
   * @property {Array} changelog
   * The changelog returns the underlying NGN.DATA.TransactionLog#log if
   * auditing is available. The array will be empty if auditing is disabled.
   */
  get changelog () {
    if (!this.METADATA.AUDITABLE) {
      NGN.WARN(`The changelog for the ${this.name} field is empty because auditing is disabled.`)
      return []
    }

    return this.METADATA.AUDITLOG.log
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
    if (!this.METADATA.AUDITABLE) {
      NGN.WARN(`The undo operation failed on the ${this.name} field because auditing is disabled.`)
      return
    }

    const id = this.METADATA.AUDITLOG.rollback(count)

    // Silently set the value to an older value.
    this.METADATA.setValue(this.METADATA.AUDITLOG.getCommit(id).value, suppressEvents, true)
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
    if (!this.METADATA.AUDITABLE) {
      NGN.WARN(`The redo operation failed on the ${this.name} field because auditing is disabled.`)
      return
    }

    const id = this.METADATA.AUDITLOG.advance(count)

    // Silently set the value to a newer value.
    this.METADATA.setValue(this.METADATA.AUDITLOG.getCommit(id).value, suppressEvents, true)
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

        case 'date': {
          const valueType = NGN.typeof(value)

          if (valueType !== 'date') {
            if (valueType === 'number') {
              const dt = new Date()
              dt.setTime(value)

              value = dt
            } else {
              value = new Date(Date.parse(value))
            }
          }

          break
        }
      }
    } finally {
      return value // eslint-disable-line no-unsafe-finally
    }
  }
}
