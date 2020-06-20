import Core from './class.js'

/**
 * The Middleware engine allows developers to
 * create sequential "processing pipelines" by
 * queuing a series of functions and executing
 * them when requested.
 *
 * Example:
 * ```
 * const mylib = new Middleware()
 *
 * mylib.use(function (data, next) {
 *   console.log('data', data)
 *   next()
 * })
 *
 * mylib.use((data, next) => {
 *   data.extraAttribute = 'something'
 *   next()
 * })
 *
 * // Run the pipeline
 * mylib.run({ test: true }, () => {
 *   console.log('All done')
 * })
 * ```
 *
 * This would output the following:
 *
 * ```sh
 * { test: true }
 * { test: true, extraAttribute: "something" }
 * All Done
 * ```
 */
export default class Middleware extends Core {
  constructor () {
    super(...arguments)

    Object.defineProperties(this, {
      _data: { enumerable: false, configurable: false, value: [] },
      go: { enumerable: false, configurable: false, writable: true, value: (...args) => { args.pop().apply(this, args) } }
    })

    this.register('Middleware')
  }

  /**
   * @property {number} size
   * The number of middleware functions in the queue.
   */
  get size () { return this._data.length }

  /**
   * @property {object} data
   * The object/JSON representation of the queue.
   * This contains an ordered list of functions (as text)
   */
  get data () { return this._data }

  /**
   * @method use
   * Add a function to the queue.
   * @param {function} method
   */
  use (method) {
    const methodBody = method.toString()
    if (methodBody.indexOf('[native code]') < 0) {
      this._data.push(methodBody)
    }

    this.go = (stack => (...args) => {
      let next = args.pop()
      stack(...args, () => {
        method.apply(this, [...args, next.bind(null, ...args)])
      })
    })(this.go)
  }

  /**
   * Execute each function in the queue.
   */
  run () {
    const args = Array.from(arguments)

    // Assure there is always a noop function (in the case
    // no final function is specified)
    if (args.length === 0 || typeof args[args.length - 1] !== 'function') {
      args.push(() => { })
    }

    this.go(...args)
  }
}
