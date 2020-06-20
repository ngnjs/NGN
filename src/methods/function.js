import { WARN } from '../internal.js'

/**
 * @method wrap
 * Executes a **synchronous** method before invoking a standard function.
 * This is primarily designed for displaying warnings, but can also be
 * used for other operations like migration layers.
 * @param {function} preMethod
 * The **synchronous** function to invoke before the class is instantiated. This
 * method receives the same arguments passed to the class.
 * @param {function} method
 * The function to wrap.
 * @return {function}
 * @private
 */
const Wrap = function (preFn, fn) {
  return function () {
    try { preFn(...arguments) } catch (e) { console.log(e) }
    fn(...arguments)
  }
}

/**
 * @method deprecate
 * Fires an event (if NGN.BUS is available) or logs a warning indicating the
 * method is deprecated.
 * @param {function} method
 * The method to return/execute.
 * @param {string} [message='The method has been deprecated.']
 * The warning displayed to the user.
 * @return {function}
 * @fires DEPRECATED.METHOD
 * Fires `DEPRECATED.METHOD` on the NGN.BUS. The message is delivered to
 * the event handler.
 */
const Deprecate = function (fn, message = 'The method has been deprecated.') {
  return Wrap(() => WARN('DEPRECATED.METHOD', message), fn)
}

/**
 * @method rename
 * Deprecates the method, with a message indicating the method was renamed.
 * @param {function} method
 * The new method to return/execute.
 * @param {string} name
 * The new name of the method.
 * @return {function}
 */
const Rename = function (fn, name) {
  return Deprecate(fn, `The method has been renamed to "${name}".`)
}

/**
 * @method isFn
 * A shortcut method for determining if a variable is a function.
 * This is useful for identifying the existance of callback methods.
 * @param {any} variable
 * The variable to identify as a function.
 * @returns {boolean}
 * @private
 */
const Is = v => typeof v === 'function'

export {
  Wrap,
  Deprecate,
  Rename,
  Is
}
