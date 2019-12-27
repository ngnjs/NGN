import NGN from '../core.js'

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
export default class NGNDataFieldMap { // eslint-disable-line
  constructor (cfg = {}) {
    Object.defineProperties(this, {
      originalSource: NGN.privateconst(cfg),
      sourceMap: NGN.private(null),
      reverseMap: NGN.private(null),
      applyData: NGN.privateconst((map = 'map', data) => {
        if (NGN.typeof(data) !== 'object') {
          return data
        }

        const keys = Object.keys(data)
        map = map === 'map' ? this.inverse : this.map

        for (let i = 0; i < keys.length; i++) {
          if (map.hasOwnProperty(keys[i])) { // eslint-disable-line no-prototype-builtins
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
      const keys = Object.keys(this.originalSource)

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
      const keys = Object.keys(this.originalSource)

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
