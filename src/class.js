import base from './base.js'
import { register } from './internal.js'
import Relationships from './relationships/manager.js'

export default class Core {
  #name
  #description
  #oid
  #relationships

  constructor (cfg = {}) {
    /**
     * @cfgproperty {string} [name]
     * A descriptive name for the class. This is primarily used
     * to create great debugging experiences.
     */
    if (cfg.name && typeof cfg.name === 'string') {
      this.#name = cfg.name
    }

    this.#relationships = new Relationships(this)

    /**
     * @cfgproperty {string} [description]
     * A description of the class. This is primarily used
     * to create great debugging experiences.
     */
    if (cfg.description && typeof cfg.description === 'string') {
      this.#description = cfg.description
    }

    /**
     * @cfg {any} [parent]
     * The parent of the class.
     */
    if (cfg.parent) {
      this.#relationships.parent = cfg.parent
    }

    /**
     * @cfg {any[]} [parents]
     * The parents of the class.
     */
    if (cfg.parents) {
      this.#relationships.parents = cfg.parents
    }

    /**
     * @cfg {any} [child]
     * The child of the class.
     */
    if (cfg.child) {
      this.#relationships.child = cfg.child
    }

    /**
     * @cfg {any[]} [children]
     * The children of the class.
     */
    if (cfg.children) {
      this.#relationships.children = cfg.children
    }

    /**
     * @cfg {any} [sibling]
     * The sibling of the class.
     */
    if (cfg.sibling) {
      this.#relationships.sibling = cfg.sibling
    }

    /**
     * @cfg {any[]} [siblings]
     * The siblings of the class.
     */
    if (cfg.siblings) {
      this.#relationships.siblings = cfg.siblings
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
      alias: base.hidden.value((name, value) => {
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
      rename: base.hidden.value((old, name, fn = null) => {
        if (!fn) {
          const me = this
          fn = function () {
            return typeof me[name] === 'function'
              ? me[name](...arguments)
              : me[name]
          }
        }

        Object.defineProperty(this, old, base.hidden.value(base.deprecate.value(fn, `${this.name} ${old} is now "${name}".`)))
      }),

      typeof: base.typeof,
      allowParameterType: base.acceptableType,
      disallowParameterType: base.unacceptableType,
      register: base.hiddenconstant.value(type => register(type, this))
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
    return this.#name || this.constructor.name || 'Unknown'
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

  /**
   * @property {Relationships} related
   * The relationship manager of the entity.
   */
  get related () {
    return this.#relationships
  }
}
