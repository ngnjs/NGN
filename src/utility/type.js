import { allFalse, config } from './configuration.js'

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
      let name = el.toString().replace(/\n/gi, '').replace(/^function\s|\(.*$/mgi, '').toLowerCase()
      name = name.length === 0 || name.indexOf(' ') >= 0 ? 'function' : name
      return name.toLowerCase()
    }

    return (el.name || 'function').toLowerCase()
  }

  return value.toLowerCase()
}

const typeContains = function () {
  const args = Array.from(arguments)
  const arg = args.shift()
  const types = new Set(args)

  for (const type of types) {
    if (
      (typeof type === 'function' && arg instanceof type) ||
      (typeof type === 'string' && type === typeOf(arg))
    ) {
      return true
    }
  }

  return false
}

export default {
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
  typeof: config(...allFalse, typeOf),

  /**
   * @method acceptableType
   * Determines whether a variable is of a data type
   * specified within a list of types.
   *
   * **Example**
   * ```js
   * const myVar = Object.create({})
   * const ok = acceptableType(myVar, 'string', MyCustomClass, 'number', 'object')
   * console.log(ok) // Returns true
   *
   * const alright = acceptableType(myVar, 'string', MyCustomClass, 'number')
   * console.log(alright) // Returns false
   * ```
   *
   * The first line basically says "Return true if my variable is a string, instance of MyCustomClass,
   * a number, or an object".
   *
   * The second version basically says "Return true if my variable is a string, instance of MyCustomClass,
   * a number". The difference is there is _no object_ type in this list.
   * @param {any} testElement
   * @param {any} types
   * @return {boolean}
   */
  acceptableType: config(...allFalse, typeContains),

  /**
   * @method unacceptableType
   * Determines whether a variable is **not** of a data type
   * specified within a list of types.
   *
   * **Example**
   * ```js
   * const myVar = Object.create({})
   * const ok = unacceptableType(myVar, 'string', MyCustomClass, 'number', 'object')
   * console.log(ok) // Returns false
   *
   * const alright = unacceptableType(myVar, 'string', MyCustomClass, 'number')
   * console.log(alright) // Returns true
   * ```
   *
   * The first line basically says "Return true if my variable is **not** a string, instance of MyCustomClass,
   * a number, or an object".
   *
   * The second version basically says "Return true if my variable is **not** a string, instance of MyCustomClass,
   * a number. Anything else is fine.". The difference is there is _no object_ type in this list.
   * @param {any} testElement
   * @param {any} types
   * @return {boolean}
   */
  unacceptableType: config(...allFalse, function () {
    return !typeContains(...arguments)
  })
}
