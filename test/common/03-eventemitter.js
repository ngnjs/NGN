const test = require('tape')
const Tasks = require('shortbus')

// Remember to run `npm run test:build` before executing,
// otherwise the lib directory will not exist.

require('../lib/core')
require('../lib/eventemitter')

test('NGN.EventEmitter Sanity Checks', function (t) {
  t.ok(NGN.EventEmitter !== undefined, 'NGN.EventEmitter exists')
  t.ok(NGN.BUS !== undefined, 'NGN.BUS exists')

  // Nodelike methods
  t.ok(typeof NGN.BUS.addListener === 'function', 'NGN.EventEmitter.addListener() method recognized.')
  t.ok(typeof NGN.BUS.removeListener === 'function', 'NGN.EventEmitter.removeListener() method recognized.')
  t.ok(typeof NGN.BUS.emit === 'function', 'NGN.EventEmitter.emit() method recognized.')
  t.ok(typeof NGN.BUS.eventNames === 'function', 'NGN.EventEmitter.eventNames() method recognized.')
  t.ok(typeof NGN.BUS.getMaxListeners === 'function', 'NGN.EventEmitter.getMaxListeners() method recognized.')
  t.ok(typeof NGN.BUS.setMaxListeners === 'function', 'NGN.EventEmitter.setMaxListeners() method recognized.')
  t.ok(typeof NGN.BUS.listenerCount === 'function', 'NGN.EventEmitter.listenerCount() method recognized.')
  t.ok(typeof NGN.BUS.listeners === 'function', 'NGN.EventEmitter.listeners() method recognized.')
  t.ok(typeof NGN.BUS.on === 'function', 'NGN.EventEmitter.on() method recognized.')
  t.ok(typeof NGN.BUS.once === 'function', 'NGN.EventEmitter.once() method recognized.')
  t.ok(typeof NGN.BUS.prependListener === 'function', 'NGN.EventEmitter.prependListener() method recognized.')
  t.ok(typeof NGN.BUS.prependOnceListener === 'function', 'NGN.EventEmitter.prependOnceListener() method recognized.')
  t.ok(typeof NGN.BUS.removeAllListeners === 'function', 'NGN.EventEmitter.removeAllListeners() method recognized.')

  // NGN-specific add-on methods
  t.ok(typeof NGN.BUS.clear === 'function', 'NGN.EventEmitter.clear() method recognized.')
  t.ok(typeof NGN.BUS.off === 'function', 'NGN.EventEmitter.off() method recognized.')
  t.ok(typeof NGN.BUS.deprecate === 'function', 'NGN.EventEmitter.deprecate() method recognized.')
  t.ok(typeof NGN.BUS.pool === 'function', 'NGN.EventEmitter.pool() method recognized.')
  t.ok(typeof NGN.BUS.attach === 'function', 'NGN.EventEmitter.attach() method recognized.')
  t.ok(typeof NGN.BUS.increaseMaxListeners === 'function', 'NGN.EventEmitter.increaseMaxListeners() method recognized.')
  t.ok(typeof NGN.BUS.decreaseMaxListeners === 'function', 'NGN.EventEmitter.decreaseMaxListeners() method recognized.')
  t.ok(typeof NGN.BUS.forward === 'function', 'NGN.EventEmitter.forward() method recognized.')
  t.ok(typeof NGN.BUS.delayEmit === 'function', 'NGN.EventEmitter.delayEmit() method recognized.')
  t.ok(typeof NGN.BUS.funnel === 'function', 'NGN.EventEmitter.funnel() method recognized.')
  t.ok(typeof NGN.BUS.funnelOnce === 'function', 'NGN.EventEmitter.funnelOnce() method recognized.')
  t.ok(typeof NGN.BUS.threshold === 'function', 'NGN.EventEmitter.threshold() method recognized.')
  t.ok(typeof NGN.BUS.thresholdOnce === 'function', 'NGN.EventEmitter.thresholdOnce() method recognized.')

  t.end()
})

test('NGN.EventEmitter Basic Events', function (t) {
  let tasks = new Tasks()

  tasks.add('clear()', function (next) {
    NGN.BUS.on('test', () => {})
    NGN.BUS.on('test1', () => {})
    NGN.BUS.on('test2', () => {})
    NGN.BUS.on('test3', () => {})
    NGN.BUS.on('test3', () => { console.log('yo') })

    NGN.BUS.clear('test3')
    t.ok(NGN.BUS.eventNames().length === 3, 'All named events successfully removed.')

    NGN.BUS.clear('test1', 'test2')
    t.ok(NGN.BUS.eventNames().length === 1, 'Multiple named events successfully removed.')

    NGN.BUS.clear()
    t.ok(NGN.BUS.eventNames().length === 0, 'All events successfully removed.')

    next()
  })

  tasks.add('once()', function (next) {
    this.timeout(1000)

    let count = 0

    NGN.BUS.once('testonce', function (payload) {
      count++

      if (count > 1) {
        t.fail('One-time event triggered more than once.')
        return
      }

      t.pass('NGN.EventEmitter.once() handler triggered on event.')
      t.ok(payload.data === 'test', 'NGN.EventEmitter.once() receives payload.')

      next()
    })

    NGN.BUS.emit('testonce', {data: 'test'})
  })

  tasks.add('off() - adhoc', function (next) {
    this.timeout(1000)

    let handlerFn = function (payload) {
      t.fail('One-time event triggered even though it was supposed to be removed.')
      next()
    }

    NGN.BUS.once('testonce_again', handlerFn)
    NGN.BUS.off('testonce_again', handlerFn)
    NGN.BUS.emit('testonce_again', {data: 'testing'})

    setTimeout(function () {
      t.pass('One-time event removed from event listener queue.')
      next()
    }, 400)
  })

  tasks.add('on()', function (next) {
    this.timeout(1000)

    let count = 0

    NGN.BUS.on('test', function (payload) {
      count++

      if (count === 2) {
        t.pass('Handler triggered on every emission.')
        t.ok(payload.data === 'test', 'NGN.EventEmitter.once() receives payload.')
        return next()
      }

      NGN.BUS.emit('test', {data: 'test'})
    })

    NGN.BUS.emit('test', {data: 'test'})
  })

  tasks.add('pool()', function (next) {
    NGN.BUS.clear()

    var count = 0

    NGN.BUS.pool('test.', {
      a: function (payload) {
        count++

        if (count === 2) {
          t.pass('Handler triggered on scoped event pool emissions.')
          return NGN.BUS.emit('test.c')
        }

        NGN.BUS.emit('test.b')
      },

      b: function () {
        NGN.BUS.emit('test.a')
      },

      c: function () {
        t.pass('Handler triggered on pooled event emissions.')
        NGN.BUS.clear()
        next()
      }
    })

    t.ok(NGN.BUS.eventNames().length === 3, 'Correct number of events added using a prefixed pool.')

    NGN.BUS.emit('test.a')
  })

  tasks.add('pool() w/nesting', function (next) {
    NGN.BUS.clear()

    var count = 0

    NGN.BUS.pool({
      test: {
        a: function (payload) {
          count++

          if (count === 2) {
            t.pass('Handler triggered on unprefixed scoped event pool emissions.')
            return NGN.BUS.emit('test.c')
          }

          NGN.BUS.emit('test.b')
        },

        b: function () {
          NGN.BUS.emit('test.a')
        },

        c: function () {
          t.pass('Handler triggered on pooled event emissions.')
          NGN.BUS.clear()
          next()
        }
      }
    })

    t.ok(NGN.BUS.eventNames().length === 3, 'Correct number of events added using a nested pool.')

    NGN.BUS.emit('test.a')
  })

  tasks.add('pool() w/callback', function (next) {
    NGN.BUS.clear()

    var count = 0

    NGN.BUS.pool({
      test: {
        a: function (payload) {
          count++

          if (count === 2) {
            t.pass('Handler triggered on unprefixed scoped event pool emissions.')
            return NGN.BUS.emit('test.c')
          }

          NGN.BUS.emit('test.b')
        },

        b: function () {
          NGN.BUS.emit('test.a')
        },

        c: function () {
          t.pass('Handler triggered on pooled event emissions.')
          NGN.BUS.clear()
          next()
        }
      }
    })

    t.ok(NGN.BUS.eventNames().length === 3, 'Correct number of events added using a nested pool.')

    NGN.BUS.emit('test.a')
  })

  tasks.add('attach()', function (next) {
    NGN.BUS.once('done', function () {
      t.pass('The attach method successfully re-emits a new event when a source event is triggered.')
      next()
    })

    NGN.BUS.once('test', NGN.BUS.attach('done'))

    NGN.BUS.emit('test')
  })

  tasks.add('increase/decreaseMaxListeners()', function (next) {
    const listenerCount = NGN.BUS.getMaxListeners()

    NGN.BUS.decreaseMaxListeners()
    t.ok(listenerCount > NGN.BUS.getMaxListeners(), 'Max listener count successfully decreased.')

    NGN.BUS.increaseMaxListeners()
    t.ok(listenerCount === NGN.BUS.getMaxListeners(), 'Max listener count successfully increased.')

    NGN.BUS.increaseMaxListeners(5)
    t.ok((listenerCount + 5) === NGN.BUS.getMaxListeners(), 'Max listener count successfully increased by an order.')

    NGN.BUS.decreaseMaxListeners(5)
    t.ok(listenerCount === NGN.BUS.getMaxListeners(), 'Max listener count successfully decreased by an order.')

    next()
  })

  tasks.add('forward()', function (next) {
    this.timeout(1000)

    NGN.BUS.clear()

    NGN.BUS.once('done', function () {
      t.pass('The forward event was triggered by the source event.')
      next()
    })

    NGN.BUS.forward('test', ['done'])

    NGN.BUS.emit('test')
  })

  tasks.add('delayEmit()', function (next) {
    var count = 0

    NGN.BUS.once('done', function () {
      t.ok(count === 1, 'The emit triggered after a slight delay.')
      next()
    })

    NGN.BUS.delayEmit('test', 400)

    count++
  })

  tasks.add('funnel()', function (next) {
    NGN.BUS.clear()

    NGN.BUS.funnel(['a', 'b', 'c'], 'done')

    NGN.BUS.once('done', function () {
      t.pass('The funnel method successfully fired after other events completed.')
      t.ok(NGN.BUS.eventNames().length === 3, 'All of the event handlers still exist.')

      NGN.BUS.clear()

      next()
    })

    NGN.BUS.emit('a')
    NGN.BUS.delayEmit('b', 400)
    NGN.BUS.delayEmit('c', 200)
  })

  tasks.add('funnelOnce()', function (next) {
    NGN.BUS.clear()

    NGN.BUS.funnelOnce(['a', 'b', 'c'], 'done')

    NGN.BUS.once('done', function () {
      t.pass('The funnelOnce method successfully fired after other events completed.')
      t.ok(NGN.BUS.eventNames().length === 0, 'All of the event handlers are removed upon completion.')

      next()
    })

    NGN.BUS.emit('a')
    NGN.BUS.delayEmit('b', 400)
    NGN.BUS.delayEmit('c', 200)
  })

  tasks.add('relay()', function (next) {
    var ct = 0
    var emitterA = new NGN.EventEmitter()
    var emitterB = new NGN.EventEmitter()

    emitterA.relay('event', emitterB, 'my.', '.name')

    emitterB.on('my.event.name', function () {
      ct += 1
    })

    emitterA.emit('event')
    emitterA.emit('event')

    setTimeout(function () {
      t.ok(ct === 2, 'Relayed established from one event emitter to another.')
      next()
    }, 500)
  })

  tasks.add('relayOnce()', function (next) {
    var ct = 0
    var emitterA = new NGN.EventEmitter()
    var emitterB = new NGN.EventEmitter()

    emitterA.relayOnce('event', emitterB, 'my.', '.name')

    emitterB.on('my.event.name', function () {
      ct += 1
    })

    emitterA.emit('event')
    emitterA.emit('event')
    emitterA.emit('event')

    setTimeout(function () {
      t.ok(ct === 1, 'Relay only executed once.')
      next()
    }, 500)
  })

  tasks.add('threshold()', function (next) {
    this.timeout(1000)

    NGN.BUS.clear()
    NGN.BUS.threshold('a', 3, 'done')

    NGN.BUS.once('done', function () {
      t.pass('The threshold method successfully fired after the predetermined number of event triggers.')
      t.ok(NGN.BUS.eventNames().length === 1, 'All of the event handlers still exist.')

      next()
    })

    NGN.BUS.emit('a')
    NGN.BUS.emit('a')
    NGN.BUS.delayEmit('a', 300)
  })

  tasks.add('thresholdOnce()', function (next) {
    this.timeout(1000)

    NGN.BUS.clear()
    NGN.BUS.thresholdOnce('a', 3, 'done')

    NGN.BUS.once('done', function () {
      t.pass('The threshold method successfully fired after the predetermined number of event triggers.')
      t.ok(NGN.BUS.eventNames().length === 0, 'All of the event handlers still exist.')

      next()
    })

    NGN.BUS.emit('a')
    NGN.BUS.emit('a')
    NGN.BUS.delayEmit('a', 300)
  })

  tasks.add('deprecate()', function (next) {
    NGN.BUS.once('done', function () {
      t.pass('Replacement event triggered.')
      setTimeout(next, 100)
    })

    NGN.BUS.deprecate('test', 'done')

    NGN.BUS.on('test', function () {
      t.pass('Deprecated event triggered.')
    })

    NGN.BUS.emit('test')
  })

  tasks.on('complete', function () {
    t.end()
  })

  tasks.on('steptimeout', function (step) {
    t.fail(step + ' timed out.')
    t.end()
  })

  tasks.run(true)
})

test('Multievent Emission Capability', function (t) {
  NGN.BUS.clear()

  let ct = 0

  NGN.BUS.on('test.a', function () {
    ct += 1
  })

  NGN.BUS.on('test.b', function () {
    ct += 1
  })

  NGN.BUS.once('done', function () {
    t.ok(ct === 2, 'The correct number of events were triggered.')
    t.end()
  })

  NGN.BUS.emit(['test.a', 'test.b'])
  NGN.BUS.delayEmit('done', 300)
})

test('Multievent Handling Capability', function (t) {
  NGN.BUS.clear()

  let ct = 0

  // The TTL and prepend arguments provided are unnecessary for
  // testing, but are necessary for code-coverage.
  NGN.BUS.on(['test.a', 'test.b'], function () {
    ct += 1
  }, 1000, true)

  NGN.BUS.once('done', function () {
    t.ok(ct === 2, 'The correct number of events were triggered.')
    t.end()
  })

  NGN.BUS.emit('test.a')
  NGN.BUS.emit('test.b')
  NGN.BUS.delayEmit('done', 300)
})

test('Multievent Handling Capability (One-time events)', function (t) {
  NGN.BUS.clear()

  let ct = 0

  // The TTL and prepend arguments provided are unnecessary for
  // testing, but are necessary for code-coverage.
  NGN.BUS.once(['test.a', 'test.b'], function () {
    ct += 1
  }, 1000, true)

  NGN.BUS.once('done', function () {
    t.ok(ct === 2, 'The correct number of events were triggered.')
    t.end()
  })

  NGN.BUS.emit('test.a')
  NGN.BUS.emit('test.b')
  NGN.BUS.delayEmit('done', 300)
})

test('EventEmitter TTL Capability (All Events)', function (t) {
  NGN.BUS.clear()
  NGN.BUS.setTTL(0)

  t.ok(NGN.BUS.META.defaultTTL === -1, 'Setting TTL to 0 fails')

  NGN.BUS.setTTL(300)

  let ct = 0

  NGN.BUS.on('ttl.test', function () {
    ct += 1
  })

  setTimeout(() => {
    NGN.BUS.setTTL(-1)
    t.ok(ct === 1, 'Successfully removed event handler after TTL elapsed.')
    t.end()
  }, 900)

  NGN.BUS.emit('ttl.test')
  NGN.BUS.delayEmit('ttl.test', 600)
})

test('EventEmitter TTL Capability (Individual Events)', function (t) {
  NGN.BUS.clear()

  let ct = 0

  NGN.BUS.on('ttl.test', function () {
    ct += 1
  }, 300)

  setTimeout(() => {
    t.ok(ct === 1, 'Successfully removed event handler after TTL elapsed.')
    t.end()
  }, 900)

  NGN.BUS.emit('ttl.test')
  NGN.BUS.delayEmit('ttl.test', 600)
})

test('Wilcard Support', function (t) {
  NGN.BUS.clear()

  var ct = 0

  NGN.BUS.on('test.*', function () {
    console.log('test.* triggered by ', this.event)
    ct += 1
  })
  NGN.BUS.once('testing.*', function () {
    console.log('testing.* triggered by ', this.event)
    ct += 1
  })

  t.ok(NGN.BUS.eventNames().length === 2, 'Correctly registered wildcard events.')

  NGN.BUS.emit('test.a')
  NGN.BUS.emit('test.b')
  NGN.BUS.emit('testing.something')

  setTimeout(function () {
console.log(ct)
    t.ok(ct === 3, 'Fired the correct number of events.')
    t.ok(NGN.BUS.eventNames().length === 1, 'Standard and adhoc events triggered and removed appropriately.')

    NGN.BUS.off('test.*')
    t.ok(NGN.BUS.eventNames().length === 0, 'Removed wildcard events successfully.')

    t.end()
  }, 500)
})

test('EventEmitter Special Cases', function (t) {
  NGN.BUS.clear()

  var handler = console.log('')

  // Removing multiple events simultaneously
  NGN.BUS.on('a', () => handler)
  NGN.BUS.on('b', () => handler)

  if (NGN.BUS.eventNames().length !== 2) {
    t.fail('Failed to add all events.')
  }

  NGN.BUS.off(['a', 'b'])

  t.ok(NGN.BUS.eventNames().length === 0, 'Successfully removed events via array (no handler).')

  // Removing multiple events with the specified event handler
  NGN.BUS.on('a.*', () => handler)
  NGN.BUS.on('b.*', () => handler)

  if (NGN.BUS.eventNames().length !== 2) {
    t.fail('Failed to add all events.')
  }

  NGN.BUS.off(['a.*', 'b.*'], handler)

  t.ok(NGN.BUS.eventNames().length === 0, 'Successfully removed events via array (with handler).')

  t.end()
})
