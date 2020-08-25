import NGN from './ngn.js'
import { register } from './internal.js'

export const {
  EventEmitter,
  Middleware,
  Exception,
  Class,
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
} = NGN

// Register the instance so it can be detected by plugins
register('INSTANCE', NGN)

export { NGN as default, NGN }
