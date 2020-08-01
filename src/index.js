import base from './base.js'
import * as internal from './internal.js'
import * as constant from './constants.js'
import Core from './class.js'
import Middleware from './middleware.js'
import { Exception, define as defineException, stack } from './exception.js'
import EventEmitter from './emitter/emitter.js'

/**
 * @namespace NGN
 * The NGN namespace.
 */
const NGN = Object.defineProperties({}, base)

Object.defineProperties(NGN, {
  /**
  * @property {string} version
  * Identifies the NGN version number.
  */
  version: NGN.constant(constant.version),

  // Constants
  OS: NGN.constant(constant.OS),
  nodelike: NGN.privateconstant(constant.NODELIKE),
  runtime: NGN.privateconstant(constant.RUNTIME),
  platform: NGN.get(constant.PLATFORM),
  platformVersion: NGN.get(constant.PLATFORM_RELEASE),

  // Internal Events
  WARN_EVENT: NGN.privateconstant(constant.WARN_EVENT),
  INFO_EVENT: NGN.privateconstant(constant.INFO_EVENT),
  ERROR_EVENT: NGN.privateconstant(constant.ERROR_EVENT),
  INTERNAL_EVENT: NGN.privateconstant(constant.INTERNAL_EVENT),

  // Internal event logging methods
  WARN: NGN.privateconstant(internal.WARN),
  INFO: NGN.privateconstant(internal.INFO),
  ERROR: NGN.privateconstant(internal.ERROR),
  INTERNAL: NGN.privateconstant(internal.INTERNAL),

  // Stack Methods
  stack: NGN.get(stack),

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
  defineException: NGN.constant(defineException),

  // Standard instances (event busses)
  BUS: NGN.constant(new EventEmitter({ name: 'NGN.BUS', description: 'Global event bus' })),
  LEDGER: NGN.get(() => internal.LEDGER),

  // Classes
  Class: NGN.public(Core),
  Middleware: NGN.public(Middleware),
  EventEmitter: NGN.public(EventEmitter)
})

internal.register('INSTANCE', NGN)

// Standard NGN Exceptions
defineException({
  name: 'MissingNgnDependencyError',
  type: 'MissingNgnDependencyError',
  severity: 'critical',
  message: 'An NGN dependency is missing or could not be found.',
  category: 'programmer',
  custom: {
    help: 'Include the missing library.',
    cause: 'A required dependency was not included (or was included in the wrong sequence).'
  }
})

defineException({
  name: 'ReservedWordError',
  type: 'ReservedWordError',
  severity: 'critical',
  message: 'An attempt to use a reserved word failed.',
  category: 'programmer',
  custom: {
    help: 'Use an alternative word.',
    cause: 'A word was used to define an attribute, method, field, or other element that already exists.'
  }
})

defineException({
  name: 'InvalidConfigurationError',
  type: 'InvalidConfigurationError',
  severity: 'critical',
  message: 'Invalid configuration.',
  category: 'programmer',
  custom: {
    help: 'See the documentation for the proper configuration.',
    cause: 'The configuration specified was marked as invalid or caused an error during instantiation.'
  }
})

defineException({
  name: 'UnacceptableParameterTypeError',
  type: 'UnacceptableParameterTypeError',
  severity: 'critical',
  message: 'The parameter/argument provided is unacceptable.',
  category: 'programmer',
  custom: {
    help: 'See the documentation for a list of accepted parameter types.',
    cause: 'This is commonly caused by a variable evaluating to an incorrect data type, such as "undefined" or "null". It is also commonly caused by providing arguments to a function in the incorrect order, or just an unawareness of the acceptable parameter types.'
  }
})

// Self reference to make NGN globally accessible in any environment.
// /* non-esm-only */
// globalThis.NGN = NGN
// /* end-non-esm-only */

const {
  OS,
  nodelike,
  platform,
  platformVersion,
  WARN_EVENT,
  INFO_EVENT,
  ERROR_EVENT,
  INTERNAL_EVENT,
  WARN,
  INFO,
  ERROR,
  INTERNAL,

  wrapClass,
  deprecateClass,
  wrap,
  deprecate
} = NGN

// Proxy NGN so plugins can be identified within the namespace.
const NGNProxy = new Proxy(NGN, {
  get (target, property) {
    if (target[property] !== undefined) {
      return target[property]
    }

    const ref = globalThis[constant.REFERENCE_ID]
    if (ref instanceof Map) {
      if (ref.has('PLUGINS') && ref.get('PLUGINS').has(property)) {
        return ref.get('PLUGINS').get(property)
      }
    }

    return undefined
  }
})

export {
  NGNProxy as default,
  NGNProxy as NGN,
  EventEmitter,
  Middleware,
  Exception,
  Core as Class,

  OS,
  nodelike,
  platform,
  platformVersion,
  WARN_EVENT,
  INFO_EVENT,
  ERROR_EVENT,
  INTERNAL_EVENT,
  WARN,
  INFO,
  ERROR,
  INTERNAL,
  wrapClass,
  deprecateClass,
  wrap,
  deprecate,
  stack
}
