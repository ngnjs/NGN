import test from 'tappedout'
import { NGN, EventEmitter } from '/app/.dist//ngn/index.js'

let ee

test('EventEmitter Sanity Check', t => {
  ee = new EventEmitter()

  t.ok(typeof ee === 'object', `Instantiate an EventEmitter class. Expected a object, received ${typeof ee}`)
  t.ok(ee.name === 'Unknown', `A default emitter has an "Unknown" name. Received "${ee.name}".`)
  t.ok(ee.description === 'No description available.', `A default emitter has an "No description available." name. Received "${ee.description}".`)

  ee = new EventEmitter({
    name: 'Test Emitter',
    description: 'The unit test event emitter.'
  })
  t.ok(ee.name === 'Test Emitter', `A named event emitter called "Test Emitter" is recognized. Name is "${ee.name}".`)
  t.ok(ee.description === 'The unit test event emitter.', `A named event emitter respects custom descriptions. Expected "The unit test event emitter.". Received "${ee.description}".`)

  // Nodelike methods
  t.ok(typeof ee.addListener === 'function', 'EventEmitter.addListener() method recognized.')
  t.ok(typeof ee.addEventListener === 'function', 'EventEmitter.addEventListener() method recognized.')
  t.ok(typeof ee.removeListener === 'function', 'EventEmitter.removeListener() method recognized.')
  t.ok(typeof ee.emit === 'function', 'EventEmitter.emit() method recognized.')
  t.ok(typeof ee.eventNames === 'function', 'EventEmitter.eventNames() method recognized.')
  t.ok(typeof ee.getMaxListeners === 'function', 'EventEmitter.getMaxListeners() method recognized.')
  t.ok(typeof ee.setMaxListeners === 'function', 'EventEmitter.setMaxListeners() method recognized.')
  t.ok(typeof ee.listenerCount === 'function', 'EventEmitter.listenerCount() method recognized.')
  t.ok(typeof ee.listeners === 'function', 'EventEmitter.listeners() method recognized.')
  t.ok(typeof ee.on === 'function', 'EventEmitter.on() method recognized.')
  t.ok(typeof ee.once === 'function', 'EventEmitter.once() method recognized.')
  t.ok(typeof ee.prependListener === 'function', 'EventEmitter.prependListener() method recognized.')
  t.ok(typeof ee.prependOnceListener === 'function', 'EventEmitter.prependOnceListener() method recognized.')
  t.ok(typeof ee.removeAllListeners === 'function', 'EventEmitter.removeAllListeners() method recognized.')
  t.ok(typeof ee.clear === 'function', 'NGN.EventEmitter.clear() method recognized.')
  t.ok(typeof ee.off === 'function', 'NGN.EventEmitter.off() method recognized.')

  t.end()
})

test('Basic Event: on()', t => {
  t.timeoutAfter(1000)
  ee = new EventEmitter()

  let count = 0
  ee.on('test', payload => {
    count++
    if (count === 2) {
      t.pass('Handler triggered on every emission.')
      t.ok(payload.data === 'test', 'EventEmitter.once() receives payload.')
      return t.end()
    }

    t.ok(!payload, 'Event handlers triggered without a payload.')
    ee.emit('tester') // Make sure a similar event doesn't trigger the handler again.
    ee.emit('test', { data: 'test' })
  })

  ee.emit('test')
})

test('Remove Event: off()', t => {
  t.timeoutAfter(1000)
  ee = new EventEmitter()

  let timer
  const handler = function (payload) {
    clearTimeout(timer)
    t.fail('One-time event triggered even though it was supposed to be removed.')
    t.end()
  }

  ee.on('test_again', handler)
  ee.off('test_again', handler)
  ee.emit('test_again', { data: 'testing' })

  timer = setTimeout(function () {
    t.pass('One-time event removed from event listener queue.')
    t.end()
  }, 400)
})

test('One-time Event: once()', t => {
  t.timeoutAfter(1000)
  ee = new EventEmitter()

  let count = 0
  ee.once('test', payload => {
    count++
    ee.emit('test')

    if (count > 1) {
      t.fail('One-time event triggered more than once.')
      return t.end()
    }

    t.pass('EventEmitter.once() handler triggered on event.')
    t.ok(payload.data === 'test', 'EventEmitter.once() receives payload.')
    t.end()
  })

  ee.emit('test', { data: 'test' })
})

test('Wildcard Listener', t => {
  t.timeoutAfter(1000)
  ee = new EventEmitter()

  let ct = 0

  ee.on('test.*', function () { ct += 1 })
  ee.once('testing.*', function () { ct += 1 })

  t.ok(ee.eventNames().length === 2, `Correctly registered wildcard events. Expected 2, received ${ee.eventNames().length}`)

  ee.emit('test.a')
  ee.emit('test.b')
  ee.emit('testing.something')

  setTimeout(function () {
    t.ok(ct === 3, `Fired 3 events, recognized ${ct}.`)
    t.ok(ee.eventNames().length === 1, 'Standard and adhoc events triggered and removed appropriately.')

    ee.off('test.*')
    t.ok(ee.eventNames().length === 0, 'Removed wildcard events successfully.')

    t.end()
  }, 500)
})

test('Clear Events', t => {
  t.timeoutAfter(1000)
  ee = new EventEmitter()

  ee.on('test', () => { })
  ee.on('test1', () => { })
  ee.on('test2', () => { })
  ee.on('test3', () => { })
  ee.on('test3', () => { console.log('yo') })

  ee.clear('test3')
  t.ok(ee.eventNames().length === 3, 'All named events successfully removed.')

  ee.clear('test1', 'test2')
  t.ok(ee.eventNames().length === 1, 'Multiple named events successfully removed.')

  ee.clear()
  t.ok(ee.eventNames().length === 0, 'All events successfully removed.')

  t.end()
})

test('Expiration: Single Event Handler', t => {
  t.timeoutAfter(1000)
  ee = new EventEmitter()

  let ct = 0

  ee.on('ttl.test', () => ct += 1, 300)

  setTimeout(() => {
    t.ok(ct === 1, 'Successfully removed event handler after TTL elapsed.')
    t.end()
  }, 900)

  ee.emit('ttl.test')
  setTimeout(() => ee.emit('ttl.test'), 600)
})

test('Expiration: All Handlers', t => {
  t.timeoutAfter(1000)
  ee = new EventEmitter()

  ee.TTL = 0
  t.ok(ee.TTL === -1, 'Setting TTL to 0 fails')

  ee.TTL = 300

  let ct = 0

  ee.on('ttl.test', () => ct += 1)

  setTimeout(() => {
    ee.TTL = -1
    t.ok(ct === 1, 'Successfully removed event handler after TTL elapsed.')
    t.end()
  }, 900)

  ee.emit('ttl.test')
  setTimeout(() => ee.emit('ttl.test'), 600)
})

test('Multievent Emission Capability', function (t) {
  ee = new EventEmitter()

  let ct = 0

  ee.on('test.a', () => ct += 1)
  ee.on('test.b', () => ct += 1)
  ee.once('done', function () {
    t.ok(ct === 2, 'The correct number of events were triggered.')
    t.end()
  })

  ee.emit(['test.a', 'test.b'])
  setTimeout(() => ee.emit('done'), 300)
})

test('Multievent Handling Capability', function (t) {
  ee = new EventEmitter()
  let ct = 0

  // The TTL and prepend arguments provided are unnecessary for
  // testing, but are necessary for code-coverage.
  ee.on(['test.a', 'test.b'], () => { ct += 1 }, 1000, true)

  ee.once('done', function () {
    t.ok(ct === 2, 'The correct number of events were triggered.')
    t.end()
  })

  ee.emit('test.a')
  ee.emit('test.b')
  setTimeout(() => ee.emit('done'), 300)
})

test('Multievent Handling Capability (One-time events)', function (t) {
  ee = new EventEmitter()

  let ct = 0

  // The TTL and prepend arguments provided are unnecessary for
  // testing, but are necessary for code-coverage.
  ee.once(['test.a', 'test.b'], () => { ct += 1 }, 1000, true)
  ee.once('done', function () {
    t.ok(ct === 2, 'The correct number of events were triggered.')
    t.end()
  })

  ee.emit('test.a')
  ee.emit('test.b')
  setTimeout(() => ee.emit('done'), 300)
})

test('EventEmitter Special Cases', function (t) {
  ee = new EventEmitter()

  const handler = console.log('')

  // Removing multiple events simultaneously
  ee.on('a', () => handler)
  ee.on('b', () => handler)

  if (ee.eventNames().length !== 2) {
    t.fail('Failed to add all events.')
  }

  ee.off(['a', 'b'])
  t.ok(ee.eventNames().length === 0, `Successfully removed events via array (no handler). Expected no handlers, recognized ${ee.eventNames().length}.`)

  // Removing multiple events with the specified event handler
  ee.on('a.*', () => handler)
  ee.on('b.*', () => handler)

  if (ee.eventNames().length !== 2) {
    t.fail('Failed to add all events.')
  }

  ee.off(['a.*', 'b.*'], handler)

  t.ok(ee.eventNames().length === 0, 'Successfully removed events via array (with handler).')

  t.end()
})

test('NGN.BUS Special Events', t => {
  NGN.LEDGER.once(NGN.WARN_EVENT, function () {
    t.pass('NGN.WARNING_EVENT recognized')
    NGN.INFO('message')
  })

  NGN.LEDGER.once(NGN.INFO_EVENT, function () {
    t.pass('NGN.INFO_EVENT recognized')
    NGN.ERROR('message')
  })

  NGN.LEDGER.once(NGN.ERROR_EVENT, function () {
    t.pass('NGN.ERROR_EVENT recognized')
    NGN.INTERNAL('internal.message')
  })

  NGN.LEDGER.once(NGN.INTERNAL_EVENT, function () {
    t.pass('NGN.INTERNAL_EVENT recognized')
    t.end()
  })

  NGN.WARN('message')
})

test('pool()', t => {
  ee = new EventEmitter()
  let count = 0

  ee.pool('test.', {
    a: function (payload) {
      count++

      if (count === 2) {
        t.pass('Handler triggered on scoped event pool emissions.')
        return ee.emit('test.c')
      }

      ee.emit('test.b')
    },

    b: function () {
      ee.emit('test.a')
    },

    c: function () {
      t.pass('Handler triggered on pooled event emissions.')
      ee.clear()
      t.end()
    }
  })

  t.ok(ee.eventNames().length === 3, 'Correct number of events added using a prefixed pool.')

  ee.emit('test.a')
})

test('pool() w/nesting', t => {
  ee = new EventEmitter()
  let count = 0

  ee.pool({
    test: {
      a: function (payload) {
        count++

        if (count === 2) {
          t.pass('Handler triggered on unprefixed scoped event pool emissions.')
          return ee.emit('test.c')
        }

        ee.emit('test.b')
      },

      b: function () {
        ee.emit('test.a')
      },

      c: function () {
        t.pass('Handler triggered on pooled event emissions.')
        ee.clear()
        t.end()
      }
    }
  })

  t.ok(ee.eventNames().length === 3, 'Correct number of events added using a nested pool.')

  ee.emit('test.a')
})

test('pool() w/callback', t => {
  ee = new EventEmitter()
  let count = 0

  ee.pool({
    test: {
      a: function (payload) {
        count++

        if (count === 2) {
          t.pass('Handler triggered on unprefixed scoped event pool emissions.')
          return ee.emit('test.c')
        }

        ee.emit('test.b')
      },

      b: function () {
        ee.emit('test.a')
      },

      c: function () {
        t.pass('Handler triggered on pooled event emissions.')
        ee.clear()
        t.end()
      }
    }
  })

  t.ok(ee.eventNames().length === 3, 'Correct number of events added using a nested pool.')

  ee.emit('test.a')
})
