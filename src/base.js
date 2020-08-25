import { REFERENCE_ID, WARN_EVENT } from './constants.js'

const allFalse = [false, false, false]
const config = function (enumerable, writable, configurable, value) {
  return { enumerable, writable, configurable, value }
}

const warn = function () {
  if (globalThis[REFERENCE_ID] && globalThis[REFERENCE_ID].has('LEDGER')) {
    globalThis[REFERENCE_ID].get('LEDGER').emit(WARN_EVENT, ...arguments)
  }
}

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
  public: config(...allFalse, value => config(true, typeof value !== 'function', false, value)),

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
   * used as the value for the object attribute. Private functions defined with
   * this method are not overridable. To create a private function that is
   * overridable, use #define with the following arguments: `(false, true, false, value)`.
   * @private
   */
  private: config(false, true, false, value => config(false, typeof value !== 'function', false, value)),

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
  constant: config(...allFalse, value => config(true, false, false, value)),

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
  privateconstant: config(...allFalse, value => config(...allFalse, value)),

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
  get: config(...allFalse, fn => {
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
  set: config(...allFalse, fn => {
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
  getset: config(...allFalse, (getterFn, setterFn) => {
    return {
      enumerable: false,
      get: getterFn,
      set: setterFn
    }
  }),

  /**
   * @method before
   * Executes a **synchronous** method before invoking a standard function.
   * This is primarily designed for displaying warnings, but can also be
   * used for other operations like migration layers.
   * @param {function} beforeMethod
   * The **synchronous** function to invoke before the method is instantiated. This
   * method receives the same arguments passed to the method.
   * @param {function} method
   * The function to wrap.
   * @return {function}
   * @private
   */
  before: config(...allFalse, (preFn, fn) => {
    return function () {
      preFn(...arguments)
      return fn(...arguments)
    }
  }),

  /**
   * @method after
   * Executes a **synchronous** method after invoking a standard function (nextTick).
   * This is primarily designed for displaying warnings, but can also be
   * used for other operations like migration layers.
   * @param {function} method
   * The function to wrap.
   * @param {function} afterMethod
   * The **synchronous** function to invoke after the method is instantiated. This
   * method receives the same arguments passed to the method.
   * @return {function}
   * @private
   */
  after: config(...allFalse, (fn, postFn) => {
    return function () {
      setTimeout(() => postFn(...arguments), 0)
      return fn(...arguments)
    }
  }),

  /**
   * @method wrap
   * Executes a wrapper function, passing the wrapped
   * method as the only argument of the wrapper function.
   *
   * For example:
   *
   * ```js
   * const wrapper = NGN.wrap(fn => {
   *   console.log('Running function...')
   *   fn()
   *   console.log('All done!')
   * })
   *
   * wrapper(() => console.log('Doing something...'))
   * wrapper(() => console.log('Doing something else...'))
   * ``
   *
   * Running the code above results in:
   *
   * ```sh
   * Running function...
   * Doing something...
   * All done!
   *
   * Running function...
   * Doing something else...
   * All done!
   * ```
   * @param {function} wrapperMethod
   * The function to invoke before the class is instantiated. This
   * method receives the same arguments passed to the class.
   * @return {function}
   * @private
   */
  wrap: config(...allFalse, wrapper => fn => wrapper(fn)),

  /**
   * @method deprecate
   * Logs a deprecation notice in the NGN.LEDGER, indicating
   * the method is deprecated.
   * @param {function} method
   * The method to return/execute.
   * @param {string} [message='The method has been deprecated.']
   * The warning displayed to the user.
   * @param {boolean} [stdout=false]
   * Display deprecation notices in stdout/console.
   * @return {function}
   */
  deprecate: config(...allFalse, (fn, message = 'The method has been deprecated.', stdout = false) => {
    return function () {
      warn('DEPRECATED.FUNCTION', message)

      if (stdout) {
        console.warn(message)
      }

      return fn(...arguments)
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
  wrapClass: config(...allFalse, (preFn, ClassFn) => {
    return function () {
      preFn(...arguments)
      return new ClassFn(...arguments)
    }
  }),

  /**
   * @method deprecateClass
   * Logs a warning indicating the class is deprecated. This differs from
   * #deprecate by extending & preserving the original class (the resulting
   * class can be used with the `new` operator).
   * @param {Class} class
   * The class to return/execute.
   * @param {string} [message='The class has been deprecated.']
   * The warning displayed to the user.
   * @return {Class}
   */
  deprecateClass: config(...allFalse, function (ClassFn, message = 'The class has been deprecated.', stdout = false) {
    return function () {
      warn('DEPRECATED.CLASS', message)

      if (stdout) {
        console.warn(message)
      }

      return new ClassFn(...arguments)
    }
  }),

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
