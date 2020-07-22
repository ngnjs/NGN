/**
 * @method All
 * Determines whether the specified object has _all_ of the provided properties.
 * This only accounts for enumerable properties. It also decorates the Boolean
 * result with a property called `properties`, which contains any missing property
 * names.
 *
 * **Example**
 * ```js
 * let check = NGN.objectHasAll(NGN, 'BUS', 'NET')
 *
 * console.log(check) // Outputs: true
 * ```
 *
 * ```js
 * let check = NGN.objectHasAll(NGN, 'BUS', 'NET', 'JUNK')
 *
 * console.log(check) // Outputs: false
 * console.log(check.properties) // Outputs ['JUNK']
 * ```js
 * @param {Object} object
 * The object to check.
 * @return {Boolean}
 */
const All = function () {
  const properties = new Set(Object.keys(arguments[0]))

  for (let i = 1; i < arguments.length; i++) {
    if (!properties.has(arguments[i])) {
      return false
    }
  }

  return true
}

/**
 * @method Any
 * Determines whether the specified object has _any_ of the requested properties.
 * This only accounts for enumerable properties.
 *
 * **Example**
 * ```js
 * let check = NGN.objectHasAny(NGN, 'BUS', 'NET', 'MORE')
 *
 * console.log(check) // Outputs: true
 * ```
 *
 * ```js
 * let check = NGN.objectHasAny(NGN, 'JUNK1', 'JUNK2', 'JUNK3')
 *
 * console.log(check) // Outputs: false
 * ```js
 * @param {Object} object
 * The object to check.
 * @return {Boolean}
 */
const Any = function () {
  const properties = new Set(Object.keys(arguments[0]))

  for (let i = 1; i < arguments.length; i++) {
    if (properties.has(arguments[i])) {
      return true
    }
  }

  return false
}

/**
 * @method Missing
 * Given a list, returns which list items are not present in an
 * object's enumerable properties.
 *
 * ```js
 * let obj = { a: 1, b: 2 }
 * let missing = NGN.getObjectMissingPropertyNames(obj, 'a', 'b', 'c')
 *
 * console.log(missing) // Outputs ['c']
 * ```
 * @param {Object} object
 * The object to check.
 * @return {String[]}
 * @private
 */
const Missing = function () {
  const missing = new Set()
  const properties = new Set(Object.keys(arguments[0]))

  for (let i = 1; i < arguments.length; i++) {
    if (!properties.has(arguments[i])) {
      missing.add(arguments[i])
    }
  }

  return Array.from(missing)
}

/**
 * @method Exactly
 * Determines whether the specified object has _only_ the requested properties.
 * This only accounts for enumerable properties.
 *
 * **Example**
 * ```js
 * let obj = { a: 1, b: 2 }
 * let check = NGN.objectHasExactly(obj, 'a', 'b')
 *
 * console.log(check) // Outputs: true
 * ```
 *
 * ```js
 * let obj = { a: 1, b: 2, d: 4 }
 * let check = NGN.objectHasExactly(obj, 'a', 'b', 'c')
 *
 * console.log(check) // Outputs: false
 * ```js
 * @param {Object} object
 * The object to check.
 * @return {Boolean}
 */
const Exactly = function () {
  const properties = new Set(Object.keys(arguments[0]))
  const args = new Set(Array.from(arguments).slice(1))

  // If the attribute sizes aren't equal, it's not an exact match.
  if (properties.size !== args.size) {
    return false
  }

  // Check for extra properties on the object
  for (const property of properties) {
    if (!args.has(property)) {
      return false
    }
  }

  // Make sure there are enough properties.
  for (const arg of args) {
    if (!properties.has(arg)) {
      return false
    }
  }

  return true
}

/**
 * @method Extraneous
 * Given a list, returns which enumerable object properties
 * are not in the list.
 *
 * ```js
 * let obj = { a: 1, b: 2, d: 4 }
 * let extra = NGN.getObjectExtraneousPropertyNames(obj, 'a', 'b', 'c')
 *
 * console.log(extra) // Outputs ['d']
 * ```
 * @param {Object} object
 * The object to check.
 * @return {String[]}
 * @private
 */
const Extraneous = function () {
  const extras = new Set(Object.keys(arguments[0]))

  for (let i = 1; i < arguments.length; i++) {
    if (extras.has(arguments[i])) {
      extras.delete(arguments[i])
    }
  }

  return Array.from(extras)
}

/**
 * @method Require
 * This is the same as #objectHasAll, but will throw an
 * error if the object is missing any properties.
 * @throws Error
 */
const Require = function () {
  if (!All(...arguments)) {
    throw new Error(`${arguments[0].constructor.name} is missing the following attributes: ${Missing(...arguments).join(', ')}`)
  }
}

// /**
//  * @method Alias
//  * A helper method to alias a value on an object. This is the equivalent of:
//  * ```js
//  * Object.defineProperty(namespace, name, NGN.get(() => {
//  *   return value
//  * }))
//  * ```
//  * @param  {Object} namespace
//  * The object to apply the alias property to.
//  *
//  * @private
//  */
// const Alias = function (namespace, name, value) {
//   Object.defineProperty(namespace, name, {
//     enumerable: false,
//     get () { return value }
//   })
// }

// /**
//  * @method Rename
//  * A helper method to alias a value on an object, with a deprection notice. This is the equivalent of:
//  * ```js
//  * Object.defineProperty(namespace, name, NGN.get(() => {
//  *   console.log('Deprecation notice')
//  *   return value
//  * }))
//  * ```
//  * @param  {Object} namespace
//  * The object to apply the alias property to.
//  * @param  {String} oldName
//  * The old name (i.e. the one being replaced).
//  * @param  {String} newName
//  * The alias name.
//  * @param  {Any} value
//  * The value to return.
//  * @private
//  */
// const Rename = function (namespace, old, name, value) {
//   Object.defineProperty(namespace, old, {
//     enumerable: false,
//     get () {
//       WARN('DEPRECATED.ELEMENT', `"${old}" is now "${name}".`)
//       return value
//     }
//   })
// }

/**
 * @method mixin
 * Inherit the properties of another object/class.
 * @param  {object|function} source
 * The source object (i.e. what gets copied)
 * @param  {object|function} destination
 * The object properties get copied to.
 */
const Mixin = function (source = null, dest = null) {
  if (source && dest) {
    source = typeof source === 'function' ? source.prototype : source
    dest = typeof dest === 'function' ? dest.prototype : dest

    Object.getOwnPropertyNames(source).forEach(function (attr) {
      const definition = Object.getOwnPropertyDescriptor(source, attr)
      Object.defineProperty(dest, attr, definition)
    })

    const prototype = Object.getOwnPropertyNames(Object.getPrototypeOf(source)).filter((attr) => {
      return attr.trim().toLowerCase() !== 'constructor' && !dest.hasOwnProperty(attr) // eslint-disable-line no-prototype-builtins
    })

    prototype.forEach((attr) => {
      const cfg = Object.getOwnPropertyDescriptor(source, attr)

      if (cfg === undefined && typeof source[attr] === 'function') {
        Object.defineProperty(dest, attr, {
          get () {
            return source[attr].apply(this, arguments)
          }
        })
      }
    })
  }
}

export {
  All,
  Any,
  Exactly,
  Require,
  Extraneous,
  Missing,
  // Alias,
  // Rename,
  Mixin
}
