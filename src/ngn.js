import base from './base.js'
import type from './utility/type.js'
import * as internal from './internal.js'
import * as constant from './constants.js'
import Core from './class.js'
import Middleware from './middleware.js'
import { defineException, stack } from './exception.js'
import EventEmitter from './emitter/emitter.js'

// The NGN namespace.
const NGN = Object.defineProperties({}, Object.assign({}, base, type))

Object.defineProperties(NGN, {
  // Constants
  version: NGN.constant(constant.version),
  OS: NGN.constant(constant.OS),
  nodelike: NGN.hiddenconstant(constant.NODELIKE),
  runtime: NGN.hiddenconstant(constant.RUNTIME),
  platform: NGN.get(constant.PLATFORM),
  platformVersion: NGN.get(constant.PLATFORM_RELEASE),

  // Internal Events
  WARN_EVENT: NGN.hiddenconstant(constant.WARN_EVENT),
  INFO_EVENT: NGN.hiddenconstant(constant.INFO_EVENT),
  ERROR_EVENT: NGN.hiddenconstant(constant.ERROR_EVENT),
  INTERNAL_EVENT: NGN.hiddenconstant(constant.INTERNAL_EVENT),

  // Internal event logging methods
  WARN: NGN.hiddenconstant(internal.WARN),
  INFO: NGN.hiddenconstant(internal.INFO),
  ERROR: NGN.hiddenconstant(internal.ERROR),
  INTERNAL: NGN.hiddenconstant(internal.INTERNAL),

  // Stack Methods
  stack: NGN.get(stack),

  // Custom Exceptions
  defineException: NGN.constant(defineException),

  // Standard instances (event busses)
  BUS: NGN.constant(new EventEmitter({ name: 'NGN.BUS', description: 'Global event bus' })),
  LEDGER: NGN.get(() => internal.LEDGER),

  // Classes
  Class: NGN.public(Core),
  Middleware: NGN.public(Middleware),
  EventEmitter: NGN.public(EventEmitter),

  // Plugin access
  plugins: NGN.constant(internal.plugins)
})

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

export { NGN as default }
