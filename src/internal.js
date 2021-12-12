import { EventEmitter } from './emitter/emitter.js'
import { REFERENCE_ID, WARN_EVENT, INFO_EVENT, ERROR_EVENT, INTERNAL_EVENT, RUNTIME, version } from './constants.js'

// Expose a hidden attribute for dev tooling
const globalId = Symbol.for('NGN')
globalThis[REFERENCE_ID] = new Map()
globalThis[REFERENCE_ID].set('REFERENCE_ID', REFERENCE_ID)
globalThis[REFERENCE_ID].set('VERSION', version)

if (!globalThis[globalId]) {
  globalThis[globalId] = []
}

globalThis[globalId].push(REFERENCE_ID)

export const register = (key, value) => {
  if (key !== 'REFERENCE_ID' && key !== 'LEDGER' && key !== 'version') {
    // Disallow the override of an instance
    if (key === 'INSTANCE') {
      if (!globalThis[REFERENCE_ID].has('INSTANCE')) {
        globalThis[REFERENCE_ID].set(key, value)
      }

      return
    }

    const meta = globalThis[REFERENCE_ID].get(key) || new Map()
    meta.set(Symbol(key), value)
    globalThis[REFERENCE_ID].set(key, meta)
  }
}

export const plugins = new Proxy(globalThis[REFERENCE_ID], {
  get (target, property) {
    return !target.has('PLUGINS') ? undefined : target.get('PLUGINS').get(property)
  }
})

class LedgerEventEmitter extends EventEmitter {
  #events = new Map()

  /**
   * Create a custom ledger event type and reference method.
   *
   * ```
   * // Create the event type and method name
   * const [EXAMPLE_EVENT_TYPE, fireCustomEvent] = NGN.LEDGER.createEventType('Custom Event Name')
   *
   * // Listen for the new event type
   * NGN.LEDGER.on(EXAMPLE_EVENT_TYPE, function (payloadData) {
   *   console.log(`Event: "${this.event}"`)
   *   console.log(payloadData)
   * })
   *
   * // Emit an event to the ledger
   * fireCustomEvent('my.custom.event', { payload: 'data' })
   * ```
   * @param {string} eventName
   * Name of the event reference, such as `EXAMPLE_EVENT`.
   */
  registerEventType (eventName) {
    if (this.#events.has(eventName)) {
      throw new Error(`"${eventName}" already exists.`)
    }

    const CUSTOM_EVENT = Symbol(eventName)
    const emitterFn = function () {
      LEDGER_EVENT(CUSTOM_EVENT)(...arguments)
    }
    this.#events.set(eventName, emitterFn)

    return [CUSTOM_EVENT, emitterFn]
  }

  /**
   * @property {object} events
   * A collection of ledger events (built-in & custom)
   */
  get events () {
    return Object.assign({
      INFO_EVENT,
      WARN_EVENT,
      ERROR_EVENT,
      INTERNAL_EVENT
    }, Object.fromEntries(this.#events))
  }

  /**
   * @property {object} emitters
   * A collection of ledger event emitters (by event type).
   */
  get emitters () {
    const methods = { INFO, WARN, ERROR, INTERNAL }
    for (const [name, fn] of Object.entries(this.#events)) {
      methods[name] = fn
    }
    return methods
  }
}

export const LEDGER = new LedgerEventEmitter({
  name: 'NGN Ledger',
  description: 'A ledger of events, outputs, and information produced by the system.'
})

// This line goes after the Ledger is created,
// otherwise the register method is not invoked
// by the event emitter. Remember, this is a
// circular module.
globalThis[REFERENCE_ID].set('LEDGER', LEDGER)

// A generic wrapper to fire a background event.
export const LEDGER_EVENT = EVENT => function () {
  LEDGER.emit(EVENT, ...arguments)
}

/**
 * @method WARN
 * This method is used to emit special info events.
 * The NGN.BUS can listen for all events using the NGN.WARN global symbol.
 *
 * ```js
 * NGN.BUS.on(NGN.WARNING_EVENT, function () => {
 *   console.warn(...arguments)
 * })
 * ```
 *
 * See NGN.EventEmitter#emit for detailed parameter usage.
 * @private
 */
export const WARN = function () { LEDGER_EVENT(WARN_EVENT)(...arguments) }

/**
 * @method INFO
 * This method is used to emit special warning events.
 * The NGN.BUS can listen for all events using the NGN.INFO global symbol.
 *
 * ```js
 * NGN.BUS.on(NGN.INFO_EVENT, function () => {
 *   console.info(...arguments)
 * })
 * ```
 *
 * See NGN.EventEmitter#emit for detailed parameter usage.
 * @private
 */
export const INFO = function () { LEDGER_EVENT(INFO_EVENT)(...arguments) }

/**
 * @method ERROR
 * This method is used to emit special soft error events. A soft error
 * is one that does not throw, but does get logged (typically non-critical).
 * The NGN.BUS can listen for all events using the NGN.ERROR global symbol.
 *
 * ```js
 * NGN.BUS.on(NGN.ERROR_EVENT, function () => {
 *   console.info(...arguments)
 * })
 * ```
 *
 * See NGN.EventEmitter#emit for detailed parameter usage.
 * @private
 */
export const ERROR = function () { LEDGER_EVENT(ERROR_EVENT)(...arguments) }

/**
 * @method INTERNAL
 * This method is used to emit special soft internal events. An internal
 * event is typically used for keeping track of object states.
 * The NGN.BUS can listen for all events using the NGN.INTERNAL global symbol.
 *
 * ```js
 * NGN.BUS.on(NGN.INTERNAL_EVENT, 'some.name', function () => {
 *   console.info(...arguments)
 * })
 * ```
 *
 * See NGN.EventEmitter#emit for detailed parameter usage.
 * @private
 * @ignore
 */
export const INTERNAL = function () { LEDGER_EVENT(INTERNAL_EVENT)(...arguments) }

// Track all errors and warnings in the ledger
if (RUNTIME === 'node') {
  process.on('uncaughtException', e => {
    if (typeof e.OID === 'symbol') {
      ERROR(e)
    }
  })
  process.on('unhandledRejection', ERROR)
  process.on('warning', WARN)
} else if (globalThis.window !== undefined) {
  globalThis.window.addEventListener('error', ERROR)
  globalThis.window.addEventListener('unhandledrejection', ERROR)
}
