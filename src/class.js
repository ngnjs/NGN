import base from './base.js'
import { register } from './internal.js'

export default class Core {
  #name
  #description
  #oid
  #parent

  constructor (cfg = {}) {
    /**
     * @cfgproperty {string} [name]
     * A descriptive name for the class. This is primarily used
     * to create great debugging experiences.
     */
    if (cfg.name && typeof cfg.name === 'string') {
      this.#name = cfg.name
    }

    /**
     * @cfgproperty {string} [description]
     * A description of the class. This is primarily used
     * to create great debugging experiences.
     */
    if (cfg.description && typeof cfg.description === 'string') {
      this.#description = cfg.description
    }

    /**
     * @cfgproperty {any} [parent]
     * A reference to another object or class, indicating
     * a parent-child relationship between the elements.
     * This is used for great debugging experiences and
     * introspection.
     */
    if (cfg.parent) {
      this.#parent = cfg.parent
    }

    Object.defineProperties(this, {
      /**
       * @method alias
       * A helper method to alias a value of an object. This is the equivalent of:
       * ```js
       * Object.defineProperty(this, name, {
       *   get: () => { return value }
       * })
       * ```
       * @param  {String} name
       * The alias name.
       * @param  {Any} value
       * The value to return.
       * @private
       */
      alias: base.private.value((name, value) => {
        Object.defineProperty(this, name, base.get.value(() => value))
      }),

      /**
       * @method Rename
       * A helper method to alias a value on an object, with a deprection notice. This is the equivalent of:
       * ```js
       * Object.defineProperty(this, name, {
       *   enumerable: false,
       *   get: () => {
       *     NGN.WARN('DEPRECATED.ELEMENT', 'message')
       *     return value
       *   }
       * })
       * ```
       * @param  {String} oldName
       * The old name (i.e. the one being replaced).
       * @param  {String} newName
       * The alias name.
       * @param  {Any} [value]
       * The value to return. This argument will default to
       * the newName attribute of the relevant class.
       * @private
       */
      rename: base.private.value((old, name, fn = null) => {
        if (!fn) {
          const me = this
          fn = function () {
            return typeof me[name] === 'function'
              ? me[name](...arguments)
              : me[name]
          }
        }

        Object.defineProperty(this, old, base.private.value(base.deprecate.value(fn, `${this.name} ${old} is now "${name}".`)))
      }),

      typeof: base.typeof,
      allowParameterType: base.acceptableType,
      disallowParameterType: base.unacceptableType,
      register: base.privateconstant.value(type => register(type, this))
    })
  }

  /**
   * @property {Symbol} OID
   * A guaranteed unique ID representing the class.
   */
  get OID () {
    if (!this.#oid) {
      this.#oid = Symbol(this.#name || 'NGN Class')
    }

    return this.#oid
  }

  get name () {
    return this.#name || 'Unknown'
  }

  set name (value) {
    this.#name = value
  }

  get description () {
    return this.#description || 'No description available.'
  }

  set description (value) {
    this.#description = value
  }

  get parent () {
    return this.#parent || null
  }

  set parent (value) {
    this.#parent = value
  }
}
