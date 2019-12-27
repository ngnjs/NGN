import NGN from '../core.js'

/**
 * @class EventEmitterBase
 * This is an extendable generic class used to apply event management
 * to non-DOM objects, such as data models, logging, and other common
 * elements of JavaScript programming.
 * @protected
 */
export default class BrowserEmitter { // eslint-disable-line no-unused-vars
  /**
   * @constructor
   * ```
   * let EE = new EventEmitter()
   * ```
   * This is a protected class. It is most commonly instantiated through
   * the NGN namespace (i.e. `new NGN.EventEmitter()`). However; it is
   * designed for use within the NGN library, not directly as an event emitter.
   * Use with caution.
   */
  constructor (cfg) {
    cfg = cfg || {}

    Object.defineProperties(this, {
      handlers: NGN.private({}),
      adhoc: NGN.private({}),
      maxlisteners: NGN.private(cfg.defaultMaxListeners || 25)
    })
  }

  /**
   * @property {object} subscribers
   * An array of all subscribers which currently have a registered event handler.
   * @warning This is a UI-only method.
   */
  get subscribers () {
    const subscriberList = {}

    for (const eventName in this.handlers) {
      subscriberList[eventName] = {
        handler: this.handlers[eventName].length,
        adhoc: 0
      }
    }

    for (const eventName in this.adhoc) {
      subscriberList[eventName] = subscriberList[eventName] || {
        handler: 0
      }

      subscriberList[eventName].adhoc = this.adhoc[eventName].length
    }

    return subscriberList
  }

  /**
   * @property defaultMaxListeners
   * The maximum number of listeners for a single event.
   */
  get defaultMaxListeners () {
    return this.maxlisteners
  }

  set defaultMaxListeners (value) {
    this.maxlisteners = value
  }

  /**
   * @method {number} listenerCount
   * The number of listeners for a specific event.
   * @param {string} eventName
   * The name of the event to count listeners for.
   */
  listenerCount (eventName) {
    return (this.handlers[eventName] || []).length +
      (this.adhoc[eventName] || []).length
  }

  /**
   * @method getMaxListeners
   * A node-like reference to the #defaultMaxListeners value.
   * @return {number}
   */
  getMaxListeners () {
    return this.defaultMaxListeners
  }

  /**
   * @method setMaxListeners
   * A node-like reference to the #defaultMaxListeners value (setter).
   */
  setMaxListeners (value) {
    this.defaultMaxListeners = value
  }

  /**
   * @method eventNames
   * A node-like reference providing an array of recognized event names.
   * @return {array}
   */
  eventNames () {
    const handlers = Object.keys(this.handlers)
    const adhoc = Object.keys(this.adhoc)
    return NGN.dedupe(handlers.concat(adhoc))
  }

  /**
   * @method listeners
   * Returns the raw listener methods for the event.
   * @param {string} eventName
   * Name of the event to retrieve listeners for.
   * @return {array}
   */
  listeners (eventName) {
    const handlers = this.handlers[eventName] || []
    const adhoc = this.adhoc[eventName] || []
    return handlers.concat(adhoc)
  }

  /**
   * @method addListener
   * Create a new event handler for the specified event.
   * @param  {string|object} eventName
   * Name of the event to listen for.
   * If an object is passed, this method will automatically setup a #pool.
   * @param  {Function} handler
   * The method responsible for responding to the event.
   * This is ignored if eventName is an object.
   */
  addListener (eventName, callback) {
    if (typeof eventName === 'object') {
      return this.pool(eventName)
    }

    this.handlers[eventName] = this.handlers[eventName] || []
    this.handlers[eventName].unshift(callback)
    this.emit('newListener', eventName, callback)

    if (this.listenerCount(eventName) > this.maxlisteners) {
      throw new Error('Maximum event listeners exceeded. Use setMaxListeners() to adjust the level.')
    }
  }

  /**
   * @method prependListener
   * This is the same as #addListener, except the event handler is added to the end of the queue.
   * @param  {string|object} eventName
   * Name of the event to listen for.
   * If an object is passed, this method will automatically setup a #pool.
   * @param  {Function} handler
   * The method responsible for responding to the event.
   * This is ignored if eventName is an object.
   */
  prependListener (eventName, callback) {
    if (typeof eventName === 'object') {
      return this.pool(eventName)
    }

    this.handlers[eventName] = this.handlers[eventName] || []
    this.handlers[eventName].push(callback)
    this.emit('newListener', eventName, callback)

    if (this.listenerCount(eventName) > this.maxlisteners) {
      throw new Error('Maximum event listeners exceeded. Use setMaxListeners() to adjust the level.')
    }
  }

  /**
   * @method onceListener
   * Create a new event handler for the specified event. The
   * handler will be removed immediately after it is executed. This
   * effectively listens for an event to happen once and only once
   * before the handler is destroyed.
   * @param  {string} eventName
   * Name of the event to listen for.
   * @param  {Function} handler
   * The method responsible for responding to the event.
   */
  once (eventName, callback) {
    this.adhoc[eventName] = this.adhoc[eventName] || []
    this.adhoc[eventName].push(callback)
    this.emit('newListener', eventName, callback)

    if (this.listenerCount(eventName) > this.maxlisteners) {
      throw new Error('Maximum event listeners exceeded. Use setMaxListeners() to adjust the level.')
    }
  }

  /**
   * @method prependOnceListener
   * A node-like reference to the #once method, adding events to the
   * beginning of the event list (processed before others) instead of the end.
   * @param  {string} eventName
   * Name of the event to listen for.
   * @param  {Function} handler
   * The method responsible for responding to the event.
   */
  prependOnceListener (eventName, callback) {
    this.adhoc[eventName] = this.adhoc[eventName] || []
    this.adhoc[eventName].unshift(callback)
    this.emit('newListener', eventName, callback)

    if (this.listenerCount(eventName) > this.maxlisteners) {
      throw new Error('Maximum event listeners exceeded. Use setMaxListeners() to adjust the level.')
    }
  }

  /**
   * @method removeListener
   * Remove an event handler. If no handler is specified, all handlers for
   * the specified event will be removed.
   * @param {string} eventName
   * Name of the event to remove.
   * @param {function} [handlerFn]
   * The handler function to remove from the event handlers.
   */
  removeListener (eventName, handlerFn) {
    this.deleteEventHandler('handlers', eventName, handlerFn)
    this.deleteEventHandler('adhoc', eventName, handlerFn)
  }

  /**
   * @method deleteEventHandler
   * Remove a specific event handler.
   * @param {string} type
   * Either `handler` (multi-use events) or `adhoc` (one-time events)
   * @param {string} eventName
   * Name of the event to remove.
   * @param {function} handlerFn
   * The handler function to remove from the event handlers.
   * @private
   */
  deleteEventHandler (type, eventName, handlerFn) {
    const scope = this[type]

    if (scope[eventName]) {
      if (!handlerFn) {
        delete scope[eventName]
        return
      }

      const result = []
      scope[eventName].forEach((handler) => {
        if (handler.toString() !== handlerFn.toString()) {
          result.push(handler)
        }
      })

      if (result.length === 0) {
        delete scope[eventName]
        return
      }

      scope[eventName] = result
    }
  }

  /**
   * @method removeAllListeners
   * Remove all event handlers from the EventEmitter (both regular and adhoc).
   */
  removeAllListeners (eventName = null) {
    if (eventName !== null) {
      delete this.handlers[eventName]
      delete this.adhoc[eventName]
    } else {
      this.handlers = {}
      this.adhoc = {}
    }
  }

  /**
   * @method emit
   * Fires an event. This method accepts one or more arguments. The
   * first argument is always the event name, followed by any number
   * of payload arguments.
   *
   * Example:
   * ```
   * const EE = new NGN.EventEmitter()
   *
   * EE.emit('someevent', {payload: 1}, {payload: 2})
   * ```
   * The example above triggers an event called `someevent` and applies
   * the remaining two arguments to any event handlers.
   * @param {string} eventName
   * The name of the event to trigger.
   */
  emit () {
    const args = NGN.slice(arguments)
    const eventName = args.shift()
    const events = this.getAllEvents(eventName)

    if (typeof eventName === 'symbol') {
      events.push(eventName)
    }

    const scope = {
      event: eventName
    }

    for (let name = 0; name < events.length; name++) {
      const adhocEvent = this.adhoc[events[name]]

      // Adhoc event handling
      if (adhocEvent) {
        delete this.adhoc[events[name]]

        while (adhocEvent.length > 0) {
          const fn = adhocEvent.pop()

          scope.handler = fn

          fn.apply(scope, args)
        }
      }

      // Regular event handling
      const handler = this.handlers[events[name]]

      if (handler) {
        for (let fn = 0; fn < handler.length; fn++) {
          scope.handler = handler[fn]
          handler[fn].apply(scope, args)
        }
      }
    }
  }

  /**
   * @method getAllEvents
   * Returns all of the events that match an event name. The event name
   * may contain wildcards (i.e. `*`) or it can be a regular expression.
   * @param  {string|regexp} eventName
   * A string or regular expression defining which event names to identify.
   * A string value containing an asterisk (*) will be converted to a regular
   * expression for simplistic wildcard event handling purposes.
   * @return {array}
   * An array of unique event names with handlers or adhoc handlers.
   * @private
   */
  getAllEvents (eventName) {
    const regularEvents = Object.keys(this.handlers)
    const adhocEvents = Object.keys(this.adhoc)
    let allEvents = NGN.dedupe(regularEvents.concat(adhocEvents))

    allEvents = allEvents.filter(function (event) {
      // If the event is an exact match, don't filter it out.
      if (event === eventName) {
        return true
      }

      // If the event is a regexp/wildcard, further processing is necessary.
      if (NGN.typeof(event) === 'regexp' || event.indexOf('*') >= 0) {
        // Convert wildcard events to a regular expression.
        if (NGN.typeof(event) !== 'regexp') {
          event = new RegExp(event.replace(/\./g, '\\.').replace(/\*/g, '.*'), 'g')
        }
        // If the event name matches the event, keep it.
        return event.test(eventName)
      }

      // None of the criteria were met. Ignore the event.
      return false
    })

    return allEvents
  }
}
