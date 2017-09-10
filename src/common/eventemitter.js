(function () {
  let EE

  // Create a stub class supporting both environments.
  if (NGN.nodelike) {
    EE = require('events').EventEmitter
  } else {
    class EEmitter {}

    EE = EEmitter
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

      Object.defineProperties(this, {
        queued: NGN.private({}),
        collectionQueue: NGN.private({}),
        thresholdQueue: NGN.private({}),

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
            console.warn(`${deprecatedEventName} is deprecated. ` + (!replacementEventName ? '' : `Use ${replacementEventName} instead.`))

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
         * @property {Function} [callback]
         * A callback to run after the entire pool is registered. Receives
         * a single {Object} argument containing all of the subscribers for
         * each event registered within the pool.
         * @private
         */
        pool: NGN.privateconst(function (prefix, group, callback) {
          if (typeof prefix !== 'string') {
            group = prefix
            prefix = ''
          }

          let pool = {}

          for (let eventName in group) {
            let topic = `${NGN.coalesceb(prefix, '')}${eventName}`

            if (NGN.isFn(group[eventName])) {
              this.increaseMaxListeners()

              pool[eventName] = this.on(topic, group[eventName])
            } else if (typeof group[eventName] === 'object') {
              this.pool(topic + '.', group[eventName])
            } else {
              console.warn('%c' + topic + '%c could not be pooled in the event emitter because it\'s value is not a function.', 'font-weight: bold;', '')
            }
          }

          if (NGN.isFn(callback)) {
            callback(pool)
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
            if (preventDefaultAction && NGN.isFn(e.preventDefault)) {
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
         * BUS.bind('sourceEvent', ['someEvent','anotherEvent'], {payload:true})
         * ```
         * When `sourceEvent` is published, the bind method triggers `someEvent` and
         * `anotherEvent`, passing the payload object to `someEvent` and
         * `anotherEvent` subscribers simultaneously.
         *
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

            for (let trigger in triggers) {
              me.emit(triggers[trigger], ...args)
            }
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
          if (!this.queued.hasOwnProperty(eventName)) {
            let args = NGN.slice(arguments)
            args.splice(1, 1)

            this.queued[eventName] = setTimeout(() => {
              delete this.queued[eventName]
              this.emit(...args)
            }, delay)
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
        funnel: NGN.const(function (eventCollection, triggerEventName, payload = null) {
          if (NGN.typeof(eventCollection) !== 'array') {
            throw new Error(`NGN.BUS.funnel expected an array of events, but received a(n) ${NGN.typeof(eventCollection)}`)
          }

          eventCollection = NGN.dedupe(eventCollection)

          let key = this.getInternalCollectionId(this.collectionQueue)

          this.collectionQueue[key] = {}

          Object.defineProperties(this.collectionQueue[key], {
            masterqueue: NGN.const(eventCollection),
            remainingqueue: NGN.private(eventCollection),
            eventName: NGN.const(triggerEventName),
            remove: NGN.const(() => {
              let events = this.collectionQueue[key].masterqueue.slice()

              delete this.collectionQueue[key]

              for (let name in events) {
                this.decreaseMaxListeners()
                this.off(name, this.handleCollectionTrigger(name, key))
              }
            }),
            payload: NGN.const(payload)
          })

          for (let event in eventCollection) {
            this.increaseMaxListeners()
            this.on(event, this.handleCollectionTrigger(event, key))
          }

          key = null

          return this.collectionQueue[key]
        }),

        /**
         * @method getInternalCollectionId
         * Returns a unique ID for special collections.
         * @param {object} collection
         * The collection to generate an ID for.
         * @private
         */
        getInternalCollectionId: NGN.privateconst(function (collection) {
          let time = (new Date()).getTime().toString()
          let rand = Math.random().toString()
          let key = Object.keys(collection).length + 1

          while (collection.hasOwnProperty(`${key.toString()}${time}${rand}`)) {
            key++
          }

          return `${key.toString()}${time}${rand}`
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
              if (me.collectionQueue.hasOwnProperty(key)) {
                if (me.collectionQueue[key].remainingqueue.indexOf(eventName) >= 0) {
                  me.collectionQueue[key].remainingqueue = me.collectionQueue[key].remainingqueue.filter((remainingEventName) => {
                    return remainingEventName !== eventName
                  })
                }

                if (me.collectionQueue[key].remainingqueue.length === 0) {
                  me.collectionQueue[key].remainingqueue = me.collectionQueue[key].masterqueue

                  if (NGN.isFn(me.collectionQueue[key].eventName)) {
                    me.collectionQueue[key].eventName(me.collectionQueue[key].payload)
                  } else {
                    me.emit(me.collectionQueue[key].eventName, me.collectionQueue[key].payload)
                  }
                }
              }
            }, 0)
          }
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
        funnelOnce: NGN.const(function (eventCollection, triggerEventName, payload = null) {
          let collection = this.funnel(eventCollection, triggerEventName, payload)

          this.increaseMaxListeners()
          this.once(triggerEventName, () => {
            collection.remove()
            collection = null
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

          let key = `${this.getInternalCollectionId(this.thresholdQueue)}${limit.toString()}`

          this.thresholdQueue[key] = {}

          Object.defineProperties(this.thresholdQueue[key], {
            key: NGN.const(key),
            eventName: NGN.const(thresholdEventName),
            limit: NGN.const(limit),
            count: NGN.private(0),
            finalEventName: NGN.const(finalEventName),
            remove: NGN.const(() => {
              let event = this.thresholdQueue[key].eventName

              delete this.thresholdQueue[key]

              this.decreaseMaxListeners()
              this.off(event, this.handleThresholdTrigger(key))
            }),
            payload: NGN.const(payload)
          })

          this.increaseMaxListeners()
          this.on(thresholdEventName, this.handleThresholdTrigger(key))

          return this.thresholdQueue[key]
        }),

        thresholdOnce: NGN.const(function (thresholdEventName, limit, finalEventName, payload = null) {
          let threshold = this.threshold(thresholdEventName, limit, finalEventName, payload)

          this.once(finalEventName, () => {
            threshold.remove()
            threshold = null
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
              if (me.thresholdQueue.hasOwnProperty(key)) {
                me.thresholdQueue[key].count++
                if (me.thresholdQueue[key].count === me.thresholdQueue[key].limit) {
                  if (NGN.isFn(me.thresholdQueue[key].finalEventName)) {
                    me.thresholdQueue[key].finalEventName(me.thresholdQueue[key].payload)
                  } else {
                    me.emit(me.thresholdQueue[key].finalEventName, me.thresholdQueue[key].payload)
                  }

                  // This if statement is required in case the event is removed
                  // during the reset process.
                  if (me.thresholdQueue.hasOwnProperty(key)) {
                    me.thresholdQueue[key].count = 0
                  }
                }
              }
            }, 0)
          }
        })
      })
    }
  }

  NGN.extend('EventEmitter', NGN.const(EventEmitter))
  NGN.extend('BUS', NGN.const(new NGN.EventEmitter()))
})()
