'use strict'
// let EventEmitter = require('events').EventEmitter
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
  constructor () {
//    var EE = new EventEmitter(), me = this
//    Object.keys(Object.getPrototypeOf(EE)).forEach(function(attr){
//      me[attr] = EE[attr]
//    })
  }

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
}

Object.setPrototypeOf(NgnClass.prototype, require('events').EventEmitter.prototype)

module.exports = NgnClass
