import { ERROR } from '../internal.js'
import { typeOf } from './operator.js'

/**
 * @method forceNumber
 * Forces a value to become a number if it is not already one. For example:
 *
 * ```js
 * let x = NGN.forceNumber('10') // String ==> Number
 * console.log(x === 10) // Outputs true
 *
 * let y = NGN.forceNumber(true) // Boolean ==> Number
 * console.log(y) // Output 1
 *
 * let z = NGN.forceNumber(false) // Boolean ==> Number
 * console.log(y) // Output 0
 * ```
 *
 * All other types will yield a `NaN` value. This has no effect on
 * @param {any} expression
 * The value being forced to be a number. If the expression is a date,
 * the result will be the number of milliseconds passed since the epoch.
 * See [Date.getTime()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTime)
 * for details.
 * @param {number} [radix]
 * An integer between 2 and 36 that represents the radix (the base in
 * mathematical numeral systems) of the expression.
 * Specify 10 for the decimal numeral system commonly used by humans.
 * Always specify this parameter to eliminate reader confusion and to
 * guarantee predictable behavior. Different implementations produce
 * different results when a radix is not specified, usually defaulting the
 * value to 10.
 *
 * **If no radix is supplied**, the `parseFloat` will be used to identify
 * the numeric value. When a radix is supplied, `parseInt` is used.
 * @private
 */
const Force = (value, radix = null) => {
  try {
    switch (typeOf(value)) {
      case 'boolean':
        return value ? 1 : 0

      case 'number':
        return value

      case 'date':
        return value.getTime()

      case 'string':
        return radix !== null ? parseInt(value, radix) : parseFloat(value)

      default:
        return NaN
    }
  } catch (e) {
    ERROR(e)
    return NaN
  }
}

export {
  Force
}
