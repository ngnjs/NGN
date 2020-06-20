/**
 * @method dedupe
 * Deduplicate a simple array.
 * @param {array} array
 * The array to deduplicate.
 * @return {array}
 * The array with unique records.
 * @private
 */
const Dedupe = array => Array.from(new Set(array))

/**
 * @method force
 * Forces a value to become an array if it is not already one. For example:
 *
 * ```js
 * let x = 'value'
 *
 * x = NGN.forceArray(x)
 *
 * console.log(x) // Outputs ['value']
 * ```
 * @param {any} expression
 * The value being forced to be an array.
 * @private
 */
const Force = value => value === null ? [] : (Array.isArray(value) ? value : [value])

export {
  Dedupe,
  Force
}
