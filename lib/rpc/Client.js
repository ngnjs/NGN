'use strict'

const Base = require('../NgnClass')
const rpc = require('ngn-axon-rpc')
const axon = require('axon')
const req = axon.socket('req')

let _client = new rpc.Client(req)
let _connected = false
let _connecting = false
let initialized = false

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
class Client extends Base {

  constructor (config) {
    config = config || {}

    super()

    Object.defineProperties(this, {
      /**
       * @cfg {String} [host=localhost]
       * The hostname/IP where the NGN.rpc.Server is running.
       */
      host: {
        enumerable: true,
        writable: false,
        configurable: false,
        value: config.host || 'localhost'
      },

      /**
       * @cfg {Number} port (required)
       * The port number where the NGN.rpc.Server can be reached.
       */
      port: {
        enumerable: true,
        writable: false,
        configurable: false,
        value: config.port
      },

      /**
       * @cfg {Boolean} [autoConnect=true]
       * Connect automatically.
       */
      autoConnect: {
        enumerable: true,
        writable: true,
        configurable: false,
        value: super.coalesce(config.autoConnect, true)
      },

      _methods: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: []
      }
    })

    this.on('connecting', function () {
      _connecting = true
    })

    this.autoConnect && this.connect()
  }

  /**
   * @property {Boolean} connected
   * Indicates whether the connection to the RPC server is active or not.
   * @readonly
   */
  get connected () {
    return _connected
  }

  /**
   * @property {Boolean} connecting
   * Indicates a connection is being established.
   * @readonly
   */
  get connecting () {
    return _connecting
  }

  /**
   * @method remoteConnect
   * Connect to the remote server.
   * @param {socket} socket
   * The socket connection used to communicate with the remote server.
   */
  remoteConnect (req, callback) {
    let me = this

    req.connect(this.port, this.host, function () {
      // Wrap the remote methods
      _client.methods(function (err, cmethods) {
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
                value: getMethodTree(cmethods[mthd], mthd)
              })
              me._methods.push(mthd)
            }
          })
        }
        initialized = true
        me.emit('ready')
      })
    })
  }

  /**
   * @method connect
   * Connect to the remote server.
   */
  connect () {
    if (this.connected) {
      console.warn('Client is already connected!')
      return
    }

    if (this.connecting) {
      return
    }

    let me = this

    _connected = false
    _connecting = true

    this.emit('connecting')

    req.on('disconnect', function () {
      _connected = false
      _connecting = false
      me.emit('disconnect')
    })

    req.on('reconnect attempt', function () {
      _connected = false
      _connecting = true

      me.emit('reconnecting')
    })

    req.on('error', function (err) {
      console.log('ERROR', err)
    })

    let ignored = 0
    req.on('ignored error', function (err) {
      if (err.code === 'ECONNREFUSED') {
        ignored = ignored + 1
        if ((ignored % 20 === 0 || ignored === 1) && ignored < 100) {
          console.warn('Socket connection to ' + err.address + ':' + err.port + ' failed. Attempting to reconnect.')
        }
      }
    })

    req.on('close', function () {
      _connected = false
      _connecting = false
      me.emit('disconnect')
    })

    req.on('connect', function () {
      _connected = true
      _connecting = false
      initialized && me.emit('reconnected')
    })

    this.remoteConnect(req)
  }

  /**
   * @method getRemoteMethods
   * Get a list of the methods made available via RPC.
   * @returns {Array}
   */
  getRemoteMethods () {
    return this._methods
  }

  /**
   * @method disconnect
   * Disconnect from the remote server.
   */
  disconnect () {
    if (!this.connected) {
      console.warn('Disconnect failed because the client is not connected!')
      return
    }

    req.close()
  }
}

// A private function for extracting namespaced methods
const getMethodTree = function (obj, scope) {
  scope = Array.isArray(scope) === true ? scope : (typeof scope === 'string' ? [scope] : [])

  // If the object is a function, construct the appropriate
  if (obj.hasOwnProperty('name') && obj.hasOwnProperty('params')) {
    return function () {
      let args = Array.prototype.slice.call(arguments)
      let _fn = args.pop()
      let _mthd = scope.slice(0)
      // _mthd.push(obj.name)
      _mthd = _mthd.join('.')

      _client.call.apply(_client, [_mthd].splice(0).concat(args).concat([ function () {
        if (arguments[0] instanceof Error) {
          throw arguments[0]
        }
        _fn.apply(_fn, (arguments[0] === null && (arguments.length > 1) ? Array.prototype.slice.call(arguments).splice(1, 1) : Array.prototype.slice.call(arguments)))
      }]))
    }
  } else {
    // If the object is a true object (i.e. namespace), add the tree
    var _obj = {}
    for (let attr in obj) {
      let _scope = scope.slice(0)
      _scope.push(attr)
      _obj[attr] = getMethodTree(obj[attr], _scope.join('.'))
    }
    return _obj
  }
}

// Create a module out of this.
module.exports = Client
