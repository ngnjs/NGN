'use strict'

require('colors')

const pkg = require('./package.json')
const Log = require('./lib/Log')
const Tunnel = require('./lib/Tunnel')
const Base = require('./lib/Base')
const Utility = require('./lib/Utility')
const Exception = require('./lib/exception/bootstrap')

/**
 * @class NGN
 * The primary namespace.
 * @singleton
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
class NGNFactory extends Base {
  constructor () {
    super()

    // Create non-configurable attributes
    Object.defineProperties(this, {
      /**
       * @property {string} version
       * The version of NGN that's running.
       */
      version: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: pkg.version
      },

      /**
       * @method createException
       */
      createException: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: Exception.create
      },

      // The bridge connection
      _bridgerpc: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: null
      },

      // A handler to emit proper events when the NGN Bridge
      // connection changes.
      _bridge: {
        enumerable: false,
        get: function () {
          return this._bridgerpc
        },
        set: function (rpc) {
          let me = this
          if (rpc instanceof this.rpc.Client) {
            rpc.on('ready', function () {
              me.emit('bridge.ready')
              if (rpc.configuration && typeof rpc.configuration === 'function') {
                rpc.configuration(NGN._meta.system || '', NGN._meta.secret || '', function (err, cfg) {
                  if (err) {
                    throw err
                  }
                  let exists = me._cmdb !== null
                  me._cmdb = cfg || {}
                  me.emit('configuration.' + (exists ? 'change' : 'ready'))
                })
              }
            })
            rpc.once('disconnect', function () {
              me.emit('bridge.disconnect')
              me._bridge = null
            })
            this._bridgerpc = rpc
          } else {
            this._bridgerpc = null
          }
        }
      },

      /**
       * @property {NGN.rpc.Client} BRIDGE
       * The connection to the bridge. This is shared/pooled
       * within the running node process.
       * @private
       */
      BRIDGE: {
        enumerable: false,
        get: function () {
          return this._bridge
        }
      },

      // Hold the configuration
      _cmdb: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: null
      },

      /**
       * @property {object} config
       * **Only available when connected to an NGN Bridge.**
       * A configuration provided by the NGN Bridge. The configuration
       * is populated when a connection to the bridge is established.
       * It is also automatically updated when the remote configuration
       * is modified.
       */
      config: {
        enumerable: true,
        get: function () {
          return this._cmdb || {}
        }
      },

      Class: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: Base
      },

      Log: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: new Log()
      },

      log: {
        enumerable: false,
        get: function () {
          return this.Log
        }
      },

      Tunnel: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: Tunnel
      },

      Server: {
        enumerable: false,
        writable: false,
        configurable: false,
        value: require('./lib/Server')
      },

      BUS: {
        enumerable: true,
        writable: false,
        configurable: false,
        value: require('./lib/BUS')
      },

      bus: {
        enumerable: false,
        get: function () {
          return this.BUS
        }
      },

      RPC: {
        enumerable: true,
        writable: false,
        configurable: false,
        value: {
          Client: require('./lib/rpc/Client'),
          Server: require('./lib/rpc/Server')
        }
      },

      rpc: {
        enumerable: false,
        get: function () {
          return this.RPC
        }
      },

      _meta: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: {
          system: process.env.NGN_SYSTEM_ID || null,
          secret: process.env.NGN_SYSTEM_SECRET || null,
          name: process.env.NGN_SERVICE_NAME || process.title !== 'node' ? process.title : 'Unknown',
          bridge: process.env.NGN_BRIDGE || 'localhost:5555'
        }
      },

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
      setup: {
        enumerable: true,
        writable: false,
        configurable: false,
        value: function (settings) {
          this._meta.system = settings.system || this._meta.system
          this._meta.secret = settings.secret || this._meta.secret
          this._meta.name = settings.name || this._meta.name
          this._meta.bridge = settings.bridge || this._meta.bridge
          this.emit('setup.complete')
        }
      },

      util: {
        enumerable: true,
        writable: false,
        configurable: false,
        value: Utility
      }
    })
  }
}

// Append to global object
Object.defineProperties(global, {
  NGN: {
    enumerable: true,
    writable: false,
    configurable: false,
    value: new NGNFactory()
  },
  ngn: {
    enumerable: true,
    get: function () {
      return this.NGN
    }
  }
})
