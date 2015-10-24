'use strict'

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
   */
  create: {
    enumerable: true,
    writable: false,
    configurable: false,
    value: function (config) {
      config = config || {}
      config = typeof config === 'string' ? { message: config } : config
      config.custom = config.custom || {}

      config.name = config.name || 'NgnError'
      config.type = config.type || 'TypeError'
      config.severity = config.severity || 'minor'
      config.message = config.message || 'Unknown Error'
      config.category = config.category || 'operational' // Alternative is "programmer"

      // Cleanup name
      config.name = config.name.replace(/[^a-zA-Z0-9_]/gi, '')

      // Create the error as a function
      var self = this
      this.ErrFn = function (message) {
        if (!(this instanceof Error)) {
          return new self.ErrFn(message)
        }

        var me = this
        this.name = config.name
        this.type = config.type
        this.severity = config.severity
        this.message = message || config.message
        this.category = config.category

        // Add any custom properties
        for (var attr in config.custom) {
          if (config.custom.hasOwnProperty(attr)) {
            this[attr] = config.custom[attr]
          }
        }
        this.hasOwnProperty('custom') && delete this.custom

        // Define private properties of the error
        Object.defineProperties(this, {
          toString: {
            enumerable: false,
            writable: false,
            configurable: false,
            value: function () {
              return this.name + ': ' + this.message
            }
          }
        })

        // Super constructor for Error
        Error.call(this)

        // Capture the stack trace on a new error so the detail can be saved as a structured trace.
        Error.prepareStackTrace = function (_, stack) { return stack }
        var err = new Error // eslint-disable-line
        Error.captureStackTrace(err, arguments.callee) // eslint-disable-line

        /*
         * @property {Array} trace
         * The structured data of the stacktrace. Each array element is a JSON object corresponding to
         * the full stack trace:
         *
         *     {
         *       filename: String,
         *       line: Number,
         *       column: Number,
         *       functionname: String,
         *       native: Boolean,
         *       eval: Boolean,
         *       type: String
         *     }
         *
         * @readonly
         */
        Object.defineProperty(this, 'trace', {
          enumerable: false,
          writable: false,
          configurable: false,
          value: err.stack.filter(function (frame) {
            return frame.getFileName() !== __filename && frame.getFileName()
          }).map(function (frame) {
            return {
              filename: frame.getFileName(),
              line: frame.getLineNumber(),
              column: frame.getColumnNumber(),
              functionname: frame.getFunctionName(),
              native: frame.isNative(),
              eval: frame.isEval(),
              type: frame.getTypeName()
            }
          })
        })

        Error.prepareStackTrace = function (err, stack) {
          if (err) throw err
          return me.name + ': ' + me.message + '\n' + stack.filter(function (frame) {
            return frame.getFileName() !== __filename && frame.getFileName()
          }).map(function (el) {
            return '    at ' + el
          }).join('\n')
        }

        // Enable stack trace
        Error.captureStackTrace(this)
      }
      this.ErrFn.prototype = Error.prototype

      global[config.name] = this.ErrFn
    }
  }

})
