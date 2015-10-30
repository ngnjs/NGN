'use strict'

const CustomException = require('./CustomException')

/**
 * @class NGN
 * @inheritdoc
 */
module.exports = {}

Object.defineProperties(module.exports, {

  /**
   * @method createException
   * Create a custom global exception.
   * For more information, see the [Custom Exceptions Guide](#!/guide/customerrors).
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
   * There are two "special" custom attributes: `help` and `cause`.
   * When provided, these will be written to stdout whenever the error's
   * stack is viewed.
   *
   * For example:
   *
   * ```js
   * require('ngn')
   *
   * NGN.createException({
   *   name: 'Test Problem',
   *   message: 'An example error.',
   *   custom: {
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
   * Remove the throw statement.
   * /path/to/test.js:12
   *    throw TestProblem();
   *    ^
   *
   * TestProblem: An example error.
   *    at null._onTimeout (/path/to/test.js:12:11)
   *    at Timer.listOnTimeout (timers.js:92:15)
   * ```
   */
  create: {
    enumerable: true,
    writable: false,
    configurable: false,
    value: function (config) {
      config = config || {}
      config = typeof config === 'string' ? { message: config } : config
      config.name = config.name || 'NgnError'
      config.name = config.name.replace(/[^a-zA-Z0-9_]/gi, '')

      // Create the error as a function
      global[config.name] = function () {
        if (arguments.length > 0) {
          config.message = arguments[0]
        }
        return new CustomException(config)
      }
    }
  }

})
