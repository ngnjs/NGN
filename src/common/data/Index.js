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
 * represents the NGN.DATA.Model#oid.
 * @fires delete {Symbol}
 * Triggered when a record is de-indexed. The payload (Symbol)
 * represents the NGN.DATA.Model#oid.
 * @fires update {Symbol}
 * Triggered when a record is re-indexed (updated). The payload (Symbol)
 * represents the NGN.DATA.Model#oid.
 * @fires reset
 * Triggered when the index is completely cleared/reset to it's original state.
 * @private
 */
class NGNDataIndex extends NGN.EventEmitter {
  /**
   * Create a new data index.
   * @param {Boolean} [BTree=false]
   * Use a B-Tree index. This is only available for numeric values and dates.
   * @param {String} [name='Untitled Index']
   * Optional name for index. This is useful for debugging when multiple
   * indexes exist.
   */
  constructor (btree = false, name = 'Untitled Index') {
    super()

    Object.defineProperties(this, {
      // Private constants
      CREATE_EVENT: NGN.privateconst(Symbol('create')),
      REMOVE_EVENT: NGN.privateconst(Symbol('delete')),
      UPDATE_EVENT: NGN.privateconst(Symbol('update')),

      // Private data attributes
      uniqueValues: NGN.privateconst(new Set()),
      knownRecords: NGN.privateconst([]), // Linked list of Sets
      name: NGN.const(name),
      isBTree: NGN.privateconst(btree)
    })

    // Bubble up private events when applicable
    const me = this
    this.on([
      this.CREATE_EVENT,
      this.REMOVE_EVENT,
      this.UPDATE_EVENT
    ], function (oid, value, suppressEvent = false) {
      if (!suppressEvent) {
        me.emit(this.event.toString().replace(/^Symbol\(|\)$/g, ''), oid)
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

    // Support BTree Indexing
    if (this.isBTree) {
      Object.defineProperty(this, BTREE, NGN.privateconst(new NGN.DATA.BTree(2, name)))
    }
  }

  get keys () {
    if (this.uniqueValues.size === 0) {
      return []
    }

    return Array.from(this.uniqueValues.values())
  }

  /**
   * Add a field/value to the index.
   * @param {any} value
   * The value of the model/record indexed field.
   * @param {Symbol} oid
   * The record's object ID (NGN.DATA.Model#OID)
   */
  add (value, oid, suppressEvent = false) {
    let valueIndex = -1

    // Create or identify the index of the unique value
    if (!this.uniqueValues.has(value)) {
      this.uniqueValues.add(value)
      this.knownRecords.push(new Set())
      valueIndex += this.uniqueValues.size
    } else {
      valueIndex = this.indexOf(value)
    }

    this.knownRecords[valueIndex].add(oid)

    // Add BTree indexing
    if (this.isBTree) {
      let btreeValue = value instanceof Date ? value.getTime() : value

      if (this.BTREE.get(btreeValue) === undefined) {
        tree.put(btreeValue, valueIndex)
      }
    }

    this.emit(this.CREATE_EVENT, oid, value, suppressEvent)
  }

  /**
   * Remove a record from the index.
   * @param  {Symbol} oid
   * The record's object ID (NGN.DATA.Model#OID)
   * @param  {any} [value=undefined]
   * When specified, the field value will be used to identify
   * the index value. Specifying this value will make the remove
   * operation faster (uses introspection).
   */
  remove (oid, value, suppressEvent = false) {
    // If a value is specified, attempt to lookup the OID by value.
    if (value !== undefined) {
      let index = this.recordsOf(value)

      // If a value index is found, remove the OID
      if (index) {
        if (index.delete(oid)) { // Returns false if nothing is actually deleted.
          if (this.isBTree && (!index || index.size === 0)) {
            this.BTREE.delete(value instanceof Date ? value.getTime() : value)
          }

          this.emit(this.REMOVE_EVENT, oid, value, suppressEvent)

          return
        }
      }

      NGN.WARN(`Index value "${value}" not found in index.`)
    }

    // Iterate through all index values to remove the OID (slow)
    let removed = false
    for (let i = 0; i < this.knownRecords.length; i++) {
      if (this.knownRecords[i].delete(oid) && !removed) {
        removed = true
        value = Array.from(this.uniqueValues.values())[i]

        if (this.isBTree) {
          this.BTREE.delete(value instanceof Date ? value.getTime() : value)
        }

        break
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
      this.add(newValue, oid, true)
      this.emit(this.UPDATE_EVENT, oid, null, suppressEvent)
    }
  }

  /**
   * Forcibly reset the index (clears everything).
   */
  reset () {
    this.uniqueValues.clear()
    this.knownRecords.splice(0)

    if (this.isBTree) {
      this.BTREE.reset()
    }

    this.emit('reset')
  }

  /**
   * Retrieve the index number of known records for the
   * specified value.
   * @private
   * @param  {any} value
   * The unique value for which records are known.
   * @return {[numeric]}
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
   * @return {Set}
   * An set of object ID's or `null` if none exist.
   */
  recordsOf (value) {
    let valueIndex = this.indexOf(value)

    return valueIndex < 0 ? null : this.knownRecords[valueIndex]
  }

  /**
   * Get the list of records for the given value.
   * @param  {any} [value]
   * The value of the index to lookup the index by.
   * @return {array}
   * The array contains OID reference values (records).
   */
  recordsFor (value) {
    let index = this.recordsOf(value)

    if (index === null || index.size === 0) {
      return []
    }

    return Array.from(index.values())
  }
}
