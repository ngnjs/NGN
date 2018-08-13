/**
  * @class NGN.DATA.Rule
  * A data validation rule.
  * @fires validator.add
  */
export default class NGNDataValidationRule { // eslint-disable-line
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
   * Apply a custom scope to the validation functions (applicable to custom methods only).
   */
  constructor (validation, name = null, scope = null) {
    const type = NGN.typeof(validation)

    Object.defineProperties(this, {
      RULE: NGN.private({
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
