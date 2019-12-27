import NGN from '../../core.js'
import DataField from './Field.js'

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
 * NGN.DATA.Model#validators, so relationship fields defer all validation to
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
 * There are five (5) common types of cardinality.
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
export default class NGNRelationshipField extends DataField { // eslint-disable-line
  constructor (cfg = {}) {
    const type = NGN.typeof(cfg.join)

    // Assure valid configuration
    if (!cfg.join) {
      throw new InvalidConfigurationError('Missing "join" configuration property.')
    } else if (
      ['model', 'store'].indexOf(type) < 0 &&
      (
        type !== 'array' ||
        NGN.typeof(cfg.join[0]) !== 'model'
      )
    ) {
      throw new InvalidConfigurationError(`The join specified is not a valid NGN.DATA.Model, NGN.DATA.Store, or collection. It is a ${NGN.typeof(cfg.join)}"`)
    }

    // Create optional cardinality validations

    // Initialize
    cfg.identifier = false
    super(cfg)

    this.METADATA.fieldType = 'join'
    this.METADATA.join = Symbol('relationship')

    // Apply event monitoring to the #record.
    this.METADATA.applyMonitor = () => {
      if (this.METADATA.manner === 'model') {
        // Model Event Relay
        this.METADATA.join.pool('field.', {
          create: this.METADATA.commonModelEventHandler('field.create'),
          update: this.METADATA.commonModelEventHandler('field.update'),
          remove: this.METADATA.commonModelEventHandler('field.remove'),
          invalid: (data) => {
            this.emit(['invalid', `invalid.${this.METADATA.name}.${data.field}`])
          },
          valid: (data) => {
            this.emit(['valid', `valid.${this.METADATA.name}.${data.field}`])
          }
        })
      //   this.METADATA.join.pool('field.', {
      //     create: this.METADATA.commonModelEventHandler('field.create'),
      //     update: this.METADATA.commonModelEventHandler('field.update'),
      //     remove: this.METADATA.commonModelEventHandler('field.remove'),
      //     invalid: (data) => {
      //       this.emit(['invalid', `invalid.${this.name}.${data.field}`])
      //     },
      //     valid: (data) => {
      //       this.emit(['valid', `valid.${this.name}.${data.field}`])
      //     }
      //   })
      // } else {
      //   // Store Event Relay
      //   this.METADATA.join.pool('record.', {
      //     create: this.METADATA.commonStoreEventHandler('record.create'),
      //     update: this.METADATA.commonStoreEventHandler('record.update'),
      //     remove: this.METADATA.commonStoreEventHandler('record.remove'),
      //     invalid: (data) => {
      //       this.emit('invalid', `invalid.${this.name}.${data.field}`)
      //     },
      //     valid: (data) => {
      //       this.emit('valid', `valid.${this.name}.${data.field}`)
      //     }
      //   })
      }
    }

    // Event handling for nested models.
    this.METADATA.commonModelEventHandler = (type) => {
      const me = this

      return function (change) {
        me.METADATA.commitPayload({
          field: `${me.name}.${change.field}`,
          old: NGN.coalesce(change.old),
          new: NGN.coalesce(change.new),
          join: true,
          originalEvent: {
            event: this.event,
            record: me.METADATA.record
          }
        })
      }
    }

    // Event handling for nested stores.
    this.METADATA.commonStoreEventHandler = (type) => {
      const me = this

      return function (record, change) {
        const old = change ? NGN.coalesce(change.old) : me.data

        if (this.event === 'record.create') {
          old.pop()
        } else if (this.event === 'record.delete') {
          old.push(record.data)
        }

        me.METADATA.commitPayload({
          field: me.name + (change ? `.${change.field}` : ''),
          old: change ? NGN.coalesce(change.old) : old,
          new: change ? NGN.coalesce(change.new) : me.data,
          join: true,
          originalEvent: {
            event: this.event,
            record: record
          }
        })
      }
    }

    // const commitPayload = this.METADATA.commitPayload
    //
    // this.METADATA.commitPayload = (payload) => {
    //   console.log('HERE')
    //   commitPayload(...arguments)
    // }

    /**
     * @cfg join {NGN.DATA.Store|NGN.DATA.Model[]}
     * A relationship to another model/store is defined by a join.
     * The join may be a data store or data model. It is also possible
     * to specify a collection.
     *
     * For example, a join may be defined as:
     *
     * ```js
     * // Use of a model
     * let RelationshipField = new NGN.DATA.Relationship({
     *   record: new NGN.DATA.Model(...)
     * })
     *
     * // Use of a model collection
     * let RelationshipField = new NGN.DATA.Relationship({
     *   record: [new NGN.DATA.Model(...)]
     * })
     *
     * // Use of a store
     * let RelationshipField = new NGN.DATA.Relationship({
     *   record: new NGN.DATA.Store(...)
     * })
     * ```
     *
     * A store and a model collection are both a group of models,
     * Internally, model collections are converted to data stores.
     *
     * By supporting all three formats, it is possible to create complex
     * data models, such as:
     *
     * ```js
     * let Pet = new NGN.DATA.Model(...)
     * let Kid = new NGN.DATA.Model(...)
     * let Kids = new NGN.DATA.Store({
     *   model: Kid
     * })
     *
     * let Person = new NGN.DATA.Model({
     *   fields: {
     *     dateOfBirth: Date,
     *     spouse: Person,  // <== Join a Model
     *     kids: Kids,      // <== Join a Store
     *     pets: [Pet]      // <== Join a Collection
     *   }
     * })
     * ```
     *
     * The `pets` field contains a "collection". This shorthand notation is used
     * to help understand real data relationships. In this case, it is easy to
     * infer that a person may have zero or more pets.
     */
    this.value = NGN.coalesce(cfg.join)
    this.METADATA.AUDITABLE = false
    this.auditable = NGN.coalesce(cfg.audit, false)
  }

  /**
   * @property {string} manner
   * The manner of relationship. This can be one of 3 values: `store`
   * (NGN.DATA.Store), `model` (NGN.DATA.Model), or `collection`. A collection
   * is a special configuration shortcut used to represent a new store of models.
   * ```math
   * E = mc^2
   * ```
   * ```graph
   * graph LR
   * a-->b
   * ```
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
   */
  get manner () {
    return NGN.coalesce(this.METADATA.manner, 'unknown')
  }

  get value () {
    return this.METADATA.join
  }

  // Override the default value setter
  set value (value) {
    // Short-circuit if the value hasn't changed.
    const currentValue = this.METADATA.join

    if (currentValue === value) {
      return
    }

    const type = NGN.typeof(value)

    if (type === 'array') {
      if (value.length !== 1) {
        throw new Error(`${this.METADATA.name} cannot refer to an empty data store/model collection. A record must be provided.`)
      }

      this.METADATA.manner = 'store'
      value = new NGN.DATA.Store({
        model: value[0]
      })
    } else if (['model', 'store'].indexOf(type) >= 0) {
      this.METADATA.manner = type
    } else {
      NGN.ERROR(`The "${this.METADATA.name}" relationship has an invalid record type. Only instances of NGN.DATA.Store, NGN.DATA.Model, or [NGN.DATA.Model] are supported." .`)
      throw new InvalidConfigurationError(`Invalid record configuration for "${this.METADATA.name}" field.`)
    }

    if (this.manner === 'unknown') {
      throw new Error('Cannot set a relationship field to anything other than an NGN.DATA.Store, NGN.DATA.Model, or an array of NGN.DATA.Model collections. (Unknown manner of relationship)')
    }

    this.METADATA.join = type === 'model' ? new value() : value // eslint-disable-line new-cap
    this.auditable = this.METADATA.AUDITABLE
    this.METADATA.applyMonitor()

    // Notify listeners of change
    if (typeof currentValue !== 'symbol') {
      this.emit('update', {
        old: currentValue,
        new: value
      })
    }
  }

  set auditable (value) {
    value = NGN.forceBoolean(value)

    if (value !== this.METADATA.AUDITABLE) {
      this.METADATA.AUDITABLE = value
      this.METADATA.join.auditable = value
    }
  }

  // Override the default undo
  undo () {
    if (this.METADATA.manner === 'model') {
      this.METADATA.join.undo(...arguments)
    }
  }

  redo () {
    if (this.METADATA.manner === 'model') {
      this.METADATA.join.redo(...arguments)
    }
  }
}
