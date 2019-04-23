import EventEmitter from '../emitter/core'

NGN.createException({
  name: 'NGNDuplicateRecordError',
  message: 'A duplicate record exists within the unique data set.'
})

NGN.createException({
  name: 'NGNMissingRecordError',
  message: 'The specified record does not exist or cannot be found.'
})

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
export default class NGNDataStore extends EventEmitter { // eslint-disable-line
  constructor (cfg = {}) {
    if (NGN.typeof(cfg) === 'model') {
      cfg = { model: cfg }
    } else if (!cfg.model || !NGN.DATA.UTILITY.isDataModel(cfg.model)) {
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

      OID: NGN.privateconst(Symbol('store.id')),

      METADATA: NGN.private({
        // Holds the models/records
        records: [],

        // Holds all of the relevant filters associated with the store.
        filters: new Map(),

        /**
         * @cfgproperty {NGN.DATA.Model} model
         * An NGN Data Model to which data records conform.
         */
        Model: NGN.coalesce(cfg.model),

        /**
         * @cfg {Number} [expires=-1]
         * Sets the default NGN.DATA.Model#expiration value (Milliseconds) for each new record as it
         * is added to the store.
         */
        expires: NGN.coalesce(cfg.expires, -1),

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
         * @cfg {Number} [autocompact=50000]
         * Identify the number of deletions that should occur before
         * the store is compacted. See #compact. Set this to any value
         * below `100` (the minimum) to disable autocompact.
         */
        autocompact: NGN.coalesce(cfg.autocompact, 50000),

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
          'record.expired',
          'record.purged',
          'record.move',
          'record.invalid',
          'record.valid',
          'clear',
          'filter.create',
          'filter.delete',
          'index.create',
          'index.delete',
          'compact.start',
          'compact.complete'
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
        STUB: Symbol('record.stub'),

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

              case me.PRIVATE.EVENT.CLEAR_RECORDS:
                me.METADATA.INDEXFIELDS.forEach(field => me.METADATA.INDEX[field].reset())

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

        // Contains a map of all records, in order.
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
          LOAD_RECORDS: Symbol('records.load'),
          CLEAR_RECORDS: Symbol('records.delete')
        },

        ORIGINALCFG: cfg,

        // Makes sure the model configuration specifies a valid and indexable field.
        checkModelIndexField (field) {
          let metaconfig = me.METADATA.Model.prototype.CONFIGURATION

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
        getModelFieldType (field) {
          let metaconfig = me.METADATA.Model.prototype.CONFIGURATION

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
        },

        // Prepare record for insertion into the store.
        createRecord (data, suppressEvents = false) {
          const record = new me.METADATA.Model(data)

          if (!(record instanceof NGN.DATA.Entity)) {
            throw new Error(`Only a NGN.DATA.Model or JSON object may be used in NGN.DATA.Store#add. Received a "${NGN.typeof(data)}" value.`)
          }

          // Prevent invalid record addition (if configured)
          if (!me.METADATA.allowInvalid && !record.valid) {
            NGN.WARN(`An attempt to add invalid data to the "${this.name}" store was prevented. The following fields are invalid: ${Array.from(record.METADATA.invalidFieldNames.keys()).join(', ')}`)

            if (!suppressEvents) {
              this.emit('record.invalid', record)
            }

            if (this.METADATA.errorOnInvalid) {
              throw new Error(`Invalid data cannot be added to the "${this.name}" store.`)
            }
          }

          // If duplicates are prevented, check the new data.
          if (!me.METADATA.allowDuplicates) {
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
          if (me.METADATA.lifo > 0 && me.METADATA.records.length + 1 > me.METADATA.lifo) {
            me.remove(me.METADATA.records.length - 1, suppressEvents)
          } else if (me.METADATA.fifo > 0 && me.METADATA.records.length + 1 > me.METADATA.fifo) {
            me.remove(0, suppressEvents)
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
                return me.emit(this.event.replace('field.', 'record.'), record)

              case 'expire':
                if (me.METADATA.autoRemoveExpiredRecords) {
                  me.remove(arguments[0])
                }

                me.emit('record.expired', arguments[0])
                return
            }
          })

          delete record.METADATA.store
          Object.defineProperty(record.METADATA, 'store', NGN.get(() => me))

          if (me.METADATA.expires > 0) {
            record.expires = me.METADATA.expires

          }

          return record
        },

        // Add a record
        addRecord (data, suppressEvents = false) {
          let record = me.PRIVATE.createRecord(...arguments)

          // Indexing is handled in an internal event handler
          let length = me.METADATA.records.push(record)

          // Add the record to the map for efficient retrievel by OID
          me.PRIVATE.RECORDMAP.set(record.OID, length - 1)

          me.PRIVATE.ACTIVERECORDS.set(record.OID, length - 1)

          me.METADATA.filters.forEach(filter => filter.exec(record))

          me.emit(me.PRIVATE.EVENT.CREATE_RECORD, record)

          return record
        },

        /**
         * Insert record at specific position.
         * This is accomplished by splicing the record into the records array,
         * then splitting the record map at the insertion point and recreating
         * the record map with updated pointer values.
         */
        insertRecord (data, index = 0, suppressEvents = false) {
          index = index < 0 ? 0 : index

          // If the record is supposed to be inserted at the end, just use the
          // standard addRecord method instead.
          if (index > me.PRIVATE.RECORDMAP.size) {
            return me.PRIVATE.addRecord(data, suppressEvents)
          }

          let record = me.PRIVATE.createRecord(data, suppressEvents)
          me.METADATA.records.push(record)

          let rawIndex = me.METADATA.records.length - 1
          let updatedRecords = Array.from(me.PRIVATE.RECORDMAP)

          if (index === 0) {
            updatedRecords.unshift([record.OID, rawIndex])
          } else {
            let lastRecords = updatedRecords.splice(index, updatedRecords.length, [record.OID, rawIndex])
            updatedRecords = updatedRecords.concat(lastRecords)
          }

          me.PRIVATE.RECORDMAP = new Map(updatedRecords)

          let firstActiveRecords = index === 0 ? new Array(0) : Array.from(me.PRIVATE.ACTIVERECORDS).filter(item => item[1] < index)
          let lastActiveRecords = Array.from(me.PRIVATE.ACTIVERECORDS)

          if (index === 0) {
            lastActiveRecords = lastActiveRecords.filter(item => item[1] >= index)
          }

          me.PRIVATE.ACTIVERECORDMAP = new Map([...firstActiveRecords, [record.OID, rawIndex], ...lastActiveRecords])
          me.METADATA.filters.forEach(filter => filter.exec(record))
          me.PRIVATE.updateOrderIndex()

          me.emit(me.PRIVATE.EVENT.CREATE_RECORD, record)

          return record
        },

        updateOrderIndex () {
          let activeRecords = Array.from(me.PRIVATE.ACTIVERECORDS)

          if (activeRecords.length === 0) {
            me.METADATA.FIRSTRECORDINDEX = 0
            me.METADATA.LASTRECORDINDEX = 0
          } else {
            me.METADATA.FIRSTRECORDINDEX = activeRecords[0][1]
            me.METADATA.LASTRECORDINDEX = activeRecords[activeRecords.length - 1][1]
          }
        },

        convertStubToRecord (index, record) {
          if (record !== null && record.hasOwnProperty(me.PRIVATE.STUB)) {
            let newRecord = me.PRIVATE.addRecord(record.metadata, false)
            newRecord.OID = record.OID

            me.METADATA.records[index] = newRecord

            if (me.METADATA.expires > 0) {
              newRecord.expires = this.METADATA.expires
            }

            return newRecord
          } else if (record === null || record === undefined) {
            throw new Error('Null stub cannot be converted to record.')
          } else {
            return record
          }
        },

        /**
         * Determines whether a specific record should be filtered
         * @param  {NGN.DATA.Model} record
         * The record to check.
         * @return {boolean}
         * Returns `true` if the record should be retained or `false`
         * if it should be filtered out.
         * @private
         */
        shouldFilterRecord (record) {
          let retain = true

          me.METADATA.filters.forEach((filter, name) => {
            if (retain && !filter.fn(record)) {
              retain = false
            }
          })

          return retain
        },

        // Force JSON data into the store's specified data model.
        forceDataObject (data) {
          if (!(data instanceof me.METADATA.Model)) {
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

          return data
        }
      }),

      // Create a convenience alias for the remove method.
      delete: NGN.const(NGN.deprecate(this.remove, 'Store.delete is deprecated. Use Store.remove instead.'))
    })

    // Create a smart reference to record lists
    Object.defineProperties(this.PRIVATE, {
      ACTIVERECORDS: NGN.get(() => {
        if (this.PRIVATE.ACTIVERECORDMAP === null) {
          this.PRIVATE.ACTIVERECORDMAP = new Map([...this.PRIVATE.RECORDMAP])
        }

        return this.PRIVATE.ACTIVERECORDMAP
      }),

      FILTEREDRECORDS: NGN.get(() => {
        if (this.PRIVATE.FILTEREDRECORDMAP === null) {
          this.PRIVATE.FILTEREDRECORDMAP = new Map()
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

    // Setup auto-compact
    if (this.METADATA.autocompact < 100) {
      this.METADATA.DELETECOUNT = 0
      this.on(this.PRIVATE.EVENTS.DELETE_RECORD, () => {
        this.METADATA.DELETECOUNT++

        if (this.METADATA >= this.METADATA.autocompact) {
          this.METADATA.DELETECOUNT = 0
          this.compact()
        }
      })
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
    let record = NGN.coalesce(this.METADATA.records[this.METADATA.FIRSTRECORDINDEX])

    return this.PRIVATE.convertStubToRecord(this.METADATA.FIRSTRECORDINDEX, record)
    // return NGN.coalesce(this.METADATA.records[this.METADATA.FIRSTRECORDINDEX])
  }

  /**
   * @property {NGN.DATA.Model} last
   * Return the last active record in the store. Returns `null`
   * if the store is empty.
   */
  get last () {
    let record = NGN.coalesce(this.METADATA.records[this.METADATA.LASTRECORDINDEX])

    return this.PRIVATE.convertStubToRecord(this.METADATA.LASTRECORDINDEX, record)
  }

  /**
   * @property {object} data
   * A serialized version of the data represented by the store. This
   * only includes non-virtual fields. See #representation to use
   * a representation of data containing virtual fields.
   */
  get data () {
    const recordList = this.PRIVATE.ACTIVERECORDS

    // If no records exist, skip
    if (recordList.size === 0) {
      return []
    }
    let rec = this.PRIVATE.convertStubToRecord(this.METADATA.FIRSTRECORDINDEX, this.METADATA.records[this.METADATA.FIRSTRECORDINDEX])

    if (this.METADATA.MAP === null) {
      this.METADATA.MAP = NGN.coalesce(rec.MAP)
    }

    let defaults = null

    if (rec instanceof NGN.DATA.Entity) {
      let fieldDefinitions = rec.fieldDefinitions
      let fields = Object.keys(fieldDefinitions)

      defaults = {}

      fields.forEach(field => {
        if (!fieldDefinitions[field].hidden && !fieldDefinitions[field].virtual) {
          defaults[field] = fieldDefinitions[field].default
        }
      })
    }

    const result = []
    // const fields = defaults !== null ? Object.keys(defaults) : []

    // Iterate through set
    recordList.forEach(index => {
      if (this.METADATA.records[index] !== null) {
        // If the value is a stub, map it.
        if (this.METADATA.records[index].hasOwnProperty(this.PRIVATE.STUB)) {
          let applicableData = Object.assign({}, defaults)
          let data = Object.assign(applicableData, this.METADATA.records[index].metadata)

          if (this.METADATA.MAP !== null) {
            result.push(this.METADATA.MAP.applyInverseMap(data))
          } else {
            result.push(data)
          }
        } else {
          result.push(this.METADATA.records[index].data)
        }
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

  set model (value) {
    if (value !== this.METADATA.Model) {
      if (NGN.typeof(value) !== 'model') {
        throw new InvalidConfigurationError(`"${this.name}" model could not be set because the value is a ${NGN.typeof(value)} type (requires NGN.DATA.Model).`)
      }

      this.METADATA.Model = value
    }
  }

  get map () {
    return this.METADATA.MAP
  }

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
      let result = new Array(data.length)

      for (let i = 0; i < data.length; i++) {
        result[i] = this.add(data[i], suppressEvents)
      }

      return result
    }

    // Prevent creation if it will exceed maximum record count.
    if (this.METADATA.maxRecords > 0 && this.METADATA.records.length + 1 > this.METADATA.maxRecords) {
      throw new Error('Maximum record count exceeded.')
    }

    const record = this.PRIVATE.addRecord(this.PRIVATE.forceDataObject(data))

    this.METADATA.LASTRECORDINDEX = this.METADATA.records.length - 1

    if (!suppressEvents) {
      this.emit('record.create', record)
    }

    return record
  }

  /**
   * @method insertBefore
   * Add a record before the specified record or index.
   *
   * **BE CAREFUL** when using this in combination with #LIFO or #FIFO.
   * LIFO/FIFO is applied _after_ the record is added to the store but
   * _before_ it is moved to the desired index.
   * @param  {NGN.DATA.Model|number} target
   * The record (model) or index where the new record will be before.
   * @param {NGN.DATA.Model|object} data
   * Accepts an existing NGN Data Model or a JSON object.
   * If a JSON object is supplied, it will be applied to
   * the data model specified in cfg#model.
   * @param {boolean} [suppressEvent=false]
   * Set this to `true` to prevent the `record.create` event
   * from firing.
   * @return {NGN.DATA.Model}
   * Returns the new record.
   */
  insertBefore (beforeRecord, data, suppressEvents = false) {
    let recordIndex = typeof beforeRecord === 'number' ? beforeRecord : this.indexOf(beforeRecord)

    if (recordIndex < 0) {
      throw new NGNMissingRecordError()
    }

    if (recordIndex >= this.METADATA.records.length) {
      recordIndex = this.METADATA.records.length - 1
      recordIndex = recordIndex < 0 ? 0 : recordIndex
    }

    // Support array input
    // Records must be inserted in reverse order, since they're being added
    // BEFORE the same record on each iteration.
    if (NGN.typeof(data) === 'array') {
      let result = new Array(data.length)

      for (let i = data.length - 1; i >= 0; i--) {
        result[i] = this.insertBefore(recordIndex, suppressEvents)
      }

      return result
    }

    // Prevent creation if it will exceed maximum record count.
    if (this.METADATA.maxRecords > 0 && this.METADATA.records.length + 1 > this.METADATA.maxRecords) {
      throw new Error('Maximum record count exceeded.')
    }

    const record = this.PRIVATE.insertRecord(this.PRIVATE.forceDataObject(data), recordIndex, suppressEvents)

    // Filters are auto-applied to new records

    if (!suppressEvents) {
      this.emit('record.create', record)
    }

    return record
  }

  /**
   * @method insertAfter
   * Add a record after the specified record or index.
   *
   * **BE CAREFUL** when using this in combination with #LIFO or #FIFO.
   * LIFO/FIFO is applied _after_ the record is added to the store but
   * _before_ it is moved to the desired index.
   * @param  {NGN.DATA.Model|number} target
   * The record (model) or index where the new record will be inserted after.
   * @param {NGN.DATA.Model|object} data
   * Accepts an existing NGN Data Model or a JSON object.
   * If a JSON object is supplied, it will be applied to
   * the data model specified in cfg#model.
   * @param {boolean} [suppressEvent=false]
   * Set this to `true` to prevent the `record.create` event
   * from firing.
   * @return {NGN.DATA.Model}
   * Returns the new record.
   */
  insertAfter (afterRecord, data, suppressEvents = false) {
    let recordIndex = typeof afterRecord === 'number' ? afterRecord : this.indexOf(afterRecord)

    if (recordIndex < 0) {
      throw new NGNMissingRecordError()
    }

    if (recordIndex >= this.METADATA.records.length) {
      recordIndex = this.METADATA.records.length - 1
      recordIndex = recordIndex < 0 ? 0 : recordIndex
    }

    // Support array input
    if (NGN.typeof(data) === 'array') {
      let result = new Array(data.length)

      for (let i = data.length - 1; i >= 0; i--) {
        result[i] = this.insertAfter(recordIndex, suppressEvents)
      }

      return result
    }

    // Prevent creation if it will exceed maximum record count.
    if (this.METADATA.maxRecords > 0 && this.METADATA.records.length + 1 > this.METADATA.maxRecords) {
      throw new Error('Maximum record count exceeded.')
    }

    const record = this.PRIVATE.insertRecord(this.PRIVATE.forceDataObject(data), recordIndex + 1, suppressEvents)

    // Filters are auto-applied to new records

    if (!suppressEvents) {
      this.emit('record.create', record)
    }

    return record
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
   * @returns {NGN.DATA.Model}
   * Returns the model.
   * @fires {change:Object} record.moved
   * This event is triggered when the move is complete.
   * The change data sent to this event handler looks like:
   *
   * ```
   * {
   *   oldPosition: {number},
   *   newPosition: {number},
   *   record: {NGN.DATA.Model}
   * }
   * ```
   */
  move (sourceRecord, targetRecord) {
    sourceRecord = typeof sourceRecord === 'symbol' || typeof sourceRecord === 'number'
      ? this.getRecord(sourceRecord)
      : sourceRecord

    if (!sourceRecord) {
      throw NGNMissingRecordError('Could not find source record.')
    }

    targetRecord = typeof targetRecord === 'symbol' || typeof targetRecord === 'number'
      ? this.getRecord(targetRecord)
      : targetRecord

    if (!targetRecord) {
      throw NGNMissingRecordError('Could not find target record.')
    }

    if (sourceRecord === targetRecord) {
      return
    }

    let activeRecords = Array.from(this.PRIVATE.ACTIVERECORDS)
    let sourceIndex = activeRecords.findIndex(item => item[0] === sourceRecord.OID)
    let targetIndex = activeRecords.findIndex(item => item[0] === targetRecord.OID)

    activeRecords.splice(targetIndex, 0, activeRecords.splice(sourceIndex, 1)[0])

    this.PRIVATE.ACTIVERECORDMAP = new Map([...activeRecords])
    this.PRIVATE.updateOrderIndex()

    this.emit('record.moved', {
      oldPosition: sourceIndex,
      newPosition: targetIndex,
      record: sourceRecord
    })

    return this
  }

  /**
   * @method moveToEnd
   * Move a record to the end of the dataset.
   * @param {NGN.DATA.Model|number|string} source
   * The record or the index of a record within the store to move.
   * This can also be the unique ID of a record.
   * will be positioned against. This can also be the unique ID of a record.
   * @returns {NGN.DATA.Model}
   * Returns the model.
   * @fires {change:Object} record.moved
   * This event is triggered when the move is complete.
   * The change data sent to this event handler looks like:
   *
   * ```
   * {
   *   oldPosition: {number},
   *   newPosition: {number},
   *   record: {NGN.DATA.Model}
   * }
   * ```
   */
  moveToEnd (record) {
    return this.move(record, this.PRIVATE.ACTIVERECORDS.size - 1)
  }

  /**
   * @method moveToStart
   * Move a record to the beginning of the dataset.
   * @param {NGN.DATA.Model|number|string} source
   * The record or the index of a record within the store to move.
   * This can also be the unique ID of a record.
   * will be positioned against. This can also be the unique ID of a record.
   * @returns {NGN.DATA.Model}
   * Returns the model.
   * @fires {change:Object} record.moved
   * This event is triggered when the move is complete.
   * The change data sent to this event handler looks like:
   *
   * ```
   * {
   *   oldPosition: {number},
   *   newPosition: {number},
   *   record: {NGN.DATA.Model}
   * }
   * ```
   */
  moveToStart (record) {
    return this.move(record, 0)
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
      NGN.INFO(`"${this.name}" store called remove(), but the store contains no records.`)
      return
    }

    // Support simultaneously removing multiple records
    if (NGN.typeof(record) === 'array') {
      let result = new Array(record.length)

      for (let i = 0; i < record.length; i++) {
        result[i] = this.remove(record[i])
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
        if (record < 0 || !this.METADATA.records[record]) {
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

        if (index < 0) {
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
      this.PRIVATE.ACTIVERECORDMAP = new Map([...this.PRIVATE.RECORDMAP])
    }

    // Identify the record to be removed.
    let removedRecord = this.METADATA.records[index]

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
          this.PRIVATE.RECORDMAP.delete(removedRecord.OID)

          if (!suppressEvents) {
            this.emit('record.purge', removedRecord)
          }
        })

        removedRecord.expires = this.METADATA.softDeleteTtl
      }
    } else {
      this.METADATA.records[activeIndex] = null
      this.PRIVATE.RECORDMAP.delete(removedRecord.OID)
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
   * @method restore
   * Restore a soft-deleted record to the store. This does not preserve the
   * original index (a new index number is assigned).
   * @param  {NGN.DATA.Model,Number,Symbol} id
   * This may be the archived model/record, the index number of the record,
   * or the record OID value.
   * @return {NGN.DATA.Model}
   * Returns the archived record. This will be `null` if the record cannot be
   * found or does not exist, has been purged, or otherwise does not exist in
   * the store.
   * @fires {restoredRecord:NGN.DATA.Model} record.restored
   * Triggered once a previously removed record has been restored .
   */
  restore (id) {
    let index = typeof id === 'number' ? id : this.indexOf(id)

    if (index < 0) {
      return null
    }

    let record = this.PRIVATE.convertStubToRecord(index, this.METADATA.records[index])

    if (!record) {
      return null
    }

    if (this.PRIVATE.ACTIVERECORDMAP.has(record.OID) || this.PRIVATE.FILTEREDRECORDS.has(record.OID)) {
      NGN.WARN(`${this.name} could not restore the specified record because it already exists amongst the active or filtered records.`)

      return record
    }

    this.PRIVATE.ACTIVERECORDS.set(record.OID, index)
    this.filter(record)

    record.removeAllListeners('expired')

    this.emit('record.restored', record)

    return record
  }

  /**
   * Create a copy of the store.
   * @param {boolean} [copyData=true]
   * Copy the data. If this is set to `false`, the store configuration will be
   * copied, but it will contain no data.
   * Snapshots are not copied.
   * @return {NGN.DATA.Store}
   */
  copy (includeData = true) {
    let cfg = Object.assign({}, this.PRIVATE.ORIGINALCFG)

    if (this.auditable) {
      cfg.audit = true
    }

    let store = new Object.getPrototypeOf(this)(cfg)

    store.name = `Copy of ${this.name}`

    // Apply filters
    this.METADATA.filters.forEach(filter => filter.apply(store))

    // Apply model
    store.METADATA.Model = this.METADATA.Model

    // Indexes
    this.METADATA.INDEXFIELDS.forEach(field => store.PRIVATE.createIndex(field))

    store.METADATA.autoRemoveExpiredRecords = this.METADATA.autoRemoveExpiredRecords

    store.METADATA.MAP = this.METADATA.MAP
    store.auditable = this.auditable

    if (includeData) {
      store.load(this.METADATA.records)
    }

    return store
  }

  // TODO: find/query
  // TODO: merge (with another data store)
  // TODO: split (into more data stores)
  // TODO: splitAt (specfific record/s)
  // TODO: pop, shift (for parity w/ array)
  // TODO: Copy

  /**
   * Split records into multiple stores. This
   * does **not** delete the original store.
   *
   * ```
   * let store = new NGN.DATA.Store(...)
   *
   * store.add([{
   *   field: 'a'
   * }, {
   *   field: 'b'
   * }, {
   *   field: 'c'
   * }, {
   *   field: 'd'
   * }])
   *
   * let smallerStores = store.split()
   *
   * smallerStores.forEach((store, index) => console.log(`\nStore ${index+1}\n`, store.data))
   * ```
   *
   * The output of the example above would be:
   *
   * ```
   *
   * Store 1
   * [{
   *   field: 'a'
   * }, {
   *   field: 'b'
   * }]
   *
   * Store 2
   * [{
   *   field: 'c'
   * }, {
   *   field: 'd'
   * }]
   * ```
   * @param  {Number}  [recordsPerStore]
   * The number of records that will be in each result store.
   * If this is not specified, it will be automatically
   * calculated by dividing the total number of records by 2.
   * This would result in 2 stores.
   *
   * The appropriate number of stores will automatically
   * be created by dividing the total number of records by
   * the `recordPerStore` value, rounding up to the nearest integer.
   * @param  {Boolean} [includeFiltered=false]
   * Include records which have been filtered out but not deleted from the store.
   * @return {NGN.DATA.Store[]}
   * An array of the data stores.
   */
  split (chunkSize = null, includeFiltered = false) {
    if (typeof chunkSize === 'boolean') {
      includeFiltered = chunkSize
      chunkSize = null
    }

    if (isNaN(chunkSize)) {
      chunkSize = (this.size + (includeFiltered ? this.PRIVATE.FILTEREDRECORDS.size : 0)) / 2
    }

    if (chunkSize < 0) {
      throw new Error('Cannot split a store into 0 or fewer records.')
    }

    let activeRecords = Array.from(this.PRIVATE.ACTIVERECORDS)

    if (includeFiltered) {
      activeRecords = activeRecords.concat(Array.from(this.PRIVATE.FILTEREDRECORDS))
    }

    let count = Math.ceil(activeRecords.length / chunkSize)
    let results = new Array(count)

    for (let i = 0; i < count; i++) {
      // Create a copy of the store
      results[i] = this.copy(false)
      results[i].load(activeRecords.splice(0, chunkSize))
    }

    return results
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
        this.PRIVATE.EVENT.DELETE_RECORD_FIELD,
        this.PRIVATE.EVENT.CLEAR_RECORDS,
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
   * Retrieve a record based on it's relative position to another
   * record. This method is used by NGN.DATA.Model#next and NGN.DATA.Model#previous
   * to support "doubly linked list" approach to record iteration.
   * @param  {[type]}  currentRecord [description]
   * @param  {Number}  [count=1]     [description]
   * @param  {Boolean} [cycle=false] [description]
   * @return {[type]}                [description]
   */
  getRecordSibling (currentRecord, count = 1, cycle = false) {
    let size = this.size

    if (size === 0) {
      NGN.WARN('Attempted to execute getRecordSibling with no active records.')
      return null
    }

    // Make sure the iterator fits within the range
    if (Math.abs(count) > size) {
      count = count % size
    }

    if (size === 1 || count === 0) {
      return currentRecord
    }

    let ActiveRecords = Array.from(this.PRIVATE.ACTIVERECORDS)
    let currentIndex = ActiveRecords.findIndex(item => currentRecord.OID === item[0])

    if (ActiveRecords.length === 0) {
      NGN.WARN(`"${this.name}" data store has no active records and ${this.PRIVATE.FILTEREDRECORDS.size} record${this.PRIVATE.FILTEREDRECORDS.size !== 1 ? 's' : ''}. record.next() & record.previous() do not iterate through filtered records.`)
      return null
    }

    if (currentIndex < 0) {
      let recordIndex = Array.from(this.PRIVATE.FILTEREDRECORDS).findIndex(item => currentRecord.OID === item[0])

      if (recordIndex < 0) {
        throw new Error('Record not found.')
      }

      let iterations = 0

      while (ActiveRecords.findIndex(item => recordIndex === item[1]) < 0 && iterations < ActiveRecords.length) {
        recordIndex++
        iterations++
      }

      if (iterations < ActiveRecords.length) {
        currentIndex = recordIndex
      } else {
        return null
      }
    }

    currentIndex += count

    // Support cycling through records.
    if ((currentIndex >= ActiveRecords.length || currentIndex < 0) && cycle) {
      // Cycle forwards
      if (count > 0) {
        currentIndex = currentIndex % ActiveRecords.length
      } else {
        // Cycle Backwards
        currentIndex = ActiveRecords.length - Math.abs(currentIndex)
      }
    }

    if (currentIndex < 0 || currentIndex >= ActiveRecords.length) {
      return null
    }

    return this.METADATA.records[ActiveRecords[currentIndex][1]]
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
    if (typeof record !== 'symbol') {
      record = record.OID
    }

    return NGN.coalesce(this.PRIVATE.RECORDMAP.get(record), -1)
  }

  /**
   * Determine whether the store contains a record.
   * This only checks the _active_ record set (ignores filtered records).
   * @param  {NGN.DATA.Model|NGN.DATA.Model#OID} record
   * The record to test for inclusion.
   * Internal methods may use the unique Object ID of a record.
   * @return {boolean}
   */
  contains (record) {
    return this.PRIVATE.ACTIVERECORDS.has(typeof record === 'symbol' ? record : record.OID)
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
      let oid = this.METADATA.INDEX[field].recordsFor(value)
      let result = new Array(oid.length)

      for (let i = 0; i < oid.length; i++) {
        result[i] = this.METADATA.records[this.PRIVATE.RECORDMAP.get(oid[i])]
      }

      return result
    }

    return []
  }

  /**
   * Retrieve an active record by index number (0-based, similar to an array).
   * @param  {number} [index=0]
   * The index of the record to retrieve.
   */
  getRecord (index = 0) {
    if (typeof index === 'symbol') {
      index = this.indexOf(index)
    }

    if (index < 0) {
      NGN.WARN('Cannot retrieve a record for a negative index.')
      return null
    }

    if (index >= this.PRIVATE.RECORDMAP.size) {
      NGN.WARN('Cannot retrieve a record for an out-of-scope index (index greater than total record count.)')
      return null
    }

    return this.PRIVATE.convertStubToRecord(index, this.METADATA.records[Array.from(this.PRIVATE.ACTIVERECORDS)[index][1]])
  }

  /**
   * @method clear
   * Removes all data. If auditing is enabled, the transaction log is reset.
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
    this.PRIVATE.RECORDMAP = new Map()
    this.PRIVATE.ACTIVERECORDMAP = null
    this.PRIVATE.FILTEREDRECORDMAP = null
    this.METADATA.LASTRECORDINDEX = 0
    this.METADATA.FIRSTRECORDINDEX = 0
    this.METADATA.filters.forEach(filter => filter.purge(this))

    if (this.METADATA.AUDITABLE) {
      this.METADATA.AUDITLOG.reset()
    }

    // Indexes updated automatically (listening for 'clear' event)
    this.emit(this.PRIVATE.EVENT.CLEAR_RECORDS)

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

  /**
   * Load bulk data.
   * @param  {Array} data
   * An array of data Object or NGN.DATA.Model values.
   * @param {Boolean} [autoApplyFilters=false]
   * Set this to `true` to automatically apply filters to
   * the data once loaded into the store.
   * @warning Filtering is a O(n) operation, meaning the
   * larger the dataset, the slower it will perform. Unfortunately,
   * there is no generic way to circumvent this challenge in JavaScript.
   * @fires {Object} loaded
   * Triggered when the load is complete. The object returned to the event
   * handler looks like:
   *
   * ```
   * {
   *   recordCount: 5,
   *   activeRecordCount: 3,
   *   filteredRecordCount: 2,
   *   loadDuration: 300 // milliseconds
   * }
   * ```
   */
  load (data, autoApplyFilters = false, suppressEvents = false) {
    let start = new Date()
    let insertableData

    // Guarantee unique records amongst only the new records
    if (!this.METADATA.allowDuplicates) {
      let uniqueValues = new Set()

      insertableData = []

      for (let i = 0; i < data.length; i++) {
        if (data[i]) {
          if (!uniqueValues.has(JSON.stringify(data[i]))) {
            uniqueValues.add(JSON.stringify(data[i]))
            insertableData.push(data[i])
          } else if (this.METADATA.errorOnDuplicate) {
            throw new NGNDuplicateRecordError()
          }
        }
      }
    } else {
      insertableData = data

      // Remove any null or undefined records, which would otherwise be recognized as deleted record placeholders
      while (insertableData.indexOf(null) >= 0 || insertableData.indexOf(undefined) >= 0) {
        insertableData.splice(NGN.coalesceb(NGN.nullIf(insertableData.indexOf(null), -1), NGN.nullIf(insertableData.indexOf(undefined), -1) - 1, 1)
      }
    }

    let newRecordCount = insertableData.length + this.METADATA.records.length

    // Don't exceed the maximum record count if it exists.
    if (this.METADATA.maxRecords > 0 && newRecordCount > this.METADATA.maxRecords) {
      throw new Error('Maximum record count exceeded.')
    }

    if (newRecordCount > 4000000) {
      throw new Error('Maximum load size exceeded. A store may contain a maximum of 4M records.')
    }

    let me = this
    for (let i = 0; i < insertableData.length; i++) {
      let oid = Symbol('model.id')
      this.METADATA.records.push({
        [this.PRIVATE.STUB]: true,
        OID: oid,
        get store () {
          return me
        },
        metadata: insertableData[i]
      })

      // Add the record to the map for efficient retrieval by OID
      this.PRIVATE.RECORDMAP.set(oid, this.METADATA.records.length - 1)
      this.PRIVATE.ACTIVERECORDS.set(oid, this.METADATA.records.length - 1)
    }

    if (autoApplyFilters) {
      let startFilter = new Date()
      this.filter()
      let endFilter = new Date()
    } else {
      this.PRIVATE.updateOrderIndex()
    }

    let end = new Date()

    this.emit(this.PRIVATE.EVENT.LOAD_RECORDS)

    let result = {
      recordCount: this.length,
      activeRecordCount: this.size,
      filteredRecordCount: this.length - this.size,
      loadDuration: (end - start),
      filterDuration: autoApplyFilters ? (endFilter - startFilter) : 0
    }

    if (!suppressEvents) {
      this.emit('loaded', result)
    }

    return result
  }

  /**
   * Drop all records and reload. This is the equivalent of running #clear()
   * before a new #load().
   ** @param  {Array} data
   * An array of data Object or NGN.DATA.Model values.
   * @param {Boolean} [autoApplyFilters=false]
   * Set this to `true` to automatically apply filters to
   * the data once loaded into the store.
   * @warning Filtering is a O(n) operation, meaning the
   * larger the dataset, the slower it will perform. Unfortunately,
   * there is no generic way to circumvent this challenge in JavaScript.
   * @fires {Object} reloaded
   * Triggered when the reload is complete. The object returned to the event
   * handler looks like:
   *
   * ```
   * {
   *   recordCount: 5,
   *   activeRecordCount: 3,
   *   filteredRecordCount: 2,
   *   loadDuration: 300 // milliseconds
   * }
   * ```
   */
  reload (data, autoApplyFilters = false) {
    this.clear(true)

    this.METADATA.records = new Array(data.length)

    let result = this.load(data, autoApplyFilters, false)

    this.emit('reloaded', result)
  }

  /**
   * Removes all data, filters, and "resets" the store back to
   * the original unpopulated state.
   * @param {Boolean} [suppressEvents=false]
   * Set to `true` to prevent events from triggering when this method is run.
   */
  reset (suppressEvents = false) {
    this.clear(true, suppressEvents)
    this.clearSnapshots()
    this.clearFilter()
    this.METADATA.filters = new Map()
  }

  /**
   * This rebuilds the local index of records, removing any dead records.
   * While deleted records are destroyed (in accordance to #softDeleteTtl),
   * the active record table contains a `null` or `undefined` value for each
   * deleted/dead record. This method removes such records, akin in nature to
   * the common JavaScript garbage collection process.
   *
   * This method almost never needs to be run, since stores
   * attempt to manage this process for themselves automatically. However; if
   * large volume deletions occur rapidly (50K+), it's possible (though not assured)
   * performance could be negatively impacted. Compacting the store can
   * improve performance in these cases. However; running this too often or
   * excessively may degrade performance since it is essentially rewriting
   * the store's data each time.
   *
   * When in doubt, *don't* use this method.
   * @info This method will not run when fewer than 100 cumulative records have
   * existed in the store, due to the inefficient nature at such low volume.
   * @fires compact.start
   * Triggered when the compact process begins.
   * @fires compact.complete
   * Triggered when the compact process completes.
   */
  compact () {
    this.emit('compact.start')

    if (this.METADATA.records.length < 100) {
      this.emit('compact.complete')

      if (this.METADATA.records.length !== 0) {
        NGN.WARN(`compact() called on ${this.name} with fewer than 100 elements.`)
      }

      return
    }

    let ranges = []
    let currentRange = []
    let empty = 0

    // Identify null ranges (dead records)
    for (let i = 0; i < this.METADATA.records.length; i++) {
      if (this.METADATA.records[i] === null) {
        empty++

        if (currentRange.length === 0) {
          currentRange.push(i)
        }
      } else {
        // Identify new index values for remaining records
        if (empty > 0) {
          this.PRIVATE.RECORDMAP.set(this.METADATA.records[i].OID, i - empty)

          if (this.METADATA.FIRSTRECORDINDEX === i) {
            this.METADATA.FIRSTRECORDINDEX = i - empty
          }

          if (this.METADATA.LASTRECORDINDEX === i) {
            this.METADATA.LASTRECORDINDEX = i - empty
          }
        }

        if (currentRange.length === 1) {
          currentRange.push(i - 1)
          ranges.push(currentRange)
          currentRange = []
        }
      }
    }

    // Clear null ranges
    empty = 0
    while (ranges.length > 0) {
      this.METADATA.records.splice(ranges[0][0] - empty, ranges[0][1] - ranges[0][0] + 1)
      empty += ranges[0][1] - ranges[0][0] + 1
      ranges.shift()
    }

    // Reset the active record map
    this.PRIVATE.ACTIVERECORDMAP = null

    this.emit('compact.complete')
  }

  /**
   * Performs executes the callback method on each active record
   * within the store. For example:
   *
   * ```js
   * Store.forEach(function (record) {
   *   // Do Something
   * })
   * ```
   * @param  {Function} callback
   * The callback method is applied to each record.
   */
  forEach (fn) {
    if (!NGN.isFn(fn)) {
      throw new Error(`A ${NGN.typeof(fn)} was applied to ${this.name}'s each() method when a function was expected.`)
    }

    this.PRIVATE.ACTIVERECORDS.forEach((value, key, map) => {
      fn(this.METADATA.records[value])
    })
  }

  /**
   * @method addFilter
   * Add a filter to the record set.
   * @param {string} [name]
   * The name of the filter. This is unnecessary/ignored if a NGN.DATA.Filter
   * is supplied for the filter argument.
   * @param {NGN.DATA.Filter|function} filter
   * Add a filter object/function. This function should comply
   * with the [Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) specification,
   * returning a boolean value.
   * The item passed to the filter will be the NGN.DATA.Model specified
   * in the cfg#model.
   * @fires filter.create
   * Fired when a filter is created.
   * @returns {NGN.DATA.Filter}
   * Returns the new filter.
   */
  addFilter (name, filterFn) {
    if (name instanceof NGN.DATA.Filter) {
      filterFn = name
      name = filterFn.name
    } else if (NGN.isFn(name)) {
      filterFn = new NGN.DATA.Filter(name, filterFn)
      name = filterFn
    }

    this.METADATA.filters.set(filterFn.name, filterFn)

    this.emit('filter.create', filterFn)

    return filterFn
  }

  /**
   * Apply all enabled filters to the Store's recordset.
   *
   * For example:
   *
   * ```js
   * let firstNameIsJohn = new NGN.DATA.Filter('only_john', record => {
   *   return record.firstName === 'John'
   * })
   *
   * let lastNameIsGeneric = new NGN.DATA.Filter('generic_names', record => {
   *   return ['Doe', 'Smith'].indexOf(record.lastName) >= 0
   * })
   *
   * let weirdLastName = new NGN.DATA.Filter('weird_names', record => {
   *   return ['Beeblebrox', 'Anastasio'].indexOf(record.lastName) >= 0
   * })
   *
   * MyStore.addFilter(firstNameIsJohn)
   * MyStore.addFilter(lastNameIsGeneric)
   * MyStore.addFilter(weirdLastName)
   *
   * MyStore.filter('only_john', 'generic_names')
   * ```
   *
   * In the example above, the store's records would only display people
   * of the name `John Doe` or `John Smith`, even though there are 3 known filters
   * associated with the store.
   * @param {NGN.DATA.Model} [record]
   * Optionally identify a specific record to run filters against.
   * @param {string[]} [namedFilters]
   * A list of filters can be supplied to selectively enable
   * a specific subset of filters. If no filters are specified,
   * all known filters are applied. Disabled filters will not be applied.
   * @return {NGN.DATA.Store}
   * Returns a reference to the data store, which enables
   * chaining methods together.
   */
  filter () {
    if (this.METADATA.filters.size === 0) {
      return this
    }

    // let interval = 1000
    // let timer = setTimeout(function () {
    //   interval = interval * 1.5
    //   NGN.WARN()
    // }, interval)

    let args = Array.from(arguments)

    this.METADATA.filters.forEach((filter, name) => {
      if (args[0] instanceof NGN.DATA.Entity) {
        filter.exec(args[0])
      } else if (args.length === 0 || args.indexOf(name) >= 0) {
        this.PRIVATE.ACTIVERECORDS.forEach(index => {
          filter.exec(this.METADATA.records[index])
        })
      }
    })

    return this
  }

  /**
   * Restores any records which were removed by the specified filters.
   * @param {string[]} namedFilters
   * A list of named filters can be supplied to selectively clear
   * a specific subset of filters. If no named filters are specified,
   * all known filters are cleared. Disabled filters will not be processed.
   * @return {NGN.DATA.Store}
   * Returns a reference to the data store, which enables
   * chaining methods together.
   */
  clearFilter () {
    if (arguments.length === 0) {
      this.PRIVATE.ACTIVERECORDMAP = new Map([...this.PRIVATE.ACTIVERECORDS, ...this.PRIVATE.FILTEREDRECORDS])
      this.PRIVATE.FILTEREDRECORDMAP = null
      this.METADATA.filters.forEach(filter => { filter.purge() })
    } else {
      Array.from(arguments).forEach(filter => { filter.clear() })
    }

    return this
  }

  /**
   * This is the same as #clearFilter, but it also permanently
   * removes the filter from the store (un-apply).
   * @param {string[]} namedFilters
   * A list of named filters can be supplied to selectively remove
   * a specific subset of filters. If no named filters are specified,
   * all known filters are removed. This includes disabled filters.
   * @return {NGN.DATA.Store}
   * Returns a reference to the data store, which enables
   * chaining methods together.
   */
  removeFilter () {
    let args = Array.from(arguments)

    if (args.length === 0) {
      this.PRIVATE.ACTIVERECORDMAP = new Map([...this.PRIVATE.ACTIVERECORDS, ...this.PRIVATE.FILTEREDRECORDS])
      this.PRIVATE.FILTEREDRECORDMAP = null
      this.METADATA.filters.forEach(filter => { filter.destroy(this) })
    } else {
      args.forEach(filter => { this.METADATA.filters.get(filter).destroy(this) })
    }

    return this
  }

  /**
   * This acts like #clearFilter. However, unlike clearing a filter
   * on a specific data store, disabling a filter will affect all
   * data stores to which the filter is applied.
   * @param {string[]} namedFilters
   * A list of named filters can be supplied to selectively remove
   * a specific subset of filters. If no named filters are specified,
   * all known filters are disabled.
   * @return {NGN.DATA.Store}
   * Returns a reference to the data store, which enables
   * chaining methods together.
   */
  disableFilter () {
    let args = new Set(Array.from(arguments))

    this.METADATA.filters.forEach(filter => {
      if (args.size === 0 || args.has(filter.name)) {
        filter.disable()
      }
    })

    return this
  }

  /**
   * Enabling a filter will make it available
   * _on all stores to which the filter is applied_.
   *
   * Filters are enabled by default, so this method
   * typically isn't used unless a filter has been explicitly
   * disabled. The anticipated use case is toggling filters on/off,
   * likely fordata visualizations, table renderings, and other
   * data exploration uses.
   * @param {string[]} namedFilters
   * A list of named filters can be supplied to selectively remove
   * a specific subset of filters. If no named filters are specified,
   * all known filters are disabled.
   * @return {NGN.DATA.Store}
   * Returns a reference to the data store, which enables
   * chaining methods together.
   */
  enableFilter () {
    let args = new Set(Array.from(arguments))

    this.METADATA.filters.forEach(filter => {
      if (args.size === 0 || args.has(filter.name)) {
        filter.enable()
      }
    })

    return this
  }
}
