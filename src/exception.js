import { register, ERROR } from './internal.js'

class Exception extends Error { // eslint-disable-line
  #id
  #custom
  #stack
  #verbose
  // #frameFilter = frame => {
  //   if (globalThis.process && globalThis.process.argv) {
  //     let args = process.argv.filter(i => i.indexOf(process.cwd()) === 0)
  //     if (args.length > 0) {
  //       return frame.getFileName() !== args[0] && frame.getFileName()
  //     }
  //   }
    
  //   return frame.getFileName() // eslint-disable-line no-unreachable
  // }

  constructor (config = {}) {
    super()

    config = typeof config === 'string' ? { message: config } : config

    const me = this

    this.name = config.name || 'NgnError'
    this.type = config.type || 'Error'
    this.severity = config.severity || 'minor'
    this.message = config.message || 'Unknown Error'
    this.category = config.category || 'programmer' // Alternative is "operational"
    this.description = this.message
    this.parent = globalThis

    // Cleanup name
    this.name = this.name.replace(/[^a-zA-Z0-9_]/gi, '')

    // Add any custom properties
    this.#custom = config.custom || {}

    this.#id = (config.id 
      ? config.id
      : this.#custom.id) || this.name

    const verbose = typeof this.#custom.log === 'boolean' ? this.#custom.log : false
    
    if (Error.prepareStackTrace) {
      // Capture the stack trace on a new error so the detail can be saved as a structured trace.
      Error.prepareStackTrace = function (_, stack) { return stack }

      const _err = new Error()

      Error.captureStackTrace(_err, this)

      this.#stack = _err.stack

      // const ff = this.#frameFilter

      Error.prepareStackTrace = function (err, stack) { // eslint-disable-line handle-callback-err
        // Slicing the stack prevents the library files from being included in the trace.
        stack = stack.slice(2).map(el => `    at ${el}`).join('\n')
        // Provide extended help within the Ledger
        ERROR(me.name, me)
        
        let prefix = ''
        if (verbose) {
          prefix = [me.cause, me.help].filter(i => i !== null)
          prefix = prefix.length === 0 ? '' : '\n' + prefix.join('\n\n').trim() + '\n\n'
        }

        return `${prefix}${me.name}: ${me.message}\n` + stack
      }

      // Enable stack trace
      Error.captureStackTrace(this)
    }

    if (!(typeof config.DO_NOT_REGISTER === 'boolean' && !config.DO_NOT_REGISTER)) {
      register('Exception', this)
    }
  }

  get help () {
    return this.#custom.help ? 'Tip: ' + this.#custom.help : null
  }

  get cause () {
    return this.#custom.cause ? this.#custom.cause : null
  }

  get id () {
    return this.#id
  }

  /**
   * @property {Array} trace
   * The structured data of the stacktrace. Each array element is a JSON object corresponding to
   * the full stack trace:
   *
   * ```js
   * {
   *   filename: String,
   *   line: Number,
   *   column: Number,
   *   functionname: String,
   *   native: Boolean,
   *   eval: Boolean,
   *   type: String
   * }
   * ```
   * @readonly
   */
  get trace () {
    // return this.#stack.filter(this.#frameFilter).map(frame => {
    return this.#stack.map(frame => {
      return {
        path: frame.getFileName(),
        file: frame.getFileName().split(/\/|\\/).pop().replace('<anonymous>', 'console'),
        line: frame.getLineNumber(),
        column: frame.getColumnNumber(),
        functionname: frame.getFunctionName(),
        native: frame.isNative(),
        eval: frame.isEval(),
        type: frame.getTypeName(),
        async: frame.isAsync(),
        raw: frame.toString(),
        object: frame
      }
    })
  }
}

const define = function (config = {}) {
  // Define the error globally
  globalThis[config.name || 'NGNError'] = function () {
    if (arguments.length > 0) {
      config.message = arguments[0]
    }

    return new Exception(config)
  }
}

/**
 * @method stack
 * Retrieve the stack trace from a specific code location without throwing
 * an exception. Files are always listed from the root. This is the default
 * order in browsers, but the reverse of the normal stack order in node-like
 * environments.
 *
 * For example, the following stack on node shows `_test.js` as the last item
 * in the array. In node-like environments, the `_test.js` would normally be
 * the first item in the stacktrace.
 *
 * ```js
 * [
 *   { path: 'node.js:348:7', file: 'node.js', line: 348, column: 7 },
 *   { path: 'module.js:575:10',
 *     file: 'module.js',
 *     line: 575,
 *     column: 10 },
 *   { path: 'module.js:550:10',
 *     file: 'module.js',
 *     line: 550,
 *     column: 10 },
 *   { path: 'module.js:541:32',
 *     file: 'module.js',
 *     line: 541,
 *     column: 32 },
 *   { path: '/_test.js:8:14', file: '/_test.js', line: 8, column: 14 }
 * ]
 * ```
 *
 * By standardizing the order of the stack trace, it is easier to programmatically
 * identify sources of problems. This method does not prevent developers from
 * accessing a normal stacktrace.
 * @private
 * @returns {array}
 * Returns an array of objects. Each object contains the file, line, column,
 * and path within the stack. For example:
 *
 * ```
 * {
 *   path: 'path/to/file.js:127:14'
 *   file: 'path/to/file.js',
 *   line: 127,
 *   column: 14
 * }
 * ```
 *
 * If a stacktrace is unavailable for any reason, the array will contain a
 * single element like:
 *
 * ```js
 * {
 *   path: 'unknown',
 *   file: 'unknown',
 *   line: 0,
 *   column: 0
 * }
 * ```
 */
const stack = () => (new Exception({ DO_NOT_REGISTER: true })).trace.slice(2)

export {
  Exception as default,
  Exception,
  define,
  stack
}