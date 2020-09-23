import base from './base.js'
import { register } from './internal.js'

const RELATIONSHIPS = {
  parents: [],
  children: [],
  siblings: []
}

export default class Core {
  #name
  #description
  #oid
  #related = RELATIONSHIPS

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
      this.#related.parents = [cfg.parent]
    }

    /**
     * @cfgproperty {any[]} [parents]
     * A reference to other objects or classes, indicating
     * a parent-child relationship between the elements.
     */
    if (cfg.parents) {
      this.#related.parents = Array.from(new Set(this.#related.parents.concat(cfg.parents)))
    }

    /**
     * @cfgproperty {any} [child]
     * A reference to another object or class, indicating
     * a child-parent relationship between the elements.
     */
    if (cfg.child) {
      this.#related.children = [cfg.child]
    }

    /**
     * @cfgproperty {any[]} [children]
     * A reference to other objects or classes, indicating
     * a child-parent relationship between the elements.
     */
    if (cfg.children) {
      this.#related.children = Array.from(new Set(this.#related.children.concat(cfg.children)))
    }

    /**
     * @cfgproperty {any} [sibling]
     * A reference to another object or class, indicating
     * a sibling relationship between the elements.
     */
    if (cfg.sibling) {
      this.#related.siblings = [cfg.sibling]
    }

    /**
     * @cfgproperty {any[]} [siblings]
     * A reference to other objects or classes, indicating
     * a sibling relationship between the elements.
     */
    if (cfg.siblings) {
      this.#related.siblings = Array.from(new Set(this.#related.siblings.concat(cfg.siblings)))
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
   * @property {object} related
   * Related entities and objects.
   *
   * Example:
   *
   * ```
   * {
   *   parents: [...],
   *   children: [...],
   *   siblings: [...]
   * }
   * ```
   */
  get related () {}

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
   * Returns the parent entity. In the case where multiple
   * parent entities exist, only the first is returned as
   * the "primary" parent.
   */
  get parent () {
    return this.#related.parents.length > 0 ? this.#related.parents[0] : null
  }

  set parent (value) {
    this.#related.parents = this.#related.parents || []
    this.#related.parents.unshift(value)
  }

  /**
   * Returns the child entity. In the case where multiple
   * children entities exist, only the first is returned as
   * the "primary" child.
   */
  get child () {
    return this.#related.children.length > 0 ? this.#related.children[0] : null
  }

  set child (value) {
    this.#related.children = this.#related.children || []
    this.#related.children.unshift(value)
  }

  /**
   * Returns the child entity. In the case where multiple
   * children entities exist, only the first is returned as
   * the "primary" child.
   */
  get sibling () {
    return this.#related.children.length > 0 ? this.#related.children[0] : null
  }

  set sibling (value) {
    this.#related.siblings = this.#related.siblings || []
    this.#related.siblings.unshift(value)
  }

  /**
   * @property {array}
   * Returns the parent entities. In the case where multiple
   * parent entities exist, only the first is returned as
   * the "primary" parent.
   */
  get parents () {
    return this.#related.parents
  }

  set parents (value) {
    this.#related.parents = Array.isArray(value) ? value : [value]
  }

  /**
   * Returns the child entity. In the case where multiple
   * children entities exist, only the first is returned as
   * the "primary" child.
   */
  get children () {
    return this.#related.children.length > 0 ? this.#related.children[0] : null
  }

  set children (value) {
    this.#related.children = Array.isArray(value) ? value : [value]
  }

  /**
   * Returns the child entity. In the case where multiple
   * children entities exist, only the first is returned as
   * the "primary" child.
   */
  get siblings () {
    return this.#related.children.length > 0 ? this.#related.children[0] : null
  }

  set siblings (value) {
    this.#related.siblings = Array.isArray(value) ? value : [value]
  }

  clearRelationships () {
    this.#related = RELATIONSHIPS
  }
}
