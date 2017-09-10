'use strict'

/**
 * @class NGN.DATA.VirtualField
 * A virtual field is an ephemeral representation of data generated dynamically.
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
 *   },
 *   virtuals: {
 *     age: function () {
 *       return YearsApart(new Date(), this.dateOfBirth)
 *     }
 *   }
 * })
 * ```
 *
 * The `age` example above compares the `dateOfBirth` field
 * to the current date, expecting a numeric response. This particular virtual
 * field is useful for calculating a common value on the fly, and it is reusable
 * for any number of instances of the model.
 *
 * This functionality is available by implementing the NGN.DATA.VirtualField.
 * For example, the `age` virtual field would be created as:
 *
 * ```js
 *
 * let age = new NGN.DATA.VirtualField({
 *   model: myNgnDataModel,
 *   ... any other NGN.DATA.Field Configurations...
 * })
 *
 * age.value = function () {
 *  return YearsApart(new Date(), this.dateOfBirth)
 * }
 * ```
 */
class NgnVirtualField extends NGN.DATA.Field {
  constructor (cfg) {
    cfg = NGN.coalesce(cfg, {})

    if (!cfg.hasOwnProperty('model') || (!cfg.model instanceof NGN.DATA.Entity)) {
      throw new Error('No model specified for the virtual field to reference.')
    }

    super(cfg)

    // Identify the data field as a virtual one.
    this._fieldType = 'virtual'

    Object.defineProperties(this, {
      /**
       * @cfg {NGN.DATA.Model} model
       * The model this field is applied to.
       */
      model: NGN.private(cfg.model),

      virtualMethod: NGN.private(null)
    })

    if (cfg.hasOwnProperty('default') && NGN.isFn(cfg.default)) {
      this.virtualMethod = cfg.default
    }
  }

  get 'default' () {
    return undefined
  }

  set 'default' () {
    return // No-op
  }

  /**
   * @property {any} value
   * This will always return the value of the virtual field, but it may only
   * be _set_ to a synchronous function that returns a value.
   */
  get value () {
    return this.virtualMethod.apply(this.model)
  }

  set value (fn) {
    if (!NGN.isFn(fn)) {
      throw new Error(`A virtual field may only be assigned a synchronous function (Received ${NGN.typeof(fn)}).`)
    }

    // Track the change
    let change = {
      old: this.virtualMethod,
      new: fn
    }

    // Make the change
    this.virtualMethod = fn

    // Notify subscribers of the change
    this.emit('update', change)

    // Enforce quick garbage collection
    change = null
  }

  /**
   * @property {boolean} valid
   * This indicates the value of the virtual field is valid or not, but unlike
   * a standard field, it removes the `required` check if it exists.
   */
  get valid () {
    let value = this.value
    for (let rule in this.validators) {
      if (!this.validators[rule](value)) {
        return false
      }
    }

    return true
  }
}

NGN.DATA = NGN.DATA || {}
Object.defineProperty(NGN.DATA, 'VirtualField', NGN.privateconst(NgnVirtualField))
