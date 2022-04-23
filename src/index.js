import NGN from './ngn.js'
import { register } from './internal.js'

// Register the instance so it can be detected by plugins
register('INSTANCE', NGN)

export const {
  EventEmitter,
  Middleware,
  Exception,
  Class,
  version,
  OS,
  nodelike,
  platform,
  platformVersion,
  runtime,
  runtimeVersion,
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
  stack,
  defineException,
  BUS,
  LEDGER,
  Relationship,
  Relationships,
  plugins
} = NGN

export { NGN as default, NGN }
