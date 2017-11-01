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
