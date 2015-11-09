'use strict'

const Base = require('./Base')
const os = require('os')

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
 * @fires health.error.uncaught
 * Fired when and uncaughtException occurs.
 * @fires health.error.rejection
 * Fired when an unhandled promise rejection occurs.
 * @fires health.heartbeat
 * A ping event.
 * @fires health.status
 * Fired when the system status is recorded.
 * @fires health.info
 * Fired when the service info is requested and/or changes.
 * @fires health.status.start
 * Fired when the status monitor launches.
 * @fires health.status.stop
 * Fired when the status monitor stops.
 * @fires health.info.start
 * Fired when the deviceinfo monitor launches.
 * @fires health.info.stop
 * Fired when the device info monitor stops.
 * @fires health.heartbeat.start
 * Fired when the heartbeat monitor launches.
 * @fires health.heartbeat.stop
 * Fired when the heartbeat monitor stops.
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

    // Send uncaught exceptions
    process.on('uncaughtException', function (err) {
      console.error(err.stack)
      me.emit('health.error.uncaught', err)
    })

    // Send unhandled rejections
    process.on('unhandledRejection', function (reason, promise) {
      me.emit('health.error.rejection', {
        reason: reason,
        promise: promise
      })
    })

    // Handle exits
    process.on('beforeExit', this.sendTerminationNotice)
    process.on('SIGINT', this.sendTerminationNotice('SIGINT'))
  }

  /**
   * @property {number} heartbeatWaitTime
   * The amount of time to wait between sending heartbeat signals.
   * Setting this to a new value will automatically restart the
   * heartbeat monitor.
   */
  get heartbeatWaitTime () {
    return this.heartbeatWaitInterval
  }

  set heartbeatWaitTime (value) {
    let me = this
    this.heartbeatWaitInterval = value
    this.once('health.heartbeat.stop', function () {
      me.startHeartbeat()
    })
    this.stopHeartbeat()
  }

  /**
   * @property {number} statusWaitTime
   * The amount of time to wait between sending system status updates.
   * Setting this to a new value will automatically restart the
   * status monitor.
   */
  get statusWaitTime () {
    return this.statusWaitInterval
  }

  set statusWaitTime (value) {
    let me = this
    this.statusWaitInterval = value
    this.once('health.status.stop', function () {
      me.startStatus()
    })
    this.stopStatus()
  }

  /**
   * @property {number} infoWaitTime
   * The amount of time to wait between sending device information.
   * Setting this to a new value will automatically restart the
   * device monitor. Remember, device info updates are only sent
   * if the device information changes (very rare).
   */
  get infoWaitTime () {
    return this.infoWaitInterval
  }

  set infoWaitTime (value) {
    let me = this
    this.infoWaitInterval = value
    this.once('health.info.stop', function () {
      me.startInfo()
    })
    this.stopInfo()
  }

  /**
   * @property {boolean} heartbeatrunning
   * Returns `true` if the heartbeat monitor is actively running.
   */
  get heartbeatrunning () {
    return this.coalesce(this.heartbeatInterval !== null, false)
  }

  /**
   * @property {boolean} statusrunning
   * Returns `true` if the status monitor is actively running.
   */
  get statusrunning () {
    return this.coalesce(this.statusInterval !== null, false)
  }

  /**
   * @property {boolean} inforunning
   * Returns `true` if the device information monitor is actively running.
   */
  get inforunning () {
    return this.coalesce(this.infoInterval !== null, false)
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
    // Filter unnecessary/common env vars.
    let vars = Object.keys(process.env).filter(function (v) {
      if (['npm_', 'rvm_'].indexOf(v.substr(0, 4)) < 0) {
        if (['TERM', 'TERM_PROGRAM', 'SHELL', 'TMPDIR', '_', 'PWD', 'NPM_PACKAGES', 'NODE', 'NODE_PATH'].indexOf(v) < 0) {
          if (['_system_'].indexOf(v.substr(0, 8))) {
            return true
          }
          return false
        }
        return false
      }
      return false
    })

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
      variables: vars,
      hasnpm: process.config.variables.node_install_npm
    }
  }

  /**
   * @method startHeartbeat
   * Starts the heartbeat system. This also executes the #startInfo method
   * to assure the first heartbeat is accompanied by identifying service information.
   */
  startHeartbeat () {
    let me = this

    // "Register" the service with the Bridge
    !this.inforunning && this.startInfo()

    // Begin the heartbeat
    this.heartbeatInterval = setInterval(function () {
      me.sendHeartbeat()
    }, this.heartbeatWaitInterval)
    this.emit('health.heartbeat.start')
  }

  /**
   * @method stopHeartbeat
   * Stops the heartbeat process. Use with caution. Remote systems may think the
   * process is no longer accessible if the heartbeat doesn't continue.
   */
  stopHeartbeat () {
    clearInterval(this.heartbeatInterval)
    this.emit('health.heartbeat.stop')
  }

  /**
   * @method sendHeartbeat
   * Sends a heartbeat signal.
   */
  sendHeartbeat () {
    this.emit('health.heartbeat')
  }

  /**
   * @method startStatus
   * Begins sending status updates based on the cfg#status value.
   */
  startStatus () {
    let me = this
    this.statusInterval = setInterval(function () {
      me.sendStatus()
    }, this.statusWaitInterval)
    this.emit('health.status.start')
    this.sendStatus()
  }

  /**
   * @method stopStatus
   * Stops sending regular status updates.
   */
  stopStatus () {
    clearInterval(this.statusInterval)
    this.emit('health.status.stop')
  }

  /**
   * @method sendStatus
   * Sends the service status update data to the remote system.
   */
  sendStatus () {
    this.emit('health.status', this.status)
  }

  /**
   * @method startInfo
   * Starts sending system info on the cfg#info interval. However,
   * this data will only be sent if it changes (which is seldom, if ever).
   */
  startInfo () {
    let me = this
    this.infoInterval = setInterval(function () {
      let data = me.info
      let id = me.checksum(JSON.stringify(data))
      if (id !== me.infoChecksum) {
        me.infoChecksum = id
        me.sendInfo()
      }
    }, this.infoWaitInterval)
    this.sendInfo()
    this.emit('health.info.start')
  }

  /**
   * @method stopInfo
   * Stop sending info updates.
   */
  stopInfo () {
    clearInterval(this.infoInterval)
    this.emit('health.info.stop')
  }

  /**
   * @method sendInfo
   * Sends the data to the remote system.
   */
  sendInfo () {
    this.emit('health.info', this.info)
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

  /**
   * @method off
   * A helper method to quickly remove an event listener.
   * This basically just runs `EventEmitter.removeListener`.
   */
  off (topic, fn) {
    this.removeListener(topic, fn)
  }

  /**
   * @method start
   * Starts all event shipping to remote services.
   */
  start () {
    if (!this.heartbeatrunning) {
      this.startHeartbeat() // Heartbeat autostarts info monitor
    } else if (!this.inforunning) {
      this.startInfo()
    }
    !this.statusrunning && this.startStatus()
  }

  /**
   * @method stop
   * Stops all event shipping to remote services.
   */
  stop () {
    this.heartbeatrunning && this.stopHeartbeat()
    this.statusrunning && this.stopStatus()
    this.inforunning && this.stopInfo()
  }
}

module.exports = HealthMonitor
