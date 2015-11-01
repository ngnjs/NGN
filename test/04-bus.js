'use strict'

let test = require('tape')
let rpc_port = parseInt(process.env.RPC_PORT || 47911, 10) + 3

require('../')
NGN.Log.disable()
NGN.BUS.disableRemote()

test('BUS:', function (t) {
  t.ok(typeof NGN.BUS === 'object', 'NGN.BUS exists.')

  // 1. Mimic the Bridge app
  let server = new NGN.rpc.Server({
    host: 'localhost',
    port: rpc_port,
    expose: {
      testing: {
        echo: function (txt, callback) {
          callback(null, txt)
        }
      }
    }
  })

  // 2. When the "Bridge" is ready, connect the BUS
  server.once('ready', function () {
    NGN.BUS.connect('127.0.0.1:' + rpc_port)

    // 3. When the BUS is ready, it's safe to disconnect
    NGN.BUS.once('enabled', function () {
      t.ok(NGN.BUS.connected, 'NGN.BUS successfully enabled.')

      // 6. When the BUS disconnects, close the bridge.
      NGN.BUS.once('disconnect', function () {
        t.pass('NGN.BUS disconnected from remote system successfully.')
        server.stop()
      })

      NGN.BUS.disconnect()
    })

    // 4. After the BUS is disabled, re-enable it.
    NGN.BUS.enableRemote()
  })

  // 7. When the bridge is closed, run additional tests
  server.once('stop', function () {
    NGN.BUS.once('trigger', function () {
      t.pass('Basic event handling and attaching is supported.')
      NGN.BUS.emit('test.a')
    })

    NGN.BUS.pool('test.', {
      a: function () {
        t.pass('Event pooling works.')
        NGN.BUS.emit('test.b', {payload: 'test'})
      },
      b: function (data) {
        t.ok(data.payload === 'test', 'Event pool successfully provides data.')
        NGN.BUS.bind('binder', ['b.1', 'b.2'], {payload: 'test2'})
        NGN.BUS.emit('binder')

        setTimeout(function () {
          t.ok(bindtest === 2, 'Correct number of events fired with bind().')
          t.end()
        }, 500)
      }
    })

    let bindtest = 0
    NGN.BUS.pool('b.', {
      '1': function (data) {
        bindtest += 1
        t.ok(data.payload === 'test2', 'Bind test 1 passed.')
      },
      '2': function (data) {
        bindtest += 1
        t.ok(data.payload === 'test2', 'Bind test 2 passed.')
      }
    })

    let fn = function (callback) {
      callback()
    }

    fn(NGN.BUS.attach('trigger'))
  })
})
