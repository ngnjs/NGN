'use strict'

const Base = require('./Base')
const RpcClient = require('./rpc/Client')
const HealthCheck = require('./Health')
const EventEmitter = require('events').EventEmitter
const EventSource = require('eventsource')
const util = require('./Utility')

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
      _host: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: 'localhost:5555'
      },

      remote: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: null
      },

      options: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: null
      },

      _paused: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: false
      },

      remotebus: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: new EventEmitter()
      },

      _remotebus: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: null
      },

      _remoteshipping: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: false
      },

      healthmonitor: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: new HealthCheck()
      },

      healthwarning: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: false
      },

      triggers: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: [
          'connecting',
          'connect',
          'disconnect',
          'pause',
          'resume',
          'healthmonitor.enabled',
          'healthmonitor.disabled'
        ]
      }
    })

    // Monitor remote connectivity
//    this.on('connect', this.healthmonitor.startHeartbeat)
//    this.on('disconnect', this.healthmonitor.stopHeartbeat)
  }

  /**
   * @property {string} host
   * The remote host.
   * @readonly
   */
  get host () {
    return this._host.split(':')[0]
  }

  /**
   * @property {string} port
   * The remote host port.
   * @readonly
   */
  get port () {
    let parts = this._host.split(':')
    return parts.length === 1 ? 5555 : parseInt(parts[1], 10)
  }

  /**
   * @property {boolean} connected
   * Indicates the BUS connection is established.
   * @readonly
   */
  get connected () {
    return super.coalesce(this.remote && this.remote.connected, false)
  }

  /**
   * @property {boolean} connecting
   * Indicates the BUS connection is initializing.
   * @readonly
   */
  get connecting () {
    return super.coalesce(this.remote && this.remote.connecting, false)
  }

  /**
   * @property {boolean} paused
   * Events are not sent to the remote server (NGN Bridge)
   * when the BUS is paused. However; the connection remains
   * intact and health statistics continue to be shipped to
   * the remote server.
   * @readonly
   */
  get paused () {
    return this._paused
  }

  /**
   * @method connect
   * Connect to a remote [NGN Bridge](#/guides/bridge)
   * @param {string} [host=localhost:5555]
   * The remote host.
   * @param {string} options.username
   * **Required.** The SSH account username.
   * @param {string} [options.password]
   * The SSH account password. **Required** _if no key is provided!_
   * @param {string|buffer} [options.key]
   * The private SSH key (typically found in `~/.ssh/id_rsa`).
   * This can be a file path, string, or buffer.
   * @param {number} [options.sshport=22]
   * The SSH port.
   * @param {number} [options.port]
   * The local port which is mapped to the remote service.
   * By default, an open port is auto-selected.
   */
  connect (rhost, options) {
    let me = this
    this._host = rhost || this._host
    options = options || {}

    if (Object.keys(options) > 0) {
      this.options = options
    }

    // Support SSH tunneling
    if (options.username) {
      console.log('Use SSH Tunnel')
      util.createTunnel(options, function (host, port) {
        me.createConnection(host, port)
      })
    } else {
      this.createConnection(this.host, this.port)
    }
  }

  /**
   * @method createConnection
   * Initiates a connection to a remote server.
   * @private
   */
  createConnection (host, port) {
    let me = this

    // If there is no remote client, create one.
    // Otherwise, use the existing client/connection.
    if (this.remote === null) {
      this.remote = new RpcClient({
        host: host,
        port: port
      })

      this.remote.on('ready', function () {
        me.createRemoteChannel(function (success) {
          if (!success) {
            console.log('Could not establish a connection with the remote BUS.')
          }
          me.enableLogShipping()
          me.enableRemoteHealthReports()
          me.healthmonitor.start()
          me.emit('ready')
        })
        me.emit('connect')
      })

      this.remote.on('connecting', function () {
        me.emit('connecting')
      })

      this.remote.on('disconnect', function () {
        me.disableLogShipping()
        me.disableRemoteHealthReports()
        me.emit('disconnect')
      })
    }

    this.remote.connect()
  }

  pause () {
    this._paused = true
    this.emit('pause')
  }

  resume () {
    this._paused = false
    this.emit('resume')
  }

  disconnect () {
    let me = this
    this.healthwarning = false
    this.once('healthmonitor.disabled', function () {
      me.healthmonitor.stop()
      me._remotebus !== null && me._remotebus.close && me._remotebus.close()
      me.remote && me.remote.disconnect && me.remote.disconnect()
    })
    this.disableRemoteHealthReports()
  }

  createRemoteChannel (callback) {
    let me = this
    if (this.connected && this.remote.subscribe) {
      this.remote.subscribe(function (out) {
        // If the output contains a port & path, subscriptions are possible.
        if (out.path && out.port) {
          let url = require('url').format({
            protocol: out.protocol || 'http',
            hostname: me.remote.host,
            port: out.port,
            pathname: out.path
          })

          // Prepare HTTP headers if necessary (security)
          let headers = {}

          if (out.token) {
            headers.Authentication = 'token ' + out.token
          }

          // Create the SSE subsciber
          let channel = new EventSource(url, {
            rejectUnauthorized: false,
            headers: headers
          })

          me._remotebus = channel

          // Forward remote messages to local BUS
          channel.onmessage = function (e) {
            me.emit(e.data)
          }

          channel.onerror = function (e) {
            me.emit('error', e)
          }

          channel.on('close', function () {
            me._remotebus = null
          })

          // Apply existing event handlers to the SSE channel.
          Object.keys(me._events).forEach(function (topic) {
            if (me.triggers.indexOf(topic) < 0) {
              channel.addEventListener(topic, me.bubble(topic))
            }
          })

          // When a new listener is added to the local monitor,
          // make sure to bind it to SSE events of the same type.
          me.on('newListener', function (topic) {
            if (me.triggers.indexOf(topic) < 0) {
              channel.addEventListener(topic, me.bubble(topic))
            }
          })

          // removeListener isn't supported by the eventsource lib.
          // Consider contributing the fix.
//          me.remotebus.on('removeListener', function (topic, fn) {
//            channel.removeEventListener(topic, fn)
//          })

          callback && callback(true)
        } else {
          callback && callback(false)
        }
      })
    } else {
      callback && callback(false)
    }
  }

  bubble (topic) {
    let me = this
    return function (e) {
      me.emit(topic, e.data || null)
    }
  }

  broadcast () {
    if (arguments.length === 0) {
      return
    }

    // Post remote event (if applicable)
    if (this.remote.send) {
      let args = Array.prototype.slice.call(arguments)
      args.push(function () {})
      this.remote.send.apply(null, args)
    } else {
      console.warn('Broadcast failed. No remote \"send\" method/connection available.')
    }

    this.emit.apply(this, arguments)
  }

  forward (topic) {
    let me = this
    return function (data) {
      if (!me.connected) {
        if (!me.healthwarning) {
          console.warn('Cannot send ' + topic + 'data to remote server (not connected).')
          me.healthwarning = true
        }
        return
      }
      me.broadcast(topic, data || null)
    }
  }

  shipRemoteLog () {
    let me = this
    return function (event) {
      me.broadcast('syslog.' + event.name.replace(/[^A-Za-z0-9]/gi, ''), event.data || null)
    }
  }

  /**
   * @method enableLogShipping
   * When the BUS is connected to a remote source, this
   * method will enable remote log shipping. `console` events
   * will automatically be sent to the remote server/NGN Bridge.
   */
  enableLogShipping () {
    NGN.Log && NGN.Log.on && NGN.Log.on('logevent', this.shipRemoteLog())
  }

  /**
   * @method disableLogShipping
   * When the BUS is connected to a remote source, this
   * method will disable remote log shipping. `console` events
   * will **not* be automatically sent to the remote server/NGN Bridge.
   */
  disableLogShipping () {
    console.removeListener && console.removeListener('logevent', this.shipRemoteLog)
  }

  /**
   * @method enableRemoteHealthReports
   * Enables the health monitor & reports statistics to a remote NGN Bridge.
   * This only works when connected to a remote NGN Bridge.
   * @fires healthmonitor.enabled
   * Fires the event with no additional arguments.
   */
  enableRemoteHealthReports () {
    this.healthmonitor.on('health.info', this.forward('health.info'))
    this.healthmonitor.on('health.status', this.forward('health.status'))
    this.healthmonitor.on('health.heartbeat', this.forward('health.heartbeat'))
    this.healthmonitor.on('health.error.rejection', this.forward('health.error.rejection'))
    this.healthmonitor.on('health.error.uncaught', this.forward('health.error.uncaught'))
    this.emit('healthmonitor.enabled')
  }

  /**
   * @method disableRemoteHealthReports
   * Prevent sending system health details to the NGN Bridge. If the process
   * is connected to a remote NGN Bridge, it will appear as though it has been
   * disconnected.
   * @fires healthmonitor.disabled
   * Fires the event with no additional arguments.
   */
  disableRemoteHealthReports () {
    this.healthmonitor.off('health.info', this.forward('health.info'))
    this.healthmonitor.off('health.status', this.forward('health.status'))
    this.healthmonitor.off('health.heartbeat', this.forward('health.heartbeat'))
    this.healthmonitor.off('server.error.rejection', this.forward('health.error.rejection'))
    this.healthmonitor.off('health.error.uncaught', this.forward('health.error.uncaught'))
    this.emit('healthmonitor.disabled')
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
    this.triggers.indexOf(topic) < 0 && this.triggers.push(topic)
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

module.exports = new BUS()
