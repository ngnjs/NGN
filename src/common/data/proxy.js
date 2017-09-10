'use strict'

/**
 * @class NGN.DATA.Proxy
 * Provides a gateway to remote services such as HTTP and
 * websocket endpoints. This can be used directly to create
 * custom proxies.
 * @fires enabled
 * Triggered when the proxy state changes from a disabled
 * state to an enabled state.
 * @fires disabled
 * Triggered when the proxy state changes from an enabled
 * state to a disabled state.
 * @fires statechange
 * Triggered when the state changes. The new state (enabled/disabled)
 * is passed to the event handler.
 */
class NgnDataProxy extends NGN.EventEmitter {
  constructor (config) {
    config = config || {}

    super(config)

    Object.defineProperties(this, {
      /**
       * @cfgproperty {NGN.DATA.Store} store (required)
       * THe store for data being proxied.
       */
      store: NGN.private(null),

      initialized: NGN.private(false),

      /**
       * @property {boolean} liveSyncEnabled
       * Indicates live sync is active.
       * @readonly
       */
      liveSyncEnabled: NGN.private(false),

      _enabled: NGN.private(true)
    })
  }

  /**
   * @property {string} state
   * Returns the current state (enabled/disabled) of the proxy.
   * @readonly
   */
  get state () {
    return this._enabled ? 'enabled' : 'disabled'
  }

  /**
   * @property {boolean} enabled
   * Indicates the proxy is enabled.
   * @readonly
   */
  get enabled () {
    return this._enabled
  }

  /**
   * @property {boolean} disabled
   * Indicates the proxy is disabled.
   * @readonly
   */
  get disabled () {
    return !this._enabled
  }

  /**
   * @property {string} proxytype
   * The type of underlying data (model or store).
   * @private
   */
  get type () {
    return this.store instanceof NGN.DATA.Store ? 'store' : 'model'
  }

  /**
   * @method enable
   * Changes the state to `enabled`. If the proxy is already
   * enabled, this does nothing.
   */
  enable () {
    if (!this._enabled) {
      this._enabled = true
      this.emit('enabled')
      this.emit('statechange', this.state)
    }
  }

  /**
   * @method disable
   * Changes the state to `disabled`. If the proxy is already
   * enabled, this does nothing.
   */
  disable () {
    if (this._enabled) {
      this._enabled = false
      this.emit('disabled')
      this.emit('statechange', this.state)
    }
  }

  init (store) {
    if (this.initialized) {
      return
    } else {
      this.initialized = true
    }

    this.store = store

    if (store instanceof NGN.DATA.Store) {
      Object.defineProperties(store, {
        changelog: NGN.get(() => {
          return this.changelog
        })
      })
    }
  }

  /**
   * @property changelog
   * A list of the record changes that have occurred.
   * @returns {object}
   * An object is returned with 3 keys representative of the
   * action taken:
   *
   * ```js
   * {
   *   create: [NGN.DATA.Model, NGN.DATA.Model],
   *   update: [NGN.DATA.Model],
   *   delete: []
   * }
   * ```
   *
   * The object above indicates two records have been created
   * while one record was modified and no records were deleted.
   * **NOTICE:** If you add or load a JSON object to the store
   * (as opposed to adding an instance of NGN.DATA.Model), the
   * raw object will be returned. It is also impossible for the
   * data store/proxy to determine if these have changed since
   * the NGN.DATA.Model is responsible for tracking changes to
   * data objects.
   * @private
   */
  get changelog () {
    const me = this

    if (this.store === null && !(this instanceof NGN.DATA.Store)) {
      return []
    }

    return {
      create: this.store._created,
      update: this.store.records.filter(function (record) {
        if (me.store._created.indexOf(record) < 0 && me.store._deleted.indexOf(record) < 0) {
          return false
        }
        return record.modified
      }).map(function (record) {
        return record
      }),
      delete: this.store._deleted
    }
  }

  save () {

  }

  fetch () {
    console.warn('Fetch should be overridden by a proxy implementation class.')
  }

  /**
   * @method enableLiveSync
   * Live synchronization monitors the dataset for changes and immediately
   * commits them to the data storage system.
   * @fires live.create
   * Triggered when a new record is persisted to the data store.
   * @fires live.update
   * Triggered when a record modification is persisted to the data store.
   * @fires live.delete
   * Triggered when a record is removed from the data store.
   */
  enableLiveSync () {
    if (this.liveSyncEnabled) {
      return
    }

    this.liveSyncEnabled = true

    if (this.type === 'model') {
      // Basic CRUD (-R)
      this.store.on('field.create', this.createModelRecord)
      this.store.on('field.update', this.updateModelRecord)
      this.store.on('field.remove', this.deleteModelRecord)

      // relationship.create is unncessary because no data is available
      // when a relationship is created. All related data will trigger a
      // `field.update` event.
      this.store.on('relationship.remove', this.deleteModelRecord)
    } else {
      // Persist new records
      this.store.on('record.create', this.createStoreRecord)
      this.store.on('record.restored', this.createStoreRecord)

      // Update existing records
      this.store.on('record.update', this.updateStoreRecord)

      // Remove old records
      this.store.on('record.delete', this.deleteStoreRecord)
      this.store.on('clear', this.clearStoreRecords)
    }
  }

  /**
   * @method createModelRecord
   * This method is used to create a record from a NGN.DATA.Model source.
   * This method is used as a part of the #enableLiveSync process.
   * Overriding this method will customize the functionality of the
   * live sync feature.
   * @private
   */
  createModelRecord () {
    this.shouldOverride('createModelRecord')
  }

  /**
   * @method updateModelRecord
   * This method is used to update a record from a NGN.DATA.Model source.
   * This method is used as a part of the #enableLiveSync process.
   * Overriding this method will customize the functionality of the
   * live sync feature.
   * @private
   */
  updateModelRecord () {
    this.shouldOverride('updateModelRecord')
  }

  /**
   * @method deleteModelRecord
   * This method is used to delete a record from a NGN.DATA.Model source.
   * This method is used as a part of the #enableLiveSync process.
   * Overriding this method will customize the functionality of the
   * live sync feature.
   * @private
   */
  deleteModelRecord () {
    this.shouldOverride('deleteModelRecord')
  }

  /**
   * @method createStoreRecord
   * This method is used to create a record from a NGN.DATA.Store source.
   * This method is used as a part of the #enableLiveSync process.
   * Overriding this method will customize the functionality of the
   * live sync feature.
   * @private
   */
  createStoreRecord () {
    this.shouldOverride('createStoreRecord')
  }

  /**
   * @method updateStoreRecord
   * This method is used to create a record from a NGN.DATA.Store source.
   * This method is used as a part of the #enableLiveSync process.
   * Overriding this method will customize the functionality of the
   * live sync feature.
   * @private
   */
  updateStoreRecord () {
    this.shouldOverride('updateStoreRecord')
  }

  /**
   * @method deleteStoreRecord
   * This method is used to create a record from a NGN.DATA.Store source.
   * This method is used as a part of the #enableLiveSync process.
   * Overriding this method will customize the functionality of the
   * live sync feature.
   * @private
   */
  deleteStoreRecord () {
    this.shouldOverride('deleteStoreRecord')
  }

  /**
   * @method clearStoreRecords
   * This method is used to remove all records from a NGN.DATA.Store source.
   * This method is used as a part of the #enableLiveSync process.
   * Overriding this method will customize the functionality of the
   * live sync feature.
   * @private
   */
  clearStoreRecords () {
    this.shouldOverride('clearStoreRecords')
  }

  /**
   * @method proxyRecordFilter
   * This is a filter method for the NGN.DATA.Store.
   * It will strip out records that shouldn't be saved/fetched/etc.
   * As a result, the NGN.DATA.Store#records will only return records that
   * the proxy should work on, i.e. anything not explicitly prohibited by
   * NGN.DATA.Model#proxyignore.
   */
  proxyRecordFilter (model) {
    if (model.hasOwnProperty('proxyignore')) {
      return !model.proxyignore
    }

    return true
  }

  static shouldOverride (methodName) {
    console.warn(methodName + ' should be overridden by a proxy implementation class.')
  }
}

NGN.DATA.Proxy = NgnDataProxy
// Object.defineProperty(NGN.DATA, 'Proxy', NGN.const(NgnDataProxy))
