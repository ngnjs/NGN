'use strict'
let Base = require('./Base')

/**
 * @class NGN.Server
 * A generic utility class representing a server in the application.
 * This class typically isn't invoked directly. It is designed as a base class
 * for different server types.
 * @extends NGN.Class
 * @private
 * @fires start
 * Fired when the server starts.
 * @fires ready
 * Fired when the server is ready to accept client connections.
 * @fires stop
 * Fired when the server stops.
 */
class Server extends Base {
  constructor (config) {
    // General configuration
    config = config || {}

    // Instantiate super constructor
    super(config)

    // Private properties
    Object.defineProperties(this, {
      /**
       * @property {boolean} [_running=false]
       * Indicates the server is running (modifiable).
       * @private
       */
      _running: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: false
      },

      /**
       * @property {Boolean} [_starting=false]
       * Indicates whether the server is in the process of starting (modifiable).
       * @private
       */
      _starting: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: false
      }
    })

    /**
     * @cfgproperty {Number} port
     * The port on which the server will listen/connect.
     */
    this._port = config.port || null
    this._port = this._port !== null ? parseInt(this._port, 10) : null

    /**
     * @cfg {Boolean} [autoStart=true]
     * Automatically start the server. If this is set to `false`, the
     * server will need to be running explicitly using the #start method.
     */
    this.autostart = super.coalesce(config.autoStart, true)

    var me = this
    this.on('start', function () {
      me.emit('ready')
    })

    setTimeout(function () {
      me.autostart && me.start()
    }, 10)
  }

  /**
   * @property {Boolean} [running=false]
   * Indicates the server is currently running.
   * @readonly
   */
  get running () {
    return this._running
  }

  /**
   * @property {Boolean}
   * Indicates whether the server is in the process of starting.
   * @readonly
   */
  get starting () {
    return this._starting
  }

  get port () {
    return parseInt(this._port, 10)
  }

  /**
   * @method start
   * Start the server
   */
  start () {
    if (!this.running) {
      this._running = true
      this._starting = false
      this.emit && this.emit('start')
    }
  }

  /**
   * @method stop
   * Stop the server
   */
  stop () {
    if (this.running) {
      this._running = false
      this._starting = false
      this.emit && this.emit('stop', this)
    }
  }
}

module.exports = Server
