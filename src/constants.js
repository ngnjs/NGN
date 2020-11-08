/**
* @property {string} version
* Identifies the NGN version number.
*/
const version = '<#REPLACE_VERSION#>' // The real version is injected by the build process

const NODELIKE = globalThis.process !== undefined

/**
 * Indicates NGN is running in a node-like environment.
 * This will detect node, Electron, NW.js, and other environments
 * presumably supporting Node.js (or a `global` namespace instead of `window`).
 * @private
 */
const RUNTIME = NODELIKE ? 'node' : (globalThis.hasOwnProperty('Deno') ? 'deno' : 'browser') // eslint-disable-line no-prototype-builtins

/**
 * The name of the operating system.
 * @readonly
 */
const OS = (RUNTIME === 'deno' ? globalThis.Deno.build.os : ((NODELIKE ? globalThis.process : globalThis.navigator).platform || 'unknown').toLowerCase())
// TODO: Once optional chaining is supported in minifiers,
// modify this to be globalThis.process?.platform || globalThis.navigator?.platform

/**
 * Identifies the operating system.
 * @readonly
 */
const PLATFORM = () => {
  if (OS.indexOf('ios') >= 0 || OS.indexOf('like mac')) {
    return 'ios'
  } else if (OS.indexOf('mac') >= 0) {
    return 'mac'
  } else if (OS.indexOf('darwin') >= 0) {
    return 'mac'
  } else if (OS.indexOf('win') >= 0) {
    return 'windows'
  } else if (OS.indexOf('android') >= 0) {
    return 'android'
  } else if (OS.indexOf('linux') >= 0) {
    return 'linux'
  }

  return 'unrecognized'
}

/**
 * The version of the platform/OS.
 */
const PLATFORM_RELEASE = async () => {
  return NODELIKE
    ? (await import('os')).release()
    : new Promise(resolve => resolve(RUNTIME === 'deno' ? 'unknown' : /\((.*)\)/i.exec(globalThis.navigator.userAgent)[1].split(';')[0].split(/\s+/i).pop()))
}

/**
 * The unique ID of the NGN instance.
 */
const REFERENCE_ID = Symbol(`NGN ${version}`)

/**
 * @event WARN_EVENT
 * This is an internal event used to emit warning
 * events to the NGN.LEDGER.
 */
const WARN_EVENT = Symbol('NGN.WARN')

/**
 * @event INFO_EVENT
 * This is an internal event used to emit info
 * events to the NGN.LEDGER.
 */
const INFO_EVENT = Symbol('NGN.INFO')

/**
 * @event ERROR_EVENT
 * This is an internal event used to emit error
 * events to the NGN.LEDGER.
 */
const ERROR_EVENT = Symbol('NGN.ERROR')

/**
 * @event INTERNAL_EVENT
 * This is an internal event used to emit internal
 * events to the NGN.LEDGER.
 */
const INTERNAL_EVENT = Symbol('NGN.INTERNAL')

const all = {
  RUNTIME,
  NODELIKE,
  OS,
  PLATFORM,
  PLATFORM_RELEASE,
  REFERENCE_ID,
  WARN_EVENT,
  INFO_EVENT,
  ERROR_EVENT,
  INTERNAL_EVENT
}

export {
  all as default,
  version,
  NODELIKE,
  RUNTIME,
  OS,
  PLATFORM,
  PLATFORM_RELEASE,
  REFERENCE_ID,
  WARN_EVENT,
  INFO_EVENT,
  ERROR_EVENT,
  INTERNAL_EVENT
}
