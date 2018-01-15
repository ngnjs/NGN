// [PARTIAL]
/**
 * @class NGN.DATA.RangeRule
 * A special rule to validate values within one or more ranges.
 * Supports numeric ranges, date ranges, and simple string-based
 * ranges (string length).
 */
class NGNDataRangeValidationRule extends NGNDataValidationRule { // eslint-disable-line
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
      value = NGN.forceArray(value)

      if (NGN.typeof(value[0]) !== 'array') {
        value = [value]
      }

      for (let i = 0; i < value.length; i++) {
        if (value[i].length !== 2) {
          if (NGN.typeof(value[i][0]) !== 'string') {
            throw new Error(`Invalid range: "${value[i].toString()}"`)
          }

          value[i] = value[i][0].replace(/[^0-9->]/gi, '').split(/->{1,100}/)
        }

        if (NGN.typeof(value[i][0]) !== 'number') {
          value[i][0] = NGN.coalesce(value[i][0], '').replace(/null|none|any/gi, '')
        }

        if (NGN.typeof(value[i][1]) !== 'number') {
          value[i][1] = NGN.coalesce(value[i][1], '').replace(/null|none|any/gi, '')
        }
      }

      return value
    }

    // Initialize the range
    this.RULE.range = new Set()
    this.range = range

    // Create the validation function.
    this.RULE.validator = (value) => {
      let isString = NGN.typeof(value) === 'string'
      let range = this.range

      for (let i = 0; i < range.length; i++) {
        let min = NGN.coalesceb(range[i][0], isString ? value.length : value)
        let max = NGN.coalesceb(range[i][1], isString ? value.length : value)

        if (
          (isString && value.length >= min && value.length <= max) ||
          (!isString && value >= min && value <= max)
        ) {
          return true
        }
      }

      return false
    }
  }

  get range () {
    return Array.from(this.RULE.range.values())
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
      if (NGN.coalesceb(value[i][0]) !== null && NGN.coalesceb(value[i][1]) !== null && value[i][1] < value[i][0]) {
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
    let range = this.range
    value = this.RULE.prepareRange(value)

    for (let i = 0; i < value.length; i++) {
      for (let x = 0; x < range.length; x++) {
        if (value[i].toString() === range[x].toString()) {
          this.RULE.range.delete(range[x])
        }
      }
    }
  }
}
