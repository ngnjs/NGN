'use strict'

const EE = require('events').EventEmitter

/**
 * @class NGN.EventEmitter
 * A customized EventEmitter. In addition to Node's native event
 * emitter functionality, this class provides support for RegExp-based
 * events and wildcards (ex: `scope.*`). It also supports event pooling,
 * binding, event attachment shortcuts, and event queues (delayed events).
 *
 * This class is designed to provide the same API as can be found in the
 * frontend library (exceptions are notated).
 * @extends events.EventEmitter
 * @private
 */
class EventEmitter extends EE {
  // constructor () {
  //   super()
  // }

  emit () {
    const event = arguments[0]
    let events = [event]

    if (NGN.typeof(event) === 'regexp' || event.indexOf('*') >= 0) {
      let re = event

      if (NGN.typeof(re) !== 'regexp') {
        re = new RegExp(event.replace('*', '.*', 'gi'))
      }

      events = this.eventNames().filter(function (eventName) {
        return re.test(eventName) && eventName !== event
      })
    }

    let args = Array.from(arguments)
    args.shift()

    for (let index in events) {
      args.unshift(events[index])
      super.emit.apply(this, args)
      args.shift()
    }
  }

  /**
   * @method off
   * Remove an event handler. If no handler is specified, all handlers for
   * the spcified event will be removed.
   * @param {string} eventName
   * Name of the event to remove.
   * @param {function} [handlerFn]
   * The handler function to remove from the event handlers.
   */
  off (eventName, callback) {
    this.removeListener(eventName, callback)
  }

  /**
   * @method onceoff
   * Remove an event handler that was originally created using #once. If no
   * handler is specified, all handlers for the spcified event will be removed.
   * @param {string} eventName
   * Name of the event to remove.
   * @param {function} handlerFn
   * The handler function to remove from the event handlers.
   */
  onceoff (eventName, callback) {
    this.off(eventName, callback)
  }

  /**
   * @method clear
   * Remove all event handlers from the EventEmitter (both regular and adhoc).
   */
  clear () {
    const me = this
    this.eventNames().forEach(function (eventName) {
      me.removeAllListeners(eventName)
    })
  }
}

module.exports = EventEmitter
