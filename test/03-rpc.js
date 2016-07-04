'use strict'

var test = require('tape')
var rpcPort = process.env.rpcPort || 47911

test('RPC:', function (t) {
  require('../')
  NGN.Log.disable()

  t.ok(NGN.RPC.Server !== undefined, 'NGN.RPC.Server exists.')
  t.ok(NGN.RPC.Client !== undefined, 'NGN.RPC.Client exists.')

  // 1. Create the server
  let s = new NGN.RPC.Server({
    host: 'localhost',
    port: rpcPort,
    expose: {
      testing: {
        echo: function (txt, callback) {
          callback(null, txt)
        },
        echo2: function (txt1, txt2, callback) {
          callback(null, txt1 + txt2)
        },
        fireforget: function (txt, txt2) {
          t.pass('Remote method with no callback works.')
          s.stop()
        }
      }
    }
  })

  // 2. Create the client but don't autoconnect
  let c = new NGN.RPC.Client({
    host: 'localhost',
    port: rpcPort,
    autoConnect: false
  })

  // 4. When the client is ready, run a remote method.
  c.once('ready', function () {
    t.ok(c !== null, 'RPC client connected successfully.')
    t.ok(c.connected && !c.connecting, 'RPC client status is accurate.')
    t.ok(c.testing !== undefined, 'RPC client recognized remote namespace.')
    t.ok(c.testing.echo !== undefined, 'RPC client recognized remote method.')

    c.testing.echo('sometext', function (err, out) {
      t.ok(err === null, 'No RPC error.')
      t.ok(out === 'sometext', 'RPC remote method called successfully.')

      // 5. Stop the server & check the status of the client
      s.once('stop', function () {
        t.ok(!s.running, 'RPC server temporarily stopped.')
      })

      c.testing.echo2('a', 'b', function (err, out) {
        t.ok(err === null, 'No RPC error.')
        t.ok(out === 'ab', 'Multiargument remote method works.')
        c.testing.fireforget('a', 'b')
      })
    })
  })

  s.once('clientconnection', function () {
    t.pass('RPC server recognized client.')
  })

  // 6. Check to make sure the client attempts to reconnect
  //    after it loses connectivity to the server
  c.once('reconnecting', function () {
    t.ok(!c.connected && c.connecting, 'RPC client attempting reconnect.')

    // 7. When the server is ready again, the client SHOULD auto-reconnect
    //    (i.e. there is no need to trigger anything)
    s.once('ready', function () {
      t.ok(s.running, 'RPC server restarted successfully.')
    })

    // 8. Once client reconnects, disconnect permanently.
    c.once('reconnected', function () {
      t.ok(c.connected && !c.connecting, 'RPC client successfully reconnected.')
      c.disconnect()
    })

    // 6. Restart the server after a half second pause
    setTimeout(function () {
      s.start()
    }, 750)
  })

  // 9. When the client disconnects, shutdown the server
  c.once('disconnect', function () {
    t.ok(!c.connected, 'RPC client disconnected successfully.')

    // 10. When the server is stopped, exit successfully.
    s.once('stop', function () {
      t.ok(!s.running, 'RPC server stopped successfully.')
      t.end()
    })

    s.stop()
  })

  // 3. When the server is ready, establish a client connection.
  s.once('ready', function () {
    t.ok(s.server !== null, 'RPC server started successfully.')
    t.ok(!s.starting && s.running, 'RPC server status is accurate.')
    c.connect()
  })
})
