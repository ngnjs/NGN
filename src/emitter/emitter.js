import base from '../base.js'
import { NODELIKE } from '../constants.js'
import { WARN, INFO } from '../internal.js'
import EventEmitter from './core.js'

const forceArray = value => value === null ? [] : (Array.isArray(value) ? value : [value])

class EnhancedEventEmitter extends EventEmitter {
  // Delayed event queue
  #queued = new Map()
  // Funnel event collections
  #collections = new Map()
  #funnels = new Map()
  // Threshold collections
  #after = new Map()

  /**
   * @method funnel
   * A method to manage funnel events.
   */
  #funnel = (key, name, trigger, args = [], once = false) => {
    const queue = this.#collections.get(key)

    if (!queue) {
      return
    }

    queue.delete(name)
    this.maxListeners--

    if (queue.size === 0) {
      if (once) {
        this.#collections.delete(key)
        this.#funnels.delete(key)
      } else {
        const collection = this.#funnels.get(key)
        this.#collections.set(key, collection)
        this.maxListeners += collection.size
        collection.forEach(event => this.once(event, () => this.#funnel(key, event, trigger, args)))
      }

      if (typeof trigger === 'function') {
        trigger(...args)
      } else {
        this.emit(trigger, ...args)
      }
    } else {
      this.#collections.set(key, queue)
    }
  }

  #eventFunnel = function (once, collection, trigger, payload) {
    if (!Array.isArray(collection) && !(collection instanceof Set)) {
      throw new Error(`EventEmitter.reduce expected an array of events, but received a(n) ${typeof collection} instead.`)
    }

    const key = Symbol('reduce.event')

    collection = collection instanceof Set ? collection : new Set(collection)

    this.#collections.set(key, collection)
    this.maxListeners += collection.size

    const handlers = new Set()
    collection.forEach(event => handlers.add(this[once ? 'once' : 'on'](event, () => this.#funnel(key, event, trigger, Array.from(arguments).slice(3)))))

    // If the funnel is not an adhoc/one-time funnel,
    // store the collection of events so the funnel can be reset.
    this.#funnels.set(key, collection)

    return Object.defineProperty({}, 'remove', base.constant.value(() => {
      this.#collections.delete(key)
      // const activeHandlers = Array.from(handlers)
      Array.from(collection).forEach((event, i) => this.off(event, handlers[i]))
    }))
  }

  #afterEvent = function (once, event, limit, target) {
    const oid = Symbol(`after.${limit}.${event}`)
    this.#after.set(oid, {
      remaining: limit,
      limit,
      once
    })

    const args = Array.from(arguments)
    const me = this
    const OID = this.on(event, function () {
      const meta = me.#after.get(oid)

      if (!meta) {
        return
      }

      meta.remaining--

      if (meta.remaining === 0) {
        if (meta.once) {
          me.#after.delete(oid)
          me.off(event, OID)
        } else {
          meta.remaining = meta.limit
          me.#after.set(oid, meta)
        }

        if (typeof target === 'function') {
          target(...args.slice(4))
        } else {
          me.emit(target, ...arguments)
        }
      } else {
        me.#after.set(oid, meta)
      }
    })

    return Object.defineProperty({}, 'remove', base.constant.value(() => {
      this.#after.delete(oid)
      this.off(event, oid)
    }))
  }

  constructor () {
    super(...arguments)

    this.rename('funnel', 'reduce')
    this.rename('funnelOnce', 'reduceOnce')
    this.rename('threshold', 'after')
    this.rename('thresholdOnce', 'afterOnce')

    Object.defineProperties(this, {
      /**
       * @method increaseMaxListeners
       * Increase the number of maximum listeners.
       * @param {Number} [value = 1]
       * The number of events the max listener account will be increased by.
       * @private
       */
      increaseMaxListeners: base.private.value((count = 1) => { this.maxListeners += count }),

      /**
       * @method decreaseMaxListeners
       * Decrease the number of maximum listeners.
       * @param {Number} [value = 1]
       * The number of events the max listener account will be decreased by.
       * @private
       */
      decreaseMaxListeners: base.private.value((count = 1) => { this.maxListeners = this.maxListeners - count })
    })
  }

  emit (name) {
    // Do not emit events that are queued/delayed.
    if ((typeof name === 'string' || typeof name === 'symbol') && this.#queued.has(name)) {
      return
    }

    super.emit(...arguments)
  }

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
  delayEmit (name, delay) {
    if (!this.#queued.has(name)) {
      const args = Array.from(arguments)

      // Discard the delay value when emitting the event.
      args.splice(1, 1)

      this.#queued.set(name, setTimeout(() => {
        this.#queued.delete(name)
        this.emit(...args)
      }, delay))
    }
  }

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
  attach (eventName, preventDefaultAction) {
    preventDefaultAction = typeof preventDefaultAction === 'boolean' ? preventDefaultAction : false

    return e => {
      if (preventDefaultAction && !NODELIKE) {
        e.preventDefault()
      }

      this.emit(eventName, ...arguments)
    }
  }

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
  forward (eventName, triggers, payload) {
    if (Array.isArray(eventName)) {
      return eventName.forEach(name => this.forward(...Array.from(arguments).slice(1)))
    }

    triggers = forceArray(triggers)

    const me = this
    const handler = function () {
      const args = Array.from(arguments)

      if (payload) {
        args.push(payload)
      }

      me.emit(triggers, ...args)
    }

    this.maxListeners++
    const oid = this.on(eventName, handler)

    // Provide handle back for removal of topic
    return {
      id: oid,
      remove: () => {
        this.maxListeners--
        this.off(eventName, oid)
      }
    }
  }

  /**
   * @method reduce
   * Emit an event after a collection of unique events have all fired.
   * This can be useful in situations where multiple asynchronous actions
   * must complete before another begins. For example, blending 3
   * remote data sources from different API's into a single resultset
   * can be achieved with this.
   *
   * **Example**
   * ```js
   * let collection = NGN.BUS.reduce(['download1done', 'download2done', 'download3done'], 'make.results')
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
   * // The handler can be removed with the special method:
   * collection.remove()
   * ```
   * @param {array|Set} eventCollection
   * An array of events. Once _all_ of these events have fired,
   * the triggerEventName will be fired.
   * @param {string|function} triggerEventName
   * The name of the event triggered after the collection has completed.
   * This can also be a callback function. If a callback function is provided,
   * it will receive the payload as the only argument when it is triggered.
   * @param {any} [payload]
   * An optional payload delivered to the #triggerEventName.
   * Any number of additional payload attributes can be specified.
   * @returns {object} collection
   * Provides the key/value configuration of the collection.
   * ```js
   * {
   *   remove: [Function]
   * }
   * ```
   */
  reduce () {
    return this.#eventFunnel(false, ...arguments)
  }

  /**
   * @method reduceOnce
   * This provides the same functionality as #reduce, but
   * removes the listener after the final event has fired.
   * See #funnel for detailed usage.
   * @param {array} eventCollection
   * An array of events. Once _all_ of these events have fired,
   * the triggerEventName will be fired.
   * @param {string} triggerEventName
   * The name of the event triggered after the collection has completed.
   * @param {any} [payload]
   * An optional payload delivered to the #triggerEventName.
   * @returns {object} collection
   * Provides the `remove()` method of the collection.
   */
  reduceOnce () {
    return this.#eventFunnel(true, ...arguments)
  }

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
  relay (name, target, prefix = null, postfix = null, once = false) {
    if (target === this || typeof target.emit !== 'function') {
      throw new Error(`Cannot relay events from "${this.name}" event emitter to a non-event emitter.`)
    }

    name = forceArray(name)

    this.maxListeners += name.length

    const me = this
    name.forEach(event => {
      this[once ? 'once' : 'on'](event, function () {
        if (typeof event === 'string') {
          target.emit(`${prefix || ''}${this.event}${postfix || ''}`, ...arguments)
          return
        } else if (prefix !== null || postfix !== null) {
          INFO('RELAY', `Cannot relay a pre/postfixed "${this.event.toString()}" event (${typeof this.event}) from ${me.name} event emitter to ${target instanceof EventEmitter ? target.name : 'target event emitter'}.`)
        }

        target.emit(this.event, ...arguments)
      })
    })
  }

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
  relayOnce () {
    this.relay(...arguments, true)
  }

  /**
   * @method after
   * After an event is fired a predetermined number of times (the threshold/limit),
   * trigger another event or function.
   *
   * For example:
   *
   * ```js
   * NGN.BUS.after('push.my.button', 3, 'annoyed')
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
   * @param {string|symbol} eventName
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
   */
  after () {
    return this.#afterEvent(false, ...arguments)
  }

  /**
   * @method afterOnce
   * The same as #after, but the events are removed once the final event is emitted.
   * @param {string|symbol} eventName
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
   */
  afterOnce () {
    return this.#afterEvent(true, ...arguments)
  }

  /**
   * @method deprecate
   * Provides a deprecation notice for the specified event.
   * Automatically emits the appropriate "replacement" event
   * if a replacement event is configured. If no replacement
   * event is configured, the deprecation notice will be written
   * to the console but no replacement event will be triggered.
   * @param {string|symbol} deprecatedEventName
   * The name of the deprecated event.
   * @param {string|symbol} [replacementEventName]
   * The name of the new event.
   */
  deprecate (event, replacementName) {
    const me = this

    this.on(event, function () {
      WARN('DEPRECATED.EVENT', `${event} is deprecated. ` + (!replacementName ? '' : `Use ${replacementName} instead.`))

      if (replacementName) {
        const args = Array.from(arguments).slice(1)
        args.unshift(replacementName)
        me.emit(...args)
      }
    })
  }
}

export { EnhancedEventEmitter as default, EnhancedEventEmitter as EventEmitter }
