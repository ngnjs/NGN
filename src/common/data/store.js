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
 * @fires record.update
 * Fired when a record(s) is modified. A change object
 * is provided as an argument to event handlers. The object
 * contains a reference to the store, the old record, and
 * the new record.
 *
 * ```
 * {
 *   store: <current data store>,
 *   new: <NGN.DATA.Model>,
 *   old: <NGN.DATA.Model>
 * }
 * ```
 */
class NGNDataStore extends NGN.EventEmitter { // eslint-disable-line
  constructor (cfg = {}) {
    if (NGN.typeof(cfg) === 'model') {
      cfg = { model: cfg }
    } else if (!cfg.model || NGN.typeof(cfg.model) !== 'model') {
      throw new InvalidConfigurationError('Missing or invalid "model" configuration property.')
    }

    super()

    const me = this

    Object.defineProperties(this, {
      /**
       * @cfgproperty {string} [name]
       * A descriptive name for the store. This is typically used for
       * debugging, logging, and (somtimes) data proxies.
       */
      name: NGN.const(NGN.coalesce(cfg.name, 'Untitled Data Store')),

      METADATA: NGN.private({
        // Holds the models/records
        records: [],

        /**
         * @cfgproperty {NGN.DATA.Model} model
         * An NGN Data Model to which data records conform.
         */
        Model: NGN.coalesce(cfg.model),

        /**
         * @cfg {boolean} [allowDuplicates=true]
         * Set to `false` to prevent duplicate records from being added.
         * If a duplicate record is added, it will be ignored and an
         * error will be thrown.
         *
         * **Identifying duplicates _may_ be slow** on data sets with 200+ records.
         * Uniqueness is determined by a checksum of the current NGN.DATA.Model#data
         * of a record. The amount of time required to generate a checksum can range
         * from 3ms to 150ms per record depending on data complexity.
         *
         * In most scenarios, the performance impact will be negligible/indistinguishable
         * to the naked eye. However; if an application experiences slow data
         * load or processing times, setting this to `false` may help.
         */
        allowDuplicates: NGN.coalesce(cfg.allowDuplicates, true),

        /**
         * @cfg {boolean} [errorOnDuplicate=false]
         * Set to `true` to throw an error when a duplicate record is detected.
         * If this is not set, it will default to the value of #allowDuplicates.
         * If #allowDuplicates is not defined either, this will be `true`
         */
        errorOnDuplicate: NGN.coalesce(cfg.errorOnDuplicate, cfg.allowDuplicates, false),

        /**
         * @cfg {boolean} [allowInvalid=true]
         * Allow invalid records to be added to the store.
         */
        allowInvalid: NGN.coalesce(cfg.allowInvalid, true),

        /**
         * @cfg {boolean} [errorOnInvalid=false]
         * Set to `true` to throw an error when an attempt is made to add an
         * invalid record.
         */
        errorOnInvalid: NGN.coalesce(cfg.errorOnInvalid, cfg.allowInvalid, false),

        /**
         * @cfgproperty {boolean} [autoRemoveExpiredRecords=true]
         * When set to `true`, the store will automatically delete expired records.
         */
        autoRemoveExpiredRecords: NGN.coalesce(cfg.autoRemoveExpiredRecords, true),

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
        softDelete: NGN.coalesce(cfg.softDelete, false),

        /**
         * @cfg {number} [softDeleteTtl=-1]
         * This is the number of milliseconds the store waits before purging a
         * soft-deleted record from memory. `-1` = Infinite (no TTL).
         */
        softDeleteTtl: NGN.coalesce(cfg.softDeleteTtl, -1),

        // ARCHIVE contains soft deleted records

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
        fifo: NGN.coalesce(cfg.FIFO, -1),

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
        lifo: NGN.coalesce(cfg.LIFO, -1),

        /**
         * @cfg {Number} [maxRecords=-1]
         * Setting this will prevent new records from being added past this limit.
         * Attempting to add a record to the store beyond it's maximum will throw
         * an error.
         */
        maxRecords: NGN.coalesce(cfg.maxRecords, -1),

        /**
         * @cfg {Number} [minRecords=0]
         * Setting this will prevent removal of records if the removal would
         * decrease the count below this limit.
         * Attempting to remove a record below the store's minimum will throw
         * an error.
         */
        minRecords: NGN.coalesce(cfg.minRecords, 0),

        /**
         * @cfgproperty {object} fieldmap
         * An object mapping model attribute names to data storage field names.
         *
         * _Example_
         * ```
         * {
         *   ModelFieldName: 'inputName',
         *   father: 'dad',
         *   email: 'eml',
         *   image: 'img',
         *   displayName: 'dn',
         *   firstName: 'gn',
         *   lastName: 'sn',
         *   middleName: 'mn',
         *   gender: 'sex',
         *   dob: 'bd'
         * }
         * ```
         */
        MAP: NGN.coalesce(cfg.fieldmap),

        EVENTS: new Set([
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
        ]),

        /**
         * @cfg {boolean} [audit=false]
         * Enable auditing to support #undo/#redo operations. This creates and
         * manages a NGN.DATA.TransactionLog.
         */
        AUDITABLE: NGN.coalesce(cfg.audit, false),
        AUDITLOG: NGN.coalesce(cfg.audit, false) ? new NGN.DATA.TransactionLog() : null,
        AUDIT_HANDLER: (change) => {
          if (change.hasOwnProperty('cursor')) {
            this.METADATA.AUDITLOG.commit(this.METADATA.getAuditMap())
          }
        },

        // The first and last indexes are maintained to determine which active
        // record is considered first/last. Sometimes data is filtered out,
        // so the first/last active record is not guaranteed to represent the
        // first/last actual record. These indexes are maintained to prevent
        // unnecessary iteration in large data sets.
        FIRSTRECORDINDEX: 0,
        LASTRECORDINDEX: 0,

        /**
         * @cfg {array} [index]
         * An array of #model fields that will be indexed.
         * See NGN.DATA.Index for details.
         */
        INDEX: null
      }),

      // Internal attributes that should not be extended.
      PRIVATE: NGN.privateconst({
        // A private indexing method
        INDEX: function (record, delta) {
          if (typeof this.event === 'symbol') {
            switch (this.event) {
              case me.PRIVATE.EVENT.CREATE_RECORD:
                me.METADATA.INDEXFIELDS.forEach(field => me.METADATA.INDEX[field].add(record[field], record.OID))
                break

              case me.PRIVATE.EVENT.DELETE_RECORD:
                me.METADATA.INDEXFIELDS.forEach(field => me.METADATA.INDEX[field].remove(record.OID, record[field]))
                break

              case me.PRIVATE.EVENT.LOAD_RECORDS:
                for (let i = 0; i < me.METADATA.records.length; i++) {
                  me.METADATA.INDEXFIELDS.forEach(field => me.METADATA.INDEX[field].add(me.METADATA.records[i][field], me.METADATA.records[i].OID))
                }

                break

              case me.PRIVATE.EVENT.DELETE_RECORD_FIELD:
                if (me.METADATA.INDEXFIELDS.has(record.field.name)) {
                  me.METADATA.INDEX[record.field.name].remove(record.record.OID, record.field.value)
                }

                break
            }
          } else {
            switch (this.event) {
              case 'record.update':
                if (me.METADATA.INDEXFIELDS.has(delta.field.name)) {
                  me.METADATA.INDEX[delta.field.name].update(record.OID, delta.old, delta.new)
                }
                break

              case 'clear':
                me.METADATA.INDEXFIELDS.forEach(field => me.METADATA.INDEX[field].reset())
                break
            }
          }
        },

        // Contains a map of all records
        RECORDMAP: new Map(),

        // A reference to active records
        ACTIVERECORDMAP: null,

        // A reference to filtered records (non-active/non-deleted)
        FILTEREDRECORDMAP: null,

        // Internal events
        EVENT: {
          CREATE_RECORD: Symbol('record.create'),
          DELETE_RECORD: Symbol('record.delete'),
          DELETE_RECORD_FIELD: Symbol('records.field.delete'),
          LOAD_RECORDS: Symbol('records.load')
        },

        // Makes sure the model configuration specifies a valid and indexable field.
        checkModelIndexField: (field) => {
          let metaconfig = this.METADATA.Model.prototype.CONFIGURATION

          if (metaconfig.fields && metaconfig.fields.hasOwnProperty(field)) {
            if (metaconfig.fields[field] !== null) {
              if (['model', 'store', 'entity', 'function'].indexOf(NGN.typeof(metaconfig.fields[field])) >= 0) {
                throw new Error(`Cannot create index for "${field}" field. Only basic NGN.DATA.Field types can be indexed. Relationship and virtual fields cannot be indexed.`)
              } else if (NGN.typeof(metaconfig.fields[field]) === 'object') {
                if (['model', 'store', 'entity', 'function'].indexOf(NGN.typeof(NGN.coalesce(metaconfig.fields[field].type))) >= 0) {
                  throw new Error(`Cannot create index for "${field}" field. Only basic NGN.DATA.Field types can be indexed. Relationship and virtual fields cannot be indexed.`)
                }
              }
            }
          } else {
            throw new Error(`Cannot create index for unrecognized field "${field}".`)
          }
        },

        // Get the type of field from the model definition
        getModelFieldType: (field) => {
          let metaconfig = this.METADATA.Model.prototype.CONFIGURATION

          if (metaconfig.fields[field] === null) {
            return NGN.typeof(metaconfig.fields[field])
          }

          if (metaconfig.fields[field].type) {
            return NGN.typeof(metaconfig.fields[field].type)
          }

          if (metaconfig.fields[field].default) {
            return NGN.typeof(metaconfig.fields[field].default)
          }

          return NGN.typeof(NGN.coalesce(metaconfig.fields[field]))
        }
      }),

      // Create a convenience alias to the remove method.
      delete: NGN.const(NGN.deprecate(this.remove, 'Store.delete is not a valid method. Use Store.remove instead.'))
    })

    // Create a smart reference to record lists
    Object.defineProperties(this.PRIVATE, {
      ACTIVERECORDS: NGN.get(() => {
        if (this.PRIVATE.ACTIVERECORDMAP === null) {
          return this.PRIVATE.RECORDMAP
        }

        return this.PRIVATE.ACTIVERECORDMAP
      }),

      FILTEREDRECORDS: NGN.get(() => {
        if (this.PRIVATE.FILTEREDRECORDMAP === null) {
          return this.PRIVATE.RECORDMAP
        }

        return this.PRIVATE.FILTEREDRECORDMAP
      })
    })

    // Disallow modification of internal events
    Object.freeze(this.PRIVATE.EVENT)

    // Support LIFO (Last In First Out) & FIFO(First In First Out)
    if (this.METADATA.lifo > 0 && this.METADATA.fifo > 0) {
      throw new InvalidConfigurationError('NGN.DATA.Store can be configured to use FIFO or LIFO, but not both simultaneously.')
    }

    // If LIFO/FIFO is used, disable alternative record count limitations.
    if (this.METADATA.lifo > 0 || this.METADATA.fifo > 0) {
      this.METADATA.minRecords = 0
      this.METADATA.maxRecords = -1
    } else {
      this.METADATA.minRecords = this.METADATA.minRecords < 0 ? 0 : this.METADATA.minRecords
    }

    // Bubble events to the BUS
    // this.relay('*', NGN.BUS, 'store.')

    // Configure Indices
    if (NGN.coalesce(cfg.index) && NGN.typeof(this.METADATA.Model.prototype.CONFIGURATION.fields) === 'object') {
      this.createIndex(cfg.index)
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

  // Deprecation notice
  get history () {
    NGN.WARN('history is deprecated. Use NGN.DATA.Store#changelog instead.')
    return this.changelog
  }

  // Deprecation notice
  get recordCount () {
    NGN.WARN('recordCount is deprecated. Use NGN.DATA.Store#size instead.')
    return this.size
  }

  /**
   * @property {number} count
   * The total number of **active** records contained in the store.
   * Active records are any records that aren't filtered out.
   */
  get size () {
    return this.PRIVATE.ACTIVERECORDS.size
  }

  /**
   * @property {number} length
   * The total number of records contained in the store.
   * This value does not include any soft-deleted/volatile records.
   */
  get length () {
    return this.METADATA.records.length
  }

  /**
   * @property {NGN.DATA.Model} first
   * Return the first active record in the store. Returns `null`
   * if the store is empty.
   */
  get first () {
    return NGN.coalesce(this.METADATA.records[this.METADATA.FIRSTRECORDINDEX])
  }

  /**
   * @property {NGN.DATA.Model} last
   * Return the last active record in the store. Returns `null`
   * if the store is empty.
   */
  get last () {
    return NGN.coalesce(this.METADATA.records[this.METADATA.LASTRECORDINDEX])
  }

  /**
   * @property {object} data
   * A serialized version of the data represented by the store. This
   * only includes non-virtual fields. See #representation to use
   * a representation of data containing virtual fields.
   */
  get data () {
    const result = []
    const recordList = this.PRIVATE.ACTIVERECORDS

    recordList.forEach(index => {
      if (this.METADATA.records[index] !== null) {
        result.push(this.METADATA.records[index].data)
      }
    })

    return result
  }

  /**
   * @property {array} representation
   * The complete and unfiltered underlying representation dataset
   * (data + virtuals of each model).
   */
  get representation () {
    const result = []
    const recordList = this.PRIVATE.ACTIVERECORDS

    recordList.forEach(index => {
      if (this.METADATA.records[index] !== null) {
        result.push(this.METADATA.records[index].representation)
      }
    })

    return result
  }

  get auditable () {
    return this.METADATA.AUDITABLE
  }

  set auditable (value) {
    value = NGN.forceBoolean(value)

    if (value !== this.METADATA.AUDITABLE) {
      this.METADATA.AUDITABLE = value
      this.METADATA.AUDITLOG = value ? new NGN.DATA.TransactionLog() : null
    }
  }

  get model () {
    return this.METADATA.Model
  }

  // set model (value) {
  //   if (value !== this.METADATA.Model) {
  //     if (NGN.typeof(value) !== 'model') {
  //       throw new InvalidConfigurationError(`"${this.name}" model could not be set because the value is a ${NGN.typeof(value)} type (requires NGN.DATA.Model).`)
  //     }
  //
  //     this.METADATA.Model = value
  //   }
  // }

  /**
   * @property {array} indexedFieldNames
   * An array of the field names for which the store maintains indexes.
   */
  get indexedFieldNames () {
    if (this.METADATA.INDEXFIELDS) {
      return Array.from(this.METADATA.INDEXFIELDS)
    } else {
      return []
    }
  }

  /**
   * @method add
   * Append a data record to the store. This adds the record to the end of the list.
   * @param {NGN.DATA.Model|object} data
   * Accepts an existing NGN Data Model or a JSON object.
   * If a JSON object is supplied, it will be applied to
   * the data model specified in #model.
   * @param {boolean} [suppressEvents=false]
   * Set this to `true` to prevent the `record.create` event
   * from firing.
   * @return {NGN.DATA.Model}
   * Returns the new record.
   */
  add (data, suppressEvents = false) {
    // Support array input
    if (NGN.typeof(data) === 'array') {
      let result = []

      for (let i = 0; i < data.length; i++) {
        result.push(this.add(data[i]))
      }

      return result
    }

    // Prevent creation if it will exceed maximum record count.
    if (this.METADATA.maxRecords > 0 && this.METADATA.records.length + 1 > this.METADATA.maxRecords) {
      throw new Error('Maximum record count exceeded.')
    }

    if (!(data instanceof this.METADATA.Model)) {
      // Force a data model
      if (NGN.typeof(data) === 'string') {
        data = JSON.parse(data)
      }

      if (typeof data !== 'object') {
        throw new Error(`${NGN.typeof(data)} is an invalid data type (must be an object conforming to the ${this.METADATA.Model.name} field configuration).`)
      }
    } else {
      data = data.data
    }

    const record = new this.METADATA.Model(data)

    if (!(record instanceof NGN.DATA.Entity)) {
      throw new Error(`Only a NGN.DATA.Model or JSON object may be used in NGN.DATA.Store#add. Received a "${NGN.typeof(data)}" value.`)
    }

    // Prevent invalid record addition (if configured)
    if (!this.METADATA.allowInvalid && !record.valid) {
      NGN.WARN(`An attempt to add invalid data to the "${this.name}" store was prevented. The following fields are invalid: ${Array.from(record.METADATA.invalidFieldNames.keys()).join(', ')}`)

      if (!suppressEvents) {
        this.emit('record.invalid', record)
      }

      if (this.METADATA.errorOnInvalid) {
        throw new Error(`Invalid data cannot be added to the "${this.name}" store.`)
      }
    }

    // If duplicates are prevented, check the new data.
    if (!this.METADATA.allowDuplicates) {
      for (let i = 0; i < this.METADATA.records.length; i++) {
        if (this.METADATA.records[i].checksum === record.checksum) {
          NGN.WARN(`An attempt to add a duplicate record to the "${this.name}" store was prevented.`)

          if (!suppressEvents) {
            this.emit('record.duplicate', record)
          }

          if (this.METADATA.errorOnDuplicate) {
            throw new Error(`Duplicate records are not allowed in the "${this.name}" data store.`)
          }

          break
        }
      }
    }

    // Handle special record count processing (LIFO/FIFO support)
    if (this.METADATA.lifo > 0 && this.METADATA.records.length + 1 > this.METADATA.lifo) {
      this.remove(this.METADATA.records.length - 1, suppressEvents)
    } else if (this.METADATA.fifo > 0 && this.METADATA.records.length + 1 > this.METADATA.fifo) {
      this.remove(0, suppressEvents)
    }

    // Relay model events to this store.
    // record.relay('*', this, 'record.')
    record.on('*', function () {
      switch (this.event) {
        // case 'field.update':
        // case 'field.delete':
        //   // TODO: Update indices
        //   return

        case 'field.invalid':
        case 'field.valid':
          return this.emit(this.event.replace('field.', 'record.'), record)

        case 'expired':
          // TODO: Handle expiration
      }
    })

    delete record.METADATA.store
    Object.defineProperty(record.METADATA, 'store', NGN.get(() => this))

    // Indexing is handled in an internal event handler
    this.METADATA.records.push(record)

    // Add the record to the map for efficient retrievel by OID
    this.PRIVATE.RECORDMAP.set(record.OID, this.METADATA.records.length - 1)

    // TODO: Apply filters to new record before identifying the last record.
    this.METADATA.LASTRECORDINDEX = this.METADATA.records.length - 1

    this.emit(this.PRIVATE.EVENT.CREATE_RECORD, record)

    if (!suppressEvents) {
      this.emit('record.create', record)
    }

    return record
  }

  /**
   * @method remove
   * Remove a record.
   * @param {NGN.DATA.Model|number|Symbol} record
   * Accepts an existing NGN Data Model or index number.
   * Using a model is slower than using an index number.
   * This may also be the NGN.DATA.Model#OID value (for
   * advanced use cases).
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
  remove (record, suppressEvents = false) {
    // Short-circuit processing if there are no records.
    if (this.METADATA.records.length === 0) {
      NGN.INFO(`Store.remove() called "${this.name}" store, which contains no records.`)
      return
    }

    // Support removal of simultaneously removing multiple records
    if (NGN.typeof(record) === 'array') {
      let result = []

      for (let i = 0; i < record.length; i++) {
        result.push(this.remove(record[i]))
      }

      return result
    }

    // Prevent removal if it will exceed minimum record count.
    if (this.minRecords > 0 && this.METADATA.records.length - 1 < this.minRecords) {
      throw new Error('Removing this record would violate the minimum record count.')
    }

    // Identify which record will be removed.
    let index

    switch (NGN.typeof(record)) {
      case 'number':
        if (record < 0) {
          NGN.ERROR(`Record removal failed (record not found at index ${(record || 'undefined').toString()}).`)
          return null
        }

        index = record

        break

      // The default case comes before the symbol case specifically
      // so the record can be converted to an OID value (for use with
      // the RECORDMAP lookup).
      default:
        if (!(record instanceof NGN.DATA.Entity)) {
          NGN.ERROR('Invalid record value passed to Store.remove() method.')
          return null
        }

        record = record.OID

      case 'symbol': // eslint-disable-line no-fallthrough
        index = this.PRIVATE.ACTIVERECORDS.get(record)

        if (!index) {
          NGN.ERROR(`Record removal failed. Record OID not found ("${record.toString()}").`)
          return null
        }

        break
    }

    // If nothing has been deleted yet, create an active record map.
    // The active record map contains Model OID values with a reference
    // to the actual record index.
    if (this.PRIVATE.ACTIVERECORDMAP === null) {
      // Copy the record map to initialize the active records
      this.PRIVATE.ACTIVERECORDMAP = new Map(this.PRIVATE.RECORDMAP)
    }

    // Identify the record to be removed.
    const removedRecord = this.METADATA.records[index]

    // If the record isn't among the active records, do not remove it.
    if (removedRecord === null) {
      NGN.WARN('Specified record does not exist.')
      return null
    }

    let activeIndex = this.PRIVATE.ACTIVERECORDS.get(removedRecord.OID)

    if (isNaN(activeIndex)) {
      NGN.WARN(`Record not found for "${removedRecord.OID.toString()}".`)
      return null
    }

    this.PRIVATE.ACTIVERECORDS.delete(removedRecord.OID)

    // If the store is configured to soft-delete,
    // don't actually remove it until it expires.
    if (this.METADATA.softDelete) {
      if (this.METADATA.softDeleteTtl >= 0) {
        removedRecord.once('expired', () => {
          this.METADATA.records[this.PRIVATE.RECORDMAP.get(removedRecord.OID)] = null
          this.PRIVATE.RECORDMAP.set(removedRecord.OID, null)

          if (!suppressEvents) {
            this.emit('record.purge', removedRecord)
          }
        })

        removedRecord.expires = this.METADATA.softDeleteTtl
      }
    } else {
      this.METADATA.records[this.PRIVATE.RECORDMAP.get(removedRecord.OID)] = null
      this.PRIVATE.RECORDMAP.set(removedRecord.OID, null)
    }

    // Update cursor indexes (to quickly reference first and last active records)
    if (this.METADATA.LASTRECORDINDEX === activeIndex) {
      if (this.PRIVATE.ACTIVERECORDS.size <= 1) {
        this.METADATA.LASTRECORDINDEX = this.PRIVATE.ACTIVERECORDS.values().next().value
        this.METADATA.FIRSTRECORDINDEX = this.METADATA.LASTRECORDINDEX
      } else if (activeIndex !== 0) {
        for (let i = (activeIndex - 1); i >= 0; i--) {
          if (i === 0) {
            this.METADATA.LASTRECORDINDEX = 0
            break
          }

          const examinedRecord = this.METADATA.records[i]

          if (examinedRecord !== null) {
            if (this.PRIVATE.ACTIVERECORDS.has(examinedRecord.OID)) {
              this.METADATA.LASTRECORDINDEX = this.PRIVATE.ACTIVERECORDS.get(examinedRecord.OID)
              break
            }
          }
        }
      }
    } else if (this.METADATA.FIRSTRECORDINDEX === activeIndex) {
      let totalSize = this.PRIVATE.ACTIVERECORDS.size

      for (let i = (activeIndex + 1); i < totalSize; i++) {
        const examinedRecord = this.METADATA.records[i]

        if (examinedRecord !== null) {
          if (this.PRIVATE.ACTIVERECORDS.has(examinedRecord.OID)) {
            this.METADATA.FIRSTRECORDINDEX = this.PRIVATE.ACTIVERECORDS.get(examinedRecord.OID)
            break
          }
        }
      }
    }

    this.emit(this.PRIVATE.EVENT.DELETE_RECORD, removedRecord)

    if (!suppressEvents) {
      this.emit('record.delete', removedRecord)
    }

    return removedRecord
  }

  /**
   * Create a new index on the store.
   * @param  {string} field
   * The name of the field to index.
   * @fires index.create
   * Triggered when an index is created. The name of field is passed
   * as the only argument.
   */
  createIndex (field) {
    // Support multiple indexes
    if (NGN.typeof(field) === 'array') {
      for (let i = 0; i < field.length; i++) {
        this.createIndex(field[i])
      }

      return
    }

    // Make sure index fields are known to the store
    if (!this.METADATA.INDEXFIELDS) {
      this.METADATA.INDEXFIELDS = new Set()

      // this.on('record.*', this.PRIVATE.INDEX)
      this.on([
        this.PRIVATE.EVENT.CREATE_RECORD,
        this.PRIVATE.EVENT.DELETE_RECORD,
        this.PRIVATE.EVENT.LOAD_RECORDS,
        this.PRIVATE.EVENT.DELETE_RECORD_FIELD
      ], this.PRIVATE.INDEX)
    }

    // In an index already exists, ignore it.
    if (this.METADATA.INDEXFIELDS.has(field)) {
      return
    }

    // Guarantee the existance of the index list
    this.METADATA.INDEX = NGN.coalesce(this.METADATA.INDEX, {})

    this.PRIVATE.checkModelIndexField(field)

    this.METADATA.INDEXFIELDS.add(field)

    // Identify BTree
    let btree = ['number', 'date'].indexOf(this.PRIVATE.getModelFieldType(field)) >= 0

    this.METADATA.INDEX[field] = new NGN.DATA.Index(btree, `${field.toUpperCase()} ${btree ? 'BTREE ' : ''}INDEX`)

    // Apply to any existing records
    if (this.METADATA.records.length > 0) {
      this.PRIVATE.INDEX.apply({ event: this.PRIVATE.EVENT.LOAD_RECORDS })
    }

    this.emit('index.created', field)
  }

  /**
   * Remove an existing index from the store.
   * @param  {string} [field=null]
   * The name of the indexed field. Set this to `null` (or leave blank) to
   * remove all existing indexes.
   * @fires index.delete
   * Triggered when an index is removed. The name of field is passed
   * as the only argument.
   */
  removeIndex (field = null) {
    if (!this.METADATA.INDEXFIELDS) {
      return
    }

    if (NGN.coalesce(field) === null) {
      field = this.indexedFieldNames
    }

    // Support multiple indexes
    if (NGN.typeof(field) === 'array') {
      for (let i = 0; i < field.length; i++) {
        this.removeIndex(field[i])
      }

      return
    }

    // Remove the specific index.
    this.METADATA.INDEXFIELDS.delete(field)
    delete this.METADATA.INDEX[field]
    this.emit('index.delete', field)

    // When there are no more indexes, clear out event
    // listeners and fields.
    if (this.METADATA.INDEXFIELDS.size === 0) {
      this.METADATA.INDEX = null
      delete this.METADATA.INDEXFIELDS

      this.off([
        this.PRIVATE.EVENT.CREATE_RECORD,
        this.PRIVATE.EVENT.DELETE_RECORD,
        this.PRIVATE.EVENT.LOAD_RECORDS,
        this.PRIVATE.EVENT.DELETE_RECORD_FIELD
      ], this.PRIVATE.INDEX)
    }
  }

  /**
   * Returns the index number of the model. If the same
   * model exists more than once (duplicate records), only
   * the first index is returned.
   * @param  {NGN.DATA.Model} model
   * The model/record to retrieve an index number for.
   * @return {number}
   * The zero-based index number of the model.
   */
  indexOf (record) {
    return this.PRIVATE.RECORDMAP.get(record.OID)
  }

  /**
   * Determine whether the store contains a record.
   * This only checks the active record set (ignores filtered records).
   * @param  {NGN.DATA.Model} record
   * The record to test for inclusion.
   * @return {boolean}
   */
  contains (record) {
    return this.PRIVATE.ACTIVERECORDS.has(record.OID)
  }

  /**
   * Get the list of records for the given value.
   * @param {string} fieldName
   * The name of the indexed field.
   * @param  {any} fieldValue
   * The value of the index field. This is used to lookup
   * the list of records/models whose field is equal to
   * the specified value.
   * @return {NGN.DATA.Model[]}
   * Returns an array of models/records within the index for
   * the given value.
   */
  getIndexRecords (field, value) {
    if (this.METADATA.INDEX && this.METADATA.INDEX.hasOwnProperty(field)) {
      let result = []
      let oid = this.METADATA.INDEX[field].recordsFor(value)

      for (let i = 0; i < oid.length; i++) {
        result.push(this.METADATA.records[this.PRIVATE.RECORDMAP.get(oid[i])])
      }

      return result
    }

    return []
  }

  /**
   * Retrieve a record by index number (0-based, like an array).
   * @param  {number} [index=0]
   * The index of the record to retrieve.
   */
  getRecord (index = 0) {
    if (index < 0) {
      NGN.WARN('Cannot retrieve a record for a negative index.')
      return null
    }

    if (index >= this.METADATA.records.length) {
      NGN.WARN('Cannot retrieve a record for an out-of-scope index (index greater than total record count.)')
      return null
    }

    return this.METADATA.records[index]
  }

  /**
   * @method clear
   * Removes all data.
   * @param {boolean} [purgeSoftDelete=true]
   * Purge soft deleted records from memory.
   * @param {boolean} [suppressEvents=false]
   * Set to `true` to prevent events from triggering when this method is run.
   * @fires clear
   * Fired when all data is removed
   */
  clear (purge = true, suppressEvents = false) {
    if (this.METADATA.ARCHIVE) {
      if (!purge) {
        this.METADATA.ARCHIVE = this.records
      } else {
        delete this.METADATA.ARCHIVE
      }
    }

    this.METADATA.records = []

    // TODO: Update indexes

    if (!suppressEvents) {
      this.emit('clear')
    }
  }

  /**
   * A special method to clear events from the underlying event emitter.
   * This exists because #clear has a special meaning in a data store (removing
   * all data records vs removing all events).
   * @private
   */
  clearEvents () {
    super.clear(...arguments)
  }

  /**
   * Replace a model.
   * @deprecated 2.0.0
   * @param  {NGN.DATA.Model} newModel
   * The new model.
   */
  replaceModel (newModel) {
    NGN.deprecate(
      () => { this.model = newModel },
      'replaceModel has been deprected. Set the model directly instead.'
    )
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
   * @fires snapshot
   * Triggered when a new snapshot is created. The snapshot dataset is
   * passed as the only argument to event handlers.
   * @returns {object}
   * Returns an object containing the following fields:
   *
   * ```js
   * {
   *   timestamp: 'ex: 2018-01-19T16:43:03.279Z',
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
    this.METADATA.snapshotarchive = NGN.coalesce(this.METADATA.snapshotarchive, [])

    let data = this.data
    let dataset = {
      id: NGN.DATA.UTILITY.GUID(),
      timestamp: (new Date()).toISOString(),
      checksum: NGN.DATA.UTILITY.checksum(JSON.stringify(data)).toString(),
      modelChecksums: this.data.map((item) => {
        return NGN.DATA.UTILITY.checksum(JSON.stringify(item)).toString()
      }),
      data: data
    }

    this.METADATA.snapshotarchive.unshift(dataset)
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

  load (data) {
    // this.emit(this.PRIVATE.EVENT.LOAD_RECORDS)
  }
}
