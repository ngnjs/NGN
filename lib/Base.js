'use strict'

let crypto = require('crypto')

/**
 * @class NGN.Class
 * A base class providing a simple inheritance model for JavaScript classes. All
 * API classes are an extension of this model.<br/><br/>
 * **Example:**
 *
 *     // Superclass
 *     class Vehicle extends NGN.Class {
 *       constructor(type) {
 *         this.type = type
 *       }
 *
 *       accelerate() {
 *         return this.type+' is accelerating'
 *       }
 *     }
 *
 *     // Subclass
 *     class Car extends Vehicle {
 *       constructor(doorCount) {
 *         super('car')
 *
 *         Object.defineProperty(this,'doors',{
 *           value:      doorCount || 4, // Default = 4
 *           writable:   true,
 *           enumerable: true
 *         })
 *       }
 *
 *       accelerate () {
 *         console.log('The '+this.doors+'-door '+ Car.super.accelerate.call(this))
 *       }
 *     }
 *
 *     var mustang = new Car(2)
 *     mustang.accelerate()
 *
 *     //Outputs: The 2-door car is accelerating.
 *
 * @docauthor Corey Butler
 * @requires events
 */
class NgnClass {
  constructor () {}

  /**
   * @method typeOf
   * Get the type of a specific object.
   * @returns {String}
   * @protected
   */
  typeOf (obj) {
    if (obj === undefined) {
      return 'undefined'
    }
    if (obj === null) {
      return 'null'
    }
    if (['true', 'false'].indexOf(obj.toString()) >= 0) {
      return 'boolean'
    }
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
  }

  /**
   * @method coalesce
   * Finds the first non-null/defined value in a list of arguments.
   * This can be used with {@link Boolean Boolean} values, since `true`/`false` is a
   * non-null/defined value.
   * @param {Mixed} args
   * Any number of arguments can be passed to this method.
   */
  coalesce () {
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i] !== undefined) {
        if (this.typeOf(arguments[i]) !== 'null') {
          return arguments[i]
        }
      }
    }
    // No values? Return null
    return null
  }

  /**
   * @method checksum
   * Provides a checksum for any string-based content.
   * @param {string} content
   * The content to prepare a checksum for.
   * @param {string} [algorithm=md5]
   * The algorithm used to generate the checksum.
   * @param {string} [encoding=hex]
   * The encoding type.
   */
  checksum (content, algorithm, encoding) {
    return crypto
      .createHash(algorithm || 'md5')
      .update(content, 'utf8')
      .digest(encoding || 'hex')
  }
}

Object.setPrototypeOf(NgnClass.prototype, require('events').EventEmitter.prototype)

/**
 * @method on
 * Add an event listener for the specified topic.
 * @param {string} topic
 * The topic to subscribe to.
 * @param {function} callback
 * The event handler.
 * @param {object|number|string|array|boolean} callback.data
 * The data/payload emitted by the event.
 */

/**
 * @method emit
 * Send an event to the BUS.
 * @param {string} topic
 * The topic/channel.
 * @param {object|number|string|array|boolean} [data]
 * The data/payload attached to the event.
 */

module.exports = NgnClass
