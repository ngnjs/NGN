import NGN from '../core.js'

/**
 * @class NGN.UTILITY.Set
 * Provides advanced features for [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)
 * objects.
 */
export default class NGNSet { // eslint-disable-line
  /**
   * Indicates the subset is wholly contained within the main set.
   * @param  {Set}  mainset
   * @param  {Set}  subset
   * @return {Boolean}
   */
  static isSuperSet (mainset, subset) {
    if (subset.size > mainset.size || subset.size === 0) {
      return false
    }

    const elements = mainset.values()
    let element = elements.next()

    while (!element.done) {
      if (!mainset.has(element.value)) {
        return false
      }

      element = elements.next()
    }

    return true
  }

  /**
   * Join any number of sets together into a single aggregate set.
   * Only unique values will be added.
   * Accepts any number of Set arguments.
   * @return {Set}
   */
  static concat () {
    let aggregate = new Set(arguments[0]) // eslint-disable-line prefer-const

    for (let i = 1; i < arguments.length; i++) {
      const elements = arguments[i].values()
      let element = elements.next()

      while (!element.done) {
        aggregate.add(element.value)
        element = elements.next()
      }
    }

    return aggregate
  }

  /**
   * Identify the intersection/overlap between two sets.
   * @param  {Set} setA
   * @param  {Set} setB
   * @return {Set}
   * Returns a Set containing the common elements of setA and setB.
   */
  static intersection (setA, setB) {
    let intersection = new Set() // eslint-disable-line prefer-const
    const a = setA.size < setB.size ? setA : setB
    const b = setA.size < setB.size ? setB : setA
    const elements = a.values()
    let element = elements.next()

    while (!element.done) {
      if (b.has(element.value)) {
        intersection.add(element.value)
      }

      element = elements.next()
    }

    return intersection
  }

  /**
   * Identify the elements that are NOT part of both sets.
   * @param  {Set} setA
   * @param  {Set} setB
   * @return {Set}
   * Returns a set containing elements that are NOT common between setA and setB.
   */
  static difference (setA, setB) {
    let diff = new Set(setA) // eslint-disable-line prefer-const
    const elements = setB.values()
    let element = elements.next()

    while (!element.done) {
      diff.delete(element.value)
      element = elements.next()
    }

    return diff
  }

  /**
   * Determines whether two sets contain the same values.
   * @param  {Set} setA
   * @param  {Set} setB
   * @return {Boolean}
   */
  static equal (setA, setB) {
    return NGN.UTILITY.Set.difference(setA, setB).size === 0
  }

  static equals () {
    NGN.WARN('NGN.UTILITY.Set.equals() should be equal() (no s at the end).')
    NGN.UTILITY.Set.equal(...arguments)
  }

  /**
   * A convenience method for appending the Set prototype with all
   * of the methods in this utility, where the first argument of
   * each method automatically refers to the Set.
   * @private
   */
  static applyAll () {
    Set.prototype.isSuperSet = function (subset) { // eslint-disable-line no-extend-native
      return NGN.UTILITY.Set.isSuperSet(this, subset)
    }

    Set.prototype.concat = function () { // eslint-disable-line no-extend-native
      return NGN.UTILITY.Set.concat(this, ...arguments)
    }

    Set.prototype.intersection = function () { // eslint-disable-line no-extend-native
      return NGN.UTILITY.Set.intersection(this, ...arguments)
    }

    Set.prototype.difference = function () { // eslint-disable-line no-extend-native
      return NGN.UTILITY.Set.difference(this, ...arguments)
    }

    Set.prototype.equals = function () { // eslint-disable-line no-extend-native
      return NGN.UTILITY.Set.equal(this, ...arguments)
    }
  }
}
