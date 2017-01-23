'use strict'

const RpcClient = require('./rpc/Client')
const HealthCheck = require('./Health')
const EventSource = require('eventsource')
const util = require('./Utility')
const URL = require('url')

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
class BUS extends NGN.EventEmitter {
  constructor () {
    super()

    Object.defineProperties(this, {
      _host: NGN.private('localhost:5555'),
      remote: NGN.private(null),
      options: NGN.private(null),
      _paused: NGN.private(false),
      remotebus: NGN.private(new NGN.EventEmitter()),
      _remotebus: NGN.private(null),
      _remoteshipping: NGN.private(false),
      healthmonitor: NGN.privateconst(new HealthCheck()),
      healthwarning: NGN.private(false),
      _queue: NGN.private({}),
      triggers: NGN.private([
        'connecting',
        'connect',
        'disconnect',
        'pause',
        'resume',
        'healthmonitor.enabled',
        'healthmonitor.disabled'
      ])
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
    return NGN.coalesce(this.remote && this.remote.connected, false)
  }

  /**
   * @property {boolean} connecting
   * Indicates the BUS connection is initializing.
   * @readonly
   */
  get connecting () {
    return NGN.coalesce(this.remote && this.remote.connecting, false)
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
   * Connect to a remote [NGN Bridge](#/guides/bridge). If the NGN#setup
   * is executed before this, no parameters need to be passed in. Setup
   * parameters will be automatically used if no others are provided.
   * @param {string} [host=localhost:5555]
   * The remote host.
   * @param {string} [options.username]
   * **Required for SSH tunneling.** The SSH account username.
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
   * @fires sshtunnel.create
   * Fired when an SSH tunnel is established. Handler receives
   * a payload containing the NGN.Tunnel.
   */
  connect (rhost, options) {
    const me = this

    if (arguments.length === 0) {
      if (typeof NGN._meta.bridge === 'object') {
        rhost = NGN._meta.bridge.host || 'localhost:5555'
        options = {}
        Object.keys(NGN._meta.bridge).forEach(function (key) {
          options[key] = NGN._meta.bridge[key]
        })
      }
    }

    this._host = rhost || this._host
    options = options || {}

    if (Object.keys(options) > 0) {
      this.options = options
    }

    // Support SSH tunneling
    if (options.username) {
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
    const me = this

    // If there is no remote client, create one.
    // Otherwise, use the existing client/connection.
    if (this.remote === null) {
      NGN._bridge = NGN._bridge || new RpcClient({
        host: host,
        port: port
      })
      this.remote = NGN._bridge

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
        NGN._bridge = null
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
    const me = this
    this.healthwarning = false
    this.once('healthmonitor.disabled', function () {
      me.healthmonitor.stop()
      if (me._remotebus !== null && me._remotebus.close) {
        me._remotebus.close()
      }
      if (me.remote && me.remote.disconnect) {
        me.remote.disconnect()
      }
    })
    this.disableRemoteHealthReports()
  }

  createRemoteChannel (callback) {
    const me = this
    if (this.connected && this.remote.subscribe) {
      this.remote.subscribe(function (err, out) {
        if (err) {
          throw err
        }
        // If the output contains a port & path, subscriptions are possible.
        if (out.path && out.port) {
          let url = URL.format({
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
            me.emit(e.content)
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
          if (callback) {
            callback(true)
          }
        } else if (callback) {
          callback(false)
        }
      })
    } else if (callback) {
      callback(false)
    }
  }

  bubble (topic) {
    const me = this
    return function (e) {
      me.emit(topic, e.content || null)
    }
  }

  broadcast () {
    if (arguments.length === 0) {
      return
    }

    // Post remote event (if applicable)
    const args = Array.from(arguments)
    if (this.remote.send) {
      args.push(function () {})
      this.remote.send.apply(this, args)
      args.pop()
    } else {
      console.warn('Broadcast failed. No remote "send" method/connection available.')
    }
    this.emit.apply(this, args)
  }

  forwardHealth (topic) {
    const me = this
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
    const me = this
    return function (event) {
      me.broadcast('syslog.' + event.name.replace(/[^A-Za-z0-9]/gi, ''), event.content || null)
    }
  }

  /**
   * @method enableLogShipping
   * When the BUS is connected to a remote source, this
   * method will enable remote log shipping. `console` events
   * will automatically be sent to the remote server/NGN Bridge.
   */
  enableLogShipping () {
    if (NGN.Log && NGN.Log.on) {
      NGN.Log.on('logevent', this.shipRemoteLog())
    }
  }

  /**
   * @method disableLogShipping
   * When the BUS is connected to a remote source, this
   * method will disable remote log shipping. `console` events
   * will **not* be automatically sent to the remote server/NGN Bridge.
   */
  disableLogShipping () {
    if (console.removeListener) {
      console.removeListener('logevent', this.shipRemoteLog)
    }
  }

  /**
   * @method enableRemoteHealthReports
   * Enables the health monitor & reports statistics to a remote NGN Bridge.
   * This only works when connected to a remote NGN Bridge.
   * @fires healthmonitor.enabled
   * Fires the event with no additional arguments.
   */
  enableRemoteHealthReports () {
    this.switchRemoteHealthReports()
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
    this.switchRemoteHealthReports('off')
    this.emit('healthmonitor.disabled')
  }

  switchRemoteHealthReports (evt) {
    evt = evt || 'on'
    this.healthmonitor[evt]('health.info', this.forwardHealth('health.info'))
    this.healthmonitor[evt]('health.status', this.forwardHealth('health.status'))
    this.healthmonitor[evt]('health.heartbeat', this.forwardHealth('health.heartbeat'))
    this.healthmonitor[evt]('health.error.rejection', this.forwardHealth('health.error.rejection'))
    this.healthmonitor[evt]('health.error.uncaught', this.forwardHealth('health.error.uncaught'))
  }

  /**
   * @method ssh
   * Establish an SSH tunnel.
   * @private
   */
  ssh (options) {}
}

module.exports = new BUS()
