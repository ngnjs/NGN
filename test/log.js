'use strict'

var test = require('tape')

require('../')

test('Custom Logging', function (t) {
  // Sanity checks
  t.ok(console.debug !== undefined, 'console.debug() exists.')
  t.ok(console.level !== undefined, 'console.level() exists.')
  t.ok(console.io !== undefined, 'console.io() exists.')
  t.ok(typeof NGN.Log.createMethod === 'function', 'Method for decorating console exists.')
  t.ok(typeof NGN.Log.write === 'function', 'Method for writing to stdout exists.')
  t.ok(typeof NGN.Log.on === 'function', 'NGN.Log object can handle events.')

  // Functional Checks
  NGN.Log.once('logevent', function (evt) {
    NGN.Log.disable()
    t.ok(true, 'Log event captured.')
    t.ok(typeof evt === 'object', 'logevent emits a payload.')
    t.ok(evt.name !== undefined, 'logevent payload has a name attribute.')
    t.ok(evt.data !== undefined, 'logevent payload has a data attribute.')
    t.ok(evt.name === 'log', 'logevent emitted with proper name.')
    t.ok(evt.data === 'test', 'logevent emitted with proper data.')

    NGN.Log.once('enabled', function () {
      t.ok(NGN.Log.enabled, 'NGN.Log enabled successfully.')

      NGN.Log.createMethod('critical', function () {
        console.level('critical').log.apply(this, arguments)
      })

      t.ok(console.critical !== undefined, 'Successfully added a custom logging method (critical).')

      NGN.Log.disable()
//      NGN.Log.level = ['critical', 'error']
//
//      NGN.Log.once('info', function () {
//        t.fail('Failed to filter properly.')
//      })
//
//      NGN.Log.once('critical', function () {
//        NGN.Log.disable()
//      })
//
//      console.info('generic info')
//      console.critical('crtical test')
    })

    NGN.Log.once('disabled', function () {
      t.end()
    })

    NGN.Log.enable()
  })

  NGN.Log.enable()
  console.log('test')
})
