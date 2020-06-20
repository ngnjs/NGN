import Core from '../class.js'
import Listener from './listener.js'
import { WARN } from '../internal.js'

export default class EventEmitter extends Core {
  #ttl = -1
  #maxListeners = 25
  #listeners = new Map()
  #dynamicListeners = new Set()

  // Determines if an event name is dynamic (i.e. a pattern/regex)
  #isDynamicEventName = (name = null) => name !== null ? name instanceof RegExp || (typeof name === 'string' && name.indexOf('*')) : false
  // Converts an event name to a RegExp for use in dynamic listeners.
  #getListenerRegex = name => name instanceof RegExp ? name : new RegExp('^' + name.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$')
  // Retrieves the list of listeners, then retrieves each listener object and applies a function to it.
  #forEachListener = (name, fn) => this.listeners(name).map(i => this.#listeners.get(i)).forEach(i => fn(i))

  constructor (cfg = {}) {
    super(...arguments)
    
    if (cfg.hasOwnProperty('defaultMaxListeners')) {
      this.#maxListeners = cfg.defaultMaxListeners
    }

    this.alias('addListener', this.on)
    this.alias('addEventListener', this.on)
    this.alias('removeListener', this.off)
    this.alias('removeEventListener', this.off)
    this.alias('clear', this.removeAllListeners)
  
    this.register('EventEmitter')
  }

  /**
   * @property {number} TTL
   * The **t**ime-**t**o-**l**ive value, in milliseconds. Set this
   * value to auto-expire handlers after the TTL period has elapsed.
   */
  get TTL () {
    return this.#ttl
  }

  set TTL (value) {
    if (this.#ttl === value) {
      return
    }

    if (isNaN(value)) {
      throw new TypeError(`The TTL value supplied to the ${this.name} event emitter must be an integer, not ${typeof value}.`)
    }
    
    if (value === 0) {
      value = -1
    }

    this.#ttl = value
  }

  // The maximum number of listeners allowed for each event.
  get maxListeners () {
    return this.#maxListeners
  }

  set maxListeners (value) {
    if (typeof value !== 'number') {
      if (value !== Infinity) {
        value = -1
      } else {
        throw new TypeError('maxListeners must be a non-zero integer.')
      }
    }

    if (value === this.#maxListeners) {
      return
    }

    this.#maxListeners = value
    this.#forEachListener(l => { l.maxListeners = value })
  }

  /**
   * @method getMaxListeners
   * This method is for node-like runtimes.
   * It is a reference to the listener maximum threshold (#maxListeners).
   * @return {number}
   */
  getMaxListeners () {
    return this.#maxListeners
  }

  /**
   * @method setMaxListeners
   * This method is for node-like runtimes.
   * It is a reference to the listener maximum threshold (#maxListeners).
   * @param {number} maximum
   * The maximum number of listeners allowed per event.
   */
  setMaxListeners (value) {
    this.maxListeners = value
  }

  /**
   * @method on
   * Create a new event handler for the specified event.
   * @param {string|string[]} eventName
   * Name of the event to listen for.
   * @param {function} handler
   * The method responsible for responding to the event.
   * This is ignored if eventName is an object.
   * @param {number} [TTL]
   * Time-To-Live is the number of milliseconds before the event handler
   * is automatically removed. This is useful for automatically cleaning
   * up limited-life event handlers.
   * @param {boolean} [prepend=false]
   * When set to `true`, the event is added to the beginning of
   * the processing list instead of the end.
   * This is ignored if eventName is an object.
   * @return {Symbol} id
   * Returns a unique ID (a [Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol))
   * which can be used to retrieve/delete the listener.
   */
  on (name, handler, ttl = null, prepend = false) {
    // If an array of events is specified, apply the handler to each listener.
    if (Array.isArray(name)) {
      name.forEach(eventName => this.on(eventName, handler, ttl, prepend))
      return
    }

    if (typeof name === 'object') {
      return this.pool(name)
    }

    if (typeof name !== 'string' && typeof name !== 'symbol') {
      throw new TypeError(`The ${this.name} event emitter cannot listen for ${typeof name} events. Please provide a string or symbol.`)
    }

    // Add the underlying listener (if necessary)
    let listener = this.#listeners.get(name)
    if (!listener) {
      listener = new Listener(name, this.#maxListeners)
      
      // ID the parent emitter
      listener.parent = this
      
      // When the listener has no handlers, remove it.
      listener.flush = () => {
        this.#listeners.delete(name)
        this.emit('removeListener', name)
      }
    }

    // Create and identify a new handler
    const id = listener.add(handler, prepend, ttl || this.#ttl)

    // Update the listener collection with the new addition
    this.#listeners.set(name, listener)

    // If the listener is a regex or pattern-based event, track
    // it for rapid retrieval (for emit method).
    if (listener.dynamic) {
      this.#dynamicListeners.add(name)
    }

    this.emit('newListener', name, handler, id)

    return id
  }

  /**
   * @method prependListener
   * This is the same as #addListener, except the event handler is added to the beginning of the queue.
   * @param  {string|object} eventName
   * Name of the event to listen for.
   * If an object is passed, this method will automatically setup a #pool.
   * @param  {Function} handler
   * The method responsible for responding to the event.
   * This is ignored if eventName is an object.
   * @return {Symbol} id
   * Returns a unique ID (a [Symbol](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol))
   * which can be used to retrieve/delete the listener.
   */
  prependListener(name, handler, ttl = null) {
    return this.on(name, handler, ttl, true)
  }

  /**
   * @method once
   * Create a new event handler for the specified event. The
   * handler will be removed immediately after it is executed. This
   * effectively listens for an event to happen once and only once
   * before the handler is destroyed.
   * @param  {string} eventName
   * Name of the event to listen for.
   * @param  {Function} handler
   * The method responsible for responding to the event.
   */
  once (name, handler, ttl = null, prepend = false) {
    const oid = this.on(...arguments)
    this.#forEachListener(name, listener => listener.once(oid))
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
  prependOnceListener(name, handler, ttl = null) {
    this.once(name, handler, ttl, true)
  }

  /**
   * @method off
   * Remove an event handler. If no handler is specified, all handlers for
   * the specified event will be removed.
   * @param {string} event
   * Name of the event to remove.
   * @param {function|symbol} [handlerFn]
   * The handler function to remove from the event handlers.
   * Alternatively, provide the ID as returned by the #addListener method.
   */
  off (name, handler) {
    if (arguments.length === 0) {
      return this.removeAllListeners()
    }

    if (Array.isArray(name)) {
      name.forEach(eventName => this.off(eventName, handler))
      return
    }

    const listeners = this.listeners(name)

    if (listeners.length === 0) {
      WARN(`Failed to remove event listener(s). The "${this.name}" event emitter has no listeners for the "${name.toString()}" event.`)
    } else {
      listeners.forEach(name => {
        let listener = this.#listeners.get(name)
        listener.remove(handler)
        
        this.emit('removeListener', name)
      })
    }
  }

  /**
   * @method removeAllListeners
   * Remove all event handlers from the EventEmitter (both regular and adhoc).
   */
  removeAllListeners(name = null) {
    if (arguments.length > 1) {
      (new Set([...arguments])).forEach(arg => this.removeAllListeners(arg))
      return
    }

    if (name !== null) {
      this.off(name)
    } else {
      let events = this.listeners()
      this.#listeners = new Map()
      events.forEach(eventName => this.emit('removeListener', eventName))
    }
  }

  /**
   * @method {number} listenerCount
   * The number of listeners for a specific event.
   * @param {string} eventName
   * The name of the event to count listeners for.
   */
  listenerCount (name) {
    const listener = this.#listeners.get(name)
    return listener ? listener.size : 0
  }

  /**
   * @method listeners
   * Returns the raw listener methods for the event.
   * @param {string} eventName
   * Name of the event to retrieve listeners for.
   * @return {array}
   */
  listeners (filter = null) {
    // LOGIC: Running Array.from inside the Set deduplicates name list
    const list = Array.from(new Set(Array.from(this.#listeners.keys())))
    return (filter === null ? list : list.filter(name => typeof name === 'symbol' ? name === filter : this.#getListenerRegex(name).test(filter)))
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
   * @param {string|string[]} eventName
   * The name of the event to trigger.
   * @param {any} [payload]
   * An optional payload. This can be any number of additional arguments.
   */
  emit () {
    const args = Array.from(arguments)
    const name = args.shift()

    if (Array.isArray(name)) {
      name.forEach(eventName => this.emit(eventName, ...args))
      return
    }
    
    this.#forEachListener(name, listener => listener.execute(name, ...args))
  }

  /**
   * @method eventNames
   * A node-like reference providing an array of recognized event names.
   * @return {array}
   */
  eventNames () {
    return this.listeners()//.filter(name => !this.#isDynamicEventName(name))
  }

  /**
   * @method pool
   * A helper command to create multiple related subscribers
   * all at once. This is a convenience function.
   * @property {string} [prefix]
   * Supply a prefix to be added to every event. For example,
   * `myScope.` would turn `someEvent` into `myScope.someEvent`.
   * @property {Object} subscriberObject
   * A key:value object where the key is the name of the
   * unprefixed event and the key is the handler function.
   * A value can be an object, allowing for nesting events. For example:
   *
   * ```js
   * NGN.BUS.pool('prefix.', {
   *   deep: {
   *     nested: {
   *       eventName: function () {
   *         console.log('event triggered')
   *       }
   *     }
   *   }
   * })
   *
   * NGN.BUS.emit('prefix.deep.nested.eventName') // <-- Outputs "event triggered"
   * ```
   */
  pool (prefix, group) {
    if (typeof prefix !== 'string') {
      group = prefix
      prefix = null
    }

    const me = this
    const pool = {}

    for (const eventName in group) {
      const topic = `${prefix || ''}${eventName}`

      if (typeof group[eventName] === 'function') {
        this.maxListeners++
        pool[eventName] = this.on(topic, group[eventName])
      } else if (typeof group[eventName] === 'object') {
        this.pool(`${topic}.`, group[eventName])
      } else if (typeof group[eventName] === 'string') {
        // Forward strings 
        pool[eventName] = this.on(topic, function () {
          me.emit(group[eventName], ...arguments)
        })
      } else {
        WARN(`${topic} could not be pooled in the event emitter because its value is not a function.`)
      }
    }
  }
}
