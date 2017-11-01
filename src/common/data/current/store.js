'use strict'

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
class NgnDataStore extends NGN.EventEmitter {
  constructor (cfg) {
    cfg = cfg || {}
    super(cfg)

    Object.defineProperties(this, {
      /**
       * @cfg {NGN.DATA.Model} model
       * An NGN Data Model to which data records conform.
       */
      _model: { //NGN.public(NGN.coalesce(cfg.model)),
        enumerable: false,
        writable: true,
        configurable: false,
        value: NGN.coalesce(cfg.model)
      },

      // The raw data collection
      _data: NGN.private([]),

      // The raw filters
      _filters: NGN.private([]),

      // The raw indexes
      _index: NGN.private(cfg.index || []),

      // Placeholders to track the data that's added/removed
      // during the lifespan of the store. Modified data is
      // tracked within each model record.
      _created: NGN.private([]),
      _deleted: NGN.private([]),
      _loading: NGN.private(false),
      _softarchive: NGN.private([]),

      /**
       * @cfg {NGN.DATA.Proxy} proxy
       * The proxy used to transmit data over a network.
       */
      _proxy: NGN.private(cfg.proxy || null),

      /**
       * @cfg {boolean} [allowDuplicates=true]
       * Set to `false` to prevent duplicate records from being added.
       * If a duplicate record is added, it will be ignored and an
       * error will be thrown.
       */
      allowDuplicates: NGN.public(NGN.coalesce(cfg.allowDuplicates, true)),

      /**
       * @cfg {boolean} [errorOnDuplicate=false]
       * Set to `true` to throw an error when a duplicate record is detected.
       * If this is not set, it will default to the value of #allowDuplicates.
       * If #allowDuplicates is not defined either, this will be `true`
       */
      errorOnDuplicate: NGN.const(NGN.coalesce(cfg.errorOnDuplicate, cfg.allowDuplicates, true)),

      /**
       * @cfgproperty {boolean} [autoRemoveExpiredRecords=true]
       * When set to `true`, the store will automatically delete expired records.
       */
      autoRemoveExpiredRecords: NGN.privateconst(NGN.coalesce(cfg.autoRemoveExpiredRecords, true)),

      /**
       * @cfg {boolean} [softDelete=false]
       * When set to `true`, the store makes a copy of a record before removing
       * it from the store. The store will still emit a `record.delete` event,
       * and it will still behanve as though the record has been completely
       * removed. However; the record copy can be retrieved using the #restore
       * method.
       *
       * Since it is not always desirable to store a copy of every deleted
       * record indefinitely, it is possible to expire and permanently remove
       * records by setting the #softDeleteTtl.
       *
       * ```js
       * var People = new NGN.DATA.Store({
       *   model: Person,
       *   softDelete: true,
       *   softDeleteTtl: 10000
       * })
       *
       * People.add(somePerson)
       *
       * var removedRecordId
       * People.once('record.delete', function (record) {
       *   removedRecordId = record.id
       * })
       *
       * People.remove(somePerson)
       *
       * setTimeout(function () {
       *   People.restore(removedRecordId)
       * }, 5000)
       *
       * ```
       *
       * The code above creates a new store and adds a person to it.
       * Then a placeholder variable (`removedRecordId`) is created.
       * Next, a one-time event listener is added to the store, specifically
       * for handling the removal of a record. Then the record is removed,
       * which triggers the `record.delete` event, which populates
       * `removedRecordId` with the ID of the record that was deleted.
       * Finally, the code waits for 5 seconds, then restores the record. If
       * the #restore method _wasn't_ called, the record would be purged
       * from memory after 10 seconds (because `softDeleteTtl` is set to 10000
       * milliseconds).
       */
      softDelete: NGN.privateconst(NGN.coalesce(cfg.softDelete, false)),

      /**
       * @cfg {number} [softDeleteTtl=-1]
       * This is the number of milliseconds the store waits before purging a
       * soft-deleted record from memory. `-1` = Infinite (no TTL).
       */
      softDeleteTtl: NGN.private(NGN.coalesce(cfg.softDeleteTtl, -1)),

      /**
       * @cfg {Number} [FIFO=-1]
       * Configures the store to use "**F**irst **I**n **F**irst **O**ut"
       * record processing when it reaches a maximum number of records.
       *
       * For example, assume `FIFO=10`. When the 11th record is added, it
       * will replace the oldest record (i.e. the 1st). This guarantees the
       * store will never have more than 10 records at any given time and it
       * will always maintain the latest records.
       *
       * FIFO and LIFO cannot be applied at the same time.
       *
       * **BE CAREFUL** when using this in combination with #insert,
       * #insertBefore, or #insertAfter. FIFO is applied _after_ the record
       * is added to the store but _before_ it is moved to the desired index.
       */
      fifo: NGN.private(NGN.coalesce(cfg.FIFO, -1)),

      /**
       * @cfg {Number} [LIFO=-1]
       * Configures the store to use "**L**ast **I**n **F**irst **O**ut"
       * record processing when it reaches a maximum number of records.
       *
       * This methos acts in the opposite manner as #FIFO. However; for
       * all intents and purposes, this merely replaces the last record in
       * the store when a new record is added.
       *
       * For example, assume `FIFO=10`. When the 11th record is added, it
       * will replace the latest record (i.e. the 10th). This guarantees the
       * store will never have more than 10 records at any given time. Every
       * time a new record is added (assuming the store already has the maximum
       * allowable records), it replaces the last record (10th) with the new
       * record.
       *
       * LIFO and FIFO cannot be applied at the same time.
       *
       * **BE CAREFUL** when using this in combination with #insert,
       * #insertBefore, or #insertAfter. LIFO is applied _after_ the record
       * is added to the store but _before_ it is moved to the desired index.
       */
      lifo: NGN.private(NGN.coalesce(cfg.LIFO, -1)),

      /**
       * @cfg {Number} [maxRecords=-1]
       * Setting this will prevent new records from being added past this limit.
       * Attempting to add a record to the store beyond it's maximum will throw
       * an error.
       */
      maxRecords: NGN.private(NGN.coalesce(cfg.maxRecords, -1)),

      /**
       * @cfg {Number} [minRecords=0]
       * Setting this will prevent removal of records if the removal would
       * decrease the count below this limit.
       * Attempting to remove a record below the store's minimum will throw
       * an error.
       */
      minRecords: NGN.private(NGN.coalesce(cfg.minRecords, 0)),

      /*
       * @property {array} changelog
       * An ordered array of changes made to the store.
       * This cannot be changed manually. Instead, use #history
       * and #undo to manage this list.
       * @private
       */
      // changelog: NGN.private([])

      /**
       * @property snapshotarchive
       * Contains snapshots.
       * @private
       */
      snapshotarchive: NGN.private(null)
    })

    if (this.lifo > 0 && this.fifo > 0) {
      throw new Error('NGN.DATA.Store can be configured as FIFO or LIFO, but not both simultaneously.')
    }

    // If LIFO/FIFO is used, disable alternative record count limitations.
    if (this.lifo > 0 || this.fifo > 0) {
      this.minRecords = 0
      this.maxRecords = -1
    } else {
      this.minRecords = this.minRecords < 0 ? 0 : this.minRecords
    }

    let obj = {}
    this._index.forEach(i => {
      obj[i] = []
    })

    this._index = obj

    const events = [
      'record.duplicate',
      'record.create',
      'record.update',
      'record.delete',
      'record.restored',
      'record.purged',
      'record.move',
      'record.invalid',
      'record.valid',
      'clear',
      'filter.create',
      'filter.delete',
      'index.create',
      'index.delete'
    ]

    if (NGN.BUS) {
      events.forEach(eventName => {
        this.on(eventName, function () {
          let args = NGN.slice(arguments)
          args.shift()
          args.push(this)
          NGN.BUS.emit(eventName, args)
        })
      })
    }

    if (cfg.proxy) {
      if (this._proxy instanceof NGN.DATA.Proxy) {
        this._proxy.init(this)
      } else {
        throw new Error('Invalid proxy configuration.')
      }
    }
  }

  get model () {
    return this._model
  }

  replaceModel (modelFn) {
    this._model = modelFn
  }

  get proxy () {
    return this._proxy
  }

  set proxy (value) {
    if (!this._proxy && value instanceof NGN.DATA.Proxy) {
      this._proxy = value
      this._proxy.init(this)
    }
  }

  /**
   * @property {array} snapshots
   * Contains the data snapshot of the entire store.
   * @readonly
   * @private
   */
  get snapshots () {
    return NGN.coalesce(this.snapshotarchive, [])
  }

  /**
   * @property history
   * The history of the entity (i.e. changelog).The history
   * is shown from most recent to oldest change. Keep in mind that
   * some actions, such as adding new custom fields on the fly, may
   * be triggered before other updates.
   * @returns {array}
   */
  get history () {
    return this.changelog.reverse()
  }

  /**
   * @property {array} data
   * The complete and unfiltered raw underlying dataset. This data
   * is usually persisted to a database.
   * @readonly
   */
  get data () {
    return this._data.map(function (record) {
      return record.data
    })
  }

  /**
   * @property {array} representation
   * The complete and unfiltered underlying representation dataset
   * (data + virtuals of each model).
   */
  get representation () {
    return this._data.map((record) => {
      return record.representation
    })
  }

  /**
   * @property {array} records
   * An array of NGN.DATA.Model records. If the store has
   * filters applied, the records will reflect the filtration.
   * @readonly
   */
  get records () {
    return this.applyFilters(this._data)
  }

  /**
   * @property recordCount
   * The total number of #records in the collection.
   * @readonly
   */
  get recordCount () {
    return this.applyFilters(this._data).length
  }

  /**
   * @property {array} filtered
   * An array of NGN.DATA.Model records that have been filtered out.
   * The results reflect the inverse of #records.
   */
  get filtered () {
    let records = this.records
    return this._data.filter(function (record) {
      return records.filter(function (rec) {
        return rec.checksum === record.checksum
      }).length === 0
    })
  }

  /**
   * @property {NGN.DATA.Model} first
   * Return the first record in the store. Returns `null`
   * if the store is empty.
   */
  get first () {
    if (this.records.length === 0) {
      return null
    }
    return this.records[0]
  }

  /**
   * @property {NGN.DATA.Model} last
   * Return the last record in the store. Returns `null`
   * if the store is empty.
   */
  get last () {
    if (this.records.length === 0) {
      return null
    }
    return this.records[this.records.length - 1]
  }

  /**
   * @method add
   * Add a data record.
   * @param {NGN.DATA.Model|object} data
   * Accepts an existing NGN Data Model or a JSON object.
   * If a JSON object is supplied, it will be applied to
   * the data model specified in cfg#model. If no model
   * is specified, the raw JSON data will be stored.
   * @param {boolean} [suppressEvent=false]
   * Set this to `true` to prevent the `record.create` event
   * from firing.
   * @return {NGN.DATA.Model}
   * Returns the new record.
   */
  add (data, suppressEvent) {
    let record

    // Prevent creation if it will exceed maximum record count.
    if (this.maxRecords > 0 && this._data.length + 1 > this.maxRecords) {
      throw new Error('Maximum record count exceeded.')
    }

    if (!(data instanceof NGN.DATA.Entity)) {
      try { data = JSON.parse(data) } catch (e) {}
      if (typeof data !== 'object') {
        throw new Error('Cannot add a non-object record.')
      }
      if (this.model) {
        record = new this.model(data) // eslint-disable-line new-cap
      } else {
        record = data
      }
    } else {
      record = data
    }

    if (record.hasOwnProperty('_store')) {
      record._store = this
    }

    let dupe = this.isDuplicate(record)
    if (dupe) {
      this.emit('record.duplicate', record)
      if (!this.allowDuplicates) {
        if (this.errorOnDuplicate) {
          throw new Error('Cannot add duplicate record (allowDuplicates = false).')
        }
        return
      }
    }

    // Handle special record count processing
    if (this.lifo > 0 && this._data.length + 1 > this.lifo) {
      this.remove(this._data.length - 1)
    } else if (this.fifo > 0 && this._data.length + 1 > this.fifo) {
      this.remove(0)
    }

    this.listen(record)
    this.applyIndices(record, this._data.length)
    this._data.push(record)
    !this._loading && this._created.indexOf(record) < 0 && this._created.push(record)

    if (!NGN.coalesce(suppressEvent, false)) {
      this.emit('record.create', record)
    }

    if (!record.valid) {
      this.emit('record.invalid', record)
    }

    return record
  }

  /**
   * @method insertBefore
   * Add a record before the specified index.
   *
   * **BE CAREFUL** when using this in combination with #LIFO or #FIFO.
   * LIFO/FIFO is applied _after_ the record is added to the store but
   * _before_ it is moved to the desired index.
   * @param  {NGN.DATA.Model|number} target
   * The model or index where the new record will be added before.
   * @param {NGN.DATA.Model|object} data
   * Accepts an existing NGN Data Model or a JSON object.
   * If a JSON object is supplied, it will be applied to
   * the data model specified in cfg#model. If no model
   * is specified, the raw JSON data will be stored.
   * @param {boolean} [suppressEvent=false]
   * Set this to `true` to prevent the `record.create` event
   * from firing.
   * @return {NGN.DATA.Model}
   * Returns the new record.
   */
  insertBefore (index, data, suppressEvent = false) {
    return this.insert(index, data, suppressEvent, 'before')
  }

  /**
   * @method insertAfter
   * Add a record after the specified index.
   *
   * **BE CAREFUL** when using this in combination with #LIFO or #FIFO.
   * LIFO/FIFO is applied _after_ the record is added to the store but
   * _before_ it is moved to the desired index.
   * @param  {NGN.DATA.Model|number} target
   * The model or index where the new record will be added after.
   * @param {NGN.DATA.Model|object} data
   * Accepts an existing NGN Data Model or a JSON object.
   * If a JSON object is supplied, it will be applied to
   * the data model specified in cfg#model. If no model
   * is specified, the raw JSON data will be stored.
   * @param {boolean} [suppressEvent=false]
   * Set this to `true` to prevent the `record.create` event
   * from firing.
   * @return {NGN.DATA.Model}
   * Returns the new record.
   */
  insertAfter (index, data, suppressEvent = false) {
    return this.insert(index + 1, data, suppressEvent, 'after')
  }

  /**
   * @method insert
   * Add a record somewhere within the existing recordset (as opposed to simply appending).
   *
   * **BE CAREFUL** when using this in combination with #LIFO or #FIFO.
   * LIFO/FIFO is applied _after_ the record is added to the store but
   * _before_ it is moved to the desired index.
   * @param  {NGN.DATA.Model|number} target
   * The model or index where the new record will be added after.
   * @param {NGN.DATA.Model|object} data
   * Accepts an existing NGN Data Model or a JSON object.
   * If a JSON object is supplied, it will be applied to
   * the data model specified in cfg#model. If no model
   * is specified, the raw JSON data will be stored.
   * @param {boolean} [suppressEvent=false]
   * Set this to `true` to prevent the `record.create` event
   * from firing.
   * @param {string} [position=after]
   * The position (before or after) where the record should be added.
   * @return {NGN.DATA.Model}
   * Returns the new record.
   */
  insert (index, data, suppressEvent = false, position = 'after') {
    let record = this.add(data, true)
    if (record) {
      this.move(this._data.length - 1, index, position, false)

      if (!suppressEvent) {
        this.emit('record.create', record)
      }
    }

    return record
  }

  /**
   * @method isDuplicate
   * Indicates whether the specified record is a duplicate.
   * This compares checksum values. Any match is considered a
   * duplicate. It will also check for duplication of raw JSON
   * objects (i.e. non-NGN.DATA.Model records).
   * @param  {NGN.DATA.Model|Object} record
   * The record or JSON object.
   * @return {boolean}
   */
  isDuplicate (record) {
    if (this._data.indexOf(record) >= 0) {
      return false
    }
    return this._data.filter(function (rec) {
      return rec.checksum === record.checksum
    }).length > 0
  }

  /**
   * @method listen
   * Listen to a specific record's events and respond.
   * @param {NGN.DATA.Model} record
   * The record to listen to.
   * @fires record.update
   * Fired when a record is updated. The #record is passed as an argument to
   * the event handler.
   * @private
   */
  listen (record) {
    record.on('field.update', delta => {
      this.updateIndice(delta.field, delta.old, delta.new, this._data.indexOf(record))
      this.emit('record.update', record, delta)
    })

    record.on('field.delete', delta => {
      this.updateIndice(delta.field, delta.old, undefined, this._data.indexOf(record))
      this.emit('record.update', record, delta)
    })

    record.on('field.invalid', () => {
      this.emit('record.invalid', record)
    })

    record.on('field.valid', () => {
      this.emit('record.valid', record)
    })

    record.on('expired', () => {
      if (!record.expired) {
        return
      }

      this.emit('record.expired', record)

      if (this.autoRemoveExpiredRecords) {
        const index = this.indexOf(record)
        if (index >= 0) {
          this.remove(record)
        }
      }
    })

    // record.on('append.changelog', (delta) => {
    //   this.changelog.push(delta)
    // })
    //
    // record.on('remove.changelog', (idList) => {
    //   this.changelog = this.changelog.filter((item) => {
    //     return idList.indexOf(item.id) < 0
    //   })
    // })
  }

  /**
   * @method bulk
   * Bulk load data.
   * @param {string} eventName
   * @param {array} data
   * @private
   */
  bulk (event, data) {
    this._loading = true

    data.forEach(record => {
      this.add(record, true)
    })

    this._loading = false
    this._deleted = []
    this._created = []

    // Slight delay to prevent faster systems from
    // responding before data is written to memory.
    if (event !== null) {
      setTimeout(() => {
        this.emit(event || 'load')
      }, 100)
    }
  }

  /**
   * @method load
   * Bulk load data. This acts the same as adding records,
   * but it suppresses individual record creation events.
   * This will add data to the existing collection. If you
   * want to load fresh data, use the #reload method.
   * @param {array} data
   * An array of data. Each array element should be an
   * NGN.DATA.Model or a JSON object that can be applied
   * to the store's #model.
   */
  load () {
    let array = Array.isArray(arguments[0]) ? arguments[0] : NGN.slice(arguments)
    this.bulk('load', array)
  }

  /**
   * @method reload
   * Reload data. This is the same as running #clear followed
   * by #load.
   */
  reload (data) {
    this.clear()
    let array = Array.isArray(arguments[0]) ? arguments[0] : NGN.slice(arguments)
    this.bulk('reload', array)
  }

  /**
   * @method indexOf
   * Find the index number of a record within the collection.
   * @param  {NGN.DATA.Model} record
   * The record whose index should be identified.
   * @return {Number}
   * Returns a number from `0-collection length`. Returns `-1` if
   * the record is not found in the collection.
   */
  indexOf (record) {
    if (typeof record !== 'object' || (!(record instanceof NGN.DATA.Entity) && !record.checksum)) {
      return -1
    }

    return this._data.findIndex(function (el) {
      return el.checksum === record.checksum
    })
  }

  /**
   * @method contains
   * A convenience method that indicates whether a record is in
   * the store or not.
   * @param {NGN.DATA.Model} record
   * The record to check for inclusion in the data collection.
   * @return {Boolean}
   */
  contains (record) {
    return this.indexOf(record) >= 0
  }

  /**
   * @method remove
   * Remove a record.
   * @param {NGN.DATA.Model|object|number} data
   * Accepts an existing NGN Data Model, JSON object,
   * or index number. Using a JSON object is slower
   * than using a reference to a data model or an index
   * number (index is fastest).
   * @fires record.delete
   * The record delete event sends 2 arguments to handler methods:
   * `record` and `index`. The record refers to the model that was
   * removed. The `index` refers to the position of the record within
   * the store's data list. **NOTICE** the `index` refers to where
   * the record _used to be_.
   * @returns {NGN.DATA.Model}
   * Returns the data model that was just removed. If a model
   * is unavailable (i.e. remove didn't find the specified record),
   * this will return `null`.
   */
  remove (data, suppressEvents) {
    let removedRecord = []
    let dataIndex

    // Prevent removal if it will exceed minimum record count.
    if (this.minRecords > 0 && this._data.length - 1 < this.minRecords) {
      throw new Error('Minimum record count not met.')
    }

    if (typeof data === 'number') {
      dataIndex = data
    } else if (data && data.checksum && data.checksum !== null || data instanceof NGN.DATA.Model) {
      dataIndex = this.indexOf(data)
    } else {
      let m = new this.model(data, true) // eslint-disable-line new-cap
      dataIndex = this._data.findIndex(function (el) {
        return el.checksum === m.checksum
      })
    }

    // If no record is found, the operation fails.
    if (dataIndex < 0) {
      throw new Error('Record removal failed (record not found at index ' + (dataIndex || '').toString() + ').')
    }

    this._data[dataIndex].isDestroyed = true

    removedRecord = this._data.splice(dataIndex, 1)

    removedRecord.isDestroyed = true

    if (removedRecord.length > 0) {
      removedRecord = removedRecord[0]
      this.unapplyIndices(dataIndex)

      if (this.softDelete) {
        if (this.softDeleteTtl >= 0) {
          const checksum = removedRecord.checksum
          removedRecord.once('expired', () => {
            this.purgeDeletedRecord(checksum)
          })

          removedRecord.expires = this.softDeleteTtl
        }

        this._softarchive.push(removedRecord)
      }

      if (!this._loading) {
        let i = this._created.indexOf(removedRecord)
        if (i >= 0) {
          i >= 0 && this._created.splice(i, 1)
        } else if (this._deleted.indexOf(removedRecord) < 0) {
          this._deleted.push(removedRecord)
        }
      }

      if (!NGN.coalesce(suppressEvents, false)) {
        this.emit('record.delete', removedRecord, dataIndex)
      }

      return removedRecord
    }

    return null
  }

  /**
   * @method findArchivedRecord
   * Retrieve an archived record.
   * @param  {string} checksum
   * Checksum of the record.
   * @return {object}
   * Returns the archived record and it's index within the deletion archive.
   * ```js
   * {
   *   index: <number>,
   *   record: <NGN.DATA.Model>
   * }
   * ```
   * @private
   */
  findArchivedRecord (checksum) {
    let index
    let record = this._softarchive.filter((record, i) => {
      if (record.checksum === checksum) {
        index = i
        return true
      }
    })

    if (record.length !== 1) {
      let source
      try {
        source = NGN.stack.pop().path
      } catch (e) {
        source = 'Unknown'
      }

      console.warn('Cannot purge record. %c' + record.length + ' records found%c. Source: %c' + source, NGN.css, '', NGN.css)
      return null
    }

    return {
      index: index,
      record: record[0]
    }
  }

  /**
   * @method purgeDeletedRecord
   * Remove a soft-deleted record from the store permanently.
   * This cannot be undone, and there are no events for this action.
   * @param  {string} checksum
   * Checksum of the record.
   * @return {NGN.DATA.Model}
   * Returns the purged record. This will be `null` if the record cannot be
   * found or does not exist.
   * @fires {NGN.DATA.Model} record.purged
   * This event is triggered when a record is removed from the soft-delete
   * archive.
   * @private
   */
  purgeDeletedRecord (checksum) {
    const purgedRecord = this.findArchivedRecord(checksum)

    // If there is no record, abort (the findArchivedRecord emits a warning)
    if (purgedRecord === null) {
      return null
    }

    this._softarchive.splice(purgedRecord.index, 1)

    this.emit('record.purged', purgedRecord.record)

    return purgedRecord.record
  }

  /**
   * @method restore
   * Restore a soft-deleted record to the store. This does not preserve the
   * original index (a new index number is assigned).
   * @param  {string} checksum
   * Checksum of the record.
   * @return {NGN.DATA.Model}
   * Returns the purged record. This will be `null` if the record cannot be
   * found or does not exist.
   * @fires record.restored
   */
  restore (checksum) {
    const purgedRecord = this.findArchivedRecord(checksum)

    // If there is no record, abort (the findArchivedRecord emits a warning)
    if (purgedRecord === null) {
      return null
    }

    purgedRecord.record.removeAllListeners('expired')
    purgedRecord.record.expires = this.softDeleteTtl

    this.add(purgedRecord.record, true)

    this._softarchive[purgedRecord.index].removeAllListeners('expired')
    this._softarchive.splice(purgedRecord.index, 1)

    purgedRecord.record.isDestroyed = false

    this.emit('record.restored', purgedRecord.record)

    return purgedRecord.record
  }

  /**
   * @method clear
   * Removes all data.
   * @param {boolean} [purgeSoftDelete=true]
   * Purge soft deleted records from memory.
   * @fires clear
   * Fired when all data is removed
   */
  clear (purge = true) {
    if (!purge) {
      this._softarchive = this._data
    } else {
      this._softarchive = []
    }

    this._data = []

    Object.keys(this._index).forEach(index => {
      this._index[index] = []
    })

    this.emit('clear')
  }

  /**
   * @method find
   * Retrieve a specific record or set of records.
   * @param {number|function|string|object} [query=null]
   * When this is set to a `number`, the corresponding zero-based
   * record will be returned. A `function` can also be used, which
   * acts like a filter. Each record is passed to this function.
   *
   * For example, if we want to find all administrators within a
   * set of users, the following could be used:
   *
   * ```js
   *   let record = MyStore.find(function (record) {
   *     return record.usertype = 'admin'
   *   })
   * ```
   *
   * It's also possible to supply a String. When this is supplied,
   * the store will look for a record whose ID (see NGN.DATA.Model#idAttribute)
   * matches the string. Numberic ID's are matched on their string
   * equivalent for search purposes (data is not modified).
   *
   * An object can be used to search for specific field values. For example:
   *
   * ```js
   * MyStore.find({
   *   firstname: 'Corey',
   *   lastname: /Butler|Doe/
   * })
   * ```
   *
   * The code above will find everyone named Corey Butler or Corey Doe. The
   * first attribute must match the value exactly whereas `lastname` will
   * match against the regular expression.
   *
   * If this parameter is `undefined` or `null`, all records will be
   * returned (i.e. no search criteria specified, so return everything).
   *
   * If you're using a large dataset, indexing can speed up queries. To take
   * full advantage of indexing, all of the query elements should be indexed.
   * For example, if you have `lastname`, 'firstname' in your query and
   * both of those are indexed, the response time will be substantially faster
   * than if they're not (in large data sets). However; if one of those
   * elements is _not_ indexed, performance may not increase.
   * @param {boolean} [ignoreFilters=false]
   * Set this to `true` to search the full unfiltered record set.
   * @return {NGN.DATA.Model|array|null}
   * An array is returned when a function is specified for the query.
   * Otherwise the specific record is return. This method assumes
   * records have unique ID's.
   */
  find (query, ignoreFilters) {
    if (this._data.length === 0) {
      return []
    }

    let resultSet = []

    switch (typeof query) {
      case 'function':
        resultSet = this._data.filter(query)
        break
      case 'number':
        resultSet = (query < 0 || query >= this._data.length) ? null : this._data[query]
        break
      case 'string':
        let indice = this.getIndices(this._data[0].idAttribute, query.trim())
        if (indice !== null && indice.length > 0) {
          indice.forEach(index => {
            resultSet.push(this._data[index])
          })
          return resultSet
        }

        let recordSet = this._data.filter(function (record) {
          return (record[record.idAttribute] || '').toString().trim() === query.trim()
        })

        resultSet = recordSet.length === 0 ? null : recordSet[0]

        break
      case 'object':
        if (query instanceof NGN.DATA.Model) {
          if (this.contains(query)) {
            return query
          }

          return null
        }

        let match = []
        let noindex = []
        let queryKeys = Object.keys(query)

        queryKeys.forEach(field => {
          let index = this.getIndices(field, query[field])

          if (index) {
            match = match.concat(index || [])
          } else {
            field !== null && noindex.push(field)
          }
        })

        // Deduplicate
        match.filter(function (index, i) {
          return match.indexOf(index) === i
        })

        // Get non-indexed matches
        if (noindex.length > 0) {
          resultSet = this._data.filter(function (record, i) {
            if (match.indexOf(i) >= 0) {
              return false
            }

            for (let x = 0; x < noindex.length; x++) {
              if (record[noindex[x]] !== query[noindex[x]]) {
                return false
              }
            }

            return true
          })
        }

        // If a combined indexable + nonindexable query
        resultSet = resultSet.concat(match.map(index => {
          return this._data[index]
        })).filter(function (record) {
          for (let y = 0; y < queryKeys.length; y++) {
            if (query[queryKeys[y]] !== record[queryKeys[y]]) {
              return false
            }
          }

          return true
        })
        break
      default:
        resultSet = this._data
    }

    if (resultSet === null) {
      return null
    }

    if (!NGN.coalesce(ignoreFilters, false)) {
      this.applyFilters(resultSet instanceof Array ? resultSet : [resultSet])
    }

    return resultSet
  }

  /**
   * @method applyFilters
   * Apply filters to a data set.
   * @param {array} data
   * The array of data to apply filters to.
   * @private
   */
  applyFilters (data) {
    if (this._filters.length === 0) {
      return data
    }

    this._filters.forEach(function (filter) {
      data = data.filter(filter)
    })

    return data
  }

  /**
   * @method addFilter
   * Add a filter to the record set.
   * @param {function} fn
   * The filter function. This function should comply
   * with the [Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) specification,
   * returning a boolean value.
   * The item passed to the filter will be the NGN.DATA.Model specified
   * in the cfg#model.
   * @fires filter.create
   * Fired when a filter is created.
   */
  addFilter (fn) {
    this._filters.push(fn)
    this.emit('filter.create', fn)
  }

  /**
   * @method removeFilter
   * Remove a filter from the record set.
   * @param {function|index} filter
   * This can be the function which was originally passed to
   * the #addFilter method, or the zero-based #filters index
   * @param {boolean} [suppressEvents=false]
   * Prevent events from firing one the creation of the filter.
   * @fires filter.delete
   * Fired when a filter is removed.
   */
  removeFilter (fn, suppressEvents) {
    suppressEvents = NGN.coalesce(suppressEvents, false)

    let removed = []

    if (typeof fn === 'number') {
      removed = this._filters.splice(fn, 1)
    } else {
      removed = this._filters.splice(this._filters.indexOf(fn), 1)
    }

    if (removed.length > 0 && !suppressEvents) {
      this.emit('filter.delete', removed[0])
    }
  }

  /**
   * @method clearFilters
   * Remove all filters.
   * @param {boolean} [suppressEvents=false]
   * Prevent events from firing one the removal of each filter.
   */
  clearFilters (suppressEvents) {
    suppressEvents = NGN.coalesce(suppressEvents, false)

    if (suppressEvents) {
      this._filters = []
      return
    }

    while (this._filters.length > 0) {
      this.emit('filter.delete', this._filters.pop())
    }
  }

  /**
   * @method deduplicate
   * Deduplicates the recordset. This compares the checksum of
   * each of the records to each other and removes duplicates.
   * This suppresses the removal
   * @param {boolean} [suppressEvents=true]
   * Suppress the event that gets fired when a record is removed.
   */
  deduplicate (suppressEvents) {
    suppressEvents = NGN.coalesce(suppressEvents, true)

    let records = this.data.map(function (rec) {
      return JSON.stringify(rec)
    })

    let dupes = []

    records.forEach((record, i) => {
      if (records.indexOf(record) < i) {
        dupes.push(this.find(i))
      }
    })

    dupes.forEach(duplicate => {
      this.remove(duplicate)
    })
  }

  /**
   * @method sort
   * Sort the #records. This forces a #reindex, which may potentially be
   * an expensive operation on large data sets.
   * @param {function|object} sorter
   * Using a function is exactly the same as using the
   * [Array.sort()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FArray%2Fsort) method
   * (this is the compare function). The arguments passed to the
   * method are NGN.DATA.Model objects.
   * Alternatively, it is possible to sort by one or more model
   * attributes. Each attribute For example:
   *
   * ```js
   * let Person = new NGN.DATA.Model({
   *   fields: {
   *     fname: null,
   *     lname: null
   *   }
   * })
   *
   * let People = new NGN.DATA.Store({
   *   model: Person
   * })
   *
   * People.add({
   *   fname: 'John',
   *   lname: 'Doe',
   *   age: 37
   * }, {
   *   fname: 'Jane',
   *   lname: 'Doe',
   *   age: 36
   * }, {
   *   fname: 'Jane',
   *   lname: 'Vaughn',
   *   age: 42
   * })
   *
   * People.sort({
   *   lname: 'asc',  // Sort by last name in normal alphabetical order.
   *   age: 'desc'    // Sort by age, oldest to youngest.
   * })
   *
   * People.records.forEach(function (p) {
   *   console.log(fname, lname, age)
   * })
   *
   * // DISPLAYS
   * // John Doe 37
   * // Jane Doe 36
   * // Jane Vaughn 42
   *
   * People.sort({
   *   age: 'desc',  // Sort by age, oldest to youngest.
   *   lname: 'asc'  // Sort by name in normal alphabetical order.
   * })
   *
   * People.records.forEach(function (p) {
   *   console.log(fname, lname, age)
   * })
   *
   * // DISPLAYS
   * // Jane Vaughn 42
   * // John Doe 37
   * // Jane Doe 36
   * ```
   *
   * It is also posible to provide complex sorters. For example:
   *
   * ```js
   * People.sort({
   *   lname: 'asc',
   *   age: function (a, b) {
   *     if (a.age < 40) {
   *       return 1
   *     }
   *     return a.age < b.age
   *   }
   * })
   * ```
   *
   * The sorter above says "sort alphabetically by last name,
   * then by age where anyone under 40yrs old shows up before
   * everyone else, but sort the remainder ages in descending order.
   */
  sort (fn) {
    if (typeof fn === 'function') {
      this.records.sort(fn)
    } else if (typeof fn === 'object') {
      let functionKeys = Object.keys(fn)

      this._data.sort(function (a, b) {
        for (let i = 0; i < functionKeys.length; i++) {
          // Make sure both objects have the same sorting key
          if (a.hasOwnProperty(functionKeys[i]) && !b.hasOwnProperty(functionKeys[i])) {
            return 1
          }

          if (!a.hasOwnProperty(functionKeys[i]) && b.hasOwnProperty(functionKeys[i])) {
            return -1
          }

          // For objects who have the key, sort in the order defined in object.
          if (a[functionKeys[i]] !== b[functionKeys[i]]) {
            switch (fn[functionKeys[i]].toString().trim().toLowerCase()) {
              case 'asc':
                if (typeof a.fields[functionKeys[i]] === 'string') {
                  return a[functionKeys[i]].localeCompare(b[functionKeys[i]])
                }

                return a[functionKeys[i]] > b[functionKeys[i]] ? 1 : -1

              case 'desc':
                return a[functionKeys[i]] < b[functionKeys[i]] ? 1 : -1

              default:
                if (typeof fn[functionKeys[i]] === 'function') {
                  return fn[functionKeys[i]](a, b)
                }
                
                return 0
            }
          }
        }

        // Everything is equal
        return 0
      })
    }
    this.reindex()
  }

  /**
   * @method createIndex
   * Add a simple index to the recordset.
   * @param {string} datafield
   * The #model data field to index.
   * @param {boolean} [suppressEvents=false]
   * Prevent events from firing on the creation of the index.
   * @fires index.create
   * Fired when an index is created. The datafield name and
   * store are supplied as an argument to event handlers.
   */
  createIndex (field, suppressEvents) {
    if (!this.model.hasOwnProperty(field)) {
      console.warn('The store\'s model does not contain a data field called %c' + field + '%c.', NGN.css, '')
    }

    let exists = this._index.hasOwnProperty(field)

    this._index[field] = this._index[field] || []
    if (!NGN.coalesce(suppressEvents, false) && !exists) {
      this.emit('index.created', {
        field: field,
        store: this
      })
    }
  }

  /**
   * @method deleteIndex
   * Remove an index.
   * @param {string} datafield
   * The #model data field to stop indexing.
   * @param {boolean} [suppressEvents=false]
   * Prevent events from firing on the removal of the index.
   * @fires index.delete
   * Fired when an index is deleted. The datafield name and
   * store are supplied as an argument to event handlers.
   */
  deleteIndex (field, suppressEvents) {
    if (this._index.hasOwnProperty(field)) {
      delete this._index[field]

      if (!NGN.coalesce(suppressEvents, false)) {
        this.emit('index.created', {
          field: field,
          store: this
        })
      }
    }
  }

  /**
   * @method clearIndices
   * Clear all indices from the indexes.
   */
  clearIndices () {
    Object.keys(this._index).forEach(key => {
      this._index[key] = []
    })
  }

  /**
   * @method deleteIndexes
   * Remove all indexes.
   * @param {boolean} [suppressEvents=true]
   * Prevent events from firing on the removal of each index.
   */
  deleteIndexes (suppressEvents) {
    suppressEvents = NGN.coalesce(suppressEvents, true)

    Object.keys(this._index).forEach(key => {
      this.deleteIndex(key, suppressEvents)
    })
  }

  /**
   * @method applyIndices
   * Apply the values to the index.
   * @param {NGN.DATA.Model} record
   * The record which should be applied to the index.
   * @param {number} number
   * The record index number.
   * @private
   */
  applyIndices (record, number) {
    let indexes = Object.keys(this._index)

    if (indexes.length === 0) {
      return
    }

    indexes.forEach(field => {
      if (record.hasOwnProperty(field)) {
        let values = this._index[field]

        // Check existing records for similar values
        for (let i = 0; i < values.length; i++) {
          if (values[i][0] === record[field]) {
            this._index[field][i].push(number)
            return
          }
        }

        // No matching words, create a new one.
        this._index[field].push([record[field], number])
      }
    })
  }

  /**
   * @method unapplyIndices
   * This removes a record from all relevant indexes simultaneously.
   * Commonly used when removing a record from the store.
   * @param  {number} indexNumber
   * The record index.
   * @private
   */
  unapplyIndices (num) {
    Object.keys(this._index).forEach(field => {
      const i = this._index[field].indexOf(num)
      if (i >= 0) {
        this._index[field].splice(i, 1)
      }
    })
  }

  /**
   * @method updateIndice
   * Update the index with new values.
   * @param  {string} fieldname
   * The name of the indexed field.
   * @param  {any} oldValue
   * The original value. This is used to remove the old value from the index.
   * @param  {any} newValue
   * The new value.
   * @param  {number} indexNumber
   * The number of the record index.
   * @private
   */
  updateIndice (field, oldValue, newValue, num) {
    if (!this._index.hasOwnProperty(field) || oldValue === newValue) {
      return
    }

    let ct = 0

    for (let i = 0; i < this._index[field].length; i++) {
      let value = this._index[field][i][0]

      if (value === oldValue) {
        this._index[field][i].splice(this._index[field][i].indexOf(num), 1)
        ct++
      } else if (newValue === undefined) {
        // If thr new value is undefined, the field was removed for the record.
        // This can be skipped.
        ct++
      } else if (value === newValue) {
        this._index[field][i].push(num)
        this._index[field][i].shift()
        this._index[field][i].sort()
        this._index[field][i].unshift(value)
        ct++
      }

      if (ct === 2) {
        return
      }
    }
  }

  /**
   * @method getIndices
   * Retrieve a list of index numbers pertaining to a field value.
   * @param  {string} field
   * Name of the data field.
   * @param  {any} value
   * The value of the index to match against.
   * @return {array}
   * Returns an array of integers representing the index where the
   * values exist in the record set.
   */
  getIndices (field, value) {
    if (!this._index.hasOwnProperty(field)) {
      return null
    }

    let indexes = this._index[field].filter(function (dataArray) {
      return dataArray.length > 0 && dataArray[0] === value
    })

    if (indexes.length === 1) {
      indexes[0].shift()
      return indexes[0]
    }

    return []
  }

  /**
   * @method move
   * Move an existing record to a specific index. This can be used
   * to reorder a single record.
   * @param {NGN.DATA.Model|number|string} source
   * The record or the index of a record within the store to move.
   * This can also be the unique ID of a record.
   * @param {NGN.DATA.Model|number|string} target
   * The record or the index of a record within the store where the source
   * will be positioned against. This can also be the unique ID of a record.
   * @param {boolean} [suppressEvent=false]
   * Set this to `true` to prevent the `record.create` event
   * from firing.
   */
  move (source, target, suppressEvent = false) {
    if (source === undefined) {
      console.warn('Cannot move record. No source specified.')
      return
    }

    if (target === undefined) {
      console.warn('Cannot move record. No target specified.')
      return
    }

    source = this.getRecordIndex(source)
    target = this.getRecordIndex(target)

    // If the positins haven't actually changed, stop processing.
    if (source === target) {
      return
    }

    this._data.splice(target, 0, this._data.splice(source, 1)[0])

    if (!suppressEvent) {
      this.emit('record.move', {
        oldIndex: source,
        newIndex: target,
        record: this._data[target]
      })
    }

    this.reindex()
  }

  /**
   * @method getRecordIndex
   * Returns the index of a record using sanitize input.
   * @param  {NGN.DATA.Model|number|String} value
   * The record or the index of a record within the store.
   * This can also be the unique ID of a record.
   * @return {NGN.DATA.Model}
   * Returns the model or `null`
   */
  getRecordIndex (value) {
    if (value === undefined) {
      console.warn('No argument passed to getRecordIndex().')
      return null
    }

    if (typeof value === 'number') {
      if (value < 0 || value >= this._data.length) {
        console.warn('%c' + value + '%c out of bounds.', NGN.css, '')
        return null
      }

      return value
    } else if (typeof value === 'string') {
      let id = value

      value = this.find(id)

      if (!value) {
        console.warn('%c' + id + '%c does not exist or cannot be found in the store.', NGN.css, '')
        return null
      }
    }

    return this.indexOf(value)
  }

  /**
   * @method reindex
   * Reindex the entire record set. This can be expensive operation.
   * Use with caution.
   * @private
   */
  reindex () {
    this.clearIndices()
    this._data.forEach((record, index) => {
      this.applyIndices(record, index)
    })
  }

  /**
   * @method snapshot
   * Add a snapshot of the current store to the #snapshot archive.
   * This can potentially be a computationally/memory-expensive operation.
   * The method creates a copy of all data in the store along with checksums
   * of each element and holds the snapshot in RAM. Large stores may consume
   * large amounts of RAM until the snapshots are released/cleared.
   * Snapshots are most commonly used with data proxies to calculate
   * differences in a data set before persisting them to a database.
   * @returns {object}
   * Returns an object containing the following fields:
   *
   * ```js
   * {
   *   timestamp: 'ex: 2017-01-19T16:43:03.279Z',
   *   checksum: 'snapshotchecksum',
   *   modelChecksums: [
   *     'record1_checksum',
   *     'record2_checksum'
   *   ],
   *   data: { ... } // Actual data at the time of the snapshot
   * }
   * ```
   */
  snapshot () {
    this.snapshotarchive = NGN.coalesce(this.snapshotarchive, [])

    let dataset = {
      timestamp: (new Date()).toJSON(),
      checksum: NGN.DATA.util.checksum(JSON.stringify(this.data)).toString(),
      modelChecksums: this.data.map((item) => {
        return NGN.DATA.util.checksum(JSON.stringify(item)).toString()
      }),
      data: this.data
    }

    this.snapshotarchive.unshift(dataset)
    this.emit('snapshot', dataset)

    return dataset
  }

  /**
   * @method clearSnapshots
   * Remove all archived snapshots.
   */
  clearSnapshots () {
    this.snapshotarchive = null
  }
}

/**
 * indexes
 * An index consists of an object whose key is name of the
 * data field being indexed. The value is an array of record values
 * and their corresponding index numbers. For example:
 *
 * ```js
 * {
 *   "lastname": [["Butler", 0, 1, 3], ["Doe", 2, 4]]
 * }
 * ```
 * The above example indicates the store has two unique `lastname`
 * values, "Butler" and "Doe". Records containing a `lastname` of
 * "Butler" exist in the record store as the first, 2nd, and 4th
 * records. Records with the last name "Doe" are 3rd and 5th.
 * Remember indexes are zero based since records are stored as an
 * array.
 */

NGN.DATA.Store = NgnDataStore
