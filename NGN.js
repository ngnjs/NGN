'use strict'

require('colors')

const pkg = require('./package.json')
const EventEmitter = require('./lib/EventEmitter')

// Append to global object
global.NGN = {}
require('./shared/core')

/**
 * @class NGN
 * The primary namespace.
 * @inheritdoc
 * @singleton
 * @extends EventEmitter
 * @readonly
 * @fires bridge.ready
 * Fired when NGN.BRIDGE is available.
 * @fires bridge.disconnect
 * Fired when the NGN.BRIDGE is closed and no longer available.
 * @fires configuration.ready
 * Fired when the initial configuration variables are populated.
 * (this occurs after connecting to the NGN Bridge)
 * @fires configuration.change
 * Fired when the configuration changes.
 */
class NGNCore extends EventEmitter {
  constructor () {
    super()

    // Create non-configurable attributes
    Object.defineProperties(this, {
      /**
       * @property {string} version
       * The version of NGN that's running.
       */
      version: NGN.privateconst(pkg.version),

      // The bridge connection
      _bridgerpc: NGN.private(null),

      // A handler to emit proper events when the NGN Bridge
      // connection changes.
      _bridge: {
        enumerable: false,
        get: () => {
          return this._bridgerpc
        },
        set: (rpc) => {
          if (rpc instanceof this.RPC.Client) {
            rpc.on('ready', () => {
              this.emit('bridge.ready')

              if (rpc.configuration && typeof rpc.configuration === 'function') {
                rpc.configuration(NGN._meta.system || '', NGN._meta.secret || '', (err, cfg) => {
                  if (err) {
                    throw err
                  }

                  let exists = this._cmdb !== null
                  this._cmdb = cfg || {}
                  this.emit('configuration.' + (exists ? 'change' : 'ready'))
                })
              }
            })

            rpc.once('disconnect', () => {
              this.emit('bridge.disconnect')
              this._bridge = null
            })

            this._bridgerpc = rpc
          } else {
            this._bridgerpc = null
          }
        }
      },

      // Hold the configuration
      _cmdb: NGN.private(null),

      _meta: NGN.private({
        system: process.env.NGN_SYSTEM_ID || null,
        secret: process.env.NGN_SYSTEM_SECRET || null,
        name: process.env.NGN_SERVICE_NAME || process.title !== 'node' ? process.title : 'Unknown',
        bridge: process.env.NGN_BRIDGE || 'localhost:5555'
      }),

      /**
       * @method setup
       * Use this method to identify which system this microservice is
       * a member of. This can technically be used multiple times, but
       * it is designed to be used once within the code base.
       *
       * This method does not need to be called if the appropriate
       * environment variables are defined.
       * @param {object} settings
       * An object containing the settings.
       * @param {string} settings.system
       * The system ID/name to which this microservice belongs. This is
       * primarily used to identify which configuration the NGN Bridge
       * should provide to the service.
       * @param {string} secret
       * The system secret. This is defined in the NGN Bridge and is used
       * to authenticate requests for configuration data.
       * @param {string} [settings.name]
       * The friendly name of this microservice. This is used to identify
       * the service in the NGN Bridge console and to other microservices
       * within the network. This defaults to the `process.title` if nothing
       * is set. If the `process.title` is not defined or is just `node`
       * (the default), this will be automatically set to `Unknown`. Setting
       * this value will automatically update the `process.title`.
       * @param {string|object} [settings.bridge=localhost:5555]
       * The host address and port of the NGN Bridge. If the NGN Bridge is
       * not directly accessible, SSH tunneling can be used to access it.
       * To do this, provide an object with SSH tunneling credentials. See
       * NGN.BUS#connect for full details.
       *
       * ```js
       * NGN.setup({
       *   system: '...',
       *   secret: '...',
       *   name: '...',
       *   bridge: {
       *     host: 'myserver.com:5555',
       *     username: 'ssh_account',
       *     password: 'ssh_account_password',
       *     key: 'string or buffer of ~/.ssh/id_rsa', // optional
       *     sshport: 22, // optional, defaults to 22
       *     port: 1234, // optional, automatically selects a free local port by default
       *   }
       * }
       * ```
       * @fires setup.complete
       * Fired when the #setup is finished.
       */
      setup: NGN.const(function (settings) {
        this._meta.system = settings.system || this._meta.system
        this._meta.secret = settings.secret || this._meta.secret
        this._meta.name = settings.name || this._meta.name
        this._meta.bridge = settings.bridge || this._meta.bridge
        this.emit('setup.complete')
      })
    })

    this.on('newListener', () => {
      this.setMaxListeners(this.getMaxListeners() + 1)
    })

    this.on('removeListener', () => {
      this.setMaxListeners(this.getMaxListeners() - 1)
    })
  }

  /**
   * @property {NGN.rpc.Client} BRIDGE
   * The connection to the bridge. This is shared/pooled
   * within the running node process.
   * @private
   */
  get BRIDGE () {
    return this._bridge
  }

  /**
   * @property {object} config
   * **Only available when connected to an NGN Bridge.**
   * A configuration provided by the NGN Bridge. The configuration
   * is populated when a connection to the bridge is established.
   * It is also automatically updated when the remote configuration
   * is modified.
   */
  get config () {
    return this._cmdb || {}
  }
}

// Extend with additional classes
NGN.extend('EventEmitter', NGN.privateconst(EventEmitter))
require('./shared/eventemitter')

// Define these after the event emitter (they are dependent on it)
const Log = require('./lib/Log')
const Tunnel = require('./lib/Tunnel')
const Utility = require('./lib/Utility')
// const Exception = require('./lib/exception/bootstrap')

/**
 * @method createException
 */
const CustomException = require('./shared/exception')
NGN.extend('createException', NGN.privateconst(function (config) {
  config = config || {}
  config = typeof config === 'string' ? { message: config } : config
  config.name = config.name || 'NgnError'
  config.name = config.name.replace(/[^a-zA-Z0-9_]/gi, '')

  // Create the error as a function
  global[config.name] = function () {
    if (arguments.length > 0) {
      config.message = arguments[0]
    }
    return new CustomException(config)
  }
}))

// Extend the NGN namespace with common feature classes.
// NGN.extend('Log', NGN.const(new Log()))
NGN.extend('_log', NGN.private(null))
NGN.extend('Log', NGN.get(function () {
  if (this._log === null) {
    this._log = new Log()
  }

  return this._log
}))
NGN.extend('Tunnel', NGN.const(Tunnel))
NGN.extend('Server', NGN.const(require('./lib/Server')))
NGN.extend('BUS', NGN.const(require('./lib/BUS')))
NGN.extend('util', NGN.const(Utility))
NGN.extend('RPC', NGN.const({
  Client: require('./lib/rpc/Client'),
  Server: require('./lib/rpc/Server')
}))

global.__core__ = new NGNCore()

NGN.inherit(NGN, global.__core__)
delete global.NGN

Object.defineProperties(global, {
  NGN: {
    enumerable: true,
    writable: true,
    configurable: false,
    value: global.__core__
  },
  ngn: {
    enumerable: true,
    get: function () {
      return this.NGN
    }
  }
})

delete global.__core__
