import { coalesceb, typeOf } from './operator.js'

/**
 * @method forceBoolean
 * Forces a value to become a boolean if it is not already one. For example:
 *
 * ```js
 * let x = NGN.forceBoolean('false') // String ==> Boolean
 * console.log(x) // Outputs false
 *
 * let y = NGN.forceBoolean('text') // String ==> Boolean
 * console.log(y) // Outputs true (any non-blank text results in true, except the word "false")
 *
 * let z = NGN.forceBoolean(0) // Number ==> Boolean (0 = false, 1 = true)
 * console.log(z) // Outputs false
 * ```
 *
 * All other types will yield a `true` value, except for `null`. A `null`
 * value is treated as `false`.
 * @param {any} expression
 * The value being forced to be a boolean.
 * @private
 */
const Force = value => {
  switch (typeOf(value)) {
    case 'boolean':
      return value

    case 'number':
      return value === 0 ? false : true // eslint-disable-line no-unneeded-ternary

    case 'string':
      value = value.trim().toLowerCase()

      if (value === 'false') {
        return false
      }

      return true

    default:
      return coalesceb(value) !== null
  }
}

export {
  Force
}
