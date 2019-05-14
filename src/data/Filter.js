import EventEmitter from '../emitter/core'

/**
 * @class NGN.DATA.Filter
 * Filters can be applied to NGN.DATA.Store objects to filter
 * records out of the resultset. A store can have any number of
 * filters applied.
 *
 * Typically this class is not invoked directly. A more common
 * approach is to create the filters using the filtering methods
 * found in the NGN.DATA.Store class.
 * @fires enabled
 * Fired when the filter changes state from `disabled` to `enabled`
 * @fires disabled
 * Fired when the filter changes state from `enabled` to `disabled`
 * @fires renamed
 * Fired when the name of the filter changes.
 */
export default class NGNDataFilter extends EventEmitter { // eslint-disable-line
  /**
   * Create a filter function
   * @param {string} [name]
   * The name of the filter. This can be used to reference the filter,
   * and it will also be displayed in any error messages related to filtering.
   * @param {function}  filterFn
   * The function used to filter out a record. This method should return
   * `true` when the record should **remain** in the result set.
   * Returning `false` means the record _should not remain_ in
   * result set (filter out).
   * @param {Boolean} [enabled=true]
   * Indicates the filter should be enforced/applied.
   */
  constructor (name, filterFn, enabled = true) {
    if (NGN.isFn(name)) {
      enabled = NGN.type(filterFn) === 'boolean' ? filterFn : enabled
      filterFn = name
      name = `Filter_${filterFn.toString().length}${(new Date()).getTime()}`
    }

    // If the filter is not a function, convert it to one.
    // if (!NGN.isFn(filterFn)) {
    //
    // }

    super()

    const me = this

    Object.defineProperties(this, {
      recordUpdates: NGN.private(new Map()),
      filterName: NGN.private(name),
      fn: NGN.private(filterFn),
      active: NGN.private(enabled),
      filteredRecords: NGN.private({}),
      filteredRecordStores: NGN.private(new Map()),
      clean: NGN.privateconst(function () {
        for (let i = 0; i < arguments.length; i++) {
          let store = arguments[0]
          if (store instanceof NGN.DATA.Store) {
            me.filteredRecordStores.set(store.OID, store)
            me.filteredRecords[store.OID] = new Set()
          } else {
            throw new Error('Cannot clean filter for an unrecognized data store.')
          }
        }
      }),
      clearFilter: NGN.privateconst(function () {
        let stores = arguments.length > 0 ? Array.from(arguments).map(store => store.OID) : Object.keys(me.filteredRecords)

        stores.forEach(storeOID => {
          let store = me.filteredRecordStores.get(storeOID)

          if (store) {
            me.filteredRecords[storeOID].forEach(recordOID => {
              store.PRIVATE.ACTIVERECORDS.set(recordOID, store.PRIVATE.FILTEREDRECORDS.get(recordOID))
              store.PRIVATE.FILTEREDRECORDS.delete(recordOID)
            })
          } else {
            NGN.WARN(`An attempt to remove ${this.name} filter occurred for a NGN.DATA.Store that could not be found or does not exist.`)
          }
        })

        this.active = false
      }),
      STORE_EVENT: NGN.privateconst(Symbol(`monitor.store.event-${name}-filter`)),
      // When the store is disabled, restore the records to the active list.
      deactivate: NGN.privateconst(() => {
        NGN.INFO('filter.disable', `Disabling "${this.name}"`)

        this.filteredRecordStores.forEach(store => {
          this.filteredRecords[store.OID].forEach(recordOID => {
            let recordIndex = store.indexOf(recordOID)

            if (recordIndex < 0) {
              console.log('Record DNE?');
              this.filteredRecords[store.OID].delete(recordOID)
            } else {
              store.PRIVATE.ACTIVERECORDS.set(recordOID, store.indexOf(recordOID))
              store.PRIVATE.FILTEREDRECORDS.delete(recordOID)
            }
          })
        })

        this.active = false
      }),
      // When the store is enabled, reapply the filter.
      activate: NGN.privateconst(() => {
        NGN.INFO('filter.enable', `Enabling "${this.name}"`)
        this.filteredRecordStores.forEach(store => {
          // Support updates that occured while filter was inactive.
          if (this.recordUpdates.has(store.OID)) {
            this.recordUpdates.get(store.OID).forEach(recordOID => {
              if (store.PRIVATE.RECORDMAP.has(recordOID)) {
                this.exec(store.METADATA.records[store.PRIVATE.RECORDMAP.get(recordOID)])
              }
            })

            this.recordUpdates.get(store.OID).clear()
          }

          // Refilter known records
          this.filteredRecords[store.OID].forEach(recordOID => {
            if (!this.recordUpdates.has(store.OID) || !this.recordUpdates.get(store.OID).has(recordOID)) {
              // Add the record to the store's filtered recordset
              store.PRIVATE.FILTEREDRECORDS.set(recordOID, store.indexOf(recordOID))

              // Remove the filtered record from the store's active record set.
              store.PRIVATE.ACTIVERECORDS.delete(recordOID)
            }
          })
        })

        this.active = true
      })
    })

    // Monitor data changes
    this.on(this.STORE_EVENT, payload => {
      if (!this.recordUpdates.has(payload.record.store.OID)) {
        this.recordUpdates.set(payload.record.store.OID, new Set())
      }

      switch (payload.event) {
        case 'record.create':
          if (!this.active) {
            this.recordUpdates.get(payload.record.store.OID).add(payload.record.OID)
          } else {
            this.exec(payload.record)
          }
          break

        case 'record.delete':
          if (!this.active) {
            this.recordUpdates.get(payload.record.store.OID).add(payload.record.OID)
          } else if (this.filteredRecords.hasOwnProperty(payload.record.store.OID)) {
            this.filteredRecords[payload.record.store.OID].delete(payload.record.OID)
          }
          break

        case 'record.update':
          if (!this.active) {
            this.recordUpdates.get(payload.record.store.OID).add(payload.record.OID)
          } else {
            let filtered = this.filteredRecords[payload.record.store.OID].get(payload.record.OID)
            let retained = this.exec(payload.record)

            if (retained && filtered) {
              this.filteredRecords[payload.record.store.OID].delete(payload.record.OID)

              payload.record.store.PRIVATE.ACTIVERECORDS.set(payload.record.OID, payload.record.store.PRIVATE.FILTEREDRECORDS.get(payload.record.OID))
              payload.record.store.PRIVATE.FILTEREDRECORDS.delete(payload.record.OID)
            }
          }

          break

        default:
          NGN.WARN(`"${payload.event}" is not handled by filter functions.`)
      }
    })
  }

  get applied () {
    return this.active
  }

  get name () {
    return this.filterName
  }

  set name (value) {
    if (value !== this.filterName) {
      let old = this.filterName
      this.filterName = value
      this.emit('renamed', { old, new: value })
    }
  }

  get enabled () {
    return this.active
  }

  set enabled (value) {
    value = NGN.forceBoolean(value)

    if (value !== this.active) {
      if (value) {
        this.enable()
      } else {
        this.disable()
      }
    }
  }

  get disabled () {
    return !this.active
  }

  set disabled (value) {
    value = !NGN.forceBoolean(value)

    if (value !== !this.active) {
      if (!value) {
        this.enable()
      } else {
        this.disable()
      }
    }
  }

  enable () {
    if (!this.active) {
      this.activate()
      this.emit('enabled')
    }
  }

  disable () {
    if (this.active) {
      this.deactivate()
      this.emit('disabled')
    }
  }

  /**
   * Apply the filter to the store. If the filter is disabled, it will
   * be added to the store, but not enforced (i.e. it will do nothing until
   * it is enabled).
   * @param  {NGN.DATA.Store} store
   * The NGN.DATA.Store to apply the filter to.
   */
  apply (store) {
    store.addFilter(this)
  }

  /**
   * Run the filter function against a record.
   * @param  {NGN.DATA.Model} record
   * The record to process.
   * @return {boolean}
   * Returns `true` if filtered or `false` if unfiltered.
   * @private
   */
  exec (record) {
    if (!this.active) {
      return false
    }

    if (!record) {
      throw new Error('Cannot execute filter against a null/undefined record.')
    }

    if (!record.METADATA) {
      record = record.store.getRecord(record.OID)
    }

    const store = record.METADATA.store

    if (store === null || store === undefined) {
      throw new Error('Cannot filter a record which is not part of a store: \n' + JSON.stringify(record.data, null, 2))
    }

    let retain = this.fn(record)

    if (!retain) {
      if (!this.filteredRecords.hasOwnProperty(store.OID)) {
        this.filteredRecords[store.OID] = new Set()
        this.filteredRecordStores.set(store.OID, store)

        let me = this
        store.on('record.*', function (storeRecord) {
          me.delayEmit(me.STORE_EVENT, 0, {
            event: this.event,
            record: storeRecord
          }) // Specify 0 to emit on the next event loop, assuring the record is written to memory before handling the event.
        })
      }

      // Store references to the filtered records
      this.filteredRecords[store.OID].add(record.OID)

      // Add the record to the store's filtered recordset
      store.PRIVATE.FILTEREDRECORDS.set(record.OID, store.indexOf(record.OID))

      // Remove the filtered record from the store's active record set.
      store.PRIVATE.ACTIVERECORDS.delete(record.OID)
    }

    return retain
  }

  /**
   * Clear the filtered records.
   * @param {NGN.DATA.Store[]} stores
   * Optionally provide known stores as arguments.
   * All stores are cleared of this filter by default.
   */
  clear () {
    if (!this.active) {
      return
    }

    this.clearFilter(...arguments)
  }

  /**
   * Purge the cached record filter.
   * @param {NGN.DATA.Store[]} stores
   * Optionally provide known stores as arguments.
   * All stores are cleared of this filter by default.
   * @private
   */
  purge () {
    if (arguments.length === 0) {
      this.filteredRecords = {}
      this.filteredRecordStores = new Map()
      return
    }

    let stores = Array.from(arguments).map(store => store.OID)

    stores.forEach(storeOID => {
      delete this.filteredRecords[storeOID]
      this.filteredRecordStores.delete(storeOID)
    })
  }

  destroy () {
    this.clearFilter(...arguments)

    let args = Array.from(arguments)
    let stores = args.length === 0 ? Array.from(this.filteredRecordStores).map(item => item[1]) : args

    stores.forEach(store => store.METADATA.filters.delete(this.name))
  }
}
