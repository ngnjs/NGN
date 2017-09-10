(function () {
  class CustomException extends Error { // eslint-disable-line
    constructor (config) {
      super()

      Object.defineProperty(this, 'frameFilter', NGN.privateconst((frame) => {
        if (NGN.nodelike) {
          return frame.getFileName() !== __filename && frame.getFileName()
        } else {
          return frame.getFileName()
        }
      }))

      config = config || {}
      config = typeof config === 'string' ? { message: config } : config
      config.custom = config.custom || {}

      let me = this

      this.name = config.name || 'NgnError'
      this.type = config.type || 'TypeError'
      this.severity = config.severity || 'minor'
      this.message = config.message || 'Unknown Error'
      this.category = config.category || 'operational' // Alternative is "programmer"

      // Cleanup name
      this.name = this.name.replace(/[^a-zA-Z0-9_]/gi, '')

      // Add any custom properties
      for (let attr in config.custom) {
        if (config.custom.hasOwnProperty(attr)) {
          this[attr] = config.custom[attr]
        }
      }

      this.hasOwnProperty('custom') && delete this.custom

      if (NGN.nodelike || Error.prepareStackTrace) {
        // Capture the stack trace on a new error so the detail can be saved as a structured trace.
        Error.prepareStackTrace = function (_, stack) { return stack }

        let _err = new Error()

        Error.captureStackTrace(_err, this)

        this.rawstack = _err.stack

        Error.prepareStackTrace = function (err, stack) { // eslint-disable-line handle-callback-err
          me.cause && console.warn(me.cause)
          me.help && console.info(me.help)

          return `${me.name}: ${me.message}\n` + stack.filter(me.frameFilter).map((el) => {
            return `    at ${el}`
          }).join('\n')
        }

        // Enable stack trace
        Error.captureStackTrace(this)
      }
    }

    /*
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
      return this.rawstack.filter(this.frameFilter).map((frame) => {
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
    }
  }

  try {
    Object.defineProperty(window, 'NgnCustomException', {
      enumerable: false,
      writable: false,
      configurable: false,
      value: CustomException
    })
  } catch (e) {
    Object.defineProperty(global, 'NgnCustomException', {
      enumerable: false,
      writable: false,
      configurable: false,
      value: CustomException
    })
  }
})()
// if (NGN.nodelike) {
//   module.exports = CustomException
// }
