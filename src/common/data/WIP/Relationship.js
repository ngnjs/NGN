'use strict'

/**
 * @class NGN.DATA.Relationship
 * Represents a data field linked to another NGN.DATA.Model or
 * NGN.DATA.Store. This is used for nesting models/stores within a field,
 * supporting creation of complex data structures that are still easy
 * to work with.
 *
 * While there is no limit to how deeply nested fields can be, it is considered
 * a best practice to avoid circular relationships, which can lead to infinite
 * loops when serializing data.
 *
 * Nested models (i.e. records) each have their own data
 * @NGN.DATA.Model#validators, so relationship fields defer all validation to
 * the individual record/model.
 *
 * Relationships using NGN.DATA.Stores behave a little differently, since they
 * represent a collection of data instead of a single record/model. NGN manages
 * [referential integrity](https://en.wikipedia.org/wiki/Referential_integrity)
 * using simplistic
 * [cardinality](https://en.wikipedia.org/wiki/Cardinality_(data_modeling)).
 *
 * Referential integrity & cardinality rules are data modeling principles
 * designed to enforce data quality standards. The nature of JavaScript objects
 * naturally enforces rudimentary data linking/nesting. NGN data relationships
 * build upon this, using proven data modeling principles.
 *
 * This is done, very simply, by using the @cfg#min and @cfg#max configuration
 * options. However; these options don't always need to be enforced, depending
 * on what type of cardniality needs to be achieved.
 *
 * For more information, see the Data Modeling Guide.
 *
 * **Note to self, use this next part in the guide:**
 *
 * There are five (4) common types of cardinality.
 *
 * - **1 => 1**: One-to-One
 * - **0 => 1**: Zero-or-One
 * - **0 => N**: Zero-to-Many
 * - **1 => N**: One-to-Many
 * - **N => N**: Many-to-Many
 *
 * There are also more granular types of cardinality, which are less common in
 * web applications, but often used in data and ETL operations.
 *
 * - **0,1 => 0,N**: Zero-or-One to Zero-or-More
 * - **0,1 => 1,N**: Zero-or-One to One-or-More
 * - ... write the rest in the guide...
 */
class NgnRelationshipField extends NGN.DATA.Field {
  constructor (cfg) {
    cfg = cfg || {}

    // Validate provided configuration
    if (!cfg.hasOwnProperty('name')) {
      throw new Error('A required name is missing for the related data field.')
    }

    if (!cfg.hasOwnProperty('model') || (!cfg.model instanceof NGN.DATA.Entity)) {
      throw new Error('No model specified for the virtual field to reference.')
    }

    // Create optional cardinality validations

    // Initialize
    super(cfg)

    if (this.type === 'array' && this.dataType.length === 0) {
      throw new Error(`${name} cannot be an empty store. A model must be provided.`)
    }

    Object.defineProperties(this, {
      /**
       * @cfg {NGN.DATA.Model} model
       * The model this field is applied to.
       */
      model: NGN.private(cfg.model)
    })
  }

  /**
   * @property {string} manner
   * The manner of relationship. This can be one of 3 values: `store`
   * (NGN.DATA.Store), `model` (NGN.DATA.Model), or `collection`. A collection
   * is a special configuration shortcut used to represent a new store of models.
   *
   * For example, a model may be defined as:
   *
   * ```js
   * let Pet = new NGN.DATA.Model({
   *   fields: {
   *     name: String,
   *     animalType: String
   *   }
   * })
   *
   * let Person = new NGN.DATA.Model({
   *   fields: {
   *     dateOfBirth: Date
   *   },
   *   relationships: {
   *     pets: [Pet]        // <== Collection
   *   }
   * })
   * ```
   * The `pets` field contains a "collection". This shorthand notation is used
   * to help understand real data relationships. In this case, it is easy to
   * infer that a person may have zero or more pets.
   */
  get manner () {
    return this._mannerOf(this.dataType)
  }

  // Override the default value setter
  set value (value) {
    let manner = this._mannerOf(value)
    if (manner === 'unknown') {
      throw new Error('Cannot set a relationship field to anything other than an NGN.DATA.Store, NGN.DATA.Model, or an array of NGN.DATA.Models. (Unknown manner of relationship)')
    }

    if (manner === 'collection') {
      value = new NGN.DATA.Store({
        model: value[0]
      })
    }

    let change = {
      old: this.raw,
      new: value
    }

    this.raw = value

    this.applyMonitor()

    this.emit('update', change)
  }

  applyMonitor () {
    if (this.manner === 'model') {
      // Model Event Relay
      this.raw.pool('field.', {
        create: this.commonModelEventHandler('field.create'),
        update: this.commonModelEventHandler('field.update'),
        remove: this.commonModelEventHandler('field.remove'),
        invalid (data) => {
          this.emit('invalid')
          this.emit(`invalid.${this.fieldName}.${data.field}`)
        },
        valid (data) => {
          this.emit('valid')
          this.emit(`valid.${this.fieldName}.${data.field}`)
        }
      })
    } else {
      // Store Event Relay
      this.raw.pool('record.', {
        create: this.commonStoreEventHandler('record.create'),
        update: this.commonStoreEventHandler('record.update'),
        remove: this.commonStoreEventHandler('record.remove'),
        invalid (data) => {
          this.emit('invalid')
          this.emit(`invalid.${this.fieldName}.${data.field}`)
        },
        valid (data) => {
          this.emit('valid')
          this.emit(`valid.${this.fieldName}.${data.field}`)
        }
      })
    }
  }

  commonStoreEventHandler (type) {
    const me = this

    return function (record, change) {
      let old = change ? NGN.coalesce(change.old) : me.data

      if (this.event === 'record.create') {
        old.pop()
      } else if (this.event === 'record.delete') {
        old.push(record.data)
      }

      me.commitPayload({
        field:  me.fieldName + (change ? `.${change.field}` : ''),
        old: change ? NGN.coalesce(change.old) : old,
        new: change ? NGN.coalesce(change.new) : me.data,
        originalEvent: {
          event: this.event,
          record: record
        }
      })
    }
  }

  commonModelEventHandler (type) {
    const me = this

    return function (change) {
      me.commitPayload({
        field: `${me.fieldName}.${change.field}`,
        old: NGN.coalesce(change.old),
        new: NGN.coalesce(change.new),
        originalEvent: {
          event: this.event,
          record: me.model
        }
      })
    }
  }

  commitPayload (payload) {
    payload.action = 'update'
    payload.join = true

    me.setMaxListeners(me.getMaxListeners() + 3)
    me.emit('update', payload)
    me.emit(`${payload.field}.update`, payload)
    me.emit(`update.${payload.field}`, payload)

    payload = null // Mark for immediate garbage collection
  }

  /**
   * @method _mannerOf
   * An internal helper method to determine the relationship manner of a value.
   * @param {NGN.DATA.Store|NGN.DATA.Model|Array} value
   * The value to test.
   * @returns {string}
   * Returns `store`, `model`, `collection`, or `unknown`.
   * @private
   */
  _mannerOf (value) {
    if (this._isStore(value)) {
      return 'store'
    } else if (NGN.typeof(value) === 'array') {
      return 'collection'
    } else if (NGN.typeof(value) === 'object' && value.hasOwnProperty('model')) {
      return 'store'
    } else if (value instanceof NGN.DATA.Entity) {
      return 'model'
    }

    return 'unknown'
  }

  /**
   * @method _isStore
   * An internal helper method to determine if an object is an NGN.DATA.Store.
   * @param {Any} value
   * The value to test.
   * @returns {Boolean}
   * @private
   */
  _isStore (value) {
    try {
      if (value instanceof NGN.DATA.Store) {
        return true
      } else if (NGN.typeof(value) === 'object' && value.hasOwnProperty('model')) {
        return true
      }
    } catch (e) {}

    return false
  }
}

NGN.DATA = NGN.DATA || {}
Object.defineProperty(NGN.DATA, 'Relationship', NGN.privateconst(NgnRelationshipField))
