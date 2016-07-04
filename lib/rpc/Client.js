'use strict'

const rpc = require('ngn-rpc')
const util = require('../Utility')

/**
 * @class NGN.rpc.Client
 * The RPC client is a special TCP socket client that interacts with an
 * NGN.rpc.Server. Using this, it is possible to call functions remotely
 * or between disimilar processes.
 *
 * The NGN.rpc.Server is designed to expose a module remotely. Take the following
 * example:
 *
 * **server.js**
 * ```js
 * var controller = new NGN.rpc.Server({
 *   port: 4000,
 *   module: {
 *     sayHello: function(name,callback){
 *       callback(null,"Hello, "+name)
 *     },
 *     sayGoodbye: function(name,callback){
 *       callback(null,"Goodbye "+name)
 *     }
 *   }
 * })
 * ```
 *
 * **client.js**
 * ```js
 * var api = new NGN.rpc.Client({
 *   host: 'localhost',
 *     port: 4000
 *   })
 *
 *   api.sayHello(function(err,data){
 *     console.log(data)
 *   })
 * ```
 *
 * @extends NGN.Class
 * @event connecting
 * Fired when the client initiates a connection with the RPC server.
 * @event disconnect
 * Fired when the connection to the RPC server is lost.
 * @event reconnecting
 * Fired when the client tries to re-establish a connection to the server.
 * @event reconnected
 * Fired when the client reconnects to the server.
 * @event connect
 * Fired when the connection to the RPC server is established.
 * @event ready
 * Fired when the client is fully initialized and ready for I/O.
 */
class Client extends NGN.EventEmitter {

  constructor (config) {
    config = config || {}

    super()

    let _req = rpc.axon.socket('req')
    Object.defineProperties(this, {
      /**
       * @cfg {String} [host=localhost]
       * The hostname/IP where the NGN.rpc.Server is running.
       */
      host: NGN.const(config.host || 'localhost'),

      /**
       * @cfg {Number} port (required)
       * The port number where the NGN.rpc.Server can be reached.
       */
      port: NGN.const(parseInt(config.port, 10)),

      /**
       * @cfg {Boolean} [autoConnect=true]
       * Connect automatically.
       */
      autoConnect: NGN.public(NGN.coalesce(config.autoConnect, true)),

      /**
       * @cfg {object} ssh
       * Provide SSH connectivity details for use with SSH tunneling.
       * @cfg {string} ssh.username
       * Username used to authenticate with the remote server.
       * @cfg {string} [ssh.password]
       * This is the password used to authenticate with the remote server.
       * @cfg {string|buffer} [ssh.key]
       * The private key used to authenticate with the remote server.
       * This can be a file path, string, or buffer. The file most commonly
       * used for this operation is `~/.ssh/id_rsa`
       * @cfg {number} [ssh.sshport=22]
       * The SSH port to establish the tunnel on.
       * @cfg {number} [ssh.port]
       * The local port. This is mapped to the remote port.
       */
      ssh: NGN.privateconst(config.ssh || {}),

      _methods: NGN.private([]),
      _connecting: NGN.private(false),
      _initialized: NGN.private(false),
      req: NGN.private(_req),
      _client: NGN.private(new rpc.Client(_req)),
      id: NGN.private((new Date()).getTime())
    })

    const me = this
    this.req.on('disconnect', function () {
      me._connecting = false
      me.emit('disconnect', me.id)
    })

    this.req.on('reconnect attempt', function () {
      me._connecting = true
      me.emit('reconnecting', me.id)
    })

    this.req.on('error', function (err) {
      me.emit('error', err)
    })

    let ignored = 0
    this.req.on('ignored error', function (err) {
      if (err.code === 'ECONNREFUSED') {
        ignored = ignored + 1
        if ((ignored % 20 === 0 || ignored === 1) && ignored < 100) {
          console.warn('Socket connection to ' + err.address + ':' + err.port + ' failed. Attempting to reconnect from client ' + me.id + '.')
        }
      }
    })

    this.req.on('close', function () {
      me._connecting = false
      me.emit('disconnect', me.id)
    })

    this.req.on('connect', function () {
      me._connecting = false

      if (me._initialized) {
        return me.emit('reconnected', me.id)
      }

      me.getRemoteMethods(function () {
        me.emit('ready', me.id)
      })
    })

    this.on('connecting', function () {
      me._connecting = true
    })

    this.on('ready', function () {
      me._initialized = true
    })

    if (this.autoConnect) {
      this.connect()
    }
  }

  /**
   * @property {Boolean} connected
   * Indicates whether the connection to the RPC server is active or not.
   * @readonly
   */
  get connected () {
    return this.req.connected
  }

  /**
   * @property {Boolean} connecting
   * Indicates a connection is being established.
   * @readonly
   */
  get connecting () {
    return this._connecting
  }

  /**
   * @method getRemoteMethods
   * Retrieve the remote methods from the RPC service.
   * @param {function} callback
   * Executed after the methods are retrieved.
   * @private
   */
  getRemoteMethods (callback) {
    const me = this

    // Wrap the remote methods
    this._client.methods(function (err, cmethods) {
      if (err) throw err
      if (Object.keys(cmethods).length === 0) {
        console.warn('The RPC service has no available methods.')
      } else {
        // Loop through the available methods and add them to the client
        Object.keys(cmethods).forEach(function (mthd) {
          if (!me.hasOwnProperty(mthd)) {
            Object.defineProperty(me, mthd, {
              enumerable: true,
              writable: false,
              configurable: false,
              value: me.getMethodTree(cmethods[mthd], mthd)
            })
            me._methods.push(mthd)
          } else {
            console.warn('Client already has method ' + mthd + '. Skipping.')
          }
        })
      }
      if (callback) {
        callback()
      }
    })
  }

  /**
   * @method connect
   * Connect to the remote server.
   * @param {function} callback
   * A callback method that executes after the connection is established.
   */
  connect () {
    if (this.connected) {
      console.warn('Client is already connected!')
      return
    }

    if (this.connecting) {
      return
    }

    this._connecting = true

    this.emit('connecting')

    // If SSH tunneling is configured, create the tunnel.
    let me = this
    if (this.ssh.user) {
      util.createTunnel(this.ssh, function (host, port) {
        me.req.connect(host, port)
      })
    } else {
      this.req.connect(this.port, this.host)
    }
  }

  /**
   * @property remotemethods
   * A list of the methods made available via RPC.
   * @returns {Array}
   */
  get remotemethods () {
    return this._methods
  }

  /**
   * @method disconnect
   * Disconnect from the remote server.
   */
  disconnect () {
    if (!this.connected) {
      console.warn('Client is not connected!')
      return
    }

    this._client.disconnect()
  }

  /**
   * @method getMethodTree
   * Extract namespaced methods.
   * @private
   */
  getMethodTree (obj, scope) {
    const me = this

    scope = Array.isArray(scope) === true ? scope : (typeof scope === 'string' ? [scope] : [])

    // If the object is a function, construct the appropriate
    if (obj.hasOwnProperty('name') && obj.hasOwnProperty('params')) {
      return function () {
        let args = Array.prototype.slice.call(arguments)
        let _fn = typeof args[args.length - 1] === 'function' ? args.pop() : function () {}
        let _mthd = scope.slice(0)

        _mthd = _mthd.join('.')

        me._client.call.apply(me._client, [_mthd].splice(0).concat(args).concat([ function () {
          _fn.apply(_fn, Array.prototype.slice.call(arguments))
        }]))
      }
    } else {
      // If the object is a true object (i.e. namespace), add the tree
      var _obj = {}
      for (let attr in obj) {
        if (obj.hasOwnProperty(attr)) {
          let _scope = scope.slice(0)
          _scope.push(attr)
          _obj[attr] = me.getMethodTree(obj[attr], _scope.join('.'))
        }
      }
      return _obj
    }
  }
}
// Create a module out of this.
module.exports = Client
