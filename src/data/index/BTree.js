import EventEmitter from '../../emitter/core'

/**
 * Inspired by btree.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: http://github.com/dcodeIO/btree.js for details.
 *
 * Converted to ECMASCript 2016 class syntax & modified to use
 * NGN conventions. Separated code into multiple classes.
 * Copyright (c) 2018, Ecor Ventures LLC.
 * @hidden
 */
class TreeNode {
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
  * @return {TreeLeaf|TreeNode}
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

        if (this.METADATA.compare(b.key, key) === 0) {
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

    node.leafs.splice(index, 0, new TreeLeaf(node, key, value))
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
    if (this.parent instanceof Tree) {
      // Root has a single child and no leafs
      if (this.leafs.length === 0 && this.nodes[0] !== null) {
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
        subst = new TreeNode(this.parent, this.leafs.concat([sep], right.leafs), this.nodes.concat(right.nodes))
        subst.METADATA.order = this.METADATA.order
        subst.METADATA.minOrder = this.METADATA.minOrder

        // Remove the seperator from the parent
        this.parent.leafs.splice(index, 1)

        // And replace the nodes it seperated with subst
        this.parent.nodes.splice(index, 2, subst)
      } else if (left !== null) {
        // Combine left + seperator from parent + this
        sep = this.parent.leafs[index - 1]
        subst = new TreeNode(
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
        throw new Error(`Internal error: ${this.toString(true)} has neither a left nor a right sibling`)
      }

      this.parent.balance()
    }
  }

  /**
  * Split the node.
  */
  split () {
    let index = Math.floor(this.leafs.length / 2)

    if (this.parent instanceof Tree) {
      this.nodes = [
        new TreeNode(this, this.leafs.slice(0, index), this.nodes.slice(0, index + 1)),
        new TreeNode(this, this.leafs.slice(index + 1), this.nodes.slice(index + 1))
      ]

      this.leafs = [this.leafs[index]]
    } else {
      let leaf = this.leafs[index]
      let rest = new TreeNode(
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
    let i

    for (i = 0; i < this.leafs.length; i++) {
      value.push(this.leafs[i].key)
    }

    let s = `[${value.toString()}]${(this.parent instanceof Tree ? ':*' : ':')}${this.parent}`

    if (includeNodes) {
      for (i = 0; i < this.nodes.length; i++) {
        s += ` -> ${this.nodes[i]}`
      }
    }

    return s
  }
}

/**
 * @hidden
 */
class TreeLeaf {
  /**
   * Constructs a new Leaf containing a value.
   * @param {NGNTreeNode} parent
   * @param {number} key
   * @param {any} value
   */
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
export default class Tree extends EventEmitter {
  constructor (order = 52) {
    super()

    // Sanitize input
    order = order < 1 ? 1 : order

    Object.defineProperties(this, {
      root: NGN.private(new TreeNode(this)),

      BTREE: NGN.private({}),

      METADATA: NGN.private({
        order: order,

        minOrder: order > 1 ? Math.floor(order / 2) : 1,

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
    if (node instanceof Tree) {
      return
    }

    if (node.leafs.length + 1 !== node.nodes.length) {
      NGN.ERROR(`Illegal leaf/node count in ${node}: ${node.leafs.length}/${node.nodes.length}`)
    }

    let i

    for (i = 0; i < node.leafs.length; i++) {
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
          if (ptr.parent instanceof Tree || ptr.parent.nodes.indexOf(ptr) >= ptr.parent.leafs.length) {
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
          if ((ptr.parent instanceof Tree)) {
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
          if (ptr.parent instanceof Tree) {
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
          if ((ptr.parent instanceof Tree)) {
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
