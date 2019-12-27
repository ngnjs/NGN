import NGN from '../core.js'
import DataField from './Field.js'

/**
 * @class NGN.DATA.VirtualField
 * A virtual field is a read-only ephemeral representation of data,
 * generated dynamically.
 * In other words, it's a made up data field that isn't part of what gets stored.
 * The value can be changed at any time, without warning or events. This is most
 * commonly used as an _internal class_ to support virtual fields within data
 * models. Consider the following:
 *
 * **Example:**
 *
 * ```js
 * let Person = new NGN.DATA.Model({
 *   fields: {
 *     dateOfBirth: Date
 *     age: function () {
 *       return YearsApart(new Date(), this.dateOfBirth)
 *     }
 *   }
 * })
 * ```
 *
 * The `age` example above (shorthand syntax) compares the `dateOfBirth` field
 * to the current date, expecting a numeric response. This particular virtual
 * field is useful for calculating a common value on the fly, and it is reusable
 * for any number of instances of the model.
 *
 * This functionality is available by implementing the NGN.DATA.VirtualField.
 * For example, the `age` virtual field would be created as:
 *
 * ```js
 * let age = new NGN.DATA.VirtualField(model, function () {
 *   return YearsApart(new Date(), this.dateOfBirth)
 * })
 * ```
 * @fires cache.clear {NGN.DATA.VirtualField}
 * Fired whenever the cache is cleared. The field is passed as the only argument
 * to event handler functions.
 */
export default class NGNVirtualDataField extends DataField { // eslint-disable-line
  constructor (cfg) {
    cfg = cfg || {}

    if (!(cfg.model instanceof NGN.DATA.Entity)) {
      NGN.WARN('No model specified for the virtual field to reference.')
    }

    // Remove unnecessary config values
    delete cfg.required
    delete cfg.default
    delete cfg.min
    delete cfg.minimum
    delete cfg.max
    delete cfg.maximum
    delete cfg.range
    delete cfg.rule
    delete cfg.rules
    delete cfg.validators
    delete cfg.pattern

    super(cfg)

    this.METADATA.AUDITABLE = false
    this.METADATA.fieldType = 'virtual'

    /**
     * @cfg {boolean} [cache=true]
     * By default, virtual fields _associated with a model_ will cache results
     * to prevent unnecessary function calls. The cache is cleared whenever a
     * local data field is modified.
     *
     * Caching can substantially reduce processing time in large data sets
     * by calling methods less often. In most use cases, it will provide a
     * substantial performance gain. However; since virtual fields can also
     * leverage variables and methods that are not a part of the data model,
     * caching may prevent the value from updating as expected. While this case
     * may occur less often, it can occur. If you suspect caching is interfering
     * with a virtual field value, it can be disabled by setting this to `false`.
     */
    this.METADATA.caching = NGN.coalesce(cfg.cache, true)

    /**
     * @cfg {NGN.DATA.Model|NGN.DATA.Store|Object} scope
     * The model, store, or object that will be referenceable within the
     * virtual field #method. The model will be available in the `this` scope.
     */
    this.METADATA.scope = NGN.coalesce(cfg.scope, cfg.model, this)

    /**
     * @cfg {Function} method
     * The method used to generate a value.
     * This is an asynchronous method the returns a value (of any type).
     */
    const me = this
    const handlerFn = cfg.method

    this.METADATA.virtualMethod = function () {
      return handlerFn.apply(me.METADATA.scope, ...arguments)
    }

    // Add smart-cache support
    this.METADATA.CACHEKEY = Symbol('no.cache')
    this.METADATA.cachedValue = this.METADATA.CACHEKEY

    // Only add caching support if a model is associated
    if (this.METADATA.caching && this.model) {
      // Create a method for identifying which local data fields
      // need to be monitored (for caching)
      const localFieldPattern = /this(\.(.[^\W]+)|\[['"]{1}(.*)+['"]{1}\])/g

      // Returns a Set of fieldnames used in the virtual function.
      const monitoredFields = new Set()
      let content = handlerFn.toString()
      let iterator = localFieldPattern.exec(content)

      while (iterator !== null) {
        const field = NGN.coalesce(iterator[2], iterator[3])

        if (this.model.METADATA.knownFieldNames.has(field)) {
          monitoredFields.add(field)
        }

        content = content.replace(localFieldPattern, '')
        iterator = localFieldPattern.exec(content)
      }

      this.METADATA.model.pool('field.', {
        update: (change) => {
          if (change.field && monitoredFields.has(change.field.name)) {
            this.METADATA.cachedValue = this.METADATA.CACHEKEY
            this.emit('cache.clear', this)
          }
        },

        remove: (field) => {
          if (monitoredFields.has(field.name)) {
            this.METADATA.cachedValue = this.METADATA.CACHEKEY
            this.emit('cache.clear', this)
            NGN.ERROR(`The ${this.name} virtual field uses the ${field.name} field, which was removed. This virtual field may no longer work.`)
          }
        },

        create: (field) => {
          if (monitoredFields.has(field.name)) {
            this.METADATA.cachedValue = this.METADATA.CACHEKEY
            this.emit('cache.clear', this)
            NGN.INFO(`The ${this.name} virtual field uses the ${field.name} field, which was added.`)
          }
        }
      })
    }
  }

  get auditable () {
    NGN.WARN('Virtual fields do not support the auditable property.')
    return false
  }

  set auditable (value) {
    NGN.WARN('Virtual fields do not support the auditable property.')
  }

  /**
   * @property {any} value
   * This will always return the value of the virtual field, but it may only
   * be _set_ to a synchronous function that returns a value.
   */
  get value () {
    if (this.METADATA.caching) {
      if (this.METADATA.cachedValue !== this.METADATA.CACHEKEY) {
        return this.METADATA.cachedValue
      } else {
        this.METADATA.cachedValue = this.METADATA.virtualMethod()
        return this.METADATA.cachedValue
      }
    }

    return this.METADATA.virtualMethod()
  }

  set value (value) {
    NGN.WARN('Cannot set the value of a virtual field (read only).')
  }

  get required () {
    NGN.WARN('Virtual fields do not support the required property.')
    return false
  }

  set required (value) {
    NGN.WARN('Virtual fields do not support the required property.')
  }

  get isNew () {
    NGN.WARN('Virtual fields do not support the isNew property.')
    return false
  }

  get default () {
    NGN.WARN('Virtual fields do not have default values.')
    return undefined
  }

  set default (value) {
    NGN.WARN('Virtual fields do not have default values.')
    return undefined
  }

  get violatedRule () {
    return 'None'
  }

  get valid () {
    NGN.WARN('Virtual fields are always valid.')
    return true
  }

  get modified () {
    NGN.WARN('modified attribute does nothing on virtual fields.')
    return false
  }

  allowInvalid () {
    NGN.WARN('allowInvalid() unavailable for virtual fields.')
  }

  disallowInvalid () {
    NGN.WARN('disallowInvalid() unavailable for virtual fields.')
  }

  autocorrectInput () {
    NGN.WARN('autocorrectInput() unavailable for virtual fields.')
  }
}
