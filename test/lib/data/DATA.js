(function () {
  // [PARTIAL]

// CRC table for checksum (cached)
let crcTable = null

/**
 * Generate the CRC table for checksums. This is a fairly complex
 * operation that should only be executed once and cached for
 * repeat use.
 */
const makeCRCTable = function () {
  let c
  let crcTable = []

  for (let n = 0; n < 256; n++) {
    c = n

    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1))
    }

    crcTable[n] = c
  }

  return crcTable
}

/**
 * @class NGN.DATA.UTILITY
 * A utility library of functions relevant to data management.
 */
class Utility {
  /**
   * @method checksum
   * Create the checksum of the specified string.
   * @param  {string} content
   * The content to generate a checksum for.
   * @return {string}
   * Generates a checksum value.
   */
  static checksum (str) {
    if (typeof str === 'object') {
      str = JSON.stringify(this.serialize(str))
    }

    if (!crcTable) {
      crcTable = makeCRCTable()
    }

    let crc = 0 ^ (-1)

    for (let i = 0; i < str.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF]
    }

    return (crc ^ (-1)) >>> 0
  }

  /**
   * @method UUID
   * Generate a universally unique identifier (v4).
   *
   * This is a "fast" UUID generator, designed to work in the browser.
   * This will generate a UUID in less than 20ms on Chrome, as of Nov 6, 2017.
   * Code courtesy of @broofa on StackOverflow.
   *
   * While this method cannot absolutely guarantee there will be no collisions
   * (duplicates), the chances are 1:5.3x10^^36 (1 in over 100 quadrillion).
   * You are over 30 _octillion_ times more likely to win the Powerball than to
   * generate two identical "random" UUIDs using the version 4 scheme.
   * @return {string}
   * Returns a [V4 GUID](https://en.wikipedia.org/wiki/Universally_unique_identifier#Version_4_.28random.29).
   */
  static UUID () {
    return NGN.nodelike ? this.GUID() : ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }

  /**
   * @method GUID
   * Generate a globally unique identifier. A GUID is the Microsoft
   * implementation of a UUIDv4.
   *
   * The likelihood of an ID collision, according to the original author (Jeff
   * Ward) is 1:3.26x10^15 (1 in 3.26 quadrillion). Results are generated between
   * approximately 105ms (Desktop) and 726ms (Android) as of May 2016.
   * @return {string} [description]
   */
  static GUID () {
    let lut = []

    for (let i = 0; i < 256; i++) {
      lut[i] = (i < 16 ? '0' : '') + (i).toString(16)
    }

    const d0 = Math.random() * 0xffffffff | 0
    const d1 = Math.random() * 0xffffffff | 0
    const d2 = Math.random() * 0xffffffff | 0
    const d3 = Math.random() * 0xffffffff | 0

    return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] +
      '-' + lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] +
      lut[d1 >> 24 & 0xff] + '-' + lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' +
      lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] + lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] +
      lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff]
  }

  /**
   * @method serialize
   * Creates a JSON data object with no functions. Only uses enumerable
   * attributes of the object.
   *
   * Functions & Setters are always ignored. Getters are evaluated recursively
   * until a simple object type is found or there are no further nested
   * attributes.
   * @param {object|array} object
   * Supports an object or array.
   */
  static serialize (data) {
    if (typeof data !== 'object') {
      throw new Error(`Cannot serialize ${NGN.typeof(data)} value. Must be an object.`)
    }

    // Force an object for parsing
    let SERIALIZED_ARRAY_DATA = Symbol('array.data')

    if (NGN.typeof(data) === 'array') {
      data = {
        [SERIALIZED_ARRAY_DATA]: data
      }
    }

    let result = {}
    let attribute = Object.keys(data)

    for (let i =0; i < attribute.length; i++) {
      if (data[attribute[i]] !== undefined) {
        switch (NGN.typeof(data[attribute[i]])) {
          case 'object':
            Object.defineProperty(
              result,
              attribute[i],
              NGN.public(NGN.DATA.UTIL.serialize(data[attribute[i]]))
            )

            break

          case 'array':
            result[attribute[i]] = []

            for (let a = 0; a < data[attribute[i]].length; a++) {
              result[attribute[i]].push(NGN.DATA.UTIL.serialize(data[attribute[i]]))
            }

            break

          case 'date':
            Object.defineProperty(result, attribute[i], NGN.public(data[attribute[i]].toISOString()))

            break

          case 'symbol':
            if (SERIALIZED_ARRAY_DATA === attribute[i]) {
              break
            }

          case 'regexp':
            Object.defineProperty(result, attribute[i], NGN.public(data[attribute[i]].toString()))

            break

          case 'function':
            break

          default:
            result[attribute[i]] = data[attribute[i]]
        }
      }
    }

    return result[SERIALIZED_ARRAY_DATA] !== undefined ? result[SERIALIZED_ARRAY_DATA] : result
  }
}

// /**
//  * @method objectByteSize
//  * Calculates the _estimated_ size (in bytes) of primitive key/value objects,
//  * meaning those that do not contain functions, accessors (getters/setters),
//  * or other attributes other than `String`, `Number`, or `Boolean` values.
//  * NGN treats dates as `String` values.
//  *
//  * JavaScript engines differ in how they manage memory, but most do not
//  * calculate the size of functions. If a value of type `function` is found in
//  * the object, NGN will calculate the size of it's `String` representation.
//  * This is a weak measure of function size since most JavaScript engines
//  * do not expose enough realtime heap data to know calculate with accuracy at
//  * any given point in time.
//  *
//  * This method attempts to implement similar principles to C's `sizeOf` method.
//  *
//  * Consider this method to provide a **best guess based on the data we have
//  * available**.
//  *
//  * @param {Object} object
//  * The primitive key/value object upon which the bytesize estimation will be made.
//  * @param {Boolean} [ignoreFunctionEstimate=false]
//  * By default, NGN will calculate the `String` representation of any functions
//  * it encounters in the key/value object. Setting this to `true` will prevent
//  * this behavior, effectively using a `0` to calculate function size.
//  */
// objectByteSize: NGN.const(function (obj, ignore=false) {
//   switch (typeof obj) {
//     case 'string':
//       return obj.length * 2
//
//     case 'boolean':
//       return 4
//
//     case 'number':
//       return 8
//
//     case 'function':
//       if (!ignore) {
//         return obj.toString().length * 2
//       }
//
//       return 0
//   }
//
//   let list = []
//   let stack = [obj]
//   let bytes = 0
//
//   while (stack.length) {
//     let value = stack.pop()
//
//     if (typeof value === 'object') {
//       if (list.indexOf(value) < 0) {
//         list.push(value)
//
//         // If the object is not an array, add key sizes
//         const isArray = !Array.isArray(value)
//
//         for (let key in value) {
//           if (!isArray) {
//             bytes += (2 * key.length) + NGN.DATA.util(value[key])
//             stack.push(value[key])
//           } else {
//
//           }
//         }
//       }
//     } else {
//       bytes += NGN.DATA.util.objectByteSize(value)
//     }
//   }
//
//   return bytes
// })

  // [PARTIAL]

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
class NGNTransactionLog extends NGN.EventEmitter {
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
    let id = typeof value === 'symbol' ? Symbol('generic.commit') : Symbol(NGN.coalesce(value, NGN.typeof(value)).toString())

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

  // [PARTIAL]

/**
  * @class NGN.DATA.Rule
  * A data validation rule.
  * @param {String} field
  * The data field to test.
  * @param {Function/String[]/Number[]/Date[]/RegExp/Array} validator
  *
  * @fires validator.add
  */
class NGNDataValidationRule {
  /**
   * Create a new data rule.
   * @param {Function/String[]/Number[]/Date[]/RegExp/Array} rule
   * * When rule is a _function_, the value is passed to it as an argument.
   * * When rule is a _String_, the value is compared for an exact match (case sensitive)
   * * When rule is a _Number_, the value is compared for equality.
   * * When rule is a _Date_, the value is compared for exact equality.
   * * When rule is a _RegExp_, the value is tested and the results of the RegExp#test are used to validate.
   * * When rule is an _Array_, the value is checked to exist in the array, regardless of data type. This is treated as an `enum`.
   * * When rule is _an array of dates_, the value is compared to each date for equality.
   * @param {string} [name]
   * An optional name for the rule. This can be useful when debugging data issues.
   * @param {object} [scope]
   * Aplpy a custom scope to the validation functions (applicable to custom methods only).
   */
  constructor (validation, name = null, scope = null) {
    const RULE_INSTANCE = Symbol('rule')
    const type = NGN.typeof(validation)

    Object.defineProperties(this, {
      RULE: NGN.private({
        type: type,
        validator: validation,
        name: NGN.coalesce(name, `Untitled ${type.toUpperCase()} Validation`),
        scope: NGN.coalesce(scope, this)
      })
    })
  }

  get name () {
    return this.RULE.name
  }

  get type () {
    return this.RULE.type
  }

  /**
   * @method test
   * Test a value against the validation rule.
   * @param {any} value
   * The value to test.
   * @returns {boolean}
   * Returns `true` when the value meets the rule expectations and `false` when it does not.
   */
  test (value) {
    if (NGN.isFn(this.RULE.validator)) {
      // Custom enforcement function
      return this.RULE.validator.apply(this.RULE.scope, [value])
    } else {
      switch (this.type) {
        // Enumeration
        case 'array':
          return this.RULE.validator.indexOf(value) !== -1

        // Pattern Matching
        case 'regexp':
          return this.RULE.validator.test(value)

        default:
          return this.RULE.validator === value
      }
    }
  }
}

  // [PARTIAL]
/**
 * @class NGN.DATA.RangeRule
 * A special rule to validate values within one or more ranges.
 * Supports numeric ranges, date ranges, and simple string-based
 * ranges (string length).
 */
class NGNDataRangeValidationRule extends NGNDataValidationRule {
  /**
   * Create a new range rule.
   * @param {string} [name]
   * An optional name for the rule. This can be useful when debugging data issues.
   * @param {object} [scope=null]
   * Apply a custom scope to the validation functions (applicable to custom methods only).
   * @param {Array} [range]
   * An enumeration of acceptable numeric ranges. For example, if
   * the value must be between 5-10 or from 25-50, the configuration
   * would look like:
   *
   * ```js
   * range: [
   *   [5, 10],
   *   ['25-50']
   * ]
   * ```
   *
   * To accept anything below a certain number or anything over a certain
   * number while also specifying one or more ranges, use a `null` value.
   *
   * For example:
   *
   * ```js
   * range: [
   *   [null, 0],
   *   [5, 10],
   *   ['25-50'],
   *   [100, null]
   * ]
   * ```
   *
   * The aforementioned example would accept a value less than `zero`,
   * between `5` and `10`, between `25` and `50`, or over `100`. Therefore,
   * acceptable values could be `-7`, `7`, `25`, `42`,  `10000`, or anything
   * else within the ranges. However, the values `3`, `19`, and `62` would
   * all fail because they're outside the ranges.
   */
  constructor (name, scope, range = []) {
    if (NGN.typeof(scope) === 'array') {
      range = scope
      scope = null
    }

    super(null, name, scope)

    this.RULE.prepareRange = function (value) {
      // If a simple range is specified (single array), format it for the rule processor.
      value = NGN.forceArray(value)

      if (NGN.typeof(value[0]) !== 'array') {
        value = [value]
      }

      for (let i = 0; i < value.length; i++) {
        if (value[i].length !== 2) {
          if (NGN.typeof(value[i][0]) !== 'string') {
            throw new Error(`Invalid range: "${value[i].toString()}"`)
          }

          value[i] = value[i][0].replace(/[^0-9->]/gi, '').split(/->{1,100}/)
        }

        if (NGN.typeof(value[i][0]) !== 'number') {
          value[i][0] = NGN.coalesce(value[i][0], '').replace(/null|none|any/gi, '')
        }

        if (NGN.typeof(value[i][1]) !== 'number') {
          value[i][1] = NGN.coalesce(value[i][1], '').replace(/null|none|any/gi, '')
        }
      }

      return value
    }

    // Initialize the range
    this.RULE.range = new Set()
    this.range = range

    // Create the validation function.
    this.RULE.validator = (value) => {
      let isString = NGN.typeof(value) === 'string'
      let range = this.range

      for (let i = 0; i < range.length; i++) {
        let min = NGN.coalesceb(range[i][0], isString ? value.length : value)
        let max = NGN.coalesceb(range[i][1], isString ? value.length : value)

        if (
          (isString && value.length >= min && value.length <= max) ||
          (!isString && value >= min && value <= max)
        ) {
          return true
        }
      }

      return false
    }
  }

  get range () {
    return Array.from(this.RULE.range.values())
  }

  set range (value) {
    this.RULE.range = new Set()
    this.addRange(value)
  }

  /**
   * Add a range to the rule.
   * @param {array} value
   * A range can be a single array, such as `[min, max]`. An array of arrays is
   * also acceptable, such as `[[min1, max1], [min2, max2]]`.
   */
  addRange (value) {
    value = this.RULE.prepareRange(value)

    for (let i = 0; i < value.length; i++) {
      if (NGN.coalesceb(value[i][0]) !== null && NGN.coalesceb(value[i][1]) !== null && value[i][1] < value[i][0]) {
        throw new Error(`Invalid value "${value[i][0].toString()} -> ${value[i][1].toString()}". Minimum value cannot exceed maximum.`)
      }

      this.RULE.range.add(value[i])
    }
  }

  /**
   * Remove an existing range from the rule.
   * @param {array} value
   * A range can be a single array, such as `[min, max]`. An array of arrays is
   * also acceptable, such as `[[min1, max1], [min2, max2]]`.
   */
  removeRange (value) {
    let range = this.range
    value = this.RULE.prepareRange(value)

    for (let i = 0; i < value.length; i++) {
      for (let x = 0; x < range.length; x++) {
        if (value[i].toString() === range[x].toString()) {
          this.RULE.range.delete(range[x])
        }
      }
    }
  }
}

  // [PARTIAL]

/**
 * @class NGN.DATA.Field
 * Represents a data field to be used in a model/record.
 * @fires hidden
 * Triggered when the field changes from unhidden to hidden.
 * @fires unhidden
 * Triggered when the field changes from hidden to unhidden.
 * @fires update {object}
 * Triggered when the field value is updated. The payload contains
 * an object with old and new values:
 *
 * ```js
 * {
 *   old: 'old value',
 *   new: 'new value'
 * }
 * ```
 * @fires invalid
 * Triggered when a previously valid value becomes invalid.
 * @fires valid
 * Triggered when a previously invalid value becomes valid.
 * @fires rule.add {NGN.DATA.Rule}
 * Triggered when a new validation rule is added. The rule is emitted
 * to event handlers.
 * @fires rule.remove {NGN.DATA.Rule}
 * Triggered when a validation rule is removed. The rule is emitted
 * to event handlers.
 * @fires keystatus.changed {boolean}
 * Triggered when the key (identifier) status changes. The boolean
 * payload indicates whether the field is considered an identifier.
 */
class NGNDataField extends NGN.EventEmitter {
  /**
   * @param {string|object} configuration
   * Accepts an object with all configuration objects, or a string representing
   * the name of the field.
   */
  constructor (cfg) {
    cfg = cfg || {}

    if (typeof cfg === 'string') {
      cfg = {
        name: cfg
      }
    }

    // Validate field configuration values
    if (cfg.hasOwnProperty('pattern') && NGN.typeof(cfg.pattern) !== 'regexp') {
      throw new Error('Invalid data field configuration. Pattern must be a valid JavaScript regular expression (RegExp).')
    }

    if (cfg.type === undefined) {
      if (cfg.default) {
        switch (NGN.typeof(cfg.default)) {
          case 'number':
            cfg.type = Number
            break

          case 'regexp':
            cfg.type = RegExp
            break

          case 'boolean':
            cfg.type = Boolean
            break

          case 'symbol':
            cfg.type = Symbol
            break

          case 'date':
            cfg.type = Date
            break

          case 'array':
            cfg.type = Array
            break

          case 'object':
            cfg.type = Object
            break

          case 'function':
            cfg.type = cfg.default
            break

          default:
            cfg.type = String
        }
      }
    }

    super(cfg)

    const EMPTYDATA = Symbol('empty')

    Object.defineProperties(this, {
      METADATA: NGN.privateconst({
        /**
         * @cfg {boolean} [required=false]
         * Indicates the value is required.
         */
        required: NGN.coalesce(cfg.required, false),

        /**
         * @cfgproperty {boolean} [hidden=false]
         * Indicates the field is hidden (metadata).
         */
        hidden: NGN.coalesce(cfg.hidden, false),

        // Identifies the property as a standard data attribute.
        // Alternative options include `data`, `key`, `join`, `virtual`.
        fieldType: NGN.coalesce(cfg.identifier, false) ? 'key' : 'data',

        isIdentifier: NGN.coalesce(cfg.identifier, false),

        /**
         * @cfg {boolean} [autocorrectInput=true]
         * Attempt to automatically correct data type values. For example,
         * a numeric field receiving a value of `'10'` will automatically
         * convert the input to `10`. Only arrays, numbers, and booleans are
         * supported. See NGN#forceArray, NGN#forceBoolean, and NGN#forceNumber
         * for details.
         */
        autocorrectInput: NGN.coalesce(cfg.autocorrectInput, false),

        /**
         * @cfg {RegExp} [pattern]
         * A pattern, as defined by a standard RegExp, that the data must match.
         */
        pattern: NGN.coalesceb(cfg.pattern),

        /**
         * @cfgproperty {string} name
         * The field name.
         */
        name: NGN.coalesce(cfg.name),

        /**
         * @cfgproperty {string} [sourceName]
         * A source name represents the physical name of an attribute as it
         * would be recognized in a system of record. For example, a field
         * named `firstname` may need to be written to disk/memory as `gn`
         * (commonly used as shorthand for givenName in LDAP environments
         * and relational databases).
         *
         * By specifying `firstname` as the field name and `gn` as the source
         * name, the field will automatically map values from the source
         * to model name and vice versa.
         *
         * For instance, a JSON input may look like:
         *
         * ```js
         * {
         *   "gn": "John",
         *   "sn": "Doe"
         * }
         * ```
         *
         * When this data is applied to the field (or loaded in a
         * NGN.DATA.Model), the field #value for `firstname` would be `John`.
         * If the field #value is changed to `Jill` (i.e.
         * `firstname.value = 'Jill'`), the resulting data set would look like:
         *
         * ```js
         * {
         *   "gn": "Jill",
         *   "sn": "Doe"
         * }
         * ```
         */
        sourceName: NGN.coalesce(cfg.sourceName),

        /**
         * @cfg {any} default
         * The default value of the field when no value is specified.
         */
        default: NGN.coalesce(cfg.default),

        lastValue: Symbol('no.value'),

        /**
         * @cfg {Primitive} [type=String]
         * The JS primitive representing the type of data represented
         * by the field.
         */
        dataType: NGN.coalesce(cfg.type, String),

        /**
         * @cfg {function} [rule[]]
         * A function, or an array of functions, which determine whether the
         * field value is valid or not. These functions receive a single argument
         * (the data value) and must return a Boolean value.
         */
        rules: NGN.coalesce(cfg.rule, cfg.rules, cfg.validators, []),
        violatedRule: null,

        /**
         * @cfg {boolean} [allowInvalid=true]
         * If this is set to `false`, invalid values will throw an error.
         */
        allowInvalid: NGN.coalesce(cfg.allowInvalid, true),

        RAWDATAPLACEHOLDER: EMPTYDATA,
        RAW: EMPTYDATA,
        ENUMERABLE_VALUES: null,
        IS_NEW: true,

        EVENTS: new Set([
          'hidden',
          'unhidden',
          'update',
          'invalid',
          'valid',
          'rule.add',
          'rule.remove'
        ]),

        /**
         * @cfg {boolean} [audit=false]
         * Enable auditing to support #undo/#redo operations. This creates and
         * manages a NGN.DATA.TransactionLog.
         */
        AUDITABLE: NGN.coalesce(cfg.audit, false),

        /**
         * @cfg {Number} [auditMaxEntries=20]
         * The maximum number of historical records to maintain for the field.
         * See NGN.DATA.TransactionLog#constructor for details.
         */
        AUDITLOG: NGN.coalesce(cfg.audit, false)
          ? new NGN.DATA.TransactionLog(NGN.coalesce(cfg.auditMaxEntries, 10))
          : null,

        /**
         * @cfg {NGN.DATA.Model} [model]
         * Optionally specify the parent model.
         */
        model: null,

        // Set the value using a configuration.
        setValue: (value, suppressEvents = false, ignoreAudit = false) => {
          // Attempt to auto-correct input when possible.
          if (this.METADATA.autocorrectInput && this.type !== NGN.typeof(value)) {
            value = this.autoCorrectValue(value)
          }

          // Ignore changes when the value hasn't been modified.
          if (value === this.value) {
            return
          }

          let change = {
            field: this,
            old: typeof this.METADATA.RAW === 'symbol' ? undefined : this.METADATA.RAW,
            new: value
          }

          let priorValueIsValid = this.valid

          this.METADATA.RAW = value

          // Notify when an invalid value is detected.
          if (!this.valid) {
            // If invalid values are explicitly prohibited, throw an error.
            // The value is rolled back before throwing the error so developers may
            // catch the error and continue processing.
            if (!this.METADATA.allowInvalid) {
              this.METADATA.RAW = change.old
              throw new Error(`"${value}" did not pass the ${this.METADATA.violatedRule} rule.`)
            } else {
              change.reason = `"${value}" did not pass the ${this.METADATA.violatedRule} rule.`
              NGN.WARN(change.reason)
            }

            this.emit('invalid', change)
          } else if (!suppressEvents && priorValueIsValid !== null && priorValueIsValid) {
            // If the field BECAME valid (compared to prior value),
            // emit an event.
            this.emit('valid', change)
          }

          if (typeof this.METADATA.lastValue === 'symbol') {
            this.METADATA.lastValue = value
          }

          // If auditing is enabled and not explicitly ignored by an internal
          // operation, commit the change.
          if (!ignoreAudit && !this.virtual && this.METADATA.AUDITABLE) {
            change.cursor = this.METADATA.AUDITLOG.commit(this.METADATA.RAW)
          }

          // Notify when the update is complete.
          if (!suppressEvents) {
            this.emit('update', change)
          }

          // Mark unnecessary code for garbage collection.
          priorValueIsValid = null
          change = null
        },

        // Submit the payload to the parent model (if applicable).
        commitPayload: (payload) => {
          if (this.METADATA.model) {
            payload.action = 'update'
            payload.join = true

            this.increaseMaxListeners(3)
            this.METADATA.model.emit(
              [
                'update',
                `${payload.field}.update`,
                `update.${payload.field}`
              ],
              payload
            )

            payload = null // Mark for garbage collection
          }
        }
      })
    })

    if (NGN.typeof(this.METADATA.rules) !== 'array') {
      this.METADATA.rules = NGN.forceArray(this.METADATA.rules)
    }

    if (this.METADATA.rules.length > 0) {
      for (let i = 0; i < this.METADATA.rules.length; i++) {
        if (NGN.isFn(this.METADATA.rules[i]) && !(this.METADATA.rules[i] instanceof NGN.DATA.Rule)) {
          this.METADATA.rules[i] = new NGN.DATA.Rule(this.METADATA.rules[i], `Custom Rule #${i+1}`)
        }
      }
    }

    // Apply pattern validation if specified.
    if (this.METADATA.dataType === String && this.METADATA.pattern !== null) {
      this.METADATA.rules.unshift(new NGN.DATA.Rule(cfg.pattern, `Pattern Match (${cfg.pattern.toString()})`))
    }

    if (this.METADATA.dataType === Number || this.METADATA.dataType === Date || this.METADATA.dataType === String) {
      if (NGN.objectHasAny(cfg, 'min', 'minimum', 'max', 'maximum')) {
        cfg.range = NGN.forceArray(NGN.coalesce(cfg.range))
        cfg.range.push([NGN.coalesce(cfg.min, cfg.minimum), NGN.coalesce(cfg.max, cfg.maximum)])
      }

      if (cfg.hasOwnProperty('range')) {
        this.METADATA.rules.unshift(new NGN.DATA.RangeRule('Numeric Range', cfg.range))
      }
    }

    /**
     * @cfg {Array} [enum]
     * An enumeration of available values this field is allowed to have.
     */
    if (NGN.objectHasAny(cfg, 'enum', 'enumeration')) {
      this.METADATA.ENUMERABLE_VALUES = new Set(NGN.forceArray(NGN.coalesce(cfg.enum, cfg.enumeration)))
      this.METADATA.rules.push(new NGN.DATA.Rule((value) => this.METADATA.ENUMERABLE_VALUES.has(value), 'Enumerable Values'))
    }

    /**
     * @cfg {Primitive} [type=String]
     * The type should be a JavaScript primitive, class, or constructor.
     * For example, `String`, `Number`, `Boolean`, `RegExp`, `Array`, or `Date`.
     */
    this.METADATA.rules.unshift(
      new NGN.DATA.Rule(
        (value) => NGN.typeof(value) === NGN.typeof(this.METADATA.dataType),
        `${this.type.toUpperCase()} Type Check`
      )
    )

    if (NGN.coalesce(cfg.model) !== null) {
      this.model = cfg.model
    }
  }

  get sourceName () {
    return this.METADATA.sourceName
  }

  get auditable () {
    return this.METADATA.AUDITABLE
  }

  set auditable (value) {
    value = NGN.forceBoolean(value)

    if (value !== this.METADATA.AUDITABLE) {
      this.METADATA.AUDITABLE = value
      this.METADATA.AUDITLOG = value ? new NGN.DATA.TransactionLog() : null
      this.METADATA.AUDITLOG.relay('*', this, 'transaction.')
    }
  }

  /**
   * @property {NGN.DATA.Model} model
   * Represents the model/record the field is associated to.
   * The model may be configured once, after which this property
   * becomes read-only. This will also be read-only if #model is set
   * to a valid value.
   */
  get model () {
    return this.METADATA.model
  }

  set model (value) {
    if (this.METADATA.model === null) {
      if (value instanceof NGN.DATA.Entity) {
        this.METADATA.model = value

        let events = Array.from(this.METADATA.EVENTS.values())
        events.slice(events.indexOf('update'), 1)

        this.on('update', (payload) => this.commitPayload(payload))

        for (let i = 0; i < events.length; i++) {
          this.on(events[i], () => this.METADATA.model.emit(`field.${events[i]}`, ...arguments))
        }
      } else {
        NGN.WARN('Invalid model.')
      }
    } else {
      NGN.WARN('Cannot set model multiple times.')
    }
  }

  /**
   * @property {string} fieldType
   * The type of field.
   */
  get fieldType () {
    return this.METADATA.fieldType
  }

  /**
   * @property {boolean} required
   * Indicates the field must have a non-null value.
   */
  get required () {
    return this.METADATA.required
  }

  set required (value) {
    this.METADATA.required = NGN.forceBoolean(value)
  }

  /**
   * @property {string} type
   * The type of data in string format.
   */
  get type () {
    return NGN.typeof(this.METADATA.dataType)
  }

  /**
   * @property {boolean} hidden
   * Indicates the field should be considered hidden.
   */
  get hidden () {
    return this.METADATA.hidden
  }

  set hidden (value) {
    let originallyHidden = this.hidden
    let currentlyHidden = NGN.forceBoolean(value)

    if (originallyHidden !== currentlyHidden) {
      this.METADATA.hidden = currentlyHidden
      this.emit(originallyHidden ? 'unhidden' : 'hidden')
    }
  }

  /**
   * @property {boolean} virtual
   * Indicates the field should be considered virtual.
   */
  get virtual () {
    return this.METADATA.fieldType === 'virtual'
  }

  /**
   * @property {boolean} identifier
   * Indicates the field is considered an identifier.
   */
  get identifier () {
    return this.METADATA.isIdentifier
  }

  set identifier (value) {
    value = NGN.forceBoolean(value)

    if (value !== this.METADATA.isIdentifier) {
      this.METADATA.isIdentifier = value
      this.emit('keystatus.changed', value)
    }
  }

  get name () {
    return this.METADATA.name
  }

  /**
   * @property {Boolean}
   * Indicates the model is new or does not exist according to the persistence store.
   * @private
   * @readonly
   */
  get isNew () {
    return this.METADATA.IS_NEW
  }

  /**
   * @property {Any} default
   * The default field value.
   */
  get default () {
    return this.METADATA.default
  }

  /**
   * @property {Any} value
   * The value of the field.
   */
  get value () {
    if (typeof this.METADATA.RAW !== 'symbol') {
      return this.METADATA.RAW
    }

    return this.METADATA.default
  }

  set value (value) {
    this.METADATA.setValue(value)
  }

  /**
   * @property silentValue
   * A write-only attribute to set the value without triggering an update event.
   * This is designed primarily for use with live update proxies to prevent
   * endless event loops.
   * @param {any} value
   * The new value of the field.
   * @private
   * @writeonly
   */
  set silentValue (value) {
    this.METADATA.setValue(value, true)
  }

  get modified () {
    if (typeof this.META.lastValue === 'symbol') {
      return false
    }

    return this.METADATA.lastValue !== this.value
  }

  /**
   * @property {boolean} valid
   * Indicates the field value is valid.
   */
  get valid () {
    if (this.required && NGN.coalesce(this.METADATA.RAW) === null) {
      this.METADATA.violatedRule = 'Data Required'
      NGN.WARN(`${this.name} is a required field.`)
      return false
    }

    if (this.METADATA.rules.length > 0) {
      for (let rule = 0; rule < this.METADATA.rules.length; rule++) {
        if (!this.METADATA.rules[rule].test(this.METADATA.RAW)) {
          this.METADATA.violatedRule = this.METADATA.rules[rule].name
          return false
        }
      }
    }

    this.METADATA.violatedRule = null

    return true
  }

  /**
   * @property {String}
   * Name of the rule which was violated.
   */
  get violatedRule () {
    return NGN.coalesce(this.METADATA.violatedRule, 'None')
  }

  /**
   * @property {Array} changelog
   * The changelog returns the underlying NGN.DATA.TransactionLog#log if
   * auditing is available. The array will be empty if auditing is disabled.
   */
  get changelog () {
    if (!this.METADATA.AUDITABLE) {
      NGN.WARN(`The changelog for the ${this.name} field is empty because auditing is disabled.`)
      return []
    }

    return this.METADATA.AUDITLOG.log
  }

  /**
   * @method undo
   * A rollback function to undo changes. This operation affects
   * the changelog (transaction log). To "undo" an "undo", use #redo.
   * @param {number} [OperationCount=1]
   * The number of operations to "undo". Defaults to a single operation.
   * @param {boolean} [suppressEvents=false]
   * Set to `true` to quietly update the value (prevents `update` event from
   * firing).
   */
  undo (count = 1, suppressEvents = false) {
    if (!this.METADATA.AUDITABLE) {
      NGN.WARN(`The undo operation failed on the ${this.name} field because auditing is disabled.`)
      return
    }

    let id = this.METADATA.AUDITLOG.rollback(count)

    // Silently set the value to an older value.
    this.METADATA.setValue(this.METADATA.AUDITLOG.getCommit(id).value, suppressEvents, true)
  }

  /**
   * @method redo
   * A function to reapply known changes. This operation affects
   * the changelog (transaction log).
   *
   * The redo operation only works after an undo operation, but before a new
   * value is committed to the transaction log. In other words, `undo -> redo`
   * will work, but `undo -> update -> redo` will not. For details, see how
   * the NGN.DATA.TransactionLog cursor system works.
   * @param {number} [OperationCount=1]
   * The number of operations to "undo". Defaults to a single operation.
   * @param {boolean} [suppressEvents=false]
   * Set to `true` to quietly update the value (prevents `update` event from
   * firing).
   */
  redo (count = 1, suppressEvents = false) {
    if (!this.METADATA.AUDITABLE) {
      NGN.WARN(`The redo operation failed on the ${this.name} field because auditing is disabled.`)
      return
    }

    let id = this.METADATA.AUDITLOG.advance(count)

    // Silently set the value to a newer value.
    this.METADATA.setValue(this.METADATA.AUDITLOG.getCommit(id).value, suppressEvents, true)
  }

  /**
   * Hide the field.
   */
  hide () {
    this.hidden = true
  }

  /**
   * Unhide the field.
   */
  unhide () {
    this.hidden = false
  }

  /**
   * Do not throw errors whan a value is marked as invalid.
   */
  allowInvalid () {
    this.METADATA.allowInvalid = true
  }

  /**
   * Throw errors whan a value is marked as invalid.
   */
  disallowInvalid () {
    this.METADATA.allowInvalid = false
  }

  /**
   * Attempt to automatically correct a value according to the
   * field's data type.
   * @param  {Any} value
   * The value to attempt to autocorrect.
   * @return {Any}
   * Returns the value after attempting to autocorrect the value.
   */
  autoCorrectValue (value) {
    try {
      switch (this.type) {
        case 'number':
          value = NGN.forceNumber(value)
          break

        case 'boolean':
          value = NGN.forceBoolean(value)
          break

        case 'array':
          value = NGN.forceArray(value)
          break

        case 'string':
          value = value.toString()
          break
      }
    } finally {
      return value
    }
  }
}

  // [PARTIAL]

/**
 * @class NGN.DATA.VirtualField
 * A virtual field is a read-only ephemeral representation of data,
 * generated dynamically.
 * In other words, it's a made up data field that isn't part of what gets stored.
 * The value can be changed at any time, without warning or events. This is most
 * commonly used as an _internal class_ to support virtual fields within data
 * models. Consider the following:
 *
 * **Example:**
 *
 * ```js
 * let Person = new NGN.DATA.Model({
 *   fields: {
 *     dateOfBirth: Date
 *     age: function () {
 *       return YearsApart(new Date(), this.dateOfBirth)
 *     }
 *   }
 * })
 * ```
 *
 * The `age` example above (shorthand syntax) compares the `dateOfBirth` field
 * to the current date, expecting a numeric response. This particular virtual
 * field is useful for calculating a common value on the fly, and it is reusable
 * for any number of instances of the model.
 *
 * This functionality is available by implementing the NGN.DATA.VirtualField.
 * For example, the `age` virtual field would be created as:
 *
 * ```js
 * let age = new NGN.DATA.VirtualField(model, function () {
 *   return YearsApart(new Date(), this.dateOfBirth)
 * })
 * ```
 * @fires cache.clear {NGN.DATA.VirtualField}
 * Fired whenever the cache is cleared. The field is passed as the only argument
 * to event handler functions.
 */
class NGNVirtualDataField extends NGNDataField {
  constructor (cfg) {
    cfg = cfg || {}

    if (!(cfg.model instanceof NGN.DATA.Entity)) {
      NGN.WARN('No model specified for the virtual field to reference.')
    }

    // Remove unnecessary config values
    delete cfg.required
    delete cfg.default
    delete cfg.min
    delete cfg.minimum
    delete cfg.max
    delete cfg.maximum
    delete cfg.range
    delete cfg.rule
    delete cfg.rules
    delete cfg.validators
    delete cfg.pattern

    super(cfg)

    this.METADATA.AUDITABLE = false
    this.METADATA.fieldType = 'virtual'

    /**
     * @cfg {boolean} [cache=true]
     * By default, virtual fields _associated with a model_ will cache results
     * to prevent unnecessary function calls. The cache is cleared whenever a
     * local data field is modified.
     *
     * Caching can substantially reduce processing time in large data sets
     * by calling methods less often. In most use cases, it will provide a
     * substantial performance gain. However; since virtual fields can also
     * leverage variables and methods that are not a part of the data model,
     * caching may prevent the value from updating as expected. While this case
     * may occur less often, it can occur. If you suspect caching is interfering
     * with a virtual field value, it can be disabled by setting this to `false`.
     */
    this.METADATA.caching = NGN.coalesce(cfg.cache, true)

    /**
     * @cfg {NGN.DATA.Model|NGN.DATA.Store|Object} scope
     * The model, store, or object that will be referenceable within the
     * virtual field #method. The model will be available in the `this` scope.
     */
    this.METADATA.scope = NGN.coalesce(cfg.scope, cfg.model, this)

    /**
     * @cfg {Function} method
     * The method used to generate a value.
     * This is an asynchronous method the returns a value (of any type).
     */
    const me = this
    const handlerFn = cfg.method

    this.METADATA.virtualMethod = function () {
      return handlerFn.apply(me.METADATA.scope, ...arguments)
    }

    // Add smart-cache support
    this.METADATA.CACHEKEY = Symbol('no.cache')
    this.METADATA.cachedValue = this.METADATA.CACHEKEY

    // Only add caching support if a model is associated
    if (this.METADATA.caching && this.model) {
      // Create a method for identifying which local data fields
      // need to be monitored (for caching)
      const localFieldPattern = /this(\.(.[^\W]+)|\[['"]{1}(.*)+['"]{1}\])/g

      // Returns a Set of fieldnames used in the virtual function.
      let monitoredFields = new Set()
      let content = handlerFn.toString()
      let iterator = localFieldPattern.exec(content)

      while (iterator !== null) {
        let field = NGN.coalesce(iterator[2], iterator[3])

        if (this.model.METADATA.knownFieldNames.has(field)) {
          monitoredFields.add(field)
        }

        content = content.replace(localFieldPattern, '')
        iterator = localFieldPattern.exec(content)
      }

      this.model.pool('field.', {
        update: (change) => {
          if (monitoredFields.has(change.field.name)) {
            this.METADATA.cachedValue = this.METADATA.CACHEKEY
            this.emit('cache.clear', this)
          }
        },

        remove: (field) => {
          if (monitoredFields.has(field.name)) {
            this.METADATA.cachedValue = this.METADATA.CACHEKEY
            this.emit('cache.clear', this)
            NGN.ERROR(`The ${this.name} virtual field uses the ${field.name} field, which was removed. This virtual field may no longer work.`)
          }
        },

        create: (field) => {
          if (monitoredFields.has(field.name)) {
            this.METADATA.cachedValue = this.METADATA.CACHEKEY
            this.emit('cache.clear', this)
            NGN.INFO(`The ${this.name} virtual field uses the ${field.name} field, which was added.`)
          }
        }
      })
    }
  }

  get auditable () {
    NGN.WARN('Virtual fields do not support the auditable property.')
    return false
  }

  set auditable (value) {
    NGN.WARN('Virtual fields do not support the auditable property.')
  }

  /**
   * @property {any} value
   * This will always return the value of the virtual field, but it may only
   * be _set_ to a synchronous function that returns a value.
   */
  get value () {
    if (this.METADATA.caching) {
      if (this.METADATA.cachedValue !== this.METADATA.CACHEKEY) {
        return this.METADATA.cachedValue
      } else {
        this.METADATA.cachedValue = this.METADATA.virtualMethod()
        return this.METADATA.cachedValue
      }
    }

    return this.METADATA.virtualMethod()
  }

  set value (value) {
    NGN.WARN('Cannot set the value of a virtual field (read only).')
  }

  get required () {
    NGN.WARN('Virtual fields do not support the required property.')
    return false
  }

  set required (value) {
    NGN.WARN('Virtual fields do not support the required property.')
  }

  get isNew () {
    NGN.WARN('Virtual fields do not support the isNew property.')
    return false
  }

  get default () {
    NGN.WARN('Virtual fields do not have default values.')
    return undefined
  }

  set default (value) {
    NGN.WARN('Virtual fields do not have default values.')
    return
  }

  get violatedRule () {
    return 'None'
  }

  get valid () {
    NGN.WARN('Virtual fields are always valid.')
    return true
  }

  get modified () {
    NGN.WARN('modified attribute does nothing on virtual fields.')
    return false
  }

  allowInvalid () {
    NGN.WARN('allowInvalid() unavailable for virtual fields.')
  }

  disallowInvalid () {
    NGN.WARN('disallowInvalid() unavailable for virtual fields.')
  }

  autocorrectInput () {
    NGN.WARN('autocorrectInput() unavailable for virtual fields.')
  }
}

  // [PARTIAL]

/**
 * @class NGN.DATA.Relationship
 * Represents a data field linked to another NGN.DATA.Model or
 * NGN.DATA.Store. This is used for nesting models/stores within a field,
 * supporting creation of complex data structures that are still easy
 * to work with.
 *
 * While there is no limit to how deeply nested fields can be, it is considered
 * a best practice to avoid circular relationships, which can lead to infinite
 * loops when serializing data.
 *
 * Nested models (i.e. records) each have their own data
 * @NGN.DATA.Model#validators, so relationship fields defer all validation to
 * the individual record/model.
 *
 * Relationships using NGN.DATA.Stores behave a little differently, since they
 * represent a collection of data instead of a single record/model. NGN manages
 * [referential integrity](https://en.wikipedia.org/wiki/Referential_integrity)
 * using simplistic
 * [cardinality](https://en.wikipedia.org/wiki/Cardinality_(data_modeling)).
 *
 * Referential integrity & cardinality rules are data modeling principles
 * designed to enforce data quality standards. The nature of JavaScript objects
 * naturally enforces rudimentary data linking/nesting. NGN data relationships
 * build upon this, using proven data modeling principles.
 *
 * This is done, very simply, by using the @cfg#min and @cfg#max configuration
 * options. However; these options don't always need to be enforced, depending
 * on what type of cardniality needs to be achieved.
 *
 * For more information, see the Data Modeling Guide.
 *
 * **Note to self, use this next part in the guide:**
 *
 * There are five (5) common types of cardinality.
 *
 * - **1 => 1**: One-to-One
 * - **0 => 1**: Zero-or-One
 * - **0 => N**: Zero-to-Many
 * - **1 => N**: One-to-Many
 * - **N => N**: Many-to-Many
 *
 * There are also more granular types of cardinality, which are less common in
 * web applications, but often used in data and ETL operations.
 *
 * - **0,1 => 0,N**: Zero-or-One to Zero-or-More
 * - **0,1 => 1,N**: Zero-or-One to One-or-More
 * - ... write the rest in the guide...
 */
class NGNRelationshipField extends NGNDataField {
  constructor (cfg = {}) {
    let type = NGN.typeof(cfg.join)

    // Assure valid configuration
    if (!cfg.join) {
      throw new InvalidConfigurationError('Missing "join" configuration property.')
    } else if (
      ['model', 'store'].indexOf(type) < 0 &&
      (
        type !== 'array' ||
        NGN.typeof(cfg.join[0]) !== 'model'
      )
    ) {
      throw new InvalidConfigurationError(`The join specified is not a valid NGN.DATA.Model, NGN.DATA.Store, or collection. It is a ${NGN.typeof(cfg.join)}"`)
    }

    // Create optional cardinality validations

    // Initialize
    cfg.identifier = false
    super(cfg)

    this.METADATA.fieldType = 'join'
    this.METADATA.join = Symbol('relationship')

    // Apply event monitoring to the #record.
    this.METADATA.applyMonitor = () => {
      if (this.METADATA.manner === 'model') {
        // Model Event Relay
        this.METADATA.join.pool('field.', {
          create: this.METADATA.commonModelEventHandler('field.create'),
          update: this.METADATA.commonModelEventHandler('field.update'),
          remove: this.METADATA.commonModelEventHandler('field.remove'),
          invalid: (data) => {
            this.emit(['invalid', `invalid.${this.METADATA.name}.${data.field}`])
          },
          valid: (data) => {
            this.emit(['valid', `valid.${this.METADATA.name}.${data.field}`])
          }
        })
      //   this.METADATA.join.pool('field.', {
      //     create: this.METADATA.commonModelEventHandler('field.create'),
      //     update: this.METADATA.commonModelEventHandler('field.update'),
      //     remove: this.METADATA.commonModelEventHandler('field.remove'),
      //     invalid: (data) => {
      //       this.emit(['invalid', `invalid.${this.name}.${data.field}`])
      //     },
      //     valid: (data) => {
      //       this.emit(['valid', `valid.${this.name}.${data.field}`])
      //     }
      //   })
      // } else {
      //   // Store Event Relay
      //   this.METADATA.join.pool('record.', {
      //     create: this.METADATA.commonStoreEventHandler('record.create'),
      //     update: this.METADATA.commonStoreEventHandler('record.update'),
      //     remove: this.METADATA.commonStoreEventHandler('record.remove'),
      //     invalid: (data) => {
      //       this.emit('invalid', `invalid.${this.name}.${data.field}`)
      //     },
      //     valid: (data) => {
      //       this.emit('valid', `valid.${this.name}.${data.field}`)
      //     }
      //   })
      }
    }

    // Event handling for nested models.
    this.METADATA.commonModelEventHandler = (type) => {
      const me = this

      return function (change) {
        me.METADATA.commitPayload({
          field: `${me.name}.${change.field}`,
          old: NGN.coalesce(change.old),
          new: NGN.coalesce(change.new),
          join: true,
          originalEvent: {
            event: this.event,
            record: me.METADATA.record
          }
        })
      }
    }

    // Event handling for nested stores.
    this.METADATA.commonStoreEventHandler = (type) => {
      const me = this

      return function (record, change) {
        let old = change ? NGN.coalesce(change.old) : me.data

        if (this.event === 'record.create') {
          old.pop()
        } else if (this.event === 'record.delete') {
          old.push(record.data)
        }

        me.METADATA.commitPayload({
          field:  me.name + (change ? `.${change.field}` : ''),
          old: change ? NGN.coalesce(change.old) : old,
          new: change ? NGN.coalesce(change.new) : me.data,
          join: true,
          originalEvent: {
            event: this.event,
            record: record
          }
        })
      }
    }

    // const commitPayload = this.METADATA.commitPayload
    //
    // this.METADATA.commitPayload = (payload) => {
    //   console.log('HERE')
    //   commitPayload(...arguments)
    // }

    /**
     * @cfg join {NGN.DATA.Store|NGN.DATA.Model[]}
     * A relationship to another model/store is defined by a join.
     * The join may be a data store or data model. It is also possible
     * to specify a collection.
     *
     * For example, a join may be defined as:
     *
     * ```js
     * // Use of a model
     * let RelationshipField = new NGN.DATA.Relationship({
     *   record: new NGN.DATA.Model(...)
     * })
     *
     * // Use of a model collection
     * let RelationshipField = new NGN.DATA.Relationship({
     *   record: [new NGN.DATA.Model(...)]
     * })
     *
     * // Use of a store
     * let RelationshipField = new NGN.DATA.Relationship({
     *   record: new NGN.DATA.Store(...)
     * })
     * ```
     *
     * A store and a model collection are both a group of models,
     * Internally, model collections are converted to data stores.
     *
     * By supporting all three formats, it is possible to create complex
     * data models, such as:
     *
     * ```js
     * let Pet = new NGN.DATA.Model(...)
     * let Kid = new NGN.DATA.Model(...)
     * let Kids = new NGN.DATA.Store({
     *   model: Kid
     * })
     *
     * let Person = new NGN.DATA.Model({
     *   fields: {
     *     dateOfBirth: Date,
     *     spouse: Person,  // <== Join a Model
     *     kids: Kids,      // <== Join a Store
     *     pets: [Pet]      // <== Join a Collection
     *   }
     * })
     * ```
     *
     * The `pets` field contains a "collection". This shorthand notation is used
     * to help understand real data relationships. In this case, it is easy to
     * infer that a person may have zero or more pets.
     */
    this.value = NGN.coalesce(cfg.join)
    this.METADATA.AUDITABLE = false
    this.auditable = NGN.coalesce(cfg.audit, false)
  }

  /**
   * @property {string} manner
   * The manner of relationship. This can be one of 3 values: `store`
   * (NGN.DATA.Store), `model` (NGN.DATA.Model), or `collection`. A collection
   * is a special configuration shortcut used to represent a new store of models.
   *
   * For example, a model may be defined as:
   *
   * ```js
   * let Pet = new NGN.DATA.Model({
   *   fields: {
   *     name: String,
   *     animalType: String
   *   }
   * })
   *
   * let Person = new NGN.DATA.Model({
   *   fields: {
   *     dateOfBirth: Date
   *   },
   *   relationships: {
   *     pets: [Pet]        // <== Collection
   *   }
   * })
   * ```
   */
  get manner () {
    return NGN.coalesce(this.METADATA.manner, 'unknown')
  }

  get value () {
    return this.METADATA.join
  }

  // Override the default value setter
  set value (value) {
    // Short-circuit if the value hasn't changed.
    let currentValue = this.METADATA.join

    if (currentValue === value) {
      return
    }

    let type = NGN.typeof(value)

    if (type === 'array') {
      if (value.length !== 1) {
        throw new Error(`${this.METADATA.name} cannot refer to an empty data store/model collection. A record must be provided.`)
      }

      this.METADATA.manner = 'store'
      value = new NGN.DATA.Store({
        model: value[0]
      })
    } else if (['model', 'store'].indexOf(type) >= 0) {
      this.METADATA.manner = type
    } else {
      NGN.ERROR(`The "${this.METADATA.name}" relationship has an invalid record type. Only instances of NGN.DATA.Store, NGN.DATA.Model, or [NGN.DATA.Model] are supported." .`)
      throw new InvalidConfigurationError(`Invalid record configuration for "${this.METADATA.name}" field.`)
    }

    if (this.manner === 'unknown') {
      throw new Error('Cannot set a relationship field to anything other than an NGN.DATA.Store, NGN.DATA.Model, or an array of NGN.DATA.Model collections. (Unknown manner of relationship)')
    }

    this.METADATA.join = type === 'model' ? new value() : value
    this.auditable = this.METADATA.AUDITABLE
    this.METADATA.applyMonitor()

    // Notify listeners of change
    if (typeof currentValue === 'symbol') {
      this.emit('update', {
        old: currentValue,
        new: value
      })
    }
  }

  set auditable (value) {
    value = NGN.forceBoolean(value)

    if (value !== this.METADATA.AUDITABLE) {
      this.METADATA.AUDITABLE = value
      this.METADATA.join.auditable = value

//       this.METADATA.join.on('field.update', (change) => {
// console.log('HERE')
//         this.METADATA.AUDITLOG.commit(this.METADATA.join.METADATA.getAuditMap())
//       })
      // delete this.METADATA.AUDITLOG

      // Object.defineProperty(this.METADATA, 'AUDITLOG', {
      //   get: () => {
      //     return this.METADATA.join.METADATA.AUDITLOG
      //   }
      // })
    }
  }

  // Override the default undo
  undo () {
    if (this.METADATA.manner === 'model') {
      this.METADATA.join.undo(...arguments)
    }
  }

  redo () {
    if (this.METADATA.manner === 'model') {
      this.METADATA.join.redo(...arguments)
    }
  }
}

  // [PARTIAL]

/**
 * @class NGN.DATA.Model
 * Represents a data model/record.
 * @fires field.update
 * Fired when a datafield value is changed.
 * @fires field.create {NGN.DATA.Field}
 * Fired when a datafield is created.
 * @fires field.remove
 * Fired when a datafield is deleted.
 * @fires field.invalid
 * Fired when an invalid value is detected in an data field.
 */
class NGNDataModel extends NGN.EventEmitter {
  constructor (cfg) {
    cfg = cfg || {}

    super()

    const me = this

    // Create private attributes & data placeholders
    Object.defineProperties(this, {
      /**
       * @property {Symbol} OID
       * A unique object ID assigned to the model. This is an
       * internal readon-only reference.
       * @private
       */
      OID: NGN.privateconst(Symbol('model.id')),

      METADATA: NGN.privateconst({
        /**
         * @cfg {string} [name]
         * A descriptive name for the model. This is typically used for
         * debugging, logging, and (somtimes) data proxies.
         */
        name: NGN.coalesce(cfg.name, 'Untitled Model'),

        /**
         * @cfg {String} [idAttribute='id']
         * Setting this allows an attribute of the object to be used as the ID.
         * For example, if an email is the ID of a user, this would be set to
         * `email`.
         */
        idAttribute: NGN.coalesce(cfg.idField, cfg.idAttribute) || 'id',

        /**
         * @cfg {object} fields
         * A private object containing the data fields of the model.
         * Each key contains the field name, while each value can be one of
         * the following:
         *
         * - Primitive (String, Number, RegExp, Boolean)
         * - Standard Type (Array, Object, Date)
         * - Custom Class
         * - NGN.DATA.Field
         * - An NGN.DATA.Field configuration
         * - `null` (Defaults to String primitive)
         *
         * ```js
         * fields: {
         *   a: String,
         *   b: Date,
         *   c: MyCustomClass,
         *   d: new NGN.DATA.Field({
         *     required: true,
         *     type: String,
         *     default: 'some default value'
         *   }),
         *   e: {
         *     required: true,
         *     type: String,
         *     default: 'some default value'
         *   },
         *   f: null // Uses default field config (String)
         * }
         * ```
         *
         * Extensions of the NGN.DATA.Field are also supported,
         * such as NGN.DATA.VirtualField and NGN.DATA.Relationship.
         */
        fields: NGN.coalesce(cfg.fields),
        knownFieldNames: new Set(),
        invalidFieldNames: new Set(),
        auditFieldNames: NGN.coalesce(cfg.audit, false) ? new Set() : null,

        /**
         * @property {Object}
         * Custom validation rules used to verify the integrity of the entire
         * model. This only applies to the full model. Individual data fields
         * may have their own validators.
         */
        validators: NGN.coalesce(cfg.rules, cfg.rule, cfg.validators, {}),

        /**
         * @cfgproperty {boolean} [validation=true]
         * Toggle data validation using this.
         */
        validation: NGN.coalesce(cfg.validation, true),

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
        autoid: NGN.coalesce(cfg.autoid, false),

        IdentificationField: 'id',
        IdentificationValue: null,

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
        expiration: NGN.coalesce(cfg.expires),

        // Holds a setTimeout method for expiration events.
        expirationTimeout: null,

        created: Date.now(),
        changelog: null,
        store: null,

        /**
         * @cfg {boolean} [audit=false]
         * Enable auditing to support #undo/#redo operations. This creates and
         * manages a NGN.DATA.TransactionLog.
         */
        AUDITABLE: NGN.coalesce(cfg.audit, false),
        AUDITLOG: NGN.coalesce(cfg.audit, false) ? new NGN.DATA.TransactionLog() : null,
        AUDIT_HANDLER: function (change) {
          if (change.hasOwnProperty('cursor')) {
            me.METADATA.AUDITLOG.commit(me.METADATA.getAuditMap())
          }
        },

        EVENTS: new Set([
          'field.update',
          'field.create',
          'field.remove',
          'field.invalid',
          'field.valid',
          'field.hidden',
          'field.unhidden',
          'field.rule.add',
          'field.rule.remove',
          'rule.add',
          'rule.remove',
          'relationship.create',
          'relationship.remove',
          'expired',
          'deleted',
          'reset',
          'load'
        ]),

        /**
         * An internal method used to apply field definitions to the model.
         * @param  {string} fieldname
         * Name of the field (as applied to the model).
         * @param  {NGN.DATA.Field|Object|Primitive} [cfg=null]
         * The configuration to apply. See #addField for details.
         * @param  {Boolean} [suppressEvents=false]
         * Optionally suppress the `field.create` event.
         * @private
         */
        applyField: (field, cfg = null, suppressEvents = false) => {
          // Prevent duplicate fields
          if (this.METADATA.knownFieldNames.has(field)) {
            return NGN.WARN(`Duplicate field "${field}" detected.`)
          }

          // Prevent reserved words
          if (this.hasOwnProperty(field) && field.toLowerCase() !== 'id') {
            throw new ReservedWordError(`"${field}" cannot be used as a field name (reserved word).`)
          }

          // If the field config isn't already an NGN.DATA.Field, create it.
          if (!(cfg instanceof NGN.DATA.Field)) {
            if (cfg instanceof NGN.DATA.Store || cfg instanceof NGN.DATA.Model) {
              if (this.METADATA.idAttribute === field) {
                throw new InvalidConfigurationError(`"${field}" cannot be an ID. Relationship fields cannot be an identification attribute.`)
              }

              this.METADATA.fields[field] = new NGN.DATA.Relationship({
                name: field,
                record: cfg,
                model: this
              })
            } else {
              switch (NGN.typeof(cfg)) {
                // Custom config
                case 'object':
                  cfg.model = this
                  cfg.identifier = NGN.coalesce(cfg.identifier, this.METADATA.idAttribute === field)
                  cfg.name = field

                  this.METADATA.fields[field] = new NGN.DATA.Field(cfg)

                  break

                // Collection of models
                case 'array':
                  return this.applyField(field, cfg[0], suppressEvents)

                // Type-based cfg.
                default:
                  if (NGN.isFn(cfg) || cfg === null) {
                    if (NGN.isFn(cfg) && ['string', 'number', 'boolean', 'number', 'symbol', 'regexp', 'date', 'array', 'object'].indexOf(NGN.typeof(cfg)) < 0) {
                      this.METADATA.fields[field] = new NGN.DATA.VirtualField({
                        name: field,
                        model: this,
                        method: cfg
                      })

                      break
                    }

                    this.METADATA.fields[field] = new NGN.DATA.Field({
                      name: field,
                      type: cfg,
                      model: this
                    })

                    break
                  }

                  this.METADATA.fields[field] = new NGN.DATA.Field({
                    name: field,
                    type: NGN.isFn(cfg) ? cfg : String,
                    identifier: NGN.isFn(cfg)
                      ? false
                      : NGN.coalesce(cfg.identifier, this.METADATA.idAttribute === field),
                    model: this
                  })

                  break
              }
            }
          } else if (cfg.model === null) {
            cfg.name = field
            cfg.identifier = cfg.identifier = NGN.coalesce(cfg.identifier, this.METADATA.idAttribute === field)

            this.METADATA.fields[field] = cfg
            this.METADATA.fields[field].model = this
          } else if (cfg.model === this) {
            cfg.identifier = NGN.coalesce(cfg.identifier, this.METADATA.idAttribute === field)

            this.METADATA.fields[field] = cfg
          } else {
            return NGN.WARN(`The "${cfg.name}" field cannot be applied because a model is already specified.`)
          }

          // Add a direct reference to the model.
          Object.defineProperty(this, field, {
            enumerable: true,
            configurable: true,
            get: () => this.METADATA.fields[field].value,
            set: (value) => this.METADATA.fields[field].value = value
          })

          // Enable auditing if necessary.
          if (this.METADATA.AUDITABLE) {
            if (this.METADATA.fields[field].fieldType !== 'virtual') {
              this.METADATA.fields[field].auditable = true
              this.METADATA.auditFieldNames.add(field)
            }
          }

          // Add the field to the list
          this.METADATA.knownFieldNames.add(field)

          // this.METADATA.fields[field].on('*', function () { console.log(this.event) })
          this.METADATA.fields[field].relay('*', this, 'field.')

          if (!suppressEvents) {
            this.emit('field.create', this.METADATA.fields[field])
          }
        },

        /**
         * An internal helper method for applying changes to the model.
         * @param  {String} [type='undo']
         * This can be `undo` or `redo`.
         * @param  {Number} [count=1]
         * The number of cursor indexes to shift
         * @param  {Boolean} [suppressEvents=false]
         * Indicates events should be suppressed.
         * @private
         */
        applyChange: (type = 'undo', count = 1, suppressEvents = false) => {
          if (!this.METADATA.AUDITABLE) {
            NGN.WARN(`The ${type} operation failed on the ${this.name} model because auditing is disabled.`)
            return
          }

          this.METADATA.AUDITLOG[type === 'undo' ? 'rollback' : 'advance'](count)

          let data = this.METADATA.AUDITLOG.currentValue

          if (data) {
            this.METADATA.auditFieldNames.forEach(fieldname => {
              let field = this.METADATA.fields[fieldname]
              let log = field.METADATA.AUDITLOG

              if (log.cursor !== data[fieldname]) {
                if (typeof data[fieldname] === 'symbol') {
                  log.cursor = data[fieldname]
                } else {
                  log.cursor = null
                }

                field.METADATA.setValue(NGN.coalesce(log.currentValue, field.default), suppressEvents, true)
              }
            })
          }
        },

        /**
         * Generates a key/value representation of the model where
         * each key represents an auditable field and each value is the
         * transaction cursor ID.
         * @return {Object}
         * @private
         */
        getAuditMap: () => {
          let map = {}

          this.METADATA.auditFieldNames.forEach(field => {
            map[field] = this.METADATA.fields[field].METADATA.AUDITLOG.cursor
          })

          return map
        },

        /**
         * Restore the model to a specific audit map (i.e. historical state
         * of multiple fields).
         * @param {Object} map
         * The audit map to restore.
         */
        // restore: (map) => {
        //   let keys = Object.keys(map)
        //
        //   for (let i = 0; i < keys.length; i++) {
        //     if (this.METADATA.knownFieldNames.has(keys[i]) && typeof map[keys[i]] === 'symbol') {
        //       console.log('Has', keys[i])
        //
        //     }
        //   }
        // },

        // Deprecations
        setSilent: NGN.deprecate(this.setSilentFieldValue, 'setSilent has been deprecated. Use setSilentFieldValue instead.')
      })
    })

    // Bubble events to the BUS
    // for (let i = 0; i < this.METADATA.EVENTS.length; i++) {
    //   this.on(this.METADATA.EVENTS[i], function () {
    //     let args = NGN.slice(arguments)
    //
    //     args.push(this)
    //     args.unshift(this.METADATA.EVENTS[i])
    //
    //     NGN.BUS.emit.apply(NGN.BUS, args)
    //   })
    // }

    // Add data fields.
    let fields = Object.keys(this.METADATA.fields)
    for (let i = 0; i < fields.length; i++) {
      let name = fields[i]

      if (this.METADATA.knownFieldNames.has(name)) {
        NGN.WARN(`Duplicate field "${name}" detected.`)
      } else {
        // Configure a data field for each configuration.
        this.METADATA.applyField(name, this.METADATA.fields[name], true)
      }
    }

    // Track Changes (if auditing enabled)
    if (this.METADATA.AUDITABLE) {
      this.on('field.update', this.METADATA.AUDIT_HANDLER)
    }
  }

  set auditable (value) {
    value = NGN.forceBoolean(value)

    if (value !== this.METADATA.AUDITABLE) {
      this.METADATA.AUDITABLE = value
      this.METADATA.AUDITLOG = value ? new NGN.DATA.TransactionLog() : null
      this.METADATA.auditFieldNames = value ? new Set() : null

      // Set each field to an auditable state (or not).
      this.METADATA.knownFieldNames.forEach(fieldname => {
        if (!this.METADATA.fields[fieldname].virtual) {
          this.METADATA.fields[fieldname].auditable = value

          if (value) {
            this.METADATA.auditFieldNames.add(fieldname)
          }
        }
      })

      if (value) {
        this.on('field.transaction.*', (id) => {
          this.METADATA.AUDIT_HANDLER({ cursor: id })
        })
      } else {
        this.METADATA.auditFieldNames.clear()
        this.off('field.transaction.*')
      }
    }
  }

  /**
   * The unique ID assigned to the model.
   * @return {string}
   */
  get id () {
    return this.get(this.IdentificationField)
  }

  set id (value) {
    this.set('id', value)
  }

  /**
   * @property ID
   * An alias for #id.
   */
  get ID () {
    return this.id
  }

  set ID (value) {
    this.set('id', value)
  }

  /**
   * @property {Number} createDate
   * The date/time when the model is created.
   */
  get createDate () {
    return this.METADATA.created
  }

  get data () {
    return this.serializeFields()
  }

  serializeFields (ignoreID = false, ignoreVirtualFields = true) {
    if (this.METADATA.knownFieldNames.size === 0) {
      return {}
    }

    let fieldname = this.knownFieldNames.keys()
    let result = {}

    while (!fieldname.next().done) {
      let field = this.METADATA.fields[fieldname.value]

      // Ignore unserializable fields
      if (
        field.value === undefined ||
        (ignoreID && fieldname.value === this.idAttribute) ||
        (!field.virtual || (!ignoreVirtualFields && field.virtual))
      ) {
        break
      }

      // Do not serialize hidden values or virtuals
      if (!field.hidden) {
        switch (NGN.typeof(field.value)) {
          case 'array':
          case 'object':
            result[fieldname.value] = NGN.DATA.UTILITY.serialize(field.value)
            break

          default:
            result[fieldname.value] = field.value
        }
      }
    }
  }

  serialize () {
    return NGN.deprecate(this.serializeFields, 'serialize is now serializeFields. Use NGN.DATA.UTILITY.serialize for generic object serialization.')
  }

  /**
   * Determines whether a field exists in the model or not.
   * @param  {string} field
   * Name of the field to check for.
   * @return {boolean}
   */
  fieldExists (field) {
    return this.METADATA.knownFieldNames.has(field)
  }

  /**
   * Retrieve the value of the specified field.
   * @param  {string} field
   * Name of the field whose value should be returned.
   * @return {any}
   * Returns the value of the field.
   */
  get (field) {
    if (field === 'id' || field === 'ID') {
      field = this.METADATA.IdentificationValue
    }

    if (this.METADATA.knownFieldNames.has(field)) {
      return this[field]
    } else {
      NGN.WARN(`Cannot get "${field}". The field is not part of the model.`)
      return undefined
    }
  }

  /**
   * Set a new value for the specified field.
   * @param {string} field
   * Name of the field whose value will be changed.
   * @param {any} value
   * The new value of the field.
   */
  set (field, value) {
    if (field === 'id' || field === 'ID') {
      field = this.METADATA.IdentificationField
    }

    if (this.METADATA.knownFieldNames.has(field)) {
      this[field] = value
    } else {
      NGN.WARN(`Cannot set "${field}". Unrecognized field name.`)
    }
  }

  /**
   * Add a data field after the initial model definition.
   * @param {string} fieldname
   * The name of the field.
   * @param {NGN.DATA.Field|Object|Primitive} [fieldConfiguration=null]
   * The field configuration (see cfg#fields for syntax).
   * @param {boolean} [suppressEvents=false]
   * Set to `true` to prevent events from firing when the field is added.
   */
  addField (name, cfg = null, suppressEvents = false) {
    if (name instanceof NGN.DATA.Field) {
      cfg = name
      name = cfg.name
    } else if (typeof name !== 'string') {
      throw new Error('Cannot add a non-string based field.')
    }

    this.METADATA.applyField(name, cfg, suppressEvents)
  }

  /**
   * @method removeField
   * Remove a field from the data model.
   * @param {string} name
   * Name of the field to remove.
   * @param {boolean} [suppressEvents=false]
   * Set to `true` to prevent events from firing when the field is removed.
   */
  removeField (name, suppressEvents = false) {
    if (this.METADATA.knownFieldNames.has(name)) {
      this.METADATA.knownFieldNames.delete(name)
      this.METADATA.invalidFieldNames.delete(name)

      const field = this.METADATA.fields[name]

      delete this[name]
      delete this.METADATA.fields[name] // eslint-disable-line no-undef

      // let change = {
      //   action: 'delete',
      //   field: field.name,
      //   value: field,
      //   join: field instanceof NGN.DATA.Relationship
      // }

      if (!suppressEvents) {
        this.emit('field.remove', field)
        // this.emit('changelog.append', change)
      }
    }
  }

  /**
   * Returns the NGN.DATA.Field object for the specified field.
   * @param  {string} fieldName
   * Name of the field to retrieve.
   * @return {NGN.DATA.Field}
   * The raw field.
   */
  getField (name) {
    return this.METADATA.fields[name]
  }

  /**
   * @method setSilent
   * A method to set a field value without triggering an update event.
   * This is designed primarily for use with live update proxies to prevent
   * endless event loops.
   * @param {string} fieldname
   * The name of the #field to update.
   * @param {any} value
   * The new value of the field.
   * @private
   */
  setSilentFieldValue(field, value) {
    this.METADATA.fields[field].silentValue = value
  }

  get changelog () {
    return this.METADATA.AUDITLOG.log
  }

  /**
   * @method undo
   * A rollback function to undo changes. This operation affects
   * the changelog (transaction log). To "undo" an "undo", use #redo.
   * @param {number} [OperationCount=1]
   * The number of operations to "undo". Defaults to a single operation.
   * @param {boolean} [suppressEvents=false]
   * Set to `true` to quietly update the value (prevents `update` event from
   * firing).
   */
  undo (count = 1, suppressEvents = false) {
    this.METADATA.applyChange('undo', ...arguments)
  }

  /**
   * @method redo
   * A function to reapply known changes. This operation affects
   * the changelog (transaction log).
   *
   * The redo operation only works after an undo operation, but before a new
   * value is committed to the transaction log. In other words, `undo -> redo`
   * will work, but `undo -> update -> redo` will not. For details, see how
   * the NGN.DATA.TransactionLog cursor system works.
   * @param {number} [OperationCount=1]
   * The number of operations to "undo". Defaults to a single operation.
   * @param {boolean} [suppressEvents=false]
   * Set to `true` to quietly update the value (prevents `update` event from
   * firing).
   */
  redo (count = 1, suppressEvents = false) {
    this.METADATA.applyChange('redo', ...arguments)
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
  constructor (cfg = {}) {
    if (!cfg.model || NGN.typeof(cfg.model) !== 'model') {
      throw new InvalidConfigurationError('Missing or invalid "model" configuration property.')
    }

    super(cfg)

    Object.defineProperties(this, {
      /**
       * @cfgproperty {string} [name]
       * A descriptive name for the store. This is typically used for
       * debugging, logging, and (somtimes) data proxies.
       */
      name: NGN.coalesce(cfg.name, 'Untitled Store'),

      METADATA: NGN.private({
        /**
         * @cfgproperty {NGN.DATA.Model} model
         * An NGN Data Model to which data records conform.
         */
        model: cfg.model,

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

    console.log('STORE')
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
        throw new InvalidConfigurationError(`"${this.name}" model could not be set because the value is ${NGN.typeof(value)} (requires NGN.DATA.Model).`)
      }

      this.METADATA.model = value
    }
  }
}


  let NGNModel = function (cfg) {
    const Model = function (data) {
      let model = new NGNDataModel(cfg)

      if (data) {
        model.load(data)
      }

      return model
    }

    return Model
  }

  NGN.extend('DATA', NGN.const(Object.defineProperties({}, {
    UTILITY: NGN.const(Utility),
    util: NGN.deprecate(Utility, 'NGN.DATA.util is now NGN.DATA.UTILITY'),
    TransactionLog: NGN.const(NGNTransactionLog),
    Rule: NGN.privateconst(NGNDataValidationRule),
    RangeRule: NGN.privateconst(NGNDataRangeValidationRule),
    Field: NGN.const(NGNDataField),
    VirtualField: NGN.const(NGNVirtualDataField),
    Relationship: NGN.const(NGNRelationshipField),
    Entity: NGN.privateconst(NGNDataModel),
    Model: NGN.const(NGNModel),
    Index: NGN.privateconst(NGNDataIndex),
    Store: NGN.const(NGNDataStore)
  })))
})()