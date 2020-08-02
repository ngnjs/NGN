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

// Proxy NGN so plugins can be identified within the namespace.
// const proxy = new Proxy(NGN, {
//   get (target, property) {
//     if (target[property] !== undefined) {
//       return target[property]
//     }

//     const ref = globalThis[REFERENCE_ID]
//     if (ref instanceof Map) {
//       if (ref.has('PLUGINS') && ref.get('PLUGINS').has(property)) {
//         return ref.get('PLUGINS').get(property)
//       }
//     }

//     return undefined
//   }
// })

// Register the instance so it can be detected by plugins
register('INSTANCE', NGN)

// export {
//   proxy as default,
//   proxy as NGN
// }
export { NGN as default, NGN }
