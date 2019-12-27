import NGN from '../core.js'
import EventEmitter from '../emitter/core.js'

/**
 * @class NGN.DATA.TransactionLog
 * The transaction log is a history/changelog. It can be used to revert values
 * to a prior state or (in limited cases) restore values.
 *
 * The transaction log is based on a commit log and cursor. The commit log
 * is an ordered list of values. The cursor is a position within the log.
 *
 * **How it Works:**
 *
 * The most common purpose of a transaction log is to revert changes (undo).
 * This is accomplished with the #rollback method.
 *
 * The #rollback method does not remove records, nor does the #advance.
 * The methods repositions the log cursor. Only #commit activities actually
 * modify the log.
 *
 * For example, a log containing 5 committed records will have the cursor set to
 * the latest entry by default:
 *
 * ```
 * [1, 2, 3, 4, 5]
 *              ^
 * ```
 *
 * Executing rollback(2) moves the cursor "back" two positions, from `5` to
 * `3`.
 *
 * ```
 * [1, 2, 3, 4, 5]
 *        ^
 * ```
 *
 * At this point, no records have been removed. It would still be
 * possible to #advance the cursor forward to `4` or `5`. However; once a
 * #commit is executed, all logs _after_ the cursor are removed before the new
 * transaction is committed to the log.
 *
 * ```
 * [1, 2, 3] // Commit removes [4, 5]
 *        ^
 *
 * [1, 2, 3, 6] // Commit commits new entry and advances cursor.
 *           ^
 * ```
 *
 * It is also possible to immediately #flush the log without requiring a new
 * #commit. This will immediately remove all log entries after the
 * current cursor position.
 */
export default class NGNTransactionLog extends EventEmitter { // eslint-disable-line
  /**
   * Create a new transaction log.
   * @param  {number} [maxEntryCount=10]
   * The maximum number of entries to keep in the log. Set this to `-1` to keep
   * an unlimited number of logs.
   */
  constructor (maxEntryCount) {
    super()

    Object.defineProperties(this, {
      METADATA: NGN.private({
        transaction: {},
        changeOrder: [],
        cursor: null,
        max: NGN.coalesce(maxEntryCount, 10)
      })
    })
  }

  get length () {
    return this.METADATA.changeOrder.length
  }

  /**
   * @property {Symbol} cursor
   * The active cursor of the log.
   */
  get cursor () {
    return this.METADATA.cursor
  }

  set cursor (value) {
    if (value !== null && !this.METADATA.transaction.hasOwnProperty(value)) {
      throw new Error('Cannot set cursor for transaction log (does not exist).')
    }

    this.METADATA.cursor = value
  }

  /**
   * @property {any} currentValue
   * Returns the value at the current cursor position.
   */
  get currentValue () {
    if (this.METADATA.cursor === null) {
      return undefined
    }

    return this.getCommit(this.METADATA.cursor).value
  }

  /**
   * @property {Number}
   * The index of the log entry at the current cursor position.
   */
  get cursorIndex () {
    if (this.METADATA.cursor === null) {
      return undefined
    }

    return this.METADATA.changeOrder.indexOf(this.METADATA.cursor)
  }

  /**
   * Add a new value to the transaction log.
   * @param {Any} value
   * The value to assign to the log (record).
   * @return {Number}
   * Returns the transaction number
   * @fires log {Symbol}
   * Fires a log event with the transaction ID (symbol) for reference.
   */
  commit (value) {
    let id = typeof value === 'symbol' ? Symbol(String(value)) : Symbol(NGN.coalesce(value, NGN.typeof(value)).toString())

    this.METADATA.transaction[id] = [
      new Date(),
      value
    ]

    this.flush()

    this.METADATA.changeOrder.push(id)
    this.METADATA.cursor = id

    if (this.METADATA.max > 0 && this.METADATA.changeOrder.length > this.METADATA.max) {
      let removedId = this.METADATA.changeOrder.shift()
      delete this.METADATA.transaction[removedId]
    }

    this.emit('commit', id, null)

    return id
  }

  /**
   * Return the entry for the specified commit ID.
   * @param  {Symbol} id
   * The transaction ID.
   * @return {Object}
   * Returns an object with `timestamp` and `value` keys.
   */
  getCommit (id = null) {
    if (!this.METADATA.transaction.hasOwnProperty(id)) {
      return undefined
    }

    return {
      timestamp: this.METADATA.transaction[id][0],
      value: this.METADATA.transaction[id][1]
    }
  }

  /**
   * Remove all transaction log entries from the current cursor onward.
   */
  flush () {
    if (this.METADATA.cursor === null) {
      return
    }

    let position = this.METADATA.changeOrder.indexOf(this.METADATA.cursor)

    // If the whole log is cleared, reset it silently.
    if (position === 0) {
      return
    }

    let removedEntries = this.METADATA.changeOrder.splice(position + 1)

    for (let i = 0; i < removedEntries.length; i++) {
      delete this.METADATA.transaction[removedEntries[i]]
    }

    this.METADATA.cursor = this.METADATA.changeOrder[this.METADATA.changeOrder.length - 1]
  }

  /**
   * Rollback the log to the specified index/cursor.
   * @param  {Number|Symbol} [index=1]
   * The index may be a number or a commit ID (symbol).
   *
   * **Specifying a number** will rollback the log by the specified number of
   * commits. By default, the index is `1`, which is the equivalent of a simple
   * "undo" operation. Specifying `2` would "undo" two operations. Values less
   * than or equal to zero are ignored. Values greater than the total number of
   * committed transactions trigger a reset.
   *
   * **Specifying a symbol** will rollback the log to the specified commit log
   * (the symbol is the commit log ID).
   * @fires rollback {Object}
   * This fires a `rollback` event containing the active cursor.
   * @return {Symbol}
   * Returns the active cursor upon completion of rollback.
   */
  rollback (index = 1) {
    // If the log is empty, ignore the rollback
    if (this.METADATA.changeOrder.length === 0) {
      return null
    }

    if (typeof index === 'symbol') {
      this.cursor = index
      return index
    }

    if (index >= this.METADATA.changeOrder.length) {
      this.METADATA.cursor = this.METADATA.changeOrder[0]
    } else {
      // Make sure the index is a symbol
      if (typeof index === 'number') {
        if (index <= 0) {
          return this.METADATA.cursor
        }

        let currentPosition = this.METADATA.changeOrder.indexOf(this.METADATA.cursor)
        currentPosition -= index

        if (currentPosition <= 0) {
          currentPosition = 0
        }

        index = this.METADATA.changeOrder[currentPosition]
      }

      this.METADATA.cursor = index
    }

    this.emit('rollback', this.METADATA.cursor, null)

    return this.METADATA.cursor
  }

  /**
   * Advance the log to the specified index/cursor.
   * @param  {Number|Symbol} [index=1]
   * The index may be a number or a commit ID (symbol).
   *
   * **Specifying a number** will advance the log by the specified number of
   * commits. By default, the index is `1`, which is the equivalent of a simple
   * "redo" operation. Specifying `2` would "redo" two operations. Values less
   * than or equal to zero are ignored. Values greater than the total number of
   * committed transactions will advance the cursor to the last entry.
   *
   * **Specifying a symbol** will advance the log to the specified commit log
   * record (the symbol is the commit log ID).
   * @fires advance {Object}
   * This fires a `advance` event containing the active cursor.
   * @return {Symbol}
   * Returns the active cursor upon completion of rollback.
   */
  advance (index = 1) {
    // If the log is empty, ignore the rollback
    if (this.METADATA.changeOrder.length === 0) {
      return null
    }

    // Make sure the index is a symbol
    if (typeof index === 'number') {
      if (index <= 0) {
        return this.METADATA.cursor
      }

      let currentPosition = this.METADATA.changeOrder.indexOf(this.METADATA.cursor)
      currentPosition += index

      if (currentPosition >= this.METADATA.changeOrder.length) {
        currentPosition = this.METADATA.changeOrder.length - 1
      }

      index = this.METADATA.changeOrder[currentPosition]
    }

    this.METADATA.cursor = index

    this.emit('advance', this.METADATA.cursor, null)

    return this.METADATA.cursor
  }

  /**
   * Clear the transaction log.
   */
  reset (suppressEvents = false) {
    this.METADATA.transaction = {}
    this.METADATA.changeOrder = []
    this.METADATA.cursor = null

    if (!suppressEvents) {
      this.emit('reset')
    }
  }

  /**
   * @property {Array} log
   * Returns the entire log, in ascending historical order (oldest first).
   * This may be a time-consuming operation if the log is large.
   *
   * **Example:**
   *
   * ```js
   * [{
   *   timestamp: Date,
   *   value: 'some value'
   * },{
   *   timestamp: Date,
   *   value: 'some other value'
   * }]
   */
  get log () {
    return this.METADATA.changeOrder.map(entry => {
      return {
        timestamp: this.METADATA.transaction[entry][0],
        value: this.METADATA.transaction[entry][1],
        activeCursor: this.METADATA.cursor === entry
      }
    })
  }
}
