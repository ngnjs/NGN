'use strict'

const Base = require('./Base')
const os = require('os')
const crypto = require('crypto')

/**
 * @class HealthMonitor
 * The health monitor use the NGN.BUS to send four different kinds of
 * data to the NGN Bridge or connected service:
 *
 * 1. **Heartbeat**
 *    This is a basic "ping" that indicates the runing process is connected to the Bridge.
 * 1. **Status**
 *    This is a standard healthcheck that sends system load/usage statistics.
 * 1. **Info**
 *    This provides detailed information about the process and the hardware it runs on.
 * 1. **Termination**
 *    This sends a termination notice to the bridge, indicating the process is shutting down.
 *    This usually (but not always) indicates an intentional shutdown.
 *
 * This class is an internal class designed specifically for NGN inner-workings.
 * Don't attempt to use this class in your projects (though you can listen to the events safely).
 * @private
 * @singleton
 * @fires service.error.uncaught
 * Fired when and uncaughtException occurs.
 * @fires service.error.rejection
 * Fired when an unhandled promise rejection occurs.
 * @fires service.heartbeat
 * A ping event.
 * @fires service.status
 * Fired when the system status is recorded.
 * @fires service.info
 * Fired when the service info is requested and/or changes.
 */
class HealthMonitor extends Base {
  constructor (config) {
    config = config || {}

    super(config)

    let me = this

    // Setup private properties
    Object.defineProperties(this, {
      /**
       * @cfg {number} [heartbeat=15000]
       * The number of milliseconds between heartbeats. Default is 15 seconds.
       */
      heartbeatWaitInterval: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: config.heartbeat || 15 * 1000 // 15 seconds
      },

      heartbeatInterval: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: null
      },

      /**
       * @cfg {number} [status=300000]
       * The number of milliseconds between status updates. Default is 5 minutes.
       */
      statusWaitInterval: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: config.status || 5 * 60 * 1000 // Every 5 minutes
      },

      statusInterval: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: null
      },

      /**
       * @cfg {number} [info=300000]
       * The number of milliseconds between system info updates. Default is 5 minutes.
       * System information is only delivered if it changes.
       */
      infoWaitInterval: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: config.info || 5 * 60 * 1000 // Every 5 minutes (only if info changes)
      },

      infoInterval: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: null
      },

      infoChecksum: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: null
      }
    })

    // Monitor remote connectivity
//    NGN.BUS.on('connected', this.startHeartbeat)
//    NGN.BUS.on('disconnect', this.stopHeartbeat)

    // Send uncaught exceptions
    process.on('uncaughtException', function (err) {
      me.emit('service.error.uncaught', err)
    })

    // Send unhandled rejections
    process.on('unhandledRejection', function (reason, promise) {
      me.emit('service.error.rejection', {
        reason: reason,
        promise: promise
      })
    })

    // Handle exits
    process.on('beforeExit', this.sendTerminationNotice)
    process.on('SIGINT', this.sendTerminationNotice('SIGINT'))
  }

  /**
   * @property {object} status
   * Contains the status of the current process.
   * The content is generated according to this template:
   *
   * ```js
   * {
   *   uptime: os.uptime(),
   *   load: os.loadavg(),
   *   ram: {
   *     total: os.totalmem(),
   *     free: os.freemem(),
   *     usage: process.memoryUsage()
   *   },
   *   cpu: os.cpus(),
   *   v8: require('v8').getHeapStatistics()
   * }
   * ```
   * @readonly
   */
  get status () {
    return {
      uptime: os.uptime(),
      load: os.loadavg(),
      ram: {
        total: os.totalmem(),
        free: os.freemem(),
        usage: process.memoryUsage()
      },
      cpu: os.cpus(),
      v8: require('v8').getHeapStatistics()
    }
  }

  /**
   * @property {object} info
   * Contains the system info for the current process.
   * The content is generated according to this template:
   *
   * ```js
   * {
   *   name: process.title || 'Unknown',
   *   host: os.hostname(),
   *   os: {
   *     type: os.type().replace('_NT', ''),
   *     platform: process.platform,
   *     arch: os.arch(),
   *     release: os.release()
   *   },
   *   uptime: os.uptime(),
   *   load: os.loadavg(),
   *   ram: {
   *     total: os.totalmem(),
   *     free: os.freemem(),
   *     usage: process.memoryUsage()
   *   },
   *   cpu: os.cpus(),
   *   pid: process.pid,
   *   network: os.networkInterfaces(),
   *   system: process.versions,
   *   variables: Object.keys(process.env),
   *   hasnpm: process.config.variables.node_install_npm
   * }
   * ```
   * @readonly
   */
  get info () {
    return {
      name: process.title || 'Unknown',
      host: os.hostname(),
      os: {
        type: os.type().replace('_NT', ''),
        platform: process.platform,
        arch: os.arch(),
        release: os.release()
      },
      uptime: os.uptime(),
      load: os.loadavg(),
      ram: {
        total: os.totalmem(),
        free: os.freemem(),
        usage: process.memoryUsage()
      },
      cpu: os.cpus(),
      pid: process.pid,
      network: os.networkInterfaces(),
      system: process.versions,
      variables: Object.keys(process.env),
      hasnpm: process.config.variables.node_install_npm
    }
  }

  /**
   * @method startHeartbeat
   * Starts the heartbeat system. This also executes the #startInfo method
   * to assure the first heartbeat is accompanied by identifying service information.
   */
  startHeartbeat () {
    // "Register" the service with the Bridge
    this.startInfo()

    // Begin the heartbeat
    this.heartbeatInterval = setInterval(this.sendHeartbeat, this.heartbeatWaitInterval)
  }

  /**
   * @method stopHeartbeat
   * Stops the heartbeat process. Use with caution. Remote systems may think the
   * process is no longer accessible if the heartbeat doesn't continue.
   */
  stopHeartbeat () {
    clearInterval(this.heartbeatInterval)
  }

  /**
   * @method sendHeartbeat
   * Sends a heartbeat signal.
   */
  sendHeartbeat () {
    this.emit('service.heartbeat')
  }

  /**
   * @method startStatus
   * Begins sending status updates based on the cfg#status value.
   */
  startStatus () {
    this.statusInterval = setInterval(this.sendStatus, this.statusWaitInterval)
  }

  /**
   * @method stopStatus
   * Stops sending regular status updates.
   */
  stopStatus () {
    clearInterval(this.statusInterval)
  }

  /**
   * @method sendStatus
   * Sends the service status update data to the remote system. 
   */
  sendStatus () {
    this.emit('service.status', this.status)
  }

  /**
   * @method startInfo
   * Starts sending system info on the cfg#info interval. However,
   * this data will only be sent if it changes (which is seldom, if ever).
   */
  startInfo () {
    this.infoInterval = setInterval(this.sendInfo, this.infoWaitInterval)
    this.sendInfo()
  }

  /**
   * @method stopInfo
   * Stop sending info updates.
   */
  stopInfo () {
    clearInterval(this.infoInterval)
  }

  /**
   * @method sendInfo
   * Sends the data to the remote system.
   */
  sendInfo () {
    let info = this.info
    let id = this.checksum(info)
    if (id !== this.infoChecksum) {
      this.infoChecksum = id
      this.emit('service.info', info)
    }
  }

  /**
   * @method sendTerminationNotice
   * Sends a notice that the process is about to terminate
   * with an exit code of `0` (non-failure).
   */
  sendTerminationNotice (data) {
    let me = this
    if (data) {
      return function () {
        me.emit('exit', data)
        process.exit(0)
      }
    } else {
      me.emit('exit')
      process.exit(0)
    }
  }
}

module.exports = HealthMonitor
