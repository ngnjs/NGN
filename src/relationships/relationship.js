import BASE from '../base.js'

const TYPES = new Set(['parent', 'sibling'])

export default class Relationship {
  #base
  #related
  #type = 'parent'
  #name
  #description
  #oid
  #destroyed = false

  // The setTimeout functionality exists to allow class
  // constructor methods to run before emitting events.
  // This serves as a "nextTick" operation since there is
  // no guarantee an event emitter is fully instantiated.
  // This should not impact performance or event sequencing
  // in any way.
  #update = (name, payload) => {
    if (!this.#destroyed) {
      setTimeout(() => {
        if (this.#base.emit && typeof this.#base.emit === 'function') {
          this.#base.emit(name, payload)
        }

        if (this.#related && this.#related.emit && typeof this.#related.emit === 'function') {
          this.#related.emit(name, payload)
        }
      }, 0)
    }
  }

  /**
   * Create a relationship between two entities. The best way
   * to think of this is using the following template:
   *
   * `The {{base}} is a {{type}} of {{related}}`.
   *
   * For example, "The 'Mother Class' is a 'parent' of the 'Offspring Class'".
   *
   * - `base` = "Mother Class"
   * - `related` = "Offspring Class"
   * - `type` = "parent"
   * @param {any} base
   * The main entity/object.
   * @param {any} related
   * The related entity/object.
   * @param {string} [type=child] (parent, sibling)
   */
  constructor (base, related, type = 'parent') {
    this.#base = base
    this.#related = related
    this.type = type
    this.#name = `${base.name || 'Unknown' + BASE.typeof(base)}${related.name || 'Unknown' + BASE.typeof(related)}Relationship`
    this.#description = `${base.name || 'Unknown ' + BASE.typeof(base)} <-> ${related.name || 'Unknown ' + BASE.typeof(related)} ${this.type} relationship.`
    this.#oid = Symbol(this.#name)

    Object.defineProperty(this, 'destroy', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: () => {
        this.#update('relationship.destroy', this)
        this.#destroyed = true
      }
    })

    this.#update('relationship', this)
  }

  get OID () {
    return this.#oid
  }

  get name () {
    return this.#name
  }

  get description () {
    return this.#description
  }

  get base () {
    return this.#base
  }

  set base (value) {
    if (this.#base !== value) {
      this.#update('relationship.destroy', this)
      this.#base = value
      this.#update('relationship', this)
    }
  }

  get related () {
    return this.#related
  }

  set related (value) {
    if (this.#related !== value) {
      this.#update('relationship.destroy', this)
      this.#related = value
      this.#update('relationship', this)
    }
  }

  get type () {
    return this.#type
  }

  set type (value) {
    if (value !== this.#type) {
      const old = this.#type
      value = (value || 'parent').toLowerCase()

      if (!TYPES.has(value)) {
        throw new Error(`Invalid relationship type "${value}". Acceptable values are: ${Array.from(TYPES).join(', ')}`)
      }

      this.#type = value

      this.#update('relationship.type.update', {
        old,
        new: value,
        relationship: this
      })
    }
  }
}

export { Relationship }
