'use strict'

var test = require('tape')
var rpc_port = process.env.RPC_PORT || 47911

require('../')

test('RPC:', function (t) {
  t.ok(NGN.rpc.Server !== undefined, 'NGN.rpc.Server exists.')
  t.ok(NGN.rpc.Client !== undefined, 'NGN.rpc.Client exists.')

  // 1. Create the server
  let s = new NGN.rpc.Server({
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

  // 2. Create the client but don't autoconnect
  let c = new NGN.rpc.Client({
    host: 'localhost',
    port: rpc_port,
    autoConnect: false
  })

  // 4. When the client is ready, run a remote method.
  c.once('ready', function () {
    t.ok(c !== null, 'RPC client connected successfully.')
    t.ok(c.connected && !c.connecting, 'RPC client status is accurate.')
    t.ok(c.testing !== undefined, 'RPC client recognized remote namespace.')
    t.ok(c.testing.echo !== undefined, 'RPC client recognized remote method.')

    c.testing.echo('blah', function (out) {
      t.ok(out === 'blah', 'RPC remote method called successfully.')

      // 5. Stop the server & check the status of the client
      s.once('stop', function () {
        t.ok(!s.running, 'RPC server temporarily stopped.')
      })

      s.stop()
    })
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
    }, 500)
  })

  // 9. When the client disconnects, shutdown the server
  c.on('disconnect', function () {
    t.ok(!c.connected, 'RPC client disconnected successfully.')

    // 10. When the server is stopped, exit successfully.
    s.on('stop', function () {
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
