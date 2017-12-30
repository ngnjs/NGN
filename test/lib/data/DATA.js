(function () {
  // [PARTIAL]

// Difference Utilities
// Addition: ['+', path, value]
// Deletion: ['-', path, oldValue]
// Modified: ['m', path, oldValue, newValue]
class ObjectDiff {
  static compare (lhs, rhs, path = []) {
    let differences = []
    let ltype = NGN.typeof(lhs)
    let rtype = NGN.typeof(rhs)

    // If the comparators aren't the same type, then
    // it is a replacement. This is identified as
    // removal of one object and creation of the other.
    if (ltype !== rtype) {
      return [
        ['m', path, lhs, rhs],
      ]
    }
console.log('Diffing:', ltype, lhs, rhs, 'PATH', path.join('.'))
    switch (ltype) {
      // case 'function':
      //   if (lhs.toString() !== rhs.toString()) {
      //     return ['m', path, lhs, rhs]
      //   }
      //
      //   return []

      case 'object':
        let keys = Object.keys(lhs)
        // let relativePath

        // Compare left to right for modifications and removals
        for (let i = 0; i < keys.length; i++) {
          // Reset the relative path
          let relativePath = Object.assign([], path)

          relativePath.push(keys[i])

          if (!rhs.hasOwnProperty(keys[i])) {
            // If no right hand argument exists, it was removed.
            differences.push(['-', relativePath, lhs[keys[i]]])
          } else if (NGN.typeof(lhs[keys[i]]) === 'object') {
            // Recursively compare objects
            differences = differences.concat(this.compare(lhs[keys[i]], rhs[keys[i]], relativePath))
          } else if (lhs[keys[i]] !== rhs[keys[i]]) {
            if (NGN.typeof(lhs[keys[i]]) === 'array' && NGN.typeof(rhs[keys[i]]) === 'array') {
              // If the keys contain arrays, re-run the comparison.
              differences = differences.concat(this.compare(lhs[keys[i]], rhs[keys[i]], relativePath))
            } else {
              // If the comparators exist but are different, a
              // modification ocurred.
              differences.push(['m', relativePath, lhs[keys[i]], rhs[keys[i]]])
            }
          }
        }

        // Compare right to left for additions
        keys = Object.keys(lhs)
        keys.unshift(rhs)
        keys = NGN.getObjectExtraneousPropertyNames.apply(this, keys)

        for (let i = 0; i < keys.length; i++) {
          // Reset the relative path
          let relativePath = Object.assign([], path)
          relativePath.push(keys[i])

          differences.push(['+', relativePath, rhs[keys[i]]])
        }

        break

      case 'array':
        differences = this.compareArray(lhs, rhs)

        break

      case 'string':
        console.log('TO DO: Add String Diff')

      default:
        if (lhs !== rhs) {
          if (NGN.typeof(lhs) !== 'undefined' && NGN.typeof(rhs) === 'undefined') {
            differences.push(['-', path, lhs])
          } else if (NGN.typeof(lhs) === 'undefined' && NGN.typeof(rhs) !== 'undefined') {
            differences.push(['+', path, rhs])
          } else {
            differences.push(['m', path, lhs, rhs])
          }
        }
    }

    return differences
  }

  compareArray (lhs, rhs) {
    // if (lhs === rhs) {
      return []
    // }
    //
    // for (let i = 0; i < lhs.length; i++) {
    //   if (false) {}
    // }
  }

  static arraysHaveMatchByRef (array1, array2, len1, len2) {
    for (let index1 = 0; index1 < len1; index1++) {
      let val1 = array1[index1]

      for (let index2 = 0; index2 < len2; index2++) {
        let val2 = array2[index2]

        if (index1 !== index2 && val1 === val2) {
          return true
        }
      }
    }
  }

  static matchItems (array1, array2, index1, index2, context) {
    let value1 = array1[index1]
    let value2 = array2[index2]

    if (value1 === value2) {
      return true
    }

    if (typeof value1 !== 'object' || typeof value2 !== 'object') {
      return false
    }

    let objectHash = context.objectHash

    if (!objectHash) {
      // no way to match objects was provided, try match by position
      return context.matchByPosition && index1 === index2
    }

    let hash1
    let hash2

    if (typeof index1 === 'number') {
      context.hashCache1 = NGN.forceArray(context.hashCache1)
      hash1 = context.hashCache1[index1]

      if (typeof hash1 === 'undefined') {
        context.hashCache1[index1] = hash1 = objectHash(value1, index1)
      }
    } else {
      hash1 = objectHash(value1)
    }

    if (typeof hash1 === 'undefined') {
      return false
    }

    if (typeof index2 === 'number') {
      context.hashCache2 = NGN.forceArray(context.hashCache2)
      hash2 = context.hashCache2[index2]

      if (typeof hash2 === 'undefined') {
        context.hashCache2[index2] = hash2 = objectHash(value2, index2)
      }
    } else {
      hash2 = objectHash(value2)
    }

    if (typeof hash2 === 'undefined') {
      return false
    }

    return hash1 === hash2
  }

  /*
   * LCS implementation that supports arrays or strings
   * reference: http://en.wikipedia.org/wiki/Longest_common_subsequence_problem
   * This code abstracted from Benjamín Eidelman's JSONDiffPatch (MIT).
   */
  static lcsDefaultMatch (array1, array2, index1, index2) {
    return array1[index1] === array2[index2]
  }

  static lcsLengthMatrix (array1, array2, match, context) {
    let len1 = array1.length
    let len2 = array2.length
    let x
    let y

    // initialize empty matrix of len1+1 x len2+1
    let matrix = [len1 + 1]

    for (x = 0; x < len1 + 1; x++) {
      matrix[x] = [len2 + 1]

      for (y = 0; y < len2 + 1; y++) {
        matrix[x][y] = 0
      }
    }

    matrix.match = match

    // save sequence lengths for each coordinate
    for (x = 1; x < len1 + 1; x++) {
      for (y = 1; y < len2 + 1; y++) {
        if (match(array1, array2, x - 1, y - 1, context)) {
          matrix[x][y] = matrix[x - 1][y - 1] + 1
        } else {
          matrix[x][y] = Math.max(matrix[x - 1][y], matrix[x][y - 1])
        }
      }
    }

    return matrix
  };

  static lcsBacktrack (matrix, array1, array2, index1, index2, context) {
    if (index1 === 0 || index2 === 0) {
      return {
        sequence: [],
        indices1: [],
        indices2: []
      }
    }

    if (matrix.match(array1, array2, index1 - 1, index2 - 1, context)) {
      let subsequence = backtrack(matrix, array1, array2, index1 - 1, index2 - 1, context)

      subsequence.sequence.push(array1[index1 - 1])
      subsequence.indices1.push(index1 - 1)
      subsequence.indices2.push(index2 - 1)

      return subsequence
    }

    if (matrix[index1][index2 - 1] > matrix[index1 - 1][index2]) {
      return backtrack(matrix, array1, array2, index1, index2 - 1, context)
    } else {
      return backtrack(matrix, array1, array2, index1 - 1, index2, context)
    }
  };

  static lcsGet (array1, array2, match, context) {
    context = context || {}

    let matrix = lengthMatrix(array1, array2, match || defaultMatch, context)
    let result = backtrack(matrix, array1, array2, array1.length, array2.length, context)

    if (typeof array1 === 'string' && typeof array2 === 'string') {
      result.sequence = result.sequence.join('')
    }

    return result
  }
}


class LCS {

}


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
  static diff () {
    return ObjectDiff.compare(...arguments)
  }

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
            } else {
              result[attribute[i]] = data[attribute[i]].toString()
            }

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

  // [PARTIAL]

/**
 * Inspired by btree.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: http://github.com/dcodeIO/btree.js for details.
 *
 * Converted to ECMASCript 2016 class syntax & modified to use
 * NGN conventions. Separated code into multiple classes.
 * Copyright (c) 2018, Ecor Ventures LLC.
 */

class NGNTreeNode {
  constructor (parent = null, leafs = [], nodes = [null]) {
    Object.defineProperties(this, {
      parent: NGN.private(parent),
      leafs: NGN.private(leafs),
      nodes: NGN.private(nodes),

      METADATA: NGN.private({
        order: null,
        minOrder: null,

        /**
         * Compare two numbers
         * @param  {number} firstNumber
         * @param  {number} secondNumber
         * @return {number}
         * - Returns `-1` if first number is less than second.
         * - Returns `0` if numbers are equal.
         * - Returns `1` if first number is greater than second.
         */
        compare: (firstNumber, secondNumber) => {
          return firstNumber < secondNumber ? -1 : (firstNumber > secondNumber ? 1 : 0)
        }
      })
    })

    // Associate leafs with parent
    for (let i = 0; i < this.leafs.length; i++) {
      this.leafs[i].parent = this
      // Object.defineProperty(this.leafs[i], 'parent', NGN.get(() => this))
    }

    // Associate nodes with parent
    for (let i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i] !== null) {
        this.nodes[i].parent = this
        // Object.defineProperty(this.nodes[i], 'parent', NGN.get(() => this))
      }
    }
  }

  /**
   * Search for the node that contains the specified key
   * @param  {any} key
   * @return {NGNTreeLeave|NGNTreeNode}
   */
  search (key) {
    if (this.leafs.length > 0) {
      let a = this.leafs[0]

      if (this.METADATA.compare(a.key, key) === 0) {
        return {
          leaf: a,
          index: 0
        }
      }

      if (this.METADATA.compare(key, a.key) < 0) {
        if (this.nodes[0] !== null) {
          return this.nodes[0].search(key) // Left
        }

        return { node: this, index: 0 }
      }

      let i
      for (i = 1; i < this.leafs.length; i++) {
        let b = this.leafs[i]

        if (this.METADATA.compare(b.key, key) == 0) {
          return {
            leaf: b,
            index: i
          }
        }

        if (this.METADATA.compare(key, b.key) < 0) {
          if (this.nodes[i] !== null) {
            return this.nodes[i].search(key) // Inner
          }

          return { node: this, index: i }
        }

        a = b
      }

      if (this.nodes[i] !== null) {
        return this.nodes[i].search(key) // Right
      }

      return { node: this, index: i }
    }

    return { node: this, index: 0 }
  }

  /**
   * Retrieve the value of a key.
   * @param {number} key
   * @returns {NGNTreeLeaf}
   * Returns `undefined` if no leaf is found.
   */
  get (key) {
    let result = this.search(key)
    return result.leaf ? result.leaf.value : undefined
  }

  /**
   * Insert a key/value pair into the node.
   * @param {number} key
   * @param {any} value
   * @param {boolean} [overwrite=true]
   * Overwrite existing values.
   */
  put (key, value, overwrite = true) {
    let result = this.search(key)

    // Key already exists
    if (result.leaf) {
      if (!overwrite) {
        return
      }

      result.leaf.value = value
      return
    }

    let node = result.node
    let index = result.index

    node.leafs.splice(index, 0, new NGNTreeLeaf(node, key, value))
    node.nodes.splice(index + 1, 0, null)

    if (node.leafs.length > this.METADATA.order) {
      node.split()
    }
  }

  /**
   * Delete key.
   * @param {number} key
   */
  delete (key) {
    var result = this.search(key)

    if (!result.leaf) {
      return
    }

    let leaf = result.leaf
    let node = leaf.parent
    let index = result.index
    let left = node.nodes[index]

    if (left === null) {
      node.leafs.splice(index, 1)
      node.nodes.splice(index, 1)
      node.balance()
    } else {
      let max = left.leafs[left.leafs.length - 1]

      left.delete(max.key)

      max.parent = node

      node.leafs.splice(index, 1, max)
    }

    return true
  }

  /**
   * Balance the tree.
   * @private
   */
  balance () {
    if (this.parent instanceof NGNBTree) {
      // Root has a single child and no leafs
      if (this.leafs.length == 0 && this.nodes[0] !== null) {
        this.parent.root = this.nodes[0]
        this.parent.root.parent = this.parent
      }

      return
    }

    if (this.leafs.length >= this.METADATA.minOrder) {
      return
    }

    let index = this.parent.nodes.indexOf(this)
    let left = index > 0 ? this.parent.nodes[index - 1] : null
    let right = this.parent.nodes.length > index + 1 ? this.parent.nodes[index + 1] : null
    let sep
    let leaf
    let rest

    if (right !== null && right.leafs.length > this.METADATA.minOrder) {
      // Append the parent separator
      sep = this.parent.leafs[index]
      sep.parent = this

      this.leafs.push(sep)

      // Replace blank with the first right leaf
      leaf = right.leafs.shift()
      leaf.parent = this.parent

      this.parent.leafs[index] = leaf

      // Append the right rest
      rest = right.nodes.shift()

      if (rest !== null) {
        rest.parent = this
      }

      this.nodes.push(rest)
    } else if (left !== null && left.leafs.length > this.METADATA.minOrder) {
      // Prepend the parent seperator
      sep = this.parent.leafs[index - 1]
      sep.parent = this

      this.leafs.unshift(sep)

      // Replace the blank with the last left leaf
      leaf = left.leafs.pop()
      leaf.parent = this.parent

      this.parent.leafs[index - 1] = leaf

      // Prepend the left rest to this
      rest = left.nodes.pop()

      if (rest !== null) {
        rest.parent = this
      }

      this.nodes.unshift(rest)
    } else {
      let subst

      if (right !== null) {
        // Combine this + seperator from the parent + right
        sep = this.parent.leafs[index]
        subst = new NGNTreeNode(this.parent, this.leafs.concat([sep], right.leafs), concat(this.nodes, right.nodes))
        subst.METADATA.order = this.METADATA.order
        subst.METADATA.minOrder = this.METADATA.minOrder

        // Remove the seperator from the parent
        this.parent.leafs.splice(index, 1)

        // And replace the nodes it seperated with subst
        this.parent.nodes.splice(index, 2, subst)
      } else if (left !== null) {
        // Combine left + seperator from parent + this
        sep = this.parent.leafs[index - 1]
        subst = new NGNTreeNode(
          this.parent,
          left.leafs.concat([sep], this.leafs),
          left.nodes.concat(this.nodes)
        )

        subst.METADATA.minOrder = this.METADATA.minOrder
        subst.METADATA.order = this.METADATA.order

        // Remove the seperator from the parent
        this.parent.leafs.splice(index - 1, 1)

        // Replace seperated nodes with subst
        this.parent.nodes.splice(index - 1, 2, subst)
      } else {
        throw(new Error(`Internal error: ${this.toString(true)} has neither a left nor a right sibling`))
      }

      this.parent.balance()
    }
  }

  /**
   * Split the node.
   */
  split () {
    let index = Math.floor(this.leafs.length/2)

    if (this.parent instanceof NGNBTree) {
      this.nodes = [
        new NGNTreeNode(this, this.leafs.slice(0, index), this.nodes.slice(0, index + 1)),
        new NGNTreeNode(this, this.leafs.slice(index + 1), this.nodes.slice(index + 1))
      ]

      this.leafs = [this.leafs[index]]
    } else {
      let leaf = this.leafs[index];
      let rest = new NGNTreeNode(
        this.parent,
        this.leafs.slice(index + 1),
        this.nodes.slice(index + 1)
      )

      this.leafs = this.leafs.slice(0, index)
      this.nodes = this.nodes.slice(0, index + 1)

      this.parent.unsplit(leaf, rest)
    }
  }

  /**
   * Unsplits a child.
   * @param {NGNTreeLeaf} leaf
   * @param {NGNTreeNode} rest
   * @param {number} [order=52]
   * @private
   */
  unsplit (leaf, rest) {
    leaf.parent = this
    rest.parent = this

    let a = this.leafs[0]

    if (this.METADATA.compare(leaf.key, a.key) < 0) {
      this.leafs.unshift(leaf)
      this.nodes.splice(1, 0, rest)
    } else {
      let i
      for (i = 1; i < this.leafs.length; i++) {
        let b = this.leafs[i]

        if (this.METADATA.compare(leaf.key, b.key) < 0) {
          this.leafs.splice(i, 0, leaf)
          this.nodes.splice(i + 1, 0, rest)
          break
        }
      }

      if (i === this.leafs.length) {
        this.leafs.push(leaf)
        this.nodes.push(rest)
      }
    }

    if (this.leafs.length > this.METADATA.order) {
      this.split()
    }
  }

  /**
   * A string representation of the node.
   * @param {boolean} [includeNodes=false]
   * Include sub-nodes
   * @returns {string}
   * @private
   */
  toString (includeNodes = false) {
    let value = []

    for (let i = 0; i < this.leafs.length; i++) {
      value.push(this.leafs[i].key)
    }

    let s = `[${value.toString()}]${(this.parent instanceof Tree ? ":*" : ":")}${this.parent}`

    if (includeNodes) {
      for (i = 0; i < this.nodes.length; i++) {
        s += ` -> ${this.nodes[i]}`
      }
    }

    return s
  }
}

/*
 * Constructs a new Leaf containing a value.
 * @param {NGNTreeNode} parent
 * @param {number} key
 * @param {any} value
 * @private
 */
class NGNTreeLeaf {
  constructor (parent, key, value) {
    Object.defineProperties(this, {
      parent: NGN.private(parent),
      key: NGN.private(key),
      value: NGN.private(value)
    })
  }

  toString () {
    return this.key.toString()
  }
}

/**
 * @class NGN.DATA.BTree
 * A O(n) B-tree data type.
 * @private
 */
class NGNBTree extends NGN.EventEmitter {
  constructor (order = 52) {
    super()

    // Sanitize input
    order = order < 1 ? 1 : order

    Object.defineProperties(this, {
      root: NGN.private(new NGNTreeNode(this)),

      BTREE: NGN.private({}),

      METADATA: NGN.private({
        order: order,

        minOrder: order > 1 ? Math.floor(order/2) : 1,

        compare: (firstNumber, secondNumber) => {
          return firstNumber < secondNumber ? -1 : (firstNumber > secondNumber ? 1 : 0)
        }
      })
    })

    this.root.METADATA.minOrder = this.METADATA.minOrder
    this.root.METADATA.order = this.METADATA.order
  }

  /**
   * Validates a node and prints debugging info if something went wrong.
   * @param {!TreeNode|!Tree} node
   * @private
   */
  validate (node) {
    if (node instanceof NgnBTreeIndex) {
      return
    }

    if (node.leafs.length + 1 !== node.nodes.length) {
      NGN.ERROR(`Illegal leaf/node count in ${node}: ${node.leafs.length}/${node.nodes.length}`)
    }

    for (let i = 0; i < node.leafs.length; i++) {
      if (!node.leafs[i]) {
        NGN.ERROR(`Illegal leaf in ${node} at ${i}: ${node.leafs[i]}`)
      }
    }

    for (i = 0; i < node.nodes.length; i++) {
      if (NGN.typeof(node.nodes[i]) === 'undefined') {
        NGN.ERROR(`Illegal node in ${node} at ${i}: undefined`)
      }
    }
  }

  /**
   * Insert a key/value pair into the tree.
   * @param {number} key
   * @param {any} value
   * @param {boolean} [overwrite=true]
   * Overwrite existing values
   */
  put (key, value, overwrite = true) {
    if (NGN.typeof(key) !== 'number') {
      throw new Error(`Illegal key: ${key}`)
    }

    if (value === undefined) {
      throw new Error(`Illegal value: ${value}`)
    }

    return this.root.put(key, value, overwrite)
  }

  /**
   * Retrieve the value for the specified key.
   * @param {number} key
   * @returns {any}
   * If there is no such key, `undefined` is returned.
   */
  get (key) {
    if (NGN.typeof(key) !== 'number') {
      throw new Error(`Illegal key: ${key}`)
    }

    return this.root.get(key)
  }

  /**
   * Delete a key from the tree.
   * @param {number} key
   */
  delete (key) {
    if (NGN.typeof(key) !== 'number') {
      throw new Error(`Illegal key: ${key}`)
    }

    return this.root.delete(key)
  }

  /**
   * Walk through all keys in ascending order.
   * @param {number} minKey
   * If omitted or NULL, starts at the beginning
   * @param {number} maxKey
   * If omitted or NULL, walks till the end
   * @param {function} callback
   * @param {number} callback.key
   * The key
   * @param {any} callback.value
   * The value.
   */
  walk (minKey, maxKey, callback) {
    if (this.root.leafs.length === 0) {
      return
    }

    if (NGN.isFn(minKey)) {
      callback = minKey
      minKey = maxKey = null
    } else if (NGN.isFn(maxKey)) {
      callback = maxKey
      maxKey = null
    }

    minKey = NGN.coalesce(minKey)
    maxKey = NGN.coalesce(maxKey)

    let ptr
    let index

    if (minKey === null) {
      // No minimum limit
      ptr = this.root

      while (ptr.nodes[0] !== null) {
        ptr = ptr.nodes[0]
      }

      index = 0
    } else {
      // lookup
      let result = this.root.search(minKey)

      if (result.leaf) {
        // Minimum key itself exists
        ptr = result.leaf.parent
        index = ptr.leafs.indexOf(result.leaf)
      } else {
        // Key does not exist
        ptr = result.node
        index = result.index

        if (index >= ptr.leafs.length) {
          // begin at parent separator in overrun
          if (ptr.parent instanceof NGNBTree || ptr.parent.nodes.indexOf(ptr) >= ptr.parent.leafs.length) {
            return
          }

          ptr = ptr.parent
        }
      }
    }

    // ptr/index points to first result
    while (true) {
      if (maxKey !== null && this.METADATA.compare(ptr.leafs[index].key, maxKey) > 0) {
        break
      }
      if (ptr.leafs.length === 0) {
        break
      }

      if (callback(ptr.leafs[index].key, ptr.leafs[index].value)) {
        break
      }

      if (ptr.nodes[index + 1] !== null) {
        // Descend Tree
        ptr = ptr.nodes[index + 1]
        index = 0

        while (ptr.nodes[0] !== null) {
          ptr = ptr.nodes[0]
        }
      } else if (ptr.leafs.length > index + 1) {
        // Next
        index++
      } else {
        // Ascend Tree
        do {
          if ((ptr.parent instanceof NGNBTree)) {
            return
          }

          index = ptr.parent.nodes.indexOf(ptr)
          ptr = ptr.parent
        } while (index >= ptr.leafs.length)
      }
    }
  }

  /**
   * Walks through all keys in descending order.
   * @param {number} minKey
   * If omitted or NULL, starts at the beginning
   * @param {number} maxKey
   * If omitted or NULL, walks till the end
   * @param {function} callback
   * @param {number} callback.key
   * The key
   * @param {any} callback.value
   * The value.
   */
  walkDesc (minKey, maxKey, callback) {
    if (NGN.isFn(minKey)) {
      callback = minKey
      minKey = maxKey = null
    } else if (NGN.isFn(maxKey)) {
      callback = maxKey
      maxKey = null
    }

    minKey = NGN.coalesce(minKey)
    maxKey = NGN.coalesce(maxKey)

    let ptr
    let index
    if (maxKey === null) {
      // No maximum
      ptr = this.root

      while (ptr.nodes[ptr.nodes.length - 1] !== null) {
        ptr = ptr.nodes[ptr.nodes.length - 1]
      }

      index = ptr.leafs.length - 1
    } else {
      // Lookup
      let result = this.root.search(maxKey)

      if (result.leaf) {
        // Maximum key exists
        ptr = result.leaf.parent
        index = ptr.leafs.indexOf(result.leaf)
      } else {
        // Key does not exist
        ptr = result.node
        index = result.index - 1

        while (index < 0) {
          // Begin at parent separator on underrun
          if (ptr.parent instanceof NGNBTree) {
            return
          }

          index = ptr.parent.nodes.indexOf(ptr) - 1

          if (index < 0) {
            return
          }

          ptr = ptr.parent
        }
      }
    }

    // ptr/index points to first result
    while (true) {
      if (minKey !== null && this.METADATA.compare(ptr.leafs[index].key, minKey) < 0) {
        break
      }

      if (callback(ptr.leafs[index].key, ptr.leafs[index].value)) {
        break
      }

      if (ptr.nodes[index] !== null) {
        // Descend Tree
        ptr = ptr.nodes[index]

        while (ptr.nodes[ptr.nodes.length - 1] !== null) {
          ptr = ptr.nodes[ptr.nodes.length - 1]
        }

        index = ptr.leafs.length - 1
      } else if (index > 0) {
        // Next
        index--
      } else {
        // Ascend Tree
        do {
          if ((ptr.parent instanceof NGNBTree)) {
            return
          }

          index = ptr.parent.nodes.indexOf(ptr) - 1

          ptr = ptr.parent
        } while (index < 0)
      }
    }
  }

  /**
   * The number of keys between minKey and maxKey (both inclusive).
   * @param {number} minKey
   * If omitted, counts from the start
   * @param {number} maxKey
   * If omitted, counts till the end
   * @returns {number}
   */
  count (minKey, maxKey) {
    let n = 0

    this.walk(
      minKey !== undefined ? minKey : null,
      maxKey !== undefined ? maxKey : null,
      (key, value) => { n++ }
    )

    return n
  };

  /**
   * A string representation of the tree.
   * @returns {string}
   */
  toString () {
    return `Tree(${this.METADATA.order}) ${this.root.toString()}`
  }

  get length () {
    return this.count()
  }
}

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
    let id= typeof value === 'symbol' ? Symbol(String(value)) : Symbol(NGN.coalesce(value, NGN.typeof(value)).toString())

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
         * @cfgproperty {string} description
         * This is a metadata field, primarily used for documentation
         * or schema generation purposes.
         */
        description: NGN.coalesce(cfg.description, `${NGN.typeof(cfg.type)} field`),

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

        /**
         * @cfg {function} transformer
         * A synchronous transformation function will be applied each time
         * the field value is set. This can be used to modify data _before_ it
         * is stored as a field value. The returned value from the function
         * will be the new value of the field.
         *
         * The transformation function will receive the input as it's only
         * aregument. For example:
         *
         * ```js
         * let field = new NGN.DATA.Field({
         *   name: 'testfield',
         *   transformer: function (input) {
         *     return input + '_test'
         *   }
         * })
         *
         * field.value = 'a'
         *
         * console.log(field.value) // Outputs "a_test"
         * ```
         *
         * **Transformations can affect performance.** In small data sets,
         * transformations are typically negligible, only adding a few
         * milliseconds to processing time. This may affect large data sets,
         * particularly data stores using defauly bulk recod loading.
         */
        TRANSFORM: NGN.coalesce(cfg.transformer),

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
          // Preprocessing (transform input)
          if (this.METADATA.TRANSFORM !== null && NGN.isFn(this.METADATA.TRANSFORM)) {
            value = this.METADATA.TRANSFORM.call(this, value)
          }

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

    // Apply common rules
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

    // Associate a model if one is defined.
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

        // let events = Array.from(this.METADATA.EVENTS.values())
        // events.splice(events.indexOf('update'), 1)
        //
        this.on('update', (payload) => this.METADATA.commitPayload(payload))
        //
        // for (let i = 0; i < events.length; i++) {
        //   this.on(events[i], () => this.METADATA.model.emit(`field.${events[i]}`, ...arguments))
        // }
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
      this.emit('keystatus.changed', this)
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
    if (this.isIdentifier) {
      return NGN.coalesce(this.METADATA.autoid, this.METADATA.default)
    }

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
      NGN.WARN(`${this.METADATA.name} is a required field.`)
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

        case 'date':
          let valueType = NGN.typeof(value)

          if (valueType !== 'date') {
            if (valueType === 'number') {
              let dt = new Date()
              dt.setTime(value)

              value = dt
            } else {
              value = new Date(Date.parse(value))
            }
          }

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

      this.METADATA.model.pool('field.', {
        update: (change) => {
          if (change.field && monitoredFields.has(change.field.name)) {
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
    if (typeof currentValue !== 'symbol') {
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
 * @class NGN.DATA.FieldMap
 * A field map is a special data transformer that maps field names (keys)
 * to a different format. Consider the following field map:
 *
 * ```js
 * let fieldMap = new NGN.DATA.FieldMap({
 *   father: 'pa',
 *   mother: 'ma',
 *   brother: 'bro',
 *   sister: 'sis'
 * })
 * ```
 *
 * The map above reads as "the `father` field is also known as `pa`",
 * "the `mother` field is also known as `ma`", etc.
 *
 * The following transformation is possible:
 *
 * ```js
 * let result = fieldMap.apply({
 *   pa: 'John',
 *   ma: 'Jill',
 *   bro: 'Joe',
 *   sis: 'Jane'
 * })
 *
 * console.log(result)
 * ```
 *
 * _yields:_
 *
 * ```sh
 * {
 *   father: 'John'
 *   mother: 'Jill',
 *   brother: 'Joe',
 *   sister: 'Jane'
 * }
 * ```
 *
 * It is also possible to reverse field names:
 *
 * ```js
 * let result = fieldMap.applyReverse({
 *   father: 'John'
 *   mother: 'Jill',
 *   brother: 'Joe',
 *   sister: 'Jane'
 * })
 *
 * console.log(result)
 * ```
 *
 * _yields:_
 *
 * ```sh
 * {
 *   pa: 'John',
 *   ma: 'Jill',
 *   bro: 'Joe',
 *   sis: 'Jane'
 * }
 * ```
 *
 * This class is designed to assist with reading and writing data
 * to NGN.DATA.Model and NGN.DATA.Store instances.
 * @private
 */
class NGNDataFieldMap {
  constructor (cfg = {}) {
    Object.defineProperties(this, {
      originalSource: NGN.privateconst(cfg),
      sourceMap: NGN.private(null),
      reverseMap: NGN.private(null),
      applyData: NGN.privateconst((map = 'map', data) => {
        if (NGN.typeof(data) !== 'object') {
          return data
        }

        let keys = Object.keys(data)
        map = map === 'map' ? this.inverse : this.map

        for (let i = 0; i < keys.length; i++) {
          if (map.hasOwnProperty(keys[i])) {
            data[map[keys[i]]] = data[keys[i]]
            delete data[keys[i]]
          }
        }

        return data
      })
    })
  }

  /**
   * @property {object} map
   * A reference to the data mapping object.
   */
  get map () {
    if (this.sourceMap === null) {
      let keys = Object.keys(this.originalSource)

      this.sourceMap = {}

      for (let i = 0; i < keys.length; i++) {
        if (NGN.typeof(keys[i]) === 'string' && NGN.typeof(this.originalSource[keys[i]]) === 'string') {
          this.sourceMap[keys[i]] = this.originalSource[keys[i]]
        }
      }
    }

    return this.sourceMap
  }

  /**
   * @property {object} inverse
   * A reference to the inversed data map.
   */
  get inverse () {
    if (this.reverseMap === null) {
      let keys = Object.keys(this.originalSource)

      this.reverseMap = {}

      for (let i = 0; i < keys.length; i++) {
        if (NGN.typeof(keys[i]) === 'string' && NGN.typeof(this.originalSource[keys[i]]) === 'string') {
          this.reverseMap[this.originalSource[keys[i]]] = keys[i]
        }
      }
    }

    return this.reverseMap
  }

  /**
   * Apply the map to an object.
   * @param  {object} data
   * @return {object}
   */
  applyMap (data) {
    return this.applyData('map', data)
  }

  /**
   * Apply the inversed map to an object.
   * @param  {object} data
   * @return {object}
   */
  applyInverseMap (data) {
    return this.applyData('reverse', data)
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
class NGNDataEntity extends NGN.EventEmitter {
  constructor (cfg) {
    cfg = NGN.coalesce(cfg, {})

    super()

    if (cfg.dataMap) {
      cfg.fieldmap = cfg.dataMap
      NGN.WARN('"dataMap" is deprecated. Use "map" instead.')
    }

    if (cfg.idAttribute) {
      cfg.IdentificationField = cfg.idAttribute
      NGN.WARN('"idAttribute" is deprecated. Use "IdentificationField" instead.')
    }

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
        fields: Object.assign({}, NGN.coalesce(cfg.fields, {})),
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
         * If the NGN.DATA.Model#IdentificationField/id is not provided for a record,
         * a unique ID will be automatically generated for it.
         *
         * An NGN.DATA.Store using a model with this set to `true` will never
         * have a duplicate record, since the #id or #IdentificationField will always
         * be unique.
         */
        autoid: NGN.coalesce(cfg.autoid, false),

        /**
         * @cfg {String} [IdentificationField='id']
         * Setting this allows an attribute of the object to be used as the ID.
         * For example, if an email is the ID of a user, this would be set to
         * `email`.
         */
        IdentificationField: NGN.coalesce(cfg.IdentificationField, cfg.idField, 'id'),

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
        expiration: null,

        // Holds a setTimeout method for expiration events.
        expirationTimeout: null,

        created: Date.now(),
        store: null,

        /**
         * @cfg {boolean} [audit=false]
         * Enable auditing to support #undo/#redo operations. This creates and
         * manages a NGN.DATA.TransactionLog.
         */
        AUDITABLE: false,
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
         * @param  {NGN.DATA.Field|Object|Primitive} [fieldConfiguration=null]
         * The configuration to apply. See #addField for details.
         * @param  {Boolean} [suppressEvents=false]
         * Optionally suppress the `field.create` event.
         * @private
         */
        applyField: (field, fieldcfg = null, suppressEvents = false) => {
          // Prevent duplicate fields
          if (this.METADATA.knownFieldNames.has(field)) {
            return NGN.WARN(`Duplicate field "${field}" detected.`)
          }

          // Prevent reserved words
          if (this.hasOwnProperty(field) && field.toLowerCase() !== 'id') {
            throw new ReservedWordError(`"${field}" cannot be used as a field name (reserved word).`)
          }

          // If the field config isn't already an NGN.DATA.Field, create it.
          if (!(fieldcfg instanceof NGN.DATA.Field)) {
            if (fieldcfg instanceof NGN.DATA.Store || fieldcfg instanceof NGN.DATA.Model) {
              if (this.METADATA.IdentificationField === field) {
                throw new InvalidConfigurationError(`"${field}" cannot be an ID. Relationship fields cannot be an identification field/attribute.`)
              }

              this.METADATA.fields[field] = new NGN.DATA.Relationship({
                name: field,
                record: fieldcfg,
                model: this
              })
            } else {
              switch (NGN.typeof(fieldcfg)) {
                // Custom config
                case 'object':
                  fieldcfg.model = this
                  fieldcfg.identifier = NGN.coalesce(fieldcfg.identifier, this.METADATA.IdentificationField === field)
                  fieldcfg.name = field

                  this.METADATA.fields[field] = new NGN.DATA.Field(fieldcfg)

                  break

                // Collection of models
                case 'array':
                  return this.applyField(field, fieldcfg[0], suppressEvents)

                // Type-based cfg.
                default:
                  if (NGN.isFn(fieldcfg) || fieldcfg === null) {
                    if (NGN.isFn(fieldcfg) && ['string', 'number', 'boolean', 'number', 'symbol', 'regexp', 'date', 'array', 'object'].indexOf(NGN.typeof(fieldcfg)) < 0) {
                      this.METADATA.fields[field] = new NGN.DATA.VirtualField({
                        name: field,
                        identifier: this.METADATA.IdentificationField === field,
                        model: this,
                        method: fieldcfg
                      })

                      break
                    }

                    this.METADATA.fields[field] = new NGN.DATA.Field({
                      name: field,
                      type: fieldcfg,
                      identifier: this.METADATA.IdentificationField === field,
                      model: this
                    })

                    break
                  }

                  this.METADATA.fields[field] = new NGN.DATA.Field({
                    name: field,
                    type: NGN.isFn(fieldcfg) ? fieldcfg : String,
                    identifier: NGN.isFn(fieldcfg)
                      ? false
                      : NGN.coalesce(fieldcfg.identifier, this.METADATA.IdentificationField === field),
                    model: this
                  })

                  break
              }
            }
          } else if (fieldcfg.model === null) {
            fieldcfg.name = field
            fieldcfg.identifier = fieldcfg.identifier = NGN.coalesce(fieldcfg.identifier, this.METADATA.IdentificationField === field)

            this.METADATA.fields[field] = fieldcfg
            this.METADATA.fields[field].model = this
          } else if (fieldcfg.model === this) {
            fieldcfg.identifier = NGN.coalesce(fieldcfg.identifier, this.METADATA.IdentificationField === field)

            this.METADATA.fields[field] = fieldcfg
          } else if (!(fieldcfg instanceof NGN.DATA.Field)) {
            return NGN.WARN(`The "${fieldcfg.name}" field cannot be applied because model is already specified.`)
          }

          // Add a direct reference to the model.
          Object.defineProperty(this, field, {
            enumerable: true,
            configurable: true,
            get: () => this.get(field),
            set: (value) => this.set(field, value)
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

          this.METADATA.fields[field].relay('*', this, 'field.')

          if (!suppressEvents) {
            this.emit('field.create', this.METADATA.fields[field])
          }

          return this.METADATA.fields[field]
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
        setSilent: NGN.deprecate(this.setSilentFieldValue, 'setSilent has been deprecated. Use setSilentFieldValue instead.'),

        /**
         * @cfgproperty {object} fieldmap
         * An object mapping model attribute names to data storage field names.
         *
         * _Example_
         * ```
         * {
         *   ModelFieldName: 'inputName',
         *   father: 'dad',
         *	 email: 'eml',
         *	 image: 'img',
         *	 displayName: 'dn',
         *	 firstName: 'gn',
         *	 lastName: 'sn',
         *	 middleName: 'mn',
         *	 gender: 'sex',
         *	 dob: 'bd'
         * }
         * ```
         */
        DATAMAP: null
      }),

      MAP: NGN.get(() => {
        return NGN.coalesce(
          this.METADATA.DATAMAP,
          this.METADATA.store instanceof NGN.DATA.Store
            ? this.METADATA.store.map
            : null
        )
      })
    })

    if (cfg.fieldmap instanceof NGN.DATA.FieldMap){
      this.METADATA.DATAMAP = cfg.fieldmap
    } else if (NGN.typeof(cfg.fieldmap) === 'object') {
      this.METADATA.DATAMAP = new NGN.DATA.FieldMap(cfg.fieldmap)
    }

    // Bubble events to the BUS
    // this.relay('*', NGN.BUS, 'record.')

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

    // Apply automatic ID's when applicable
    if (this.METADATA.autoid) {
      let autoIdValue = null

      Object.defineProperty(this.METADATA, 'IdentificationValue', NGN.get(() => {
        if (autoIdValue === null) {
          autoIdValue = NGN.DATA.UTILITY.UUID()
        }

        return autoIdValue
      }))
    }

    // Apply auditing if configured
    this.auditable = NGN.coalesce(cfg.audit, false)

    // Clear any cached checksums when the model changes.
    this.on(['field.update', 'field.create', 'field.delete', 'field.hidden', 'field.unhidden'], () => {
      if (this.METADATA.checksum) {
        this.METADATA.checksum = null
      }
    })

    // Configure TTL/Expiration
    if (cfg.expires) {
      this.expires = cfg.expires
    }
  }

  get name () {
    return this.METADATA.name
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
        // Track Changes (if auditing enabled)
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
    return this.get(this.METADATA.IdentificationField)
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
   * @property {Array} changelog
   * The changelog returns the underlying NGN.DATA.TransactionLog#log if
   * auditing is available. The array will be empty if auditing is disabled.
   */
  get changelog () {
    return this.METADATA.AUDITLOG.log.map(entry => {
      let result = {
        timestamp: entry.timestamp,
        activeCursor: entry.activeCursor,
        value: {}
      }

      let data = entry.value
      let field = Object.keys(data)

      for (let i = 0; i < field.length; i++) {
        if (typeof data[field[i]] === 'symbol') {
          result.value[field[i]] = NGN.coalesce(
            this.METADATA.fields[field[i]].METADATA.AUDITLOG.getCommit(data[field[i]]).value,
            this.METADATA.fields[field[i]].default
          )
        } else {
          result.value[field[i]] = NGN.coalesce(this.METADATA.fields[field[i]].default)
        }
      }

      return result
    })
  }

  /**
   * @property {Number} createDate
   * The date/time when the model is created.
   */
  get createDate () {
    return this.METADATA.created
  }

  /**
   * @property {object} data
   * A serialized version of the data represented by the model. This
   * only includes non-virtual fields. See #representation to use
   * a representation of data containing virtual fields.
   */
  get data () {
    if (this.MAP) {
      return this.MAP.applyInverseMap(this.serializeFields())
    }

    return this.serializeFields()
  }

  /**
   * @property {object} unmappedData
   * Returns #data _without applying_ the data #map.
   */
  get unmappedData () {
    return this.serializeFields()
  }

  /**
   * @property {object} representation
   * A serialized version of the data represented by the model. This
   * includes virtual fields. See #data to use just the raw values.
   */
  get representation () {
    if (this.MAP) {
      return this.MAP.applyInverseMap(this.serializeFields(false, false))
    }

    return this.serializeFields(false, false)
  }

  /**
   * @property {object} unmappedRepresentation
   * Returns #representation _without applying_ the data #map.
   */
  get unmappedRepresentation () {
    return this.serializeFields(false, false)
  }

  /**
   * @property {string} checksum
   * The checksum is a unique "fingerprint" of the data stored in the model.
   * Please note that generating a checksum for an individual record is
   * usually a quick operation, but generating large quantities of checksums
   * simultaneously/sequentially can be computationally expensive. On average,
   * a checksum takes 3-125ms to generate.
   */
  get checksum () {
    this.METADATA.checksum = NGN.coalesce(this.METADATA.checksum, NGN.DATA.UTILITY.checksum(JSON.stringify(this.data)))

    return this.METADATA.checksum
  }

  /**
   * @property {Date} expires
   * The date/time when the record expires. This may be set to
   * a future date, or a numeric value. Numeric values
   * represent the number of milliseconds from the current time
   * before the record expires. For example, set this to `3000`
   * to force the record to expire 3 seconds from now.
   *
   * Set this to `0` to immediately expire the record. Set this to
   * `-1` or `null` to prevent the record from expiring.
   */
  get expires () {
    return this.METADATA.expiration
  }

  set expires (value) {
    if (value === null) {
      clearTimeout(this.METADATA.expirationTimeout)
      this.METADATA.expiration = null
      return
    }

    let now = new Date()

    if (!isNaN(value) && !(value instanceof Date)) {
      // Handle numeric (millisecond) expiration
      if (value < 0) {
        this.METADATA.expiration = null

        return
      }

      if (value === 0) {
        this.METADATA.expiration = now
        this.emit('expire')

        return
      }

      this.METADATA.expiration = new Date()
      this.METADATA.expiration.setTime(now.getTime() + value)
    } else if (!(value instanceof Date) || value <= now) {
      throw new Error(`${this.name} expiration (TTL) value must be a positive number (milliseconds) or future date.`)
    } else {
      // Handle date-based expiration
      this.METADATA.expiration = value
    }

    clearTimeout(this.METADATA.expirationTimeout)

    this.METADATA.expirationTimeout = setTimeout(() => this.emit('expire'), this.METADATA.expiration.getTime() - now.getTime())
  }

  get expired () {
    if (this.METADATA.expiration === null) {
      return false
    }

    return this.METADATA.expiration <= (new Date())
  }

  serializeFields (ignoreID = false, ignoreVirtualFields = true) {
    if (this.METADATA.knownFieldNames.size === 0) {
      return {}
    }

    let fields = this.METADATA.knownFieldNames.keys()
    let result = {}
    let fieldname = fields.next()

    while (!fieldname.done) {
      let field = this.METADATA.fields[fieldname.value]

      // Ignore unserializable fields
      if ((

        field.value === undefined ||
        (ignoreID && fieldname.value === this.IdentificationField) ||
        (!field.virtual || (!ignoreVirtualFields && field.virtual))
      )) {
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

      fieldname = fields.next()
    }

    return result
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
    if (field === 'id' || field === 'ID' || field === this.METADATA.IdentificationField) {
      field = this.METADATA.IdentificationField

      if (this.METADATA.autoid) {
        if (!this.METADATA.knownFieldNames.has(field)) {
          return this.METADATA.IdentificationValue
        } else {
          return NGN.coalesce(this.METADATA.fields[field].value, this.METADATA.IdentificationValue)
        }
      }
    }

    if (this.METADATA.knownFieldNames.has(field)) {
      return this.METADATA.fields[field].value
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
      this.METADATA.fields[field].value = value
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
  addField (name, fieldConfiguration = null, suppressEvents = false) {
    if (name instanceof NGN.DATA.Field) {
      fieldConfiguration = name
      name = fieldConfiguration.name
    } else if (typeof name !== 'string') {
      throw new Error('Cannot add a non-string based field.')
    }

    this.METADATA.applyField(name, fieldConfiguration, suppressEvents)
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
      }

      if (this.METADATA.store !== null) {
        this.METADATA.store.emit(this.METADATA.store.PRIVATE.EVENT.DELETE_RECORD_FIELD, {
          record: this,
          field
        })
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
    if (name.toLowerCase() === 'id' && !this.METADATA.fields.hasOwnProperty(name) && this.METADATA.fields.hasOwnProperty(this.METADATA.IdentificationField)) {
      return this.METADATA.fields[this.METADATA.IdentificationField]
    }

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

  /**
   * @method load
   * Load a data record.
   * @param {object} data
   * The data to apply to the model.
   * @param {boolean} [suppressEvents=false]
   * Do not emit a change event when the data is loaded.
   */
  load (data, suppressEvents = false) {
    if (this.MAP) {
      data = this.MAP.applyMap(data)
    }

    let keys = Object.keys(data)

    for (let i = 0; i < keys.length; i++) {
      if (this.METADATA.knownFieldNames.has(keys[i])) {
        this.METADATA.fields[keys[i]].METADATA.setValue(data[keys[i]], suppressEvents)
      } else {
        NGN.WARN(`Failed to load ${keys[i]} field of ${this.name} model. "${keys[i]}" is not a recognized field.`)
      }
    }

    if (!suppressEvents) {
      this.emit('load')
    }

    return this
  }

  next () {
    // TODO: Get the next record in the data set.
  }

  previous () {
    // TODO: Get the previous record in the data set.
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
  /**
   * Create a new data index.
   * @param {Boolean} [BTree=false]
   * Use a B-Tree index. This is only available for numeric values and dates.
   * @param {String} [name='Untitled Index']
   * Optional name for index. This is useful for debugging when multiple
   * indexes exist.
   */
  constructor (btree = false, name = 'Untitled Index') {
    super()

    Object.defineProperties(this, {
      // Private constants
      CREATE_EVENT: NGN.privateconst(Symbol('create')),
      REMOVE_EVENT: NGN.privateconst(Symbol('delete')),
      UPDATE_EVENT: NGN.privateconst(Symbol('update')),

      // Private data attributes
      uniqueValues: NGN.privateconst(new Set()),
      knownRecords: NGN.privateconst([]), // Linked list of Sets
      name: NGN.const(name),
      isBTree: NGN.privateconst(btree)
    })

    // Bubble up private events when applicable
    const me = this
    this.on([
      this.CREATE_EVENT,
      this.REMOVE_EVENT,
      this.UPDATE_EVENT
    ], function (oid, value, suppressEvent = false) {
      if (!suppressEvent) {
        me.emit(this.event.toString().replace(/^Symbol\(|\)$/g, ''), oid)
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

    // Support BTree Indexing
    if (this.isBTree) {
      Object.defineProperty(this, 'BTREE', NGN.privateconst(new NGN.DATA.BTree(2, name)))
    }
  }

  get keys () {
    if (this.uniqueValues.size === 0) {
      return []
    }

    return Array.from(this.uniqueValues.values())
  }

  /**
   * Add a field/value to the index.
   * @param {any} value
   * The value of the model/record indexed field.
   * @param {Symbol} oid
   * The record's object ID (NGN.DATA.Model#OID)
   */
  add (value, oid, suppressEvent = false) {
    let valueIndex = -1

    // Create or identify the index of the unique value
    if (!this.uniqueValues.has(value)) {
      this.uniqueValues.add(value)
      this.knownRecords.push(new Set())
      valueIndex += this.uniqueValues.size
    } else {
      valueIndex = this.indexOf(value)
    }

    this.knownRecords[valueIndex].add(oid)

    // Add BTree indexing
    if (this.isBTree) {
      let btreeValue = value instanceof Date ? value.getTime() : value

      if (this.BTREE.get(btreeValue) === undefined) {
        this.BTREE.put(btreeValue, valueIndex)
      }
    }

    this.emit(this.CREATE_EVENT, oid, value, suppressEvent)
  }

  /**
   * Remove a record from the index.
   * @param  {Symbol} oid
   * The record's object ID (NGN.DATA.Model#OID)
   * @param  {any} [value=undefined]
   * When specified, the field value will be used to identify
   * the index value. Specifying this value will make the remove
   * operation faster (uses introspection).
   */
  remove (oid, value, suppressEvent = false) {
    // If a value is specified, attempt to lookup the OID by value.
    if (value !== undefined) {
      let index = this.recordsOf(value)

      // If a value index is found, remove the OID
      if (index) {
        if (index.delete(oid)) { // Returns false if nothing is actually deleted.
          if (this.isBTree && (!index || index.size === 0)) {
            this.BTREE.delete(value instanceof Date ? value.getTime() : value)
          }

          this.emit(this.REMOVE_EVENT, oid, value, suppressEvent)

          return
        }
      }

      NGN.WARN(`Index value "${value}" not found in index.`)
    }

    // Iterate through all index values to remove the OID (slow)
    let removed = false
    for (let i = 0; i < this.knownRecords.length; i++) {
      if (this.knownRecords[i].delete(oid) && !removed) {
        removed = true
        value = Array.from(this.uniqueValues.values())[i]

        if (this.isBTree) {
          this.BTREE.delete(value instanceof Date ? value.getTime() : value)
        }

        break
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
      this.add(newValue, oid, true)
      this.emit(this.UPDATE_EVENT, oid, null, suppressEvent)
    }
  }

  /**
   * Forcibly reset the index (clears everything).
   */
  reset () {
    this.uniqueValues.clear()
    this.knownRecords.splice(0)

    if (this.isBTree) {
      this.BTREE.reset()
    }

    this.emit('reset')
  }

  /**
   * Retrieve the index number of known records for the
   * specified value.
   * @private
   * @param  {any} value
   * The unique value for which records are known.
   * @return {[numeric]}
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
   * @return {Set}
   * An set of object ID's or `null` if none exist.
   */
  recordsOf (value) {
    let valueIndex = this.indexOf(value)

    return valueIndex < 0 ? null : this.knownRecords[valueIndex]
  }

  /**
   * Get the list of records for the given value.
   * @param  {any} value
   * The value of the index to lookup.
   * @return {array}
   * The array contains OID reference values (records).
   */
  recordsFor (value) {
    let index = this.recordsOf(value)

    if (index === null || index.size === 0) {
      return []
    }

    return Array.from(index.values())
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
         *	 email: 'eml',
         *	 image: 'img',
         *	 displayName: 'dn',
         *	 firstName: 'gn',
         *	 lastName: 'sn',
         *	 middleName: 'mn',
         *	 gender: 'sex',
         *	 dob: 'bd'
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

    if (!(record instanceof NGNDataEntity)) {
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
          return
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

      case 'symbol':
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


  const NGNDataModel = function (cfg) {
    if (NGN.typeof(cfg) !== 'object') {
      throw new Error('Model must be configured.')
    }

    let Model = function (data) {
      let Entity = new NGN.DATA.Entity(cfg)

      if (data) {
        Entity.load(data)
      }

      return Entity
    }

    Object.defineProperty(Model.prototype, 'CONFIGURATION', NGN.const(cfg))

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
    FieldMap: NGN.privateconst(NGNDataFieldMap),
    Model: NGN.const(NGNDataModel),
    Entity: NGN.privateconst(NGNDataEntity),
    Index: NGN.privateconst(NGNDataIndex),
    Store: NGN.const(NGNDataStore),
    BTree: NGN.privateconst(NGNBTree)
  })))
})()