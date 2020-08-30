import test from 'tappedout'
import { EventEmitter } from 'ngn'

let ee

test('EventEmitter Advanced Feature Checks', t => {
  ee = new EventEmitter()

  // NGN-specific add-on methods
  t.ok(typeof ee.deprecate === 'function', 'NGN.EventEmitter.deprecate() method recognized.')
  t.ok(typeof ee.pool === 'function', 'NGN.EventEmitter.pool() method recognized.')
  t.ok(typeof ee.attach === 'function', 'NGN.EventEmitter.attach() method recognized.')
  t.ok(typeof ee.increaseMaxListeners === 'function', 'NGN.EventEmitter.increaseMaxListeners() method recognized.')
  t.ok(typeof ee.decreaseMaxListeners === 'function', 'NGN.EventEmitter.decreaseMaxListeners() method recognized.')
  t.ok(typeof ee.forward === 'function', 'NGN.EventEmitter.forward() method recognized.')
  t.ok(typeof ee.delayEmit === 'function', 'NGN.EventEmitter.delayEmit() method recognized.')
  t.ok(typeof ee.reduce === 'function', 'NGN.EventEmitter.reduce() method recognized.')
  t.ok(typeof ee.reduceOnce === 'function', 'NGN.EventEmitter.reduceOnce() method recognized.')
  t.ok(typeof ee.after === 'function', 'NGN.EventEmitter.after() method recognized.')
  t.ok(typeof ee.afterOnce === 'function', 'NGN.EventEmitter.afterOnce() method recognized.')

  t.end()
})

// If an event pool specifies a string instead of
// a function, the string is re-emitted (event forwarding).
test('pool() with forwarding', t => {
  ee = new EventEmitter()
  const count = 0

  ee.pool('test.', {
    a: function () {
      ee.emit('test.b', ...arguments)
    },

    b: 'done',
    c: {
      d: {
        e: 'fin.ish'
      }
    }
  })

  ee.once('done', payload => {
    t.pass('Event pool forwarding works.')
    t.ok(typeof payload === 'object' && payload.data, 'Forwarded events from a pool apply payloads.')
    ee.emit('test.c.d.e')
  })

  ee.once('fin.ish', () => {
    t.pass('Nested pooling events forwarded.')
    t.end()
  })

  ee.emit('test.a', { data: true })
})

test('attach()', t => {
  ee = new EventEmitter()

  ee.once('done', function () {
    t.pass('The attach method successfully re-emits a new event when a source event is triggered.')
    t.end()
  })

  ee.once('test', ee.attach('done'))
  ee.emit('test')
})

test('increase/decreaseMaxListeners()', t => {
  ee = new EventEmitter()
  const listenerCount = ee.maxListeners

  ee.decreaseMaxListeners()
  t.ok(listenerCount > ee.maxListeners, 'Max listener count successfully decreased.')

  ee.increaseMaxListeners()
  t.ok(listenerCount === ee.maxListeners, 'Max listener count successfully increased.')

  ee.increaseMaxListeners(5)
  t.ok((listenerCount + 5) === ee.maxListeners, 'Max listener count successfully increased by an order.')

  ee.decreaseMaxListeners(5)
  t.ok(listenerCount === ee.maxListeners, 'Max listener count successfully decreased by an order.')

  t.end()
})

test('forward()', t => {
  t.timeoutAfter(1000)

  ee = new EventEmitter()

  ee.once('done', function () {
    t.pass('The forward event was triggered by the source event.')
    t.end()
  })

  ee.forward('test', ['done'])
  ee.emit('test')
})

test('delayEmit()', t => {
  ee = new EventEmitter()

  let count = 0

  ee.once('done', function (payload) {
    t.ok(count === 1, 'The emit triggered after a slight delay.')
    t.ok(typeof payload === 'object' && payload.data, 'Original payload recognized.')
    t.end()
  })

  ee.delayEmit('done', 400, { data: true })
  ee.emit('done')

  count++
})

test('reduce()', t => {
  ee = new EventEmitter()

  ee.funnel(['a', 'b', 'c'], 'done', { data: true })

  ee.once('done', function (payload) {
    t.pass('The funnel method successfully fired after other events completed.')
    t.ok(ee.eventNames().length === 3, 'The funnel events are available for repeated use.')
    t.ok(typeof payload === 'object' && payload.data, 'The original funnel payload is passed to the triggered event handler.')

    ee.once('done', pload => {
      t.pass('The funnel was recognized repeatedly.')
      t.ok(ee.eventNames().length === 3, 'All of the intermediary event handlers remain intact across multiple uses.')
      t.ok(typeof pload === 'object' && pload.data, 'The original funnel payload is passed to the triggered event handler.')
      t.end()
    })

    ee.emit(['a', 'b', 'c'])
  })

  ee.emit('a')
  ee.delayEmit('b', 400)
  ee.delayEmit('c', 200)
})

// test('reduceOnce()', t => {
//   ee = new EventEmitter()

//   ee.funnelOnce(['a', 'b', 'c'], 'done', { data: true })

//   let count = 0
//   ee.on('done', function (payload) {
//     count++
//     if (count > 1) {
//       t.fail('funnelOnce final event is fired more than once.')
//       return t.end()
//     }

//     t.pass('The funnelOnce method successfully fired after other events completed.')
//     t.ok(ee.eventNames().length === 1, `Intermediary events are removed, with 1 of the event handlers still remaining (final event). (Recognized ${ee.eventNames().length})`)
//     t.ok(typeof payload === 'object' && payload.data, 'The original funnel payload is passed to the triggered event handler.')

//     ee.emit(['a', 'b', 'c'])
//     setTimeout(() => t.end(), 300)
//   })

//   ee.emit('a')
//   ee.delayEmit('b', 400)
//   ee.delayEmit('c', 200)
// })

test('relay()', t => {
  let ct = 0
  const emitterA = new EventEmitter()
  const emitterB = new EventEmitter()

  emitterA.relay('event', emitterB, 'my.', '.name')

  emitterB.on('my.event.name', () => { ct += 1 })
  emitterA.emit('event')
  emitterA.emit('event')

  setTimeout(function () {
    t.ok(ct === 2, `Relay established from one event emitter to another. Expected 2 events, recognized ${ct}.`)
    t.end()
  }, 300)
})

test('relayOnce()', t => {
  let ct = 0
  const emitterA = new EventEmitter()
  const emitterB = new EventEmitter()

  emitterA.relayOnce('event', emitterB, 'my.', '.name')

  emitterB.on('my.event.name', () => { ct += 1 })

  emitterA.emit('event')
  emitterA.emit('event')
  emitterA.emit('event')

  setTimeout(function () {
    t.ok(ct === 1, `Relay should only execute once. Executed ${ct} relay${ct !== 1 ? 's' : ''}.`)
    t.end()
  }, 300)
})

test('after()', t => {
  t.timeoutAfter(1000)

  ee = new EventEmitter()
  ee.after('a', 3, 'done')

  ee.once('done', function () {
    t.pass('The after method successfully fired after the predetermined number of event triggers.')
    t.ok(ee.eventNames().length === 1, 'All of the event handlers still exist.')

    ee.once('done', function () {
      t.pass('The after method successfully fired after the predetermined number of event triggers (AGAIN).')
      t.ok(ee.eventNames().length === 1, 'All of the event handlers still exist after another execution.')
      t.end()
    })

    ee.emit('a')
    ee.emit('a')
    ee.emit('a')
  })

  ee.emit('a')
  ee.emit('a')
  ee.delayEmit('a', 300)
})

test('afterOnce()', t => {
  t.timeoutAfter(1000)

  ee = new EventEmitter()
  ee.afterOnce('a', 3, 'done')

  ee.once('done', function () {
    t.pass('The afterOnce method successfully fired after the predetermined number of event triggers.')
    t.ok(ee.eventNames().length === 0, 'All of the event handlers were cleared.')
    t.end()
  })

  ee.emit('a')
  ee.emit('a')
  ee.delayEmit('a', 300)
})

test('deprecate()', t => {
  ee = new EventEmitter()

  ee.once('done', function () {
    t.pass('Replacement event triggered.')
    setTimeout(() => t.end(), 300)
  })

  ee.deprecate('test', 'done')
  ee.on('test', () => t.pass('Deprecated event triggered.'))
  ee.emit('test')
})
