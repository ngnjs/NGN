'use strict'

require('colors')

const pkg = require('./package.json')
const Log = require('./lib/Log')
const Tunnel = require('./lib/Tunnel')
const Base = require('./lib/Base')
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
                rpc.configuration(function (cfg) {
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

      rpc: {
        enumerable: true,
        writable: false,
        configurable: false,
        value: {
          Client: require('./lib/rpc/Client'),
          Server: require('./lib/rpc/Server')
        }
      },

      RPC: {
        enumerable: false,
        get: function () {
          return this.RPC
        }
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
