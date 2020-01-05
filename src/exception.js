export default class CustomException extends Error { // eslint-disable-line
  #frameFilter = frame => {
    /* node-only */
    return frame.getFileName() !== process.mainModule.filename && frame.getFileName()
    /* end-node-only */
    /* browser-only */
    return frame.getFileName() // eslint-disable-line no-unreachable
    /* end-browser-only */
  }

  constructor (config) {
    super()

    config = config || {}
    config = typeof config === 'string' ? { message: config } : config
    config.custom = config.custom || {}

    const me = this

    this.name = config.name || 'NgnError'
    this.type = config.type || 'TypeError'
    this.severity = config.severity || 'minor'
    this.message = config.message || 'Unknown Error'
    this.category = config.category || 'operational' // Alternative is "programmer"

    // Cleanup name
    this.name = this.name.replace(/[^a-zA-Z0-9_]/gi, '')

    // Add any custom properties
    for (const attr in config.custom) {
      if (config.custom.hasOwnProperty(attr)) { // eslint-disable-line no-prototype-builtins
        this[attr] = config.custom[attr]
      }
    }

    this.hasOwnProperty('custom') && delete this.custom // eslint-disable-line no-prototype-builtins

    /* browser-only */
    if (Error.prepareStackTrace) {
      // Capture the stack trace on a new error so the detail can be saved as a structured trace.
      Error.prepareStackTrace = function (_, stack) { return stack }

      const _err = new Error()

      Error.captureStackTrace(_err, this)

      this.rawstack = _err.stack

      const ff = this.#frameFilter

      Error.prepareStackTrace = function (err, stack) { // eslint-disable-line handle-callback-err
        const msg = [me.message]

        if (me.cause) {
          msg.push(`Cause: ${me.cause}`)
        }

        if (me.help) {
          msg.push(`Help : ${me.help}`)
        }

        return `${me.name}: ${msg.join('\n').trim()}\n` + stack.filter(ff).map(el => `    at ${el}`).join('\n')
      }

      // Enable stack trace
      Error.captureStackTrace(this)
    }
    /* end-browser-only */
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
    return this.rawstack.filter(this.#frameFilter).map((frame) => {
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
