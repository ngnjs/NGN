'use strict'

/**
  * @class NGN.DATA.Rule
  * A simple validation rule.
  * @param {String} field
  * The data field to test.
  * @param {Function/String[]/Number[]/Date[]/RegExp/Array} validator
  *
  * @fires validator.add
  */
class NgnDataValidationRule extends NGN.EventEmitter {
  /**
   * @constructor
   * Create a new data rule.
   * @param {Function/String[]/Number[]/Date[]/RegExp/Array} rule
   * * * When rule is a _function_, the value is passed to it as an argument.
   * * When rule is a _String_, the value is compared for an exact match (case sensitive)
   * * When rule is a _Number_, the value is compared for equality.
   * * When rule is a _Date_, the value is compared for exact equality.
   * * When rule is a _RegExp_, the value is tested and the results of the RegExp#test are used to validate.
   * * When rule is an _Array_, the value is checked to exist in the array, regardless of data type. This is treated as an `enum`.
   * * When rule is _an array of dates_, the value is compared to each date for equality.
   */
  constructor (validation) {
    Object.defineProperties(this, {
      validator: NGN.private(validation)
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

NGN.DATA = NGN.DATA || {}
Object.defineProperty(NGN.DATA, 'Rule', NGN.privateconst(NgnDataValidationRule))
