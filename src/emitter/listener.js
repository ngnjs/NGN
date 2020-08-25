import Core from '../class.js'

export default class EventListener extends Core {
  #event
  #maxListeners
  #handlers = new Map()
  #once = new Set()
  #dynamic = false
  #flush
  #expire

  constructor (eventName, maxListeners = 25) {
    if (!eventName) {
      throw new TypeError('EventListener must be provided with an event name to listen for.')
    }

    super({
      name: eventName,
      description: 'Event listener.'
    })

    this.#event = eventName
    this.#maxListeners = maxListeners
    this.#dynamic = eventName instanceof RegExp || (typeof eventName === 'string' && eventName.indexOf('*') >= 0)

    // Object.defineProperty(this, 'execute', base.privateconstant.value(function (event) {
    // }))

    this.register('EventHandler', this)
  }

  execute (event) {
    const scope = {
      event,
      get emitter () {
        return this.parent
      }
    }

    const args = Array.from(arguments).slice(1)
    const me = this

    this.#handlers.forEach((handler, oid) => {
      const fn = handler

      if (me.#once.has(oid)) {
        me.#handlers.delete(oid)
        me.#once.delete(oid)
      }

      if (me.size === 0) {
        me.#flush()
      }

      scope.handler = fn
      scope.remove = () => me.remove(oid)

      try {
        fn.apply(scope, args)
      } catch (e) {
        console.log(e.message)
        console.log((new Error()).stack)
        console.log(fn.toString())
      }
    })
  }

  get dynamic () {
    return this.#dynamic
  }

  get size () {
    return this.#handlers.size
  }

  set maxListeners (value) {
    this.#maxListeners = value
  }

  // Add a listener. Returns an ID (Symbol) that can
  // be used to reference the specific handler.
  add (handler, prepend = false, ttl = null) {
    if (typeof handler !== 'function') {
      console.log(arguments)
      throw new TypeError(`The ${typeof handler} argument (${handler.toString()}) provided as a "${this.name}" event handler must be a function.`)
    }

    const OID = Symbol(this.#event.toString())

    if (prepend) {
      this.#handlers = new Map([...[[OID, handler]], ...this.#handlers])
    } else {
      this.#handlers.set(OID, handler)
    }

    if (this.#handlers.size > this.#maxListeners) {
      throw new RangeError(`Maximum call stack exceeeded (${this.parent.name} emitter limit ${this.#maxListeners}).`)
    }

    // Activate a timer if TTL is set.
    if (!isNaN(ttl) && ttl > 0) {
      setTimeout(() => this.remove(OID), ttl)
    }

    return OID
  }

  // Insert or update a handlers
  // upsert (oid, handler) {
  //   this.#handlers.set(oid, handler)
  // }

  // has (oid) {
  //   return this.#handlers.has(oid)
  // }

  // Remove a specific handler or all handlers.
  remove (handler) {
    const type = typeof handler

    if (type === 'symbol') {
      this.#handlers.delete(handler)
    } else if (type === 'function') {
      this.#handlers.forEach((value, id) => {
        if (value === handler) {
          this.#handlers.delete(id)
        }
      })
    } else {
      this.#handlers = new Map()
    }

    if (this.size === 0) {
      this.#flush()
    }
  }

  // Run the handlers
  run () {
    this.execute(this.#event, ...arguments)
  }

  // Specify a particular handler as a one-time handler
  once (oid) {
    this.#once.add(oid)
  }

  set flush (fn) {
    this.#flush = fn
  }
}
