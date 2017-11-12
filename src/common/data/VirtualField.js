// [PARTIAL]

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
 */
class NGNVirtualDataField extends NGNDataField {
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
    return
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
