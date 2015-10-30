'use strict'

const Base = require('./NgnClass')
const RpcClient = require('./rpc/Client')

/**
 * @class NGN.BUS
 * The NGN BUS acts as a service bus for microservice applications.
 * @singleton
 * @fires connected
 * Fired when the BUS initial connection to a remote server is made.
 * This does not mean the remote server is prepared yet (ex: pending auth).
 * @fires ready
 * Fired when the connection to the remote server is established
 * and both the client and server are ready to communicate.
 */
class BUS extends Base {
  constructor () {
    super()

    Object.defineProperties(this, {

      server: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: 'localhost:5555'
      },

      remoteport: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: 5555
      },

      remote: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: {
          connecting: false,
          connected: false
        }
      },

      active: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: true
      },

      options: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: null
      }
    })

    // Attempt to autostart
    let me = this
    setTimeout(function () {
      if (!me.connecting && !me.connected && me.active) {
        me.connect()
      }
    }, 150)

    this.on('connected', function () {
      me.emit('ready')
    })

//    this.on('newListener', function (topic, handler) {
//
//    })
  }

  /**
   * @property {string} host
   * The remote host.
   * @readonly
   */
  get host () {
    return this.server
  }

  /**
   * @property {string} port
   * The remote host port.
   * @readonly
   */
  get port () {
    return this.remoteport
  }

  /**
   * @property {boolean} connected
   * Indicates the BUS connection is established.
   * @readonly
   */
  get connected () {
    return super.coalesce(this.remote.connected, false)
  }

  /**
   * @property {boolean} connecting
   * Indicates the BUS connection is initializing.
   * @readonly
   */
  get connecting () {
    return super.coalesce(this.remote.connecting, false)
  }

  /**
   * @method connect
   * Connect to a remote [NGN Bridge](#/guides/bridge)
   * @param {string} [host=localhost:5555]
   * The remote host.
   * @param {object} [options]
   * Additional connection options:
   *   - ssh
   */
  connect (host, options) {
    host = host || this.server
    this.server = host

    let port = host.split(':')
    let me = this

    host = port[0]
    port = parseInt(port.length === 1 ? 5555 : port[1], 10)
    options = options || this.options || {}

    if (this.options === null && Object.keys(options) > 0) {
      this.options = options
    }

    // Support SSH tunneling
    if (options.ssh) {
      console.log('Has SSH requirement')
    }

    this.remoteport = port
    this.remote = new RpcClient({
      host: host,
      port: port
    })

    this.remote.on('ready', function () {
      me.emit('connected')
    })

    this.remote.on('disconnect', function () {
      me.emit('disconnect')
    })

    this.remote.connect()
  }

  /**
   * @method enable
   * Enable the remote BUS connection.
   */
  enable () {
    if (!this.active) {
      this.active = true

      this.once('connected', function () {
        console.warn('NGN.BUS re-enabled.')
      })

      this.connect(this.host + ':' + this.port)
    }
  }

  /**
   * @method disable
   * Disable the remote BUS connection. This does not
   * disable the local BUS.
   */
  disable () {
    if (this.active) {
      let me = this
      this.active = false

      console.warn('NGN.BUS disabled.')

      if (this.remote.once) {
        this.remote.once('disconnect', function () {
          me.remote = {
            connecting: false,
            connected: false
          }

          me.emit('disabled')
        })
      } else {
        this.remote = {
          connecting: false,
          connected: false
        }

        this.emit('disabled')
      }
      this.remote.disconnect && this.remote.disconnect()
    }
  }

  /**
   * @method disconnect
   * Forcibly disconnect (and remain disconnected) from
   * a remote Bridge/BUS.
   */
  disconnect () {
    this.remote.disconnect()
  }

  /**
   * @method ssh
   * Establish an SSH tunnel.
   * @private
   */
  ssh (options) {}

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
   * @property {Function} [callback]
   * A callback to run after the entire pool is registered. Receives
   * a single {Object} argument containing all of the subscribers for
   * each event registered within the pool.
   */
  pool (prefix, obj, callback) {
    if (typeof prefix !== 'string') {
      obj = prefix
      prefix = ''
    }

    let me = this
    let pool = {}

    Object.keys(obj).forEach(function (e) {
      if (typeof obj[e] === 'function') {
        pool[e] = me.on((prefix.trim() || '') + e, obj[e])
      } else {
        console.warn((prefix.trim() || '') + e + ' could not be pooled in the event bus because it\'s value is not a function.')
      }
    })
    callback && callback(pool)
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
   * @returns {function}
   * Returns a function that will automatically be associated with an event.
   */
  attach (topic) {
    let me = this
    return function () {
      let args = Array.prototype.slice.call(arguments)
      args.unshift(topic)
      me.emit.apply(me, args)
    }
  }

  /**
   * @method bind
   * A special subscriber that fires one or more event in response to
   * to an event. This is used to bubble events up/down an event chain.
   *
   * For example:
   *
   * ```js
   * BUS.bind('sourceEvent', ['someEvent','anotherEvent'], {payload:true});
   * ```
   * When `sourceEvent` is published, the bind method triggers `someEvent` and
   * `anotherEvent`, passing the payload object to `someEvent` and
   * `anotherEvent` subscribers simultaneously.
   *
   * @param {String} sourceEvent
   * The event to subscribe to.
   * @param {String|Array} triggeredEvent
   * An event or array of events to fire in response to the sourceEvent.
   * @returns {Object}
   * Returns an object with a single `remove()` method.
   */
  bind (topic, trigger, meta) {
    trigger = typeof trigger === 'string' ? [trigger] : trigger

    let me = this
    let fn = function () {
      trigger.forEach(function (tEvent) {
        me.emit(tEvent, meta || null)
      })
    }

    this.on(topic, fn)

    // Provide handle back for removal of topic
    return {
      remove: function () {
        this.removeEventListener(topic, fn)
      }
    }
  }
}

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

module.exports = new BUS()
