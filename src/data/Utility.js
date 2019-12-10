import checksum from '../utility/Checksum'

/**
 * @class NGN.DATA.UTILITY
 * A utility library of functions relevant to data management.
 */
export default class Utility { // eslint-disable-line
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

    return checksum(str)
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

    for (let i = 0; i < attribute.length; i++) {
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
            if (SERIALIZED_ARRAY_DATA !== attribute[i]) {
              result[attribute[i]] = data[attribute[i]].toString()
            }

            break

          case 'regexp':
            Object.defineProperty(result, attribute[i], NGN.public(data[attribute[i]].toString()))

            break

          case 'weakmap':
          case 'map':
            let mapResult = {}

            data[attribute[i]].forEach((value, key) => {
              mapResult[key.toString()] = this.serialize(value)
            })

            result[attribute[i]] = mapResult

            break

          case 'weakset':
          case 'set':
            if (data[attribute[i]].size === 0) {
              result[attribute[i]] = []
              break
            }

            result[attribute[i]] = this.serialize(Array.from(data[attribute[i]].values()))

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

  /**
   * @method isDataModel
   * Determines whether an object is an instance of NGN.DATA.Model.
   * @param {function} PossibleModel
   * The class or function to be checked.
   * @returns {boolean}
   */
  static isDataModel (Model) {
    if (Model instanceof NGN.DATA.Model || NGN.typeof(Model) === 'model') {
      return true
    }

    if (Model.hasOwnProperty('prototype') && Model.prototype !== null) {
      let currentElement = Model
      let count = 0

      while (currentElement.prototype !== null && count < 30) {
        count++

        currentElement = currentElement.prototype

        if (currentElement instanceof NGN.DATA.Model || NGN.typeof(currentElement) === 'model') {
          return true
        }
      }
    }

    return Model instanceof NGN.DATA.Entity
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
  //  * Consider this method to provide a **best guess based on the available data**.
  //  *
  //  * @param {Object} object
  //  * The primitive key/value object upon which the bytesize estimation will be made.
  //  * @param {Boolean} [ignoreFunctionEstimate=false]
  //  * By default, NGN will calculate the `String` representation of any functions
  //  * it encounters in the key/value object. Setting this to `true` will prevent
  //  * this behavior, effectively using a `0` to calculate function size.
  //  */
  // static objectByteSize (obj, ignore=false) {
  //   switch (typeof obj) {
  //     case null:
  //       return 4
  //
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
  //       bytes += NGN.DATA.UTILITY.objectByteSize(value)
  //     }
  //   }
  //
  //   return bytes
  // }
}
