import { register } from './internal.js'

const PARSER = new Map([
  ['PROTOCOL', /(\w+:\/\/?.*):([0-9]+):([0-9]+)(?!=[^0-9])/i],
  ['NO_PROTOCOL', /\((.+):([0-9]+):([0-9]+)\)/i],
  ['NO_PARENTHESIS', /\s(?!\()([^\s]+):([0-9]+):([0-9]+)(?!=[^0-9])(?!\))/i],
  ['OLD_STACK', /Line\s+([0-9]+).+\s(\w+:\/\/?[^\s|:]+):?/i]
])

export default class Exception extends Error { // eslint-disable-line
  #id
  #custom

  constructor (config = {}) {
    super()

    config = typeof config === 'string' ? { message: config } : config

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

    // Enable stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, Exception)
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
   * The structured file references of the stacktrace. Each array element is a
   * JSON object corresponding to the traceable location where the action originated.
   * The trace only provides file information. `eval`, `<anonymous>`, `console`, and
   * in-memory execution is ignored.
   *
   * Use this attribute to identify the root of an error or breakpoint within a source file.
   * For full details, use the raw stacktrace (`.stack` in most runtimes).
   *
   * ```js
   * {
   *   path: String,
   *   line: Number,
   *   column: Number
   * }
   * ```
   * @readonly
   */
  get trace () {
    return this.stack.split('\n').reduce((result, line) => {
      for (const [name, pattern] of PARSER) {
        const match = pattern.exec(line)
        if (match !== null) {
          if (name !== 'OLD_STACK') {
            result.push({ path: match[1], line: match[2], column: match[3] })
          } else {
            result.push({ path: match[2], line: match[1], column: 0 })
          }
          break
        }
      }

      return result
    }, [])
  }
}

/**
 * @method defineException
 * Create a custom global exception (custom error).
 * @param {Object} config
 * The configuration of the new error.
 * @param {String} [config.name=NgnError]
 * The pretty name of the exception. Alphanumeric characters only (underscore is acceptable).
 * @param {String} [config.type=TypeError]
 * The type of error. This is commonly `TypeError` or `ReferenceError`, but
 * it can be any custom value.
 * @param {String} [config.severity=minor]
 * A descriptive "level" indicating how critical the error is.
 * @param {String} [config.message=Unknown Error]
 * The default message to output when none is specified.
 * @param {Object} [config.custom]
 * Provide a key/value object of custom attributes for the error.
 * There are three "special" custom attributes: `help`, `cause`, and `log`.
 * When provided, help/cause will always be written to the NGN.LEDGER
 * when the error is thrown. When `log` is set to `true`, the help/cause
 * will also be written to stdout.
 *
 * For example:
 *
 * ```js
 * NGN.createException({
 *   name: 'Test Problem',
 *   message: 'An example error.',
 *   custom: {
 *     log: true,
 *     help: 'Remove the throw statement.',
 *     cause: 'Testing the error output.'
 *   }
 * });
 *
 * throw TestProblem()
 * ```
 * The code above generates the following console output:
 *
 * ```sh
 * Testing the error output.
 * Tip: Remove the throw statement.
 * /path/to/test.js:12
 *    throw TestProblem();
 *    ^
 *
 * TestProblem: An example error.
 *    at null._onTimeout (/path/to/test.js:12:11)
 *    at Timer.listOnTimeout (timers.js:92:15)
 * ```
 */
export function defineException (config = {}) {
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
 *   { path: 'node.js', line: 348, column: 7 },
 *   { path: 'module.js',
 *     line: 575,
 *     column: 10 },
 *   { path: 'module.js',
 *     line: 550,
 *     column: 10 },
 *   { path: 'module.js',
 *     line: 541,
 *     column: 32 },
 *   { path: /_test.js', line: 8, column: 14 }
 * ]
 * ```
 *
 * By standardizing the order of the stack trace, it is easier to programmatically
 * identify sources of problems. This method does not prevent developers from
 * accessing a normal stacktrace.
 * @private
 * @returns {array}
 * Returns an array of objects. Each object contains the file, line, and column
 * within the stack. For example:
 *
 * ```
 * {
 *   path: 'path/to/file.js',
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
 *   line: 0,
 *   column: 0
 * }
 * ```
 */
export const stack = () => (new Exception({ DO_NOT_REGISTER: true })).trace
