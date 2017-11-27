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
class NGNDataStore extends NGN.EventEmitter {
  constructor (cfg = {}) {
    if (NGN.typeof(cfg) === 'model') {
      cfg = { model: cfg }
    } else if (!cfg.model || NGN.typeof(cfg.model) !== 'model') {
      throw new InvalidConfigurationError('Missing or invalid "model" configuration property.')
    }

    super(cfg)

    Object.defineProperties(this, {
      /**
       * @cfgproperty {string} [name]
       * A descriptive name for the store. This is typically used for
       * debugging, logging, and (somtimes) data proxies.
       */
      name: NGN.const(NGN.coalesce(cfg.name, 'Untitled Data Store')),

      METADATA: NGN.private({
        /**
         * @cfgproperty {NGN.DATA.Model} model
         * An NGN Data Model to which data records conform.
         */
        model: cfg.model,

        // Holds the models/records
        records: NGN.private([]),

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
        }
      })
    })

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
    return this.METADATA.model
  }

  set model (value) {
    if (value !== this.METADATA.model) {
      if (NGN.typeof(value) !== 'model') {
        throw new InvalidConfigurationError(`"${this.name}" model could not be set because the value is a ${NGN.typeof(value)} type (requires NGN.DATA.Model).`)
      }

      this.METADATA.model = value
    }
  }

  /**
   * Replace a model.
   * @deprecated 2.0.0
   * @param  {NGN.DATA.Model} newModel
   * The new model.
   */
  replaceModel (newModel) {
    NGN.deprecate(
      () => this.model = newModel,
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
    this.snapshotarchive = NGN.coalesce(this.snapshotarchive, [])

    let data = this.data
    let dataset = {
      timestamp: (new Date()).toISOString(),
      checksum: NGN.DATA.UTILITY.checksum(JSON.stringify(data)).toString(),
      modelChecksums: this.data.map((item) => {
        return NGN.DATA.UTILITY.checksum(JSON.stringify(item)).toString()
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
