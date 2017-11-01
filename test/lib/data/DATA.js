(function () {
  'use strict'

/**
 * @class NGN.DATA.Model
 * Represents a data model/record.
 * @fires field.update
 * Fired when a datafield value is changed.
 * @fires field.create
 * Fired when a datafield is created.
 * @fires field.remove
 * Fired when a datafield is deleted.
 * @fires field.invalid
 * Fired when an invalid value is detected in an data field.
 */
class NGNDataModel extends NGN.EventEmitter {
  constructor (config) {
    config = config || {}

    super()

    Object.defineProperties(this, {
      /**
       * @property {Symbol} oid
       * A unique object ID assigned to the model. This is an
       * internal readon-only reference.
       * @private
       */
      oid: NGN.privateconst(Symbol()),

      /**
       * @cfg {String} [idAttribute='id']
       * Setting this allows an attribute of the object to be used as the ID.
       * For example, if an email is the ID of a user, this would be set to
       * `email`.
       */
      idAttribute: NGN.privateconst(config.idAttribute || 'id'),

      /**
       * @cfg {object} fields
       * Represents the data fields of the model.
       */
      datafields: NGN.private(config.fields),

      /**
       * @property {Object}
       * Custom validation rules used to verify the integrity of the entire
       * model. This only applies to the full model. Individual data fields
       * may have their own validators.
       */
      validators: NGN.private(NGN.coalesce(config.validators, {})),

      /**
       * @cfgproperty {boolean} [validation=true]
       * Toggle data validation using this.
       */
      validation: NGN.public(NGN.coalesce(config.validation, true)),

      /**
       * @cfg {boolean} [autoid=false]
       * If the NGN.DATA.Model#idAttribute/id is not provided for a record,
       * unique ID will be automatically generated for it. This means there
       * will not be a `null` ID.
       *
       * An NGN.DATA.Store using a model with this set to `true` will never
       * have a duplicate record, since the #id or #idAttribute will always
       * be unique.
       */
      autoid: NGN.public(NGN.coalesce(config.autoid, false)),

      benchmark: NGN.private(null),

      /**
       * @cfgproperty {Date|Number} [expires]
       * When this is set to a date/time, the model record will be marked
       * as expired at the specified time/date. If a number is specified
       * (milliseconds), the record will be marked as expired after the
       * specified time period has elapsed. When a record/model is marked as
       * "expired", it triggers the `expired` event. By default, expired
       * records/models within an NGN.DATA.Store will be removed from the store.
       *
       * Setting this to any value less than `0` disables expiration.
       * @fires expired
       * Triggered when the model/record expires.
       */
      expiration: NGN.private(null),

      // Used to hold a setTimeout method for expiration events.
      expirationTimeout: NGN.private(null),
    })
  }
}

  // [PARTIAL]
/**
 * @class NGN.DATA.Index
 * Data indexes are a data structure that improves the speed
 * of data retrieval from an NGN.DATA.Store, at the cost of
 * additional memory usage. Even though memory usage is increased
 * for each index applied to a store, it tends to be a very small
 * fraction of the memory required for storing data.
 *
 * Indexes help locate data within a store without having to read
 * every record. They will, in the overwhelming majority of cases,
 * speed up queries. However; if overused or misused, they may
 * marginally _increase_ query processing time.
 *
 * NGN data indexes were designed to be used the same way relational
 * data indexes and graph data vertices are used.
 * @fires create {Symbol}
 * Triggered when a new record is indexed. The payload (Symbol)
 * represents the NGN.DATA.Model#oid
 * @fires delete {Symbol}
 * Triggered when a record is de-indexed. The payload (Symbol)
 * represents the NGN.DATA.Model#oid
 * @fires update {Symbol}
 * Triggered when a record is re-indexed (updated). The payload (Symbol)
 * represents the NGN.DATA.Model#oid
 * @fires reset
 * Triggered when the index is completely cleared/reset to it's original state.
 * @private
 */
class NGNDataIndex extends NGN.EventEmitter {
  constructor () {
    super()

    Object.defineProperties(this, {
      // Private constants
      CREATE_EVENT: NGN.private(Symbol('create')),
      REMOVE_EVENT: NGN.private(Symbol('delete')),
      UPDATE_EVENT: NGN.private(Symbol('update')),

      // Private data attributes
      uniqueValues: NGN.private(new Set()),
      knownRecords: NGN.private([]) // Linked list of Sets
    })

    // Bubble up private events when applicable
    let me = this
    this.on([
      this.CREATE_EVENT,
      this.REMOVE_EVENT,
      this.UPDATE_EVENT
    ], function (oid, value, suppressEvent = false) {
      if (!suppressEvent) {
        me.emit(Symbol.keyFor(this.event).split('-')[0], oid)
      }
    })

    // When all known records for a given value are removed,
    // clear the unique value index.
    this.on(this.REMOVE_EVENT, (oid, value) => {
      if (this.recordsFor(value).length === 0) {
        let index = this.indexOf(value)

        if (index >= 0) {
          this.knownRecords.splice(index, 1)
          this.uniqueValues.delete(value)
        }
      }
    })
  }

  /**
   * Add a field/value to the index.
   * @param {any} value
   * The value of the model/record indexed field.
   * @param {Symbol} oid
   * The record's object ID (NGN.DATA.Model#oid)
   */
  add (value, oid, suppressEvent = false) {
    let valueIndex = -1

    // Create or identify the index of the unique value
    if (!this.uniqueValues.has(value)) {
      this.uniqueValues.add(value)
      this.knownRecords.push([new Set()])
      valueIndex += this.uniqueValues.size
    } else {
      valueIndex = this.indexOf(value)
    }

    this.knownRecords[valueIndex].add(oid)

    this.emit(this.CREATE_EVENT, oid, value, suppressEvent)
  }

  /**
   * Remove a record from the index.
   * @param  {Symbol} oid
   * The record's object ID (NGN.DATA.Model#oid)
   * @param  {any} [value=undefined]
   * When specified, the field value will be used to identify
   * the index value. Specifying this value will make the remove
   * operation faster.
   */
  remove (oid, value, suppressEvent = false) {
    // If a value is specified, attempt to lookup the OID by value.
    if (value !== undefined) {
      let index = this.recordsOf(value)

      // If a value index is found, remove the OID
      if (index) {
        if (index.delete(oid)) { // Returns false if nothing is actually deleted.
          this.emit(this.REMOVE_EVENT, oid, value, suppressEvent)
          return
        }
      }
    }

    // Iterate through all index values to remove the OID (slow)
    let removed = false
    for (let i = 0; i < this.knownRecords.length; i++) {
      if (this.knownRecords[i].delete(oid) && !removed) {
        removed = true
      }
    }

    if (removed) {
      this.emit(this.REMOVE_EVENT, oid, value, suppressEvent)
    }
  }

  /**
   * Update an index to reflect an updated value.
   * @param  {[type]} oid      [description]
   * @param  {[type]} oldvalue [description]
   * @param  {[type]} newvalue [description]
   * @return {[type]}          [description]
   */
  update (oid, oldValue, newValue, suppressEvent = false) {
    if (oldValue !== newValue) {
      this.remove(oid, oldValue, true)
      this.add(oid, newValue, true)
      this.emit(this.UPDATE_EVENT, oid, null, suppressEvent)
    }
  }

  /**
   * Forcibly reset the index (clears everything).
   */
  reset () {
    this.uniqueValues = new Set()
    this.knownRecords = []
    this.emit('reset')
  }

  /**
   * Retrive the index number of known records for the
   * specified value.
   * @private
   * @param  {any} value
   * The unique value for which records are known.
   * @return {numeric}
   * The 0-based index of known records. Returns `-1` if no
   * index exists.
   */
  indexOf (value) {
    return Array.from(this.uniqueValues.keys()).indexOf(value)
  }

  /**
   * The records of a particular value.
   * @private
   * @param  {any} value
   * The index field value to use as a lookup.
   * @return {Set.iterator}
   * An iterator of object ID's or `null` if none exist.
   */
  recordsOf (value) {
    let valueIndex = this.indexOf(value)

    return valueIndex < 0 ? null : this.knownRecords[valueIndex]
  }

  /**
   * Get the list of records for the given value.
   * @param  {any} value [description]
   * @return {[Symbol]}
   * The array contains NGN.DATA.Model#oid values.
   */
  recordsFor (value) {
    let index = this.recordsOf(value)

    if (index === 0) {
      return []
    }

    return index.values()
  }
}

  // [PARTIAL]

/**
 * @class NGN.DATA.BTreeIndex
 */
class BTreeIndex extends NGN.EventEmitter {
  constructor () {
    super()
    console.log('BTree Init')
  }
}

  // [PARTIAL]

/**
 * @class NGN.DATA.Store
 * Represents a collection of data.
 * @fires record.create
 * Fired when a new record is created. The new
 * record is provided as an argument to the event
 * handler.
 * @fires record.delete
 * Fired when a record(s) is removed. The old record
 * is provided as an argument to the event handler.
 */
class NGNDataStore extends NGN.EventEmitter {
  constructor (cfg) {
    cfg = cfg || {}
    super(cfg)

    console.log('STORE')
  }
}


  let NGNModel = function (cfg) {
    const ModelLoader = function (data) {
      let model = new NGNDataModel(cfg)

      if (data) {
        model.load(data)
      }

      return model
    }

    return ModelLoader
  }

  NGN.extend('DATA', Object.freeze(Object.defineProperties({}, {
    Entity: NGN.private(NGNDataModel),
    Model: NGN.const(NGNModel),
    'Index': NGN.const(NGNDataIndex),
    BTreeIndex: NGN.private(BTreeIndex),
    Store: NGN.const(NGNDataStore)
  })))
})()