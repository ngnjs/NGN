(function () {
  // [PARTIAL]

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
        NGN.WARN('SKIPPED ' + this.name)
      }

      return
    }

    this.emit('start', this)

    if (mode && mode === 'dev') {
      NGN.INFO('Executing ' + this.name + ':')
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
      NGN.WARN(`Cannot skip step: ${this.name} is currently running.`)
    } else if (this._status === 'timedout') {
      NGN.WARN(`Cannot skip step: ${this.name} timed out.`)
    } else if (this._status === 'complete') {
      NGN.WARN(`Cannot skip step: ${this.name} already completed.`)
    }

    this._skip = true
  }
}

NGN.extend('Task', NGN.const(QueueItem))

  // [PARTIAL]

/**
 * @class NGN.Tasks
 * A job runner/collection capable of parallel and sequential task processing.
 * @fires complete
 * Triggered when the entire collection of tasks has completed
 * processing/running.
 * @fires aborted
 * Triggered when processing is aborted before completion.
 * @fires aborting
 * Triggered when the abort sequence begins.
 * @fires timeout
 * Triggered when processing times out.
 * @fires taskstart
 * Triggered whenever a new task is started. The NGN.Task is
 * the only argument delivered to event handlers.
 * @fires taskcomplete
 * Triggered whenever a task completes processing. The NGN.Task is
 * the only argument delivered to event handlers.
 * @fires taskcreate
 * Triggered when a new NGN.Task is added to the queue. The NGN.Task is
 * the only argument delivered to event handlers.
 * @fires taskremove
 * Triggered when a NGN.Task is removed from the queue. The NGN.Task is
 * the only argument delivered to event handlers.
 * @fires tasktimeout
 * Triggered when an NGN.Task times out during processing. The NGN.Task is
 * the only argument delivered to event handlers.
 */
class TaskRunner extends NGN.EventEmitter {
  /**
   * @constructor
   * @param {string} [mode=production]
   * Set this to `dev` for verbose console output.
   */
  constructor (mode = 'production') {
    super()

    Object.defineProperties(this, {
      steps: NGN.private([]),
      completed: NGN.private(0),
      timeout: NGN.private(null),
      _mode: NGN.private(mode),
      _cancel: NGN.private(false),
      processing: NGN.private(false),
      timer: NGN.private(null),
      sequential: NGN.private(false)
    })

    this.on('taskcomplete', (step) => {
      // Disallow duplicates
      if (this.sequential || step.status === 'completed') {
        return
      }

      step._status = 'complete'

      // When the step is done, tally it
      this.completed++

      if (this.mode === 'dev') {
        NGN.INFO(step.name + ' completed.')
      }

      // If all of the queries have been tallied, we're done.
      if (this.completed === this.steps.length) {
        this.processing = false

        Object.keys(this.steps).forEach((step) => {
          clearTimeout(this.steps[step].timer)
        })

        this.emit('complete')
      }
    })

    this.on('aborting', () => {
      this._cancel = true
    })
  }

  /**
   * @property {Array} list
   * A list of tasks within the collection. This is an array of
   * objects, where each object contains the `id`, `name`, and
   * `status` of the task.
   *
   * ```js
   * {
   *   id: <Number>,
   *   name: <String>,
   *   status: <String>
   * }
   * ```
   */
  get list () {
    return this.steps.map(function (s) {
      return {
        id: s.number,
        name: s.name,
        status: s.status
      }
    })
  }

  /**
   * @property {string} mode
   * The type of processing (dev, production, etc). Setting this to
   * `dev` enables verbose logging.
   */
  get mode () {
    return this._mode
  }

  set mode (value) {
    if (value.toLowerCase().substr(0, 3) === 'dev') {
      this._mode = 'dev'
    } else {
      this._mode = 'production'
    }
  }

  get cancelled () {
    return this._cancel
  }

  onTimeout () {
    let log = []

    if (this.steps.length > 0) {
      this.steps.forEach((s) => {
        log.push(s.name, s.status === null ? 'NOT STARTED' : s.status)
      })
    }

    this.emit('timeout', {
      process: log
    })

    log = null
  }

  /**
   * @method add
   * Add a task to the list.
   * @param {string} [name]
   * A descriptive name for the queued process/task.
   * @param {function} callback
   * The function to queue.
   * @param {function} callback.next
   * This argument allows users to explicitly use asynchronous
   * methods. Example:
   *
   * ```
   * let tasks = new NGN.Tasks()
   *
   * tasks.add('Descriptive Title', function (next) {
   *   myAsyncMethod(function () {
   *     console.log('Ran something async.')
   *     next()
   *   })
   * })
   * @returns {NGN.Task}
   * Returns the task object added to the queue.
   */
  add (name, fn) {
    if (this.processing) {
      return NGN.WARN('Cannot add a step while processing.')
    }

    if (typeof name === 'function') {
      fn = name
      name = 'Step ' + (parseInt(this.steps.length) + 1)
    }

    if (typeof fn !== 'function') {
      throw new Error('No processing method defined for step ' + (parseInt(this.steps.length) + 1) + '.')
    }

    const queue = new NGN.Task({
      name: name,
      callback: fn,
      number: (this.steps.length > 0 ? this.steps[this.steps.length - 1].number : 0) + 1
    })

    queue.on('complete', (step) => this.emit('taskcomplete', step))

    queue.on('timeout', (step) => {
      if (step.status === 'running' || step.status === 'timedout') {
        this.emit('tasktimeout', step)
      }
    })

    this.steps.push(queue)
    this.emit('taskcreate', queue)

    return queue
  }

  /**
   * @method getAt
   * @param  {number} index
   * Retrieve a queue item by it's index/queue number.
   * @return {Queue}
   */
  getAt (index) {
    return this.steps[index]
  }

  /**
   * @method get
   * Retrieve a specific queue item.
   * @param  {string} requestedStepTitle
   * The descriptie name of the queue item to retrieve.
   * @return {Queue}
   */
  get (requestedStep) {
    // Get by Name
    let element = this.steps.filter((step) => {
      return step.name === requestedStep
    })

    if (element.length === 1) {
      return element[0]
    }

    // Get by index
    element = this.steps.filter((step) => {
      return step.number === requestedStep
    })

    if (element.length === 1) {
      return element[0]
    }
  }

  /**
   * @method remove
   * Remove a queue item by name or number.
   * @param  {string} requestedStepTitle
   * The descriptive name of the queue item to retrieve.
   * @return {Queue}
   * Returns the item that was removed.
   */
  remove (requestedStep) {
    if (this.processing) {
      return NGN.WARN('Cannot add a step while processing.')
    }

    // Remove by name
    let element = this.steps.filter((step) => {
      return step.name === requestedStep
    })

    if (element.length === 1) {
      this.steps = this.steps.filter((step) => {
        return step.name !== requestedStep
      })

      this.emit('taskremove', element[0])
      return element[0]
    }

    // Remove by ID
    element = this.steps.filter((step) => {
      return step.number === requestedStep
    })

    if (element.length === 1) {
      this.steps = this.steps.filter((step) => {
        return step.number !== requestedStep
      })

      this.emit('taskremove', element[0])
      return element[0]
    }
  }

  /**
   * @method removeAt
   * Removes a queue item from the specific index.
   * @param  {number} requestedStepIndex
   * The queue index/number.
   * @return {Queue}
   * Returns the item that was removed.
   */
  removeAt (requestedStep) {
    if (this.processing) {
      return NGN.WARN('Cannot add a step while processing.')
    }

    // Remove by index
    if (typeof requestedStep !== 'number') {
      return console.error('Failed to remove step: ' + requestedStep)
    }

    if (requestedStep < 0 || requestedStep >= this.steps.length) {
      return console.error('Step index ' + requestedStep + ' could not be found or does not exist.')
    }

    return this.steps.splice(requestedStep, 1)[0]
  }

  /**
   * @method reset
   * Resets all cancelled/skipped steps, essentially resetting the queue
   * to it's pre-aborted state.
   */
  reset () {
    if (this.processing) {
      return NGN.WARN('Cannot reset a running queue. Abort or wait for the process to complete before resetting.')
    }

    // Refresh cancelled steps
    this.steps.forEach((step) => {
      step._skip = false
    })
  }

  /**
   * @method process
   * Run the queued processes in order.
   * @param {boolean} [sequential=false]
   * Set to `true` to run the queue items in a synchronous-like manner.
   * This will execute each method one after the other. Each method must
   * complete before the next is started.
   */
  process (sequential) {
    if (this.processing) {
      return NGN.WARN('Cannot start processing (already running). Please wait for this process to complete before calling process() again.')
    }

    if (this.steps.length === 0) {
      return this.emit('complete')
    }

    this.processing = true
    this._cancel = false

    if (this.timeout !== null) {
      this.timer = setTimeout(() => this.onTimeout(), this.timeout)
    }

    this.sequential = typeof sequential === 'boolean' ? sequential : false
    if (!this.sequential) {
      for (let i = 0; i < this.steps.length; i++) {
        this.steps[i].run(this.mode)
      }
    } else {
      let queue = this.steps
      let listener = new NGN.EventEmitter()

      listener.on('taskcomplete', () => {
        if (queue.length > 0) {
          const currentTask = queue.shift()

          if (currentTask.skipped) {
            return listener.emit('taskcomplete')
          }

          currentTask.on('complete', () => listener.emit('taskcomplete'))
          currentTask.on('start', () => this.emit('taskstart', currentTask))

          currentTask.run(this.mode)
        } else {
          this.emit('complete')
        }
      })

      let currentStep = queue.shift()

      currentStep.on('complete', () => listener.emit('taskcomplete'))
      currentStep.on('start', () => this.emit('taskstart', currentStep))

      currentStep.run(this.mode)
    }
  }

  // Alias for process
  run () {
    this.process(...arguments)
  }

  /**
   * @method abort
   * Abort/cancel processing. This prevents further steps from processing.
   */
  abort () {
    this.emit('aborting')

    // Make sure the steps are skipped.
    this.each((step) => {
      if (['completed', 'running', 'timedout'].indexOf(step.status) < 0 && !step.skipped) {
        step.skip()
      }
    })

    this.once('complete', () => this.emit('aborted'))
  }

  /**
   * @method each
   * Apply a method to each step.
   * @param {function} method
   * @private
   */
  each (fn) {
    for (let i = 0; i < this.steps.length; i++) {
      fn(this.steps[i])
    }
  }

  // Alias for abort
  cancel () {
    this.abort(...arguments)
  }
}

NGN.extend('Tasks', NGN.const(TaskRunner))

})()