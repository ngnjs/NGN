(function () {
  let EE

  // Create a stub class supporting both environments.
  if (NGN.nodelike) {
    EE = require('events').EventEmitter
  } else {
    (function () {
      /**
 * @class EventEmitterBase
 * This is an extendable generic class used to apply event management
 * to non-DOM objects, such as data models, logging, and other common
 * elements of JavaScript programming.
 * @protected
 */
class EventEmitterBase { // eslint-disable-line no-unused-vars
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
    let subscriberList = {}

    for (let eventName in this.handlers) {
      subscriberList[eventName] = {
        handler: this.handlers[eventName].length,
        adhoc: 0
      }
    }

    for (let eventName in this.adhoc) {
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
    let handlers = Object.keys(this.handlers)
    let adhoc = Object.keys(this.adhoc)
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
    let handlers = this.handlers[eventName] || []
    let adhoc = this.adhoc[eventName] || []
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
    let scope = this[type]

    if (scope[eventName]) {
      if (!handlerFn) {
        delete scope[eventName]
        return
      }

      let result = []
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
    let args = NGN.slice(arguments)
    const eventName = args.shift()
    const events = this.getAllEvents(eventName)

    if (typeof eventName === 'symbol') {
      events.push(eventName)
    }

    let scope = {
      event: eventName
    }

    for (let name = 0; name < events.length; name++) {
      let adhocEvent = this.adhoc[events[name]]

      // Adhoc event handling
      if (adhocEvent) {
        delete this.adhoc[events[name]]

        while (adhocEvent.length > 0) {
          let fn = adhocEvent.pop()

          scope.handler = fn

          fn.apply(scope, args)
        }
      }

      // Regular event handling
      let handler = this.handlers[events[name]]

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


      EE = EventEmitterBase // eslint-disable-line no-undef
    })()
  }

  /**
   * @class NGN.EventEmitter
   * The EventEmitter is an extandable event driver non-DOM objects, such as
   * data models, objects, and other common elements of JavaScript programming.
   *
   * The NGN.EventEmitter is based on and compatible with the [Node.js EventEmitter](https://nodejs.org/dist/latest/docs/api/events.html#events_class_eventemitter).
   * It contains additional event management capabilities, which are available
   * in browser _and_ Node.js environments.
   */
  class EventEmitter extends EE {
    constructor () {
      super()

      // const INSTANCE = Symbol('instance')

      Object.defineProperties(this, {
        // META: NGN.get(() => this[INSTANCE]),

        META: NGN.private({
          queued: {},
          collectionQueue: {},
          thresholdQueue: {},
          defaultTTL: -1,
          wildcardEvents: new Set()
        }),

        /**
         * @method setTTL
         * Set a default time-to-live for event handlers (in milliseconds).
         * After the TTL period elapses, event handlers are removed.
         * By default, there is no TTL (`-1`).
         * @param {number} ttl
         * The number of milliseconds before an event handler is automatically
         * removed. This value may be `-1` (no TTL/never expires) or a value
         * greater than `0`.
         */
        setTTL: NGN.const((ttl = -1) => {
          if (ttl === 0) {
            NGN.WARN('NGN.EventEmitter#TTL cannot be 0.')
            return
          }

          this.META.defaultTTL = ttl
        }),

        /**
         * @alias off
         * Remove an event handler. If no handler is specified, all handlers for
         * the specified event will be removed.
         * This is a shortcut for #removeListener.
         * @param {string} eventName
         * Name of the event to remove.
         * @param {function} [handlerFn]
         * The handler function to remove from the event handlers.
         */
        off: NGN.public((eventName, handlerFn) => {
          if (NGN.typeof(eventName) === 'array') {
            for (let i = 0; i < eventName.length; i++) {
              this.off(eventName[i], handlerFn)
            }

            return
          }

          let l = this.listeners(eventName)

          if (!NGN.isFn(handlerFn)) {
            return this.clear(eventName)
          }

          let wrappedHandlerFn = this.wrapEventHandlerWithScope(eventName, handlerFn)

          if (l.indexOf(wrappedHandlerFn) < 0) {
            for (let i = 0; i < l.length; i++) {
              if (l[i].toString() === wrappedHandlerFn.toString()) {
                this.META.wildcardEvents.delete(eventName)
                // this.removeListener(eventName, handlerFn)
                this.removeListener(eventName, l[i], false)
                break
              }
            }
          } else {
            this.META.wildcardEvents.delete(eventName)
            this.removeListener(eventName, handlerFn)
          }
        }),

        /**
         * @method deprecate
         * Provides a deprecation notice for the specified event.
         * Automatically emits the appropriate "replacement" event
         * if a replacement event is configured. If no replacement
         * event is configured, the deprecation notice will be written
         * to the console but no replacement event will be triggered.
         * @param {string} deprecatedEventName
         * The name of the deprecated event.
         * @param {string} [replacementEventName]
         * The name of the new event.
         */
        deprecate: NGN.const((deprecatedEventName, replacementEventName) => {
          const me = this

          this.on(deprecatedEventName, function () {
            NGN.WARN(`${deprecatedEventName} is deprecated. ` + (!replacementEventName ? '' : `Use ${replacementEventName} instead.`))

            if (replacementEventName) {
              let args = NGN.slice(arguments)

              args.shift()
              args.unshift(replacementEventName)

              me.emit.apply(me, args)
            }
          })
        }),

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
         * @private
         */
        pool: NGN.privateconst(function (prefix, group) {
          if (typeof prefix !== 'string') {
            group = prefix
            prefix = ''
          }

          let pool = {}

          for (let eventName in group) {
            let topic = `${NGN.coalesce(prefix, '')}${eventName}`

            if (NGN.isFn(group[eventName])) {
              this.increaseMaxListeners()

              pool[eventName] = this.on(topic, group[eventName])
            } else if (typeof group[eventName] === 'object') {
              this.pool(`${topic}.`, group[eventName])
            } else {
              NGN.WARN(`${topic} could not be pooled in the event emitter because it's value is not a function.`)
            }
          }
        }),

        /**
         * @method attach
         * Attach a function to a topic. This can be used
         * to forward events in response to asynchronous functions.
         *
         * For example:
         *
         * ```js
         * myAsyncDataFetch(NGN.BUS.attach('topicName'))
         * ```
         *
         * This is the same as:
         *
         * ```js
         * myAsyncCall(function(data){
         *  NGN.BUS.emit('topicName', data)
         * })
         * ```
         * @param {string} eventName
         * The name of the event to attach a handler method to.
         * @param {boolean} [preventDefaultAction=false]
         * Setting this to `true` will execute a `event.preventDefault()` before
         * attaching the handler.
         * @returns {function}
         * Returns a function that will automatically be associated with an event.
         */
        attach: NGN.const(function (eventName, preventDefaultAction) {
          preventDefaultAction = NGN.coalesce(preventDefaultAction, false)

          return (e) => {
            if (preventDefaultAction && !NGN.nodelike) {
              e.preventDefault()
            }

            this.emit(eventName, ...arguments)
          }
        }),

        /**
         * @method increaseMaxListeners
         * Increase the number of maximum listeners.
         * @param {Number} [value = 1]
         * The number of events the max listener account will be increased by.
         * @private
         */
        increaseMaxListeners: NGN.private((count = 1) => {
          this.setMaxListeners(this.getMaxListeners() + count)
        }),

        /**
         * @method decreaseMaxListeners
         * Decrease the number of maximum listeners.
         * @param {Number} [value = 1]
         * The number of events the max listener account will be decreased by.
         * @private
         */
        decreaseMaxListeners: NGN.private((count = 1) => {
          this.setMaxListeners(this.getMaxListeners() - count)
        }),

        /**
         * @method forward
         * A special subscriber that fires one or more event in response to
         * to an event. This is used to bubble events up/down an event chain.
         *
         * For example:
         *
         * ```js
         * NGN.BUS.forward('sourceEvent', ['someEvent','anotherEvent'], {payload:true})
         * ```
         * When `sourceEvent` is published, the bind method triggers `someEvent` and
         * `anotherEvent`, passing the payload object to `someEvent` and
         * `anotherEvent` subscribers simultaneously.
         *
         * To forward an event to another EventEmitter, see #relay.
         * @param {String} sourceEvent
         * The event to subscribe to.
         * @param {String|Array} triggeredEvent
         * An event or array of events to fire in response to the sourceEvent.
         * @param {any} data
         * Optional data to pass to each bound event handler.
         * @returns {Object}
         * Returns an object with a single `remove()` method.
         */
        forward: NGN.const(function (eventName, triggers, payload) {
          triggers = NGN.forceArray(triggers)

          let me = this
          let listener = function () {
            let args = NGN.slice(arguments)

            if (payload) {
              args.push(payload)
            }

            me.emit(triggers, ...args)
          }

          this.increaseMaxListeners()
          this.on(eventName, listener)

          // Provide handle back for removal of topic
          return {
            remove: () => {
              this.decreaseMaxListeners()
              this.off(eventName, listener)
            }
          }
        }),

        /**
         * This relays an entire event to a different event emitter.
         * For example:
         *
         * ```js
         * let emitterA = new NGN.EventEmitter()
         * let emitterB = new NGN.EventEmitter()
         *
         * emitterA.relay('my.event', emitterB)
         *
         * emitterB.on('my.event', () => { console.log('Emitter B heard the event!') })
         *
         * emitterA.emit('my.event') // Outputs "Emitter B heard the event!"
         * ```
         * @param  {string} eventName
         * The name of the event to listen for.
         * @param  {NGN.EventEmitter} targetEmitter
         * The emitter to relay the event to.
         * @param {string} [prefix]
         * An optional prefix to prepend to the eventName.
         * @param {string} [postfix]
         * An optional postfix to append to the eventName.
         */
        relay: NGN.const(function (eventName, targetEmitter, prefix = null, postfix = null) {
          let eventNameList = NGN.forceArray(eventName)

          for (let i = 0; i < eventNameList.length; i++) {
            let eventName = eventNameList[i]

            this.on(eventName, function () {
              if (NGN.typeof(this.event) === 'symbol') {
                if (prefix !== null || postfix !== null) {
                  NGN.INFO('Cannot relay a symbol-based event with a prefix/postfix.')
                }

                targetEmitter.emit(...arguments)
              } else {
                targetEmitter.emit(`${NGN.coalesce(prefix, '')}${this.event}${NGN.coalesce(postfix, '')}`, ...arguments)
              }
            })
          }
        }),

        /**
         * This relays an entire event to a different event emitter. This is
         * the same as #relay, but the event handler is removed after the
         * first invocation of the event.
         *
         * For example:
         *
         * ```js
         * let emitterA = new NGN.EventEmitter()
         * let emitterB = new NGN.EventEmitter()
         *
         * emitterA.relayOnce('my.event', emitterB)
         *
         * emitterB.on('my.event', () => { console.log('Emitter B heard the event!') })
         *
         * emitterA.emit('my.event') // Outputs "Emitter B heard the event!"
         * emitterA.emit('my.event') // Does nothing
         * ```
         * @param  {string} eventName
         * The name of the event to listen for.
         * @param  {NGN.EventEmitter} targetEmitter
         * The emitter to relay the event to.
         * @param {string} [prefix]
         * An optional prefix to prepend to the eventName.
         * @param {string} [postfix]
         * An optional postfix to append to the eventName.
         */
        relayOnce: NGN.const(function (eventName, targetEmitter, prefix = null, postfix = null) {
          let eventNameList = NGN.forceArray(eventName)

          for (let i = 0; i < eventNameList.length; i++) {
            let eventName = eventNameList[i]

            this.once(eventName, function () {
              if (NGN.typeof(this.event) === 'symbol') {
                if (prefix !== null || postfix !== null) {
                  NGN.INFO('Cannot relay a symbol-based event with a prefix/postfix.')
                }

                targetEmitter.emit(...arguments)
              } else {
                targetEmitter.emit(`${NGN.coalesce(prefix, '')}${this.event}${NGN.coalesce(postfix, '')}`, ...arguments)
              }
            })
          }
        }),

        /**
         * @method delayEmit
         * This method waits for the specified duration, then publishes an
         * event once. This will publish the event only once at the end of the
         * wait period, even if the event is triggered multiple times. This can
         * be useful when working with many events triggered in rapid succession.
         *
         * For example, an NGN.DATA.Model representing a person may be used to
         * track a user profile. The NGN.DATA.Model fires an event called `field.update`
         * every time a data field is modified. In many cases, a user may update
         * multiple fields of their profile using a form with a "Save" button.
         * Instead of generating a new "save" (to disk, to memory, to an API, etc)
         * operation for each field, the publishOnce event can wait until all
         * changes are made before running the save operation.
         *
         * ```js
         * // Create a data model representing a person.
         * var Person = new NGN.DATA.Model({....})
         *
         * // Create a new person record for a user.
         * var user = new Person()
         *
         * // When the user is modified, save the data.
         * user.on('field.update', function () {
         *   // Wait 300 milliseconds to trigger the save event
         *   NGN.BUS.delayEmit('user.save', 300)
         * })
         *
         * // Save the user using an API
         * NGN.BUS.on('user.save', function () {
         *   NGN.NET.put({
         *     url: 'https://my.api.com/user',
         *     json: user.data
         *   })
         * })
         *
         * // Modify the record attributes (which are blank by default)
         * user.firstname = 'John'
         * user.lastname = 'Doe'
         * user.age = 42
         *
         * // Make another update 1 second later
         * setTimeout(function () {
         *   user.age = 32
         * }, 1000)
         * ```
         *
         * The code above sets up a model and record. Then it listens to the record
         * for field updates. Each time it recognizes an update, it queues the "save"
         * event. When the queue matures, it fires the `user.save` event.
         *
         * The first `field.update` is triggered when `user.firstname = 'John'` runs.
         * This initiates a queue for `user.save`, set to mature in 300 millisenconds.
         * Next, a `field.update` is triggered when `user.lastname = 'Doe'` runs.
         * This time, since the queue for `user.save` is already initiated, notthing
         * new happens. Finally, a `field.update` is triggered when `user.age = 42`
         * runs. Just like the last one, nothing happens since the `user.save` queue
         * is already active.
         *
         * The `user.save` queue "matures" after 300 milliseconds. This means after
         * 300 milliseconds have elapsed, the `user.save` event is triggered. In this
         * example, it means the `NGN.NET.put()` code will be executed. As a result,
         * all 3 change (firstname, lastname, and age) will be complete before the
         * API request is executed. The queue is cleared immediately.
         *
         * The final update occurs 1 second later (700 milliseconds after the queue
         * matures). This triggers a `field.update`, but since the queue is no
         * longer active, it is re-initiated. 300 milliseconds later, the `user.save`
         * event is fired again, thus executing the API request again (1.3 seconds
         * in total).
         * @param {string} eventName
         * The event/topic to publish/emit.
         * @param {Number} [delay=300]
         * The number of milliseconds to wait before firing the event.
         * @param {Any} [payload]
         * An optional payload, such as data to be passed to an event handler.
         */
        delayEmit: NGN.const(function (eventName, delay) {
          if (!this.META.queued.hasOwnProperty(eventName)) {
            let args = NGN.slice(arguments)
            args.splice(1, 1)

            this.META.queued[eventName] = setTimeout(() => {
              delete this.META.queued[eventName]
              this.emit(...args)
            }, delay)
          }
        }),

        /**
         * @method getInternalCollectionId
         * Returns a unique ID for special collections.
         * @param {object} collection
         * The collection to generate an ID for.
         * @private
         */
        getInternalCollectionId: NGN.privateconst(function (collection) {
          return Symbol(collection)
          // let time = (new Date()).getTime().toString()
          // let rand = Math.random().toString()
          // let key = Object.keys(collection).length + 1
          //
          // while (collection.hasOwnProperty(`${key.toString()}${time}${rand}`)) {
          //   key++
          // }
          //
          // return `${key.toString()}${time}${rand}`
        }),

        /**
         * @method handleCollectionTrigger
         * A method to manage #chain event handlers.
         * @private
         */
        handleCollectionTrigger: NGN.privateconst(function (eventName, key) {
          let me = this

          return function () {
            // Use setTimeout to simulate nextTick
            setTimeout(() => {
              let cq = me.META.collectionQueue

              if (cq[key]) {
                cq[key].remainingqueue.delete(eventName)

                if (cq[key].remainingqueue.size === 0) {
                  cq[key].remainingqueue = cq[key].masterqueue

                  if (NGN.isFn(cq[key].eventName)) {
                    cq[key].eventName(cq[key].payload)
                  } else {
                    me.emit(cq[key].eventName, cq[key].payload)
                  }
                }
              }
            }, 0)
          }
        }),

        /**
         * @method funnel
         * Emit an event after a collection of unique events have all fired.
         * This can be useful in situations where multiple asynchronous actions
         * must complete before another begins. For example, blending 3
         * remote data sources from different API's into a single resultset
         * can be achieved with this.
         *
         * **Example**
         * ```js
         * let collection = NGN.BUS.funnel(['download1done', 'download2done', 'download3done'], 'make.results')
         *
         * let allData = []
         *
         * // When all of the downloads are done, log them.
         * NGN.BUS.on('make.results', () => {
         *   console.log(allData)
         * })
         *
         * // Download the first set of data asynchronously
         * NGN.NET.json('http:/download1.com/data.json', (data) => {
         *   allData.push(data)
         *   NGN.BUS.emit('download1done')
         * })
         *
         * // Download the second set of data asynchronously
         * NGN.NET.json('http:/download2.com/data.json', (data) => {
         *   allData.push(data)
         *   NGN.BUS.emit('download2done')
         * })
         *
         * // Download the third set of data asynchronously
         * NGN.NET.json('http:/download3.com/data.json', (data) => {
         *   allData.push(data)
         *   NGN.BUS.emit('download3done')
         * })
         *
         * // The handler can be removed with the special method
         * // returned by the emitAfter method:
         * collection.remove()
         * ```
         * @param {array} eventCollection
         * An array of events. Once _all_ of these events have fired,
         * the triggerEventName will be fired.
         * @param {string|function} triggerEventName
         * The name of the event triggered after the collection has completed.
         * This can also be a callback function. If a callback function is provided,
         * it will receive the payload as the only argument when it is triggered.
         * @param {any} [payload]
         * An optional payload delivered to the #triggerEventName.
         * @returns {object} collection
         * Provides the key/value configuration of the collection.
         * ```js
         * {
         *   masterqueue: ['event1', 'event2', 'etc'], // The original event array (non-editable)
         *   remainingqueue: [...], // The events the BUS is still waiting for before firing the trigger event.
         *   eventName: 'triggeredEventName', // Name of the event triggered after the remaining elements are flushed.
         *   payload: 'anything', // OPTIONAL
         *   remove: [Function]
         * }
         * ```
         */
        funnel: NGN.const((eventCollection, triggerEventName, payload = null) => {
          if (NGN.typeof(eventCollection) !== 'array') {
            throw new Error(`NGN.BUS.funnel expected an array of events, but received a(n) ${NGN.typeof(eventCollection)}`)
          }

          let collection = new Set(eventCollection)
          let key = this.getInternalCollectionId(this.META.collectionQueue)

          this.META.collectionQueue[key] = {}

          Object.defineProperties(this.META.collectionQueue[key], {
            masterqueue: NGN.const(new Set(eventCollection)),
            remainingqueue: NGN.private(collection),
            eventName: NGN.const(triggerEventName),
            remove: NGN.const(() => {
              this.META.collectionQueue[key].masterqueue.forEach(event => {
                this.off(event, this.handleCollectionTrigger(event, key))
              })

              this.decreaseMaxListeners(this.META.collectionQueue[key].masterqueue.size)

              delete this.META.collectionQueue[key]
            }),
            payload: NGN.const(payload)
          })

          this.increaseMaxListeners(collection.size)

          collection.forEach(event => {
            this.on(event, this.handleCollectionTrigger(event, key))
          })

          return this.META.collectionQueue[key]
        }),

        /**
         * @method funnelOnce
         * This provides the same functionality as #funnel, but
         * removes the listener after the resultant event has fired.
         * See #funnel for detailed usage.
         * @param {array} eventCollection
         * An array of events. Once _all_ of these events have fired,
         * the triggerEventName will be fired.
         * @param {string} triggerEventName
         * The name of the event triggered after the collection has completed.
         * @param {any} [payload]
         * An optional payload delivered to the #triggerEventName.
         * @returns {object} collection
         * Provides the key/value configuration of the collection.
         */
        funnelOnce: NGN.const((eventCollection, triggerEventName, payload = null) => {
          let funnelClosureEvent = `::NGNFUNNEL::${(new Date()).getTime()}::${triggerEventName}`
          // let funnelClosureEvent = Symbol(triggerEventName)
          let collection = this.funnel(eventCollection, funnelClosureEvent, payload)

          this.increaseMaxListeners()
          this.once(funnelClosureEvent, () => {
            collection.remove()
            collection = null
            this.emit(triggerEventName, payload)
          })
        }),

        /**
         * @method threshold
         * After an event is fired a predetermined number of times (the threshold),
         * trigger another event or function.
         *
         * For example:
         *
         * ```js
         * NGN.BUS.threshold('push.my.button', 3, 'annoyed')
         *
         * NGN.BUS.on('annoyed', function () {
         *   console.log('We apologize for the slow response, but excessive clicking will not speed up the process.')
         * })
         *
         * document.getElementById('#myButton').addEventListener('click', NGN.BUS.attach('push.my.button'))
         * ```
         *
         * Once the threshold is exceeded, the final event will be triggered and
         * the threshold will be reset. Using the example above, this means
         * clicking 3 times on `#myButton` would trigger the `annoyed` event ONCE,
         * 6 times triggers `annoyed` TWICE, 9 times triggers `annoyed` THREE times, etc.
         * @param {string} thresholdEventName
         * The name of the event to count.
         * @param {number} limit
         * The number of occurrances allowed until the final event is triggered.
         * The event will be triggered at the threshold. For example, if the limit
         * is `3`, the finalEvent will be triggered the 3rd time thresholdEventName is
         * fired.
         * @param {string|function} finalEventName
         * This can be an event or callback function triggered when the threshold is crossed.
         * If a callback function is specified, the payload is passed as the only argument.
         * @param {any} [payload]
         * An optional payload to send to the finalEvent handler(s).
         * @returns {object}
         * Returns an object that can be used to remove the threshold.
         *
         */
        threshold: NGN.const(function (thresholdEventName, limit, finalEventName, payload = null) {
          if (typeof thresholdEventName !== 'string') {
            throw new Error('The threshold event name must be a string (received ' + (typeof thresholdEventName) + ')')
          }

          // let key = `${this.getInternalCollectionId(this.META.thresholdQueue)}${limit.toString()}`
          let key = this.getInternalCollectionId(this.META.thresholdQueue)

          this.META.thresholdQueue[key] = {}

          Object.defineProperties(this.META.thresholdQueue[key], {
            key: NGN.const(key),
            eventName: NGN.const(thresholdEventName),
            limit: NGN.const(limit),
            count: NGN.private(0),
            finalEventName: NGN.const(finalEventName),
            remove: NGN.const(() => {
              let event = this.META.thresholdQueue[key].eventName

              delete this.META.thresholdQueue[key]

              this.decreaseMaxListeners()
              this.off(event, this.handleThresholdTrigger(key))
            }),
            payload: NGN.const(payload)
          })

          this.increaseMaxListeners()
          this.on(thresholdEventName, this.handleThresholdTrigger(key))

          return this.META.thresholdQueue[key]
        }),

        thresholdOnce: NGN.const(function (thresholdEventName, limit, finalEventName, payload = null) {
          let thresholdClosureEvent = `::NGNTHRESHOLD::${(new Date()).getTime()}::${finalEventName}`
          let threshold = this.threshold(thresholdEventName, limit, thresholdClosureEvent, payload)

          this.once(thresholdClosureEvent, () => {
            threshold.remove()
            threshold = null
            this.emit(finalEventName, payload)
          })
        }),

        /**
         * @method handleThresholdTrigger
         * A method to manage #threshold event handlers.
         * @private
         */
        handleThresholdTrigger: NGN.const(function (key) {
          let me = this
          return function () {
            // Use setTimeout to simulate nextTick
            setTimeout(() => {
              if (me.META.thresholdQueue.hasOwnProperty(key)) {
                me.META.thresholdQueue[key].count++
                if (me.META.thresholdQueue[key].count === me.META.thresholdQueue[key].limit) {
                  if (NGN.isFn(me.META.thresholdQueue[key].finalEventName)) {
                    me.META.thresholdQueue[key].finalEventName(me.META.thresholdQueue[key].payload)
                  } else {
                    me.emit(me.META.thresholdQueue[key].finalEventName, me.META.thresholdQueue[key].payload)
                  }

                  // This if statement is required in case the event is removed
                  // during the reset process.
                  if (me.META.thresholdQueue.hasOwnProperty(key)) {
                    me.META.thresholdQueue[key].count = 0
                  }
                }
              }
            }, 0)
          }
        }),

        /**
         * An internal method to wrap node-based event handlers
         * with the proper scope.
         * @param {string} eventName
         * The name of the event being handled.
         * @param {function} handlerFn
         * The handler function.
         */
        wrapEventHandlerWithScope: NGN.privateconst((name, fn) => {
          if (!NGN.nodelike) {
            return fn
          }

          const handlerFn = fn

          return function () {
            let args = arguments

            if (typeof args[args.length - 1] === 'symbol') {
              name = args[args.length - 1].toString().replace(/Symbol\(|\)/gi, '')
              args = NGN.slice(args)
              args.pop()
            }

            handlerFn.apply({ event: name }, args)
          }
        }),

        /**
         * An internal method to apply scope based on whether the handler
         * is a Node-like "once" emitter or not.
         * @param {string} eventName
         * The name of the event being scoped.
         * @param {function} handlerFn
         * The handler function.
         */
        applyScope: NGN.privateconst((args) => {
          if (NGN.nodelike && args.length > 1) {
            if (args[args.length - 1].listener) {
              args[args.length - 1].listener = this.wrapEventHandlerWithScope(
                args[0],
                args[args.length - 1].listener
              )
            } else {
              args[args.length - 1] = this.wrapEventHandlerWithScope(
                args[0],
                args[args.length - 1]
              )
            }
          }
        })
      })
    }

    /**
     * @alias clear
     * Remove all event handlers from the EventEmitter (both regular and adhoc).
     * This is a shortcut for #removeAllListeners.
     */
    clear () {
      let events = NGN.slice(arguments)

      if (events.length === 0) {
        this.META.wildcardEvents.clear()

        let symbolEvents = []

        if (NGN.nodelike) {
          symbolEvents = Object.getOwnPropertySymbols(this._events)
        } else {
          symbolEvents = Object.getOwnPropertySymbols(this.adhoc)
          symbolEvents = symbolEvents.concat(Object.getOwnPropertySymbols(this.handlers))
        }

        for (let i = 0; i < symbolEvents.length; i++) {
          this.removeAllListeners(symbolEvents[i])
        }

        return this.removeAllListeners()
      }

      for (let i = 0; i < events.length; i++) {
        this.META.wildcardEvents.delete(events[i])
        this.removeAllListeners(events[i])
      }
    }

    // Internal method used to handle TTL and wildcard management.
    eventHandler (eventName, callback, ttl, prepend = false) {
      if (NGN.typeof(ttl) === 'boolean') {
        prepend = ttl
        ttl = this.META.defaultTTL
      }

      if (ttl === undefined) {
        ttl = this.META.defaultTTL
      }

      if (ttl > 0) {
        setTimeout(() => this.off(eventName, callback), ttl)
      }

      if (typeof eventName === 'string' && eventName.indexOf('*') >= 0) {
        this.META.wildcardEvents.add(eventName)
      }

      return prepend
    }

    /**
     * @method on
     * Create a new event handler for the specified event.
     * @param  {string|string[]|object} eventName
     * Name of the event to listen for.
     * If an object is passed, this method will automatically setup a #pool.
     * @param  {function} handler
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
     */
    on (eventName, callback, ttl, prepend = false) {
      if (NGN.typeof(eventName) === 'array') {
        for (let i = 0; i < eventName.length; i++) {
          this.on(eventName[i], callback, ttl, prepend)
        }

        return
      }

      if (this.eventHandler(...arguments)) {
        this.prependListener(eventName, callback)
      } else {
        this.addListener(eventName, callback)
      }
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
     * @param {boolean} [prepend=false]
     * When set to `true`, the event is added to the beginning of
     * the processing list instead of the end.
     */
    once (eventName, callback, ttl, prepend = false) {
      if (NGN.typeof(eventName) === 'array') {
        for (let i = 0; i < eventName.length; i++) {
          this.once(eventName[i], callback, ttl, prepend)
        }

        return
      }

      if (this.eventHandler(...arguments)) {
        this.prependOnceListener(eventName, callback)
      } else {
        super.once(eventName, this.wrapEventHandlerWithScope(eventName, callback))
      }
    }

    // The following methods override the Node event emitter only when necessary.
    prependListener () {
      this.applyScope(arguments)
      super.prependListener(...arguments)
    }

    prependOnceListener () {
      this.applyScope(arguments)
      super.prependOnceListener(...arguments)
    }

    addListener () {
      this.applyScope(arguments)
      super.addListener(...arguments)
    }

    removeListener () {
      if (arguments[arguments.length - 1] !== true) {
        this.applyScope(arguments)
      }

      super.removeListener(...arguments)
    }

    /**
     * @method emit
     * Emits an event.
     * @param {string[]} eventName
     * The event name can be a string or an array of strings. If an array
     * of strings is specified, an event will be fired for each event name
     * within the array.
     * @param {any} [payload]
     * An optional payload. This can be any number of additional arguments.
     */
    emit () {
      if (NGN.typeof(arguments[0]) === 'array') {
        let args = NGN.slice(arguments)
        let eventNames = args.shift()

        for (let i = 0; i < eventNames.length; i++) {
          this.emit(eventNames[i], ...args)
        }

        return
      }

      // This catches non-string event names. NGN internally uses Symbols
      // for the NGN.WARN/INFO/ERROR event names to prevent name collisions.
      // This check provides support for these special events. These types
      // of events will never have wildcards.
      if (!NGN.nodelike || !arguments[0] || this.META.wildcardEvents.size === 0) {
        super.emit(...arguments)
        return
      }

      if (NGN.nodelike && typeof arguments[0] === 'symbol') {
        super.emit(...arguments)
        return
      }

      /**
       * The NGN browser-based event emitter supports wildcards natively, but
       * Node.js does not. This adds simple wildcard support for Node. The
       * only wildcard character supported at this time is `*`. This feature
       * will check the event name for the existance of a wildcard. If a
       * wilcard character is present, the internally-maintained list of
       * wildcard events is checked to see if it's a known event. If none
       * of these checks pass, the standard event emitter is used, otherwise
       * special wildcard handling is used.
       */
      let iterator = this.META.wildcardEvents.values()
      let currentEvent = null
      let args = NGN.slice(arguments)

      args.shift()

      while (currentEvent === null || !currentEvent.done) {
        if (currentEvent !== null && currentEvent.value !== arguments[0]) {
          let pattern = new RegExp(currentEvent.value.replace(/\./g, '\\.').replace(/\*/g, '.*'), 'g')

          if (pattern.test(arguments[0])) {
            super.emit(currentEvent.value, ...args, typeof arguments[0] !== 'symbol' ? Symbol(arguments[0]) : arguments[0])
            break
          }
        }

        currentEvent = iterator.next()
      }
    }
  }

  NGN.extend('EventEmitter', NGN.public(EventEmitter))
  NGN.extend('BUS', NGN.const(new NGN.EventEmitter()))
})()