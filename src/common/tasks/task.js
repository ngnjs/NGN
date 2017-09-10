'use strict'

NGN.Task = function () {
  /**
   * @class NGN.Task
   * Represents a unit of work as a function. A task "executes"
   * when it's callback method is executed.
   * @fires start
   * Triggered when task execution begins. The task itself is provided
   * as an argument to the event handler.
   * @fires complete
   * Triggered when task execution finishes. The task itself is provided
   * as an argument to the event handler.
   * @fires skip
   * Triggered when task is skipped. The task itself is provided
   * as an argument to the event handler.
   * @fires timeout
   * Triggered when task execution time exceeds the specified timeout
   * limit. The task itself is provided as an argument to the event handler.
   */
  class QueueItem extends NGN.EventEmitter {
    constructor (config) {
      config = config || {}

      super(config)

      Object.defineProperties(this, {
        /**
         * @cfg {string} name
         * Descriptive name of the worker.
         */
        name: NGN.const(NGN.coalesce(config.name, 'Unknown')),

        /**
         * @cfg {function} callback
         * The method to execute when the queue is ready.
         */
        callback: NGN.privateconst(config.callback),

        /**
         * @cfg {number} number
         * The queue item number. This is used primarily as an ID.
         */
        number: NGN.const(parseInt(config.number, 10)),

        timer: NGN.private(null),
        _status: NGN.private(null),
        bus: NGN.private(config.buz),
        _skip: NGN.private(false)
      })

      this.on('timeout', () => {
        this._status = 'timedout'
      })

      this.on('skip', () => {
        this._status = 'skipped'
      })
    }

    /**
     * @property {string} status
     * May be `running`, `complete`, or `null` (not run yet)
     */
    get status () {
      return this._status
    }

    /**
     * @property {boolean} skipped
     * `true` to skip the step, `false` to execute it.
     */
    get skipped () {
      return this._skip
    }

    /**
     * @method run
     * Execute the callback function.
     * @param {string} mode
     * `dev` or `prod`. When in "dev" mode, verbose output is written
     * to the console.
     */
    run (mode) {
      if (this.skipped) {
        this.emit('skip', this)

        if (mode && mode === 'dev') {
          console.warn('SKIPPED ' + this.name)
        }

        return
      }

      this.emit('start', this)

      if (mode && mode === 'dev') {
        console.info('Executing ' + this.name + ':')
      }

      this._status = 'running'

      const me = this
      const scope = {
        name: this.name,
        number: this.number,
        timeout: function (milliseconds) {
          me.timer = setTimeout(function () {
            me.emit('timeout', me)
          }, milliseconds)
        }
      }

      this.callback.apply(scope, [function () {
        me._status = 'complete'
        me.emit('complete', me)
      }])

      if (this.callback.length === 0) {
        me._status = 'complete'
        me.emit('complete', me)
      }
    }

    /**
     * @method skip
     * Skip this item
     */
    skip () {
      if (this._status === 'running') {
        console.warn(`Cannot skip step: ${this.name} is currently running.`)
      } else if (this._status === 'timedout') {
        console.warn(`Cannot skip step: ${this.name} timed out.`)
      } else if (this._status === 'complete') {
        console.warn(`Cannot skip step: ${this.name} already completed.`)
      }

      this._skip = true
    }
  }

  return QueueItem
}

NGN.Task = NGN.Task()

if (NGN.nodelike) {
  module.exports = NGN.Task
}
