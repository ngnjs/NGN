import NGN from '../core.js'
import EventEmitter from '../emitter/core'

/**
 * @class NGN.UTILITY.NameManager
 * This is a helper class to keep track of
 * named data stores, exceptions, and other
 * objects where developer-provided labels
 * will assist with debugging and logging.
 */
export default class NGNNameManager extends EventEmitter {
  /**
   * @param {string} name
   * The name of the name manager.
   * @param {string} [label=null]
   * This label will be postfixed to the end of
   * any auto-generate name. For example, if the
   * label is set to `Copy`, an auto-named element
   * would look like "SomeName (Copy)" or "SomeName (Copy 2)" instead of
   * "SomeName (1)".
   */
  constructor (name, label = null) {
    super()

    Object.defineProperties(this, {
      name: NGN.const(name),
      map: NGN.private(new Map()),
      label: NGN.public(label)
    })
  }

  /**
   * @property {Array}
   * Returns the names contained in the name manager.
   */
  get names () {
    return Array.from(this.map.keys())
  }

  /**
   * Add a name to the manager.
   * @param {String}  name
   * A descriptive name.
   * @param {Any}  object
   * The object being named.
   * @param {Boolean} [overwrite=false]
   * When `true`, the set method will overwrite
   * a name if it already exists. By default,
   * a new name will be automatically generated
   * using the #create method.
   * @returns {string}
   * Returns the name.
   */
  set (name, object, overwrite = false) {
    if (!overwrite) {
      name = this.create(name)
    }

    this.map.set(name, {
      get value () {
        return object
      }
    })

    return name
  }

  /**
   * Create a new unique name.
   * For example, if the name manager already contains a name called `SomeName`,
   * this will create `SomeName (1)`. If a #constructor.label is provided,
   * the name will look like `SomeName (label)` where `label` is the configured
   * value.
   * @param  {String} [name='Untitled']
   * The root name to check for uniqueness/create.
   * @return {String}
   * The unique name as it will be stored in the name manager.
   */
  create (name = 'Untitled') {
    let count = 0

    while (this.map.has(name)) {
      count++
      name = `${name} (${this.label !== null ? this.label + ' ' : ''}${this.label !== null && count > 1 ? count : ''})`
    }

    return name
  }

  /**
   * Retrieve the object associated with the specific name.
   * @param  {String} name
   * @return {Any}
   */
  get (name) {
    return this.map.get(name).value
  }

  /**
   * Rename/remap an object.
   * @param  {String} originalName
   * The original name of the object.
   * @param  {[type]} newName
   * The new name of the object.
   * @return {string}
   * The new name.
   */
  rename (name, newName) {
    if (name === newName) {
      return name
    }

    if (this.map.has(name)) {
      let nm = this.set(newName, this.map.get(name).value) // eslint-disable-line prefer-const
      this.map.delete(name)

      return nm
    }

    throw new Error(`${name} is not managed or not associated with the "${this.name}" name manager.`)
  }

  /**
   * Remove a name from the name manager.
   * @param  {String} name
   */
  delete (name) {
    return this.map.delete(name)
  }

  /**
   * Determines whether the name manager has the specified name.
   * @param  {String}  name
   * @return {Boolean}
   */
  has (name) {
    return this.map.has(name)
  }
}
