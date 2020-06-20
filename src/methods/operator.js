import { WARN } from '../internal.js'

/**
 * @method nullIf
 * Returns a null value if the two specified expressions are equal.
 * ```js
 * if (NGN.nullIf(myvar, 'value') === null) {
 *   console.log('Variable had a value of "value", which is considered null')
 * }
 *
 * // or
 *
 * if (NGN.nullIf(myvar) === null) {
 *   console.log('Empty variable whose trimmed length is 0')
 * }
 * ```
 * @param {any} sourceExpression
 * The variable or value to check.
 * @param {any} [comparisonExpression = '']
 * The variable or value to compare the source expression against.
 * @return {any}
 * If the source expression matches the comparison expression, `null` will
 * be returned. If they do not match, the source expression will be returned.
 */
const nullIf = function (sourceExpression, comparisonExpression = '') {
  try {
    // If the values aren't equal, make sure it's not due to blank values
    // or hidden characters.
    if (sourceExpression !== comparisonExpression) {
      // Different data types indicate different values.
      if (typeof sourceExpression !== typeof comparisonExpression) {
        return sourceExpression
      }

      if (typeof sourceExpression === 'string') {
        if (sourceExpression.trim() !== comparisonExpression.trim()) {
          return sourceExpression
        }
      }
    }

    return sourceExpression === comparisonExpression ? null : sourceExpression
  } catch (e) {
    WARN(`nullIf threw an error (${e.message}) when comparing '${sourceExpression}' to '${comparisonExpression}'.`)
    return null
  }
}

/**
 * @method converge
 * Provides a basic coalesce. Expects the first parameter to be a boolean
 * value. `true` will wrap arguments in a nullIf operator. `false` will not.
 * @private
 */
const converge = function () {
  if (arguments.length < 2) {
    return null
  } else if (arguments.length === 2) {
    if (arguments[1] === undefined) {
      return null
    } else if (arguments[0] === true) {
      return nullIf(arguments[1])
    } else {
      return arguments[1]
    }
  }

  for (let i = 1; i < arguments.length; i++) {
    if (arguments[i] !== undefined &&
      (arguments[0] ? nullIf(arguments[i]) : arguments[i]) !== null
    ) {
      return arguments[i]
    }
  }

  return null
}

/**
 * @method coalesce
 * Finds the first non-null/defined value in a list of arguments.
 * This can be used with {@link Boolean Boolean} values, since `true`/`false` is a
 * non-null/defined value.
 * @param {Mixed} args
 * Any number of arguments can be passed to this method.
 * @return {Any}
 * Returns the first non-null/defined value. If non exist, `null` is retutned.
 */
const coalesce = function () { return converge(false, ...arguments) }

/**
 * @method coalesceb
 * Provides the same functionality as #coalesce, except **b**lank/empty arguments
 * are treated as `null` values.
 * @param {Mixed} args
 * Any number of arguments can be passed to this method.
 */
const coalesceb = function () { return converge(true, ...arguments) }

/**
 * @method typeof
 * A more specific typeof method. This will list primitives,
 * but also provides more specific names for functions and objects.
 * For example, the native typeof []` would return `object`, whereas
 * this method will return `array`. This method will also
 * recognize function names, dates, and classes by their name.
 * @param  {any} element
 * The element to determine the type of.
 * @return {string}
 * Returns the type (all lower case).
 */
const typeOf = el => {
  if (el === undefined) {
    return 'undefined'
  }

  if (el === null) {
    return 'null'
  }

  const value = Object.prototype.toString.call(el).split(' ')[1].replace(/[^A-Za-z]/gi, '').toLowerCase()

  if (value === 'function' || typeof el === 'function') {
    if (!el.name) {
      const name = coalesceb(el.toString().replace(/\n/gi, '').replace(/^function\s|\(.*$/mgi, '').toLowerCase(), 'function')

      if (name.indexOf(' ') >= 0) {
        return 'function'
      }

      return name.toLowerCase()
    }

    return coalesceb(el.name, 'function').toLowerCase()
  }

  return value.toLowerCase()
}

/**
 * @method getPrimitive
 * Returns the primitive object/function of the specified type.
 * For example:
 *
 * ```js
 * let type = NGN.getType('number') // Returns Number
 * let type = NGN.getType('string') // Returns String
 * ```
 */
const getPrimitive = (type, defaultType) => {
  switch (type.trim().toLowerCase()) {
    case 'number':
      return Number

    case 'regex':
      // Warn and fall through to the RegExp case.
      WARN('regex is not a valid JavaScript type. Using regexp instead.')

    case 'regexp': // eslint-disable-line no-fallthrough
      return RegExp

    case 'boolean':
      return Boolean

    case 'symbol':
      return Symbol

    case 'date':
      return Date

    case 'array':
      return Array

    case 'object':
      return Object

    case 'function':
      return Function

    case 'string':
      return String

    default:
      if (defaultType) {
        return defaultType
      }

      return undefined
  }
}

export {
  typeOf,
  converge,
  nullIf,
  coalesce,
  coalesceb,
  getPrimitive
}
