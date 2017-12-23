'use strict'

/**
 * @class NGN
 * @singleton
 */
// Establish a globally recognized namespace for browser or node-like environment.
try {
  window.NGN = {}
  Object.defineProperty(NGN, 'global', {
    enumerable: false,
    get: () => {
      return window
    }
  })
} catch (e) {
  global.NGN = {}
  Object.defineProperty(NGN, 'global', {
    enumerable: false,
    get: () => {
      return global
    }
  })
}

/**
  * @method define
  * Create an object definition for a property.
  * For example:
  *
  * ```
  * Object.defineProperty('attr', NGN.define(true, false, true, 'value'))
  *
  * // The snippet above is the same as:
  * Object.defineProperty(this, 'attr', {
  *  enumberable: true,
  *  writable: false,
  *  configurable: true,
  *  value: 'value'
  * })
  * ```
  * @param  {boolean} enumerable
  * Determines if the attribute is considered an accessible part of the object.
  * Making an attribute enumerable will make it show up as a key in an object,
  * which can be iterated over (ex: `Object.keys()`). A non-enumerable asset is
  * treated as a private attribute.
  * @param  {boolean} writable
  * Determines whether the value can be changed.
  * @param  {boolean} configurable
  * Determines whether the attribute can be removed from the object.
  * @param  {any} value
  * The actual value of the attribute.
  * @private
  */
Object.defineProperty(NGN, 'define', {
  enumerable: false,
  writable: false,
  configurable: false,
  value: function (enumerable, writable, configurable, value) {
    return {
      enumerable,
      writable,
      configurable,
      value
    }
  }
})

Object.defineProperties(NGN, {
  /**
   * @method public
   * Create a `public` property definition for an object.
   * Example:
   *
   * ```
   * Object.defineProperty(this, 'attr', NGN.public('somevalue'))
   *
   * // Longhand equivalent
   * Object.defineProperty(this, 'attr', {
   *  enumerable: true,
   *  writable: true,
   *  configurable: false,
   *  value: 'somevalue'
   * })
   * ```
   * @param  {any} value
   * Any valid JavaScript value (function, boolean, number, string, etc)
   * used as the value for the object attribute.
   * @private
   */
  public: NGN.define(false, false, false, function (value) {
    return NGN.define(true, typeof value !== 'function', false, value)
  }),

  /**
   * @method private
   * Create a `private` property definition for an object.
   * Example:
   *
   * ```
   * Object.defineProperty(this, 'attr', NGN.private('somevalue'))
   *
   * // Longhand equivalent
   * Object.defineProperty(this, 'attr', {
   *  enumerable: false,
   *  writable: true,
   *  configurable: false,
   *  value: 'somevalue'
   * })
   * ```
   * @param  {any} value
   * Any valid JavaScript value (function, boolean, number, string, etc)
   * used as the value for the object attribute.
   * @private
   */
  private: NGN.define(false, false, false, function (value) {
    return NGN.define(false, typeof value !== 'function', false, value)
  }),

  /**
   * @method const
   * Create a `public` constant property definition for an object.
   * Example:
   *
   * ```
   * Object.defineProperty(this, 'attr', NGN.const('somevalue'))
   *
   * // Longhand equivalent
   * Object.defineProperty(this, 'attr', {
   *  enumerable: true,
   *  writable: false,
   *  configurable: false,
   *  value: 'somevalue'
   * })
   * ```
   * @param  {any} value
   * Any valid JavaScript value (function, boolean, number, string, etc)
   * used as the value for the object attribute.
   * @private
   */
  const: NGN.define(false, false, false, function (value) {
    return NGN.define(true, false, false, value)
  }),

  /**
   * @method privateconst
   * Create a `private` constant property definition for an object.
   * Example:
   *
   * ```
   * Object.defineProperty(this, 'attr', NGN.privateconst('somevalue'))
   *
   * // Longhand equivalent
   * Object.defineProperty(this, 'attr', {
   *  enumerable: false,
   *  writable: false,
   *  configurable: false,
   *  value: 'somevalue'
   * })
   * ```
   * @param  {any} value
   * Any valid JavaScript value (function, boolean, number, string, etc)
   * used as the value for the object attribute.
   * @private
   */
  privateconst: NGN.define(false, false, false, function (value) {
    return NGN.define(false, false, false, value)
  }),

  /**
   * @method get
   * Create a private `getter` property definition for an object.
   * Public getters are part of the ES2015 class spec.
   *
   * Example:
   *
   * ```
   * let myFunction = function () {
   *  return 'somevalue'
   * }
   *
   * // Longhand equivalent
   * Object.defineProperty(this, 'attr', {
   *  enumerable: false,
   *  get: function () {
   *    return 'somevalue'
   *  }
   * })
   * ```
   * @param  {function} fn
   * Any valid async JavaScript function with a `return` value.
   * @private
   */
  get: NGN.define(false, false, false, function (fn) {
    return {
      enumerable: false,
      get: fn
    }
  }),

  /**
   * @method set
   * Create a private `setter` property definition for an object.
   * Public setters are part of the ES2015 class spec.
   *
   * Example:
   *
   * ```
   * let myFunction = function () {
   *  return 'somevalue'
   * }
   *
   * // Longhand equivalent
   * Object.defineProperty(this, 'attr', {
   *  enumerable: false,
   *  set: function (value) {
   *    somethingElse = value
   *  }
   * })
   * ```
   * @param  {function} fn
   * Any valid JavaScript function that accepts a single argument (value).
   * @private
   */
  set: NGN.define(false, false, false, function (fn) {
    return {
      enumerable: false,
      set: fn
    }
  }),

  /**
   * @method getset
   * Create a private property defintion containing both a `getter` and `setter`
   * for the specified attribute.
   * @param  {function} getFn
   * Any valid async JavaScript function with a `return` value.
   * @param  {function} setFn
   * Any valid JavaScript function that accepts a single argument (value).
   * @private
   */
  getset: NGN.define(false, false, false, (getterFn, setterFn) => {
    return {
      enumerable: false,
      get: getterFn,
      set: setterFn
    }
  }),

  LEDGER_EVENT: NGN.define(false, false, false, (EVENT) => {
    return function () {
      NGN.BUS.emit(EVENT, ...arguments)
    }
  })
})

Object.defineProperties(NGN, {
  /**
   * @method extend
   * Extend the NGN core object. Extending NGN is the equivalent of:
   *
   * Example:
   * ```
   * NGN.extend('greet', NGN.public(function (recipient) {
   *  return 'Hello, ' + recipient + '!'
   * }))
   *
   * // Equivalent of:
   *
   * Object.defineProperty(NGN, 'greet', {
   *  enumerable: true,
   *  writable: false,
   *  configurable: false,
   *  value: function (recipient) {
   *    return 'Hello, ' + recipient + '!'
   *  }
   * })
   * ```
   * The example above produces a public function available from NGN:
   *
   * ```
   * console.log(NGN.greet('world')) // outputs Hello, world!
   * @param  {string} attribute
   * Name of the attribute to add to the object.
   * @param  {Object} descriptor
   * The object descriptor, i.e.
   * ```
   * {
   *  enumerable: true/false,
   *  writable: true/false,
   *  configurable: true/false,
   *  value: {any}
   * }
   *
   * // OR
   *
   * {
   *  enumerable: true/false,
   *  get: function () { return ... },
   *  set: function (value) { some = value ... }
   * }
   * ```
   * @private
   */
  extend: NGN.privateconst(function (attribute, descriptor) {
    // If no descriptor is provided, multiple properties are being defined.
    if (typeof attribute === 'object') {
      Object.defineProperties(this, attribute)
    } else {
      Object.defineProperty(this, attribute, descriptor)
    }
  }),

  /**
   * @method inherit
   * Inherit the properties of another object/class.
   * @param  {object|function} source
   * The source object (i.e. what gets copied)
   * @param  {object|function} destination
   * The object properties get copied to.
   */
  inherit: NGN.const(function (source = null, dest = null) {
    if (source && dest) {
      source = typeof source === 'function' ? source.prototype : source
      dest = typeof dest === 'function' ? dest.prototype : dest

      Object.getOwnPropertyNames(source).forEach(function (attr) {
        const definition = Object.getOwnPropertyDescriptor(source, attr)
        Object.defineProperty(dest, attr, definition)
      })

      const prototype = Object.getOwnPropertyNames(Object.getPrototypeOf(source)).filter((attr) => {
        return attr.trim().toLowerCase() !== 'constructor' && !dest.hasOwnProperty(attr)
      })

      prototype.forEach((attr) => {
        const cfg = Object.getOwnPropertyDescriptor(source, attr)

        if (cfg === undefined && typeof source[attr] === 'function') {
          Object.defineProperty(dest, attr, NGN.public(function () {
            return source[attr].apply(this, arguments)
          }))
        }
      })
    }
  }),

  /**
   * @method slice
   * Converts an array-like object to an array.
   *
   * Example:
   * ```
   * function () {
   *  return NGN.slice(arguments)
   * }
   * ```
   * @param  {Object} obj
   * The object to slice into an array.
   * @return {array}
   * @private
   */
  slice: NGN.private(function (obj) {
    return Array.prototype.slice.call(obj)
  }),

  /**
   * @method splice
   * Converts an array-like object to a spliced array.
   *
   * Example:
   * ```
   * function () {
   *  return NGN.splice(arguments)
   * }
   * ```
   * @param  {Object} obj
   * The object to splice into an array.
   * @return {array}
   * @private
   */
  splice: NGN.private(function (obj) {
    return Array.prototype.splice.call(obj)
  }),

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
  nullIf: NGN.public(function (sourceExpression, comparisonExpression = '') {
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

      return null
    } catch (e) {
      return null
    }
  }),

  // Private alias for nullIf
  nullif: NGN.public(function () {
    return this.nullIf(...arguments)
  }),

  /**
   * @method converge
   * Provides a basic coalesce. Expects the first parameter to be a boolean
   * value. `true` will wrap arguments in a nullIf operator. `false` will not.
   * @private
   */
  converge: NGN.private(function () {
    if (arguments.length < 2) {
      return null
    } else if (arguments.length === 2) {
      if (arguments[1] === undefined) {
        return null
      } else if (arguments[0]) {
        return NGN.nullIf(arguments[1])
      } else {
        return arguments[1]
      }
    }

    for (let arg = 1; arg < arguments.length; arg++) {
      // try {
      if (arguments[arg] !== undefined &&
        (
          arguments[0]
          ? NGN.nullIf(arguments[arg])
          : arguments[arg]
        ) !== null
      ) {
        if (arguments[arg] !== undefined) {
          return arguments[arg]
        }
      }
      // } catch (e) {}
    }

    return null
  }),

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
  coalesce: NGN.public(function () {
    return NGN.converge(false, ...arguments)
  }),

  /**
   * @method coalesceb
   * Provides the same functionality as #coalesce, except **b**lank/empty arguments
   * are treated as `null` values.
   * @param {Mixed} args
   * Any number of arguments can be passed to this method.
   */
  coalesceb: NGN.public(function () {
    return NGN.converge(true, ...arguments)
  }),

  /**
   * @property {boolean} nodelike
   * Indicates NGN is running in a node-like environment supporting
   * the `require` statement. This will detect node, io.js, Electron,
   * NW.js, and other environments presumably supporting Node.js.
   * @private
   */
  nodelike: NGN.const(NGN.global.process !== undefined),

  /**
   * @method dedupe
   * Deduplicate a simple array.
   * @param {array} array
   * The array to deduplicate.
   * @return {array}
   * The array with unique records.
   * @private
   */
  dedupe: NGN.const((array) => {
    let matches = []

    // This is more performant than array.filter in most cases.
    for (let i = 0; i < array.length; i++) {
      if (array.indexOf(array[i]) === i) {
        matches.push(array[i])
      }
    }

    array = null

    return matches
  }),

  /**
   * @method typeof
   * A more specific typeof method.
   * @param  {any} element
   * The element to determine the type of.
   * @return {string}
   * Returns the type (all lower case).
   */
  typeof: NGN.const((el) => {
    if (el === undefined) {
      return 'undefined'
    } else if (el === null) {
      return 'null'
    }

    let value = Object.prototype.toString.call(el).split(' ')[1].replace(/[^A-Za-z]/gi, '').toLowerCase()

    if (value === 'function') {
      if (!el.name) {
        return NGN.coalesceb(el.toString().replace(/\n/gi, '').replace(/^function\s|\(.*$/mgi, '').toLowerCase(), 'function')
      } else {
        value = NGN.coalesceb(el.name, 'function')
      }
    }

    return value.toLowerCase()
  }),

   /**
    * @method forceArray
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
  forceArray: NGN.const((value) => {
    if (value === null) {
      return []
    }

    return NGN.typeof(value) === 'array' ? value : [value]
  }),

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
  forceBoolean: NGN.const((value) => {
    switch (NGN.typeof(value)) {
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
        return this.coalesceb(value) !== null
    }
  }),

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
  forceNumber: NGN.const((value, radix = null) => {
    try {
      switch (NGN.typeof(value)) {
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
      NGN.ERROR(e)
      return NaN
    }
  }),

  /**
   * @method stack
   * Retrieve the stack trace from a specific code location without throwing
   * an exception. Files are always listed from the root. This is the default
   * order in browsers, but the reverse of the normal stack order in node-like
   * environments.
   *
   * For example, the following stack on node shows `_test.js` as the last item
   * in the array. In node-like environments, the `_test.js` would normally be
   * the first item in the stacktrace.
   *
   * ```js
   * [
   *   { path: 'node.js:348:7', file: 'node.js', line: 348, column: 7 },
   *   { path: 'module.js:575:10',
   *     file: 'module.js',
   *     line: 575,
   *     column: 10 },
   *   { path: 'module.js:550:10',
   *     file: 'module.js',
   *     line: 550,
   *     column: 10 },
   *   { path: 'module.js:541:32',
   *     file: 'module.js',
   *     line: 541,
   *     column: 32 },
   *   { path: '/_test.js:8:14', file: '/_test.js', line: 8, column: 14 }
   * ]
   * ```
   *
   * By standardizing the order of the stack trace, it is easier to programmatically
   * identify sources of problems. This method does not prevent developers from
   * accessing a normal stacktrace.
   * @private
   * @returns {array}
   * Returns an array of objects. Each object contains the file, line, column,
   * and path within the stack. For example:
   *
   * ```
   * {
   *   path: 'path/to/file.js:127:14'
   *   file: 'path/to/file.js',
   *   line: 127,
   *   column: 14
   * }
   * ```
   *
   * If a stacktrace is unavailable for any reason, the array will contain a
   * single element like:
   *
   * ```js
   * {
   *   path: 'unknown',
   *   file: 'unknown',
   *   line: 0,
   *   column: 0
   * }
   * ```
   */
  processStackItem: NGN.privateconst(function (item, uri) {
    return item.replace(/at.*\(|\)/gi, '')
      .replace(uri, './')
      .replace(/\/{2,100}/gi, '/')
      .trim().split(':')
  }),

  stack: NGN.get(function () {
    const originalStack = (new Error).stack.split('\n') // eslint-disable-line
    let stack = (new Error()).stack.split('\n') || []
    let fnRegex = /at.*\(/gi

    stack = stack.filter((item) => {
      return item.split(':').length > 1
    }).map((item) => {
      let operation = fnRegex.exec(item)

      if (operation) {
        operation = operation[0].replace(/^at\s{1,100}|\s{1,100}\($/gi, '').replace('<anonymous>', 'console')
      }

      if (this.nodelike) {
        item = this.processStackItem(item.toString(), process.cwd())

        return {
          path: item.join(':').replace('./', process.cwd() + '/'),
          // path: item[0].substr(0, item[0].length) + ':' + item[1] + ':' + item[2],
          file: item[0].substr(0, item[0].length),
          line: parseInt(item[1], 10),
          column: parseInt(item[2], 10),
          operation: operation
        }
      } else {
        item = this.processStackItem(item.toString(), window.location.origin)

        return {
          path: item[0].substr(1, item[0].length - 1) + ':' + item[1] + ':' + item[2],
          file: item[0].substr(1, item[0].length - 1),
          line: parseInt(item[1], 10),
          column: parseInt(item[2], 10),
          operation: operation
        }
      }
    })

    return stack.length !== 0
      ? (this.nodelike
          ? stack.reverse()
          : stack
        )
      : [{
        path: 'unknown',
        file: 'unknown',
        line: 0,
        column: 0
      }]
  }),

  /**
   * @method isFn
   * A shortcut method for determining if a variable is a function.
   * This is useful for identifying the existance of callback methods.
   * @param {any} variable
   * The variable to identify as a function.
   * @returns {boolean}
   * @private
   */
  isFn: NGN.privateconst((v) => {
    return typeof v === 'function'
  }),

  /**
   * @method wrap
   * Executes a **synchronous** method before invoking a standard function.
   * This is primarily designed for displaying warnings, but can also be
   * used for other operations like migration layers.
   * @param {function} preMethod
   * The **synchronous** function to invoke before the class is instantiated. This
   * method receives the same arguments passed to the class.
   * @param {function} method
   * The function to wrap.
   * @return {function}
   * @private
   */
  wrap: NGN.privateconst(function (preFn, fn) {
    return function () {
      preFn(...arguments)
      fn(...arguments)
    }
  }),

  /**
   * @method wrapClass
   * Executes a **synchronous** method before returning an instantiated class.
   * It runs a function first, then returns the equivalent of
   * `new MyClass(...)`. This is primarily designed for displaying warnings,
   * but can also be used for other operations like migration layers.
   * @param {function} preMethod
   * The **synchronous** method to invoke before the class is instantiated. This
   * method receives the same arguments passed to the class.
   * @param {function} class
   * The class to wrap.
   * @return {Class}
   * @private
   */
  wrapClass: NGN.privateconst(function (preFn, ClassFn) {
    return function () {
      preFn(...arguments)
      return new ClassFn(...arguments)
    }
  }),

  /**
   * @method deprecate
   * Fires an event (if NGN.BUS is available) or logs a warning indicating the
   * method is deprecated.
   * @param {function} method
   * The method to return/execute.
   * @param {string} [message='The method has been deprecated.']
   * The warning displayed to the user.
   * @return {function}
   * @fires DEPRECATED.METHOD
   * Fires `DEPRECATED.METHOD` on the NGN.BUS. The message is delivered to
   * the event handler.
   */
  deprecate: NGN.privateconst(function (fn, message = 'The method has been deprecated.') {
    return this.wrap(() => NGN.WARN('DEPRECATED.METHOD', message), fn)
  }),

  /**
   * @method deprecateClass
   * Logs a warning indicating the class is deprecated. This differs from
   * #deprecate by extending & preserving the original class (the resulting
   * class can be used with the `new` operator).
   * @param {function} class
   * The class to return/execute.
   * @param {string} [message='The class has been deprecated.']
   * The warning displayed to the user.
   * @fires DEPRECATED.CLASS
   * Fires `DEPRECATED.CLASS` on the NGN.BUS. The message is delivered to
   * the event handler.
   * @return {Class}
   */
  deprecateClass: NGN.privateconst(function (classFn, message = 'The class has been deprecated.') {
    return this.wrapClass(() => NGN.WARN('DEPRECATED.CLASS', message), classFn)
  }),

  /**
   * @method needs
   * A method to check for the existance of required attributes in an object.
   * This is designed to check for namespace existance.
   *
   * ```js
   * NGN.needs('DOM','BUS', 'NET', 'JUNK') // Throws an error because "JUNK" doesn't exist.
   * ```
   * @param {Object} namespace
   * The object to check.
   * @param {String[]} attributes
   * A list of attributes to check for.
   * @throws {MissingNgnDependencyError}
   * Throws an error if the namespace is missing an attribute dependency.
   * @private
   */
  needs: NGN.private(function () {
    let missing = NGN.getObjectMissingPropertyNames(NGN, ...arguments)

    if (missing.length === 0) {
      return
    }

    // Throw an error if there are any missing attributes.
    if (missing.length > 0) {
      throw new MissingNgnDependencyError(`Missing NGN dependencies: ${missing.join(', ')}`.replace(/\s{2,100}/gi, ' '))
    }
  }),

  /**
   * @method getObjectMissingPropertyNames
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
  getObjectMissingPropertyNames: NGN.private(function () {
    let missing = []
    let properties = Object.keys(arguments[0])

    for (let i = 1; i < arguments.length; i++) {
      if (properties.indexOf(arguments[i]) < 0) {
        missing.push(arguments[i])
      }
    }

    return missing
  }),

  /**
   * @method getObjectExtraneousPropertyNames
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
  getObjectExtraneousPropertyNames: NGN.private(function () {
    let properties = Object.keys(arguments[0])

    for (let i = 1; i < arguments.length; i++) {
      let index = properties.indexOf(arguments[i])

      if (index >= 0) {
        properties.splice(index, 1)
      }
    }

    return properties
  }),

  /**
   * @method objectHasAll
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
  objectHasAll: NGN.const(function () {
    let properties = Object.keys(arguments[0])

    for (let i = 1; i < arguments.length; i++) {
      if (properties.indexOf(arguments[i]) < 0) {
        return false
      }
    }

    return true
  }),

  /**
   * @method objectHasAny
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
  objectHasAny: NGN.const(function () {
    let properties = Object.keys(arguments[0])

    for (let i = 1; i < arguments.length; i++) {
      if (properties.indexOf(arguments[i]) >= 0) {
        return true
      }
    }

    return false
  }),

  /**
   * @method objectHasExactly
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
  objectHasExactly: NGN.const(function () {
    // If there are missing properties, it's not an exact match.
    if (this.getObjectMissingPropertyNames(arguments[0]).length !== 0) {
      return false
    }

    let properties = Object.keys(arguments[0])
    let args = NGN.slice(arguments)

    args.shift()

    // Check for extra properties on the object
    for (let i = 0; i < properties.length; i++) {
      if (args.indexOf(properties[i]) < 0) {
        return false
      }
    }

    // Make sure there are enough properties.
    for (let i = 0; i < args.length; i++) {
      if (properties.indexOf(args[i]) < 0) {
        return false
      }
    }

    return true
  }),

  /**
   * @method objectRequires
   * This is the same as #objectHasAll, but will throw an
   * error if the object is missing any properties.
   * @throws Error
   */
  objectRequires: NGN.const(function () {
    let check = this.objectHasAll(...arguments)

    if (!check) {
      throw new Error(`${arguments[0].constructor.name} is missing the following attributes: ${check.missing.join(', ')}`)
    }
  }),

  /**
   * @method createAlias
   * A helper method to alias a value on an object. This is the equivalent of:
   * ```js
   * Object.defineProperty(namespace, name, NGN.get(() => {
   *   return value
   * }))
   * ```
   * @param  {Object} namespace
   * The object to apply the alias property to.
   * @param  {String} name
   * The alias name.
   * @param  {Any} value
   * The value to return.
   * @private
   */
  createAlias: NGN.private(function (namespace, name, value) {
    Object.defineProperty(namespace, name, NGN.get(() => {
      return value
    }))
  }),

  /**
   * @method WARN
   * This method is used to emit special info events.
   * The NGN.BUS can listen for all events using the NGN.WARN global symbol.
   *
   * ```js
   * NGN.BUS.on(NGN.WARNING_EVENT, function () => {
   *   console.warn(...arguments)
   * })
   * ```
   *
   * See NGN.EventEmitter#emit for detailed parameter usage.
   * @private
   */
  WARNING_EVENT: NGN.privateconst(Symbol('NGN.WARN')),
  WARN: NGN.privateconst((msg) => NGN.LEDGER_EVENT(NGN.WARNING_EVENT)(msg)),

  /**
   * @method INFO
   * This method is used to emit special warning events.
   * The NGN.BUS can listen for all events using the NGN.INFO global symbol.
   *
   * ```js
   * NGN.BUS.on(NGN.INFO_EVENT, function () => {
   *   console.info(...arguments)
   * })
   * ```
   *
   * See NGN.EventEmitter#emit for detailed parameter usage.
   * @private
   */
  INFO_EVENT: NGN.privateconst(Symbol.for('NGN.INFO')),
  INFO: NGN.privateconst((msg) => NGN.LEDGER_EVENT(NGN.INFO_EVENT)(msg)),

  /**
   * @method ERROR
   * This method is used to emit special soft error events. A soft error
   * is one that does not throw, but does get logged (typically non-critical).
   * The NGN.BUS can listen for all events using the NGN.ERROR global symbol.
   *
   * ```js
   * NGN.BUS.on(NGN.ERROR_EVENT, function () => {
   *   console.info(...arguments)
   * })
   * ```
   *
   * See NGN.EventEmitter#emit for detailed parameter usage.
   * @private
   */
  ERROR_EVENT: NGN.privateconst(Symbol.for('NGN.ERROR')),
  ERROR: NGN.privateconst((msg) => NGN.LEDGER_EVENT(NGN.ERROR_EVENT)(msg)),

  CustomExceptionClass: NGN.private(null),

  CustomException: NGN.get(function () {
    if (this.CustomExceptionClass === null) {
      // [INCLUDE: ./exception.js]
      this.CustomExceptionClass = CustomException // eslint-disable-line no-undef
    }

    return this.CustomExceptionClass
  }),

  /**
   * @method createException
   * Create a custom global exception (custom error).
   * @param {Object} config
   * The configuration of the new error.
   * @param {String} [config.name=NgnError]
   * The pretty name of the exception. Alphanumeric characters only (underscore is acceptable).
   * @param {String} [config.type=TypeError]
   * The type of error. This is commonly `TypeError` or `ReferenceError`, but
   * it can be any custom value.
   * @param {String} [config.severity=minor]
   * A descriptive "level" indicating how critical the error is.
   * @param {String} [config.message=Unknown Error]
   * The default message to output when none is specified.
   * @param {Object} [config.custom]
   * Provide a key/value object of custom attributes for the error.
   * There are two "special" custom attributes: `help` and `cause`.
   * When provided, these will be written to stdout whenever the error's
   * stack is viewed.
   *
   * For example:
   *
   * ```js
   * NGN.createException({
   *   name: 'Test Problem',
   *   message: 'An example error.',
   *   custom: {
   *     help: 'Remove the throw statement.',
   *     cause: 'Testing the error output.'
   *   }
   * });
   *
   * throw TestProblem()
   * ```
   * The code above generates the following console output:
   *
   * ```sh
   * Testing the error output.
   * Remove the throw statement.
   * /path/to/test.js:12
   *    throw TestProblem();
   *    ^
   *
   * TestProblem: An example error.
   *    at null._onTimeout (/path/to/test.js:12:11)
   *    at Timer.listOnTimeout (timers.js:92:15)
   * ```
   */
  createException: NGN.const(function (config) {
    config = config || {}
    config = typeof config === 'string' ? { message: config } : config
    config.name = config.name || 'NgnError'

    // Create the error as a function
    NGN.global[config.name] = function () {
      if (arguments.length > 0) {
        config.message = arguments[0]
      }

      return new NGN.CustomException(config)
    }
  })
})

// Standard NGN Exceptions
NGN.createException({
  name: 'MissingNgnDependencyError',
  type: 'MissingNgnDependencyError',
  severity: 'critical',
  message: 'An NGN dependency is missing or could not be found.',
  category: 'programmer',
  custom: {
    help: 'Include the missing library.',
    cause: 'A required dependency was not included, or it was not included in the correct sequence.'
  }
})

NGN.createException({
  name: 'ReservedWordError',
  type: 'ReservedWordError',
  severity: 'critical',
  message: 'An attempt to use a reserved word failed.',
  category: 'programmer',
  custom: {
    help: 'Use an alternative word.',
    cause: 'A word was used to define an attribute, method, field, or other element that already exists.'
  }
})

NGN.createException({
  name: 'InvalidConfigurationError',
  type: 'InvalidConfigurationError',
  severity: 'critical',
  message: 'Invalid configuration.',
  category: 'programmer',
  custom: {
    help: 'See the documentation for the proper configuration.',
    cause: 'The configuration specified was marked as invalid or caused an error during instantiation.'
  }
})
