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
      t.fail('One-time event triggered even though it was removed.')
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
    this.timeout(1500)

    let count = 0

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
