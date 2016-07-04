'use strict'

const LOCAL_PORT = parseInt(process.env.LOCAL_SSH_PORT || 47911, 10) - 3
const REMOTE_PORT = parseInt(process.env.LOCAL_SSH_PORT || 47911, 10) - 5
const test = require('tape')
const fs = require('fs')
const path = require('path')
const net = require('net')
const crypto = require('crypto')
const ssh2 = require('ssh2')
const utils = ssh2.utils
const buffersEqual = require('buffer-equal-constant-time')

test('SSH Tunneling', function (t) {
  require('../')
//  NGN.Log.disable()

  t.ok(typeof NGN.Tunnel === 'function', 'NGN.Tunnel is available.')

  // 1. Create a mock TCP server
  let server = net.createServer(function (c) { // 'connection' listener
    console.log('remote client connected')
    c.on('data', function (d) {
      console.log('DATA', d)
    })
    c.on('end', function () {
      console.log('remote client disconnected')
    })
    c.on('close', function () {
      console.log('mock TCP server closed.')
    })
    c.write('hello\r\n')
//    c.pipe(c)
  }).listen(REMOTE_PORT, '127.0.0.1')

  // 2. Create a mock SSH server
  let pubKey = utils.genPublicKey(utils.parseKey(fs.readFileSync(path.join(__dirname, '/files/ssh-client-private.key'))))
  let sshserver = new ssh2.Server({
    hostKeys: [fs.readFileSync(path.join(__dirname, '/files/ssh-host-private.key'))]
  }, function (client) {
    t.pass('SSH client connected.')

    client.on('authentication', function (ctx) {
      if (ctx.method === 'password' && ctx.username === 'foo' && ctx.password === 'bar') {
        ctx.accept()
      } else if (ctx.method === 'publickey' && ctx.key.algo === pubKey.fulltype && buffersEqual(ctx.key.data, pubKey.public)) {
        if (ctx.signature) {
          let verifier = crypto.createVerify(ctx.sigAlgo)
          verifier.update(ctx.blob)
          if (verifier.verify(pubKey.publicOrig, ctx.signature, 'binary')) {
            ctx.accept()
          } else {
            ctx.reject()
          }
        } else {
          // If no signature present, that means the client is just checking
          // the validity of the given public key
          ctx.accept()
        }
      } else {
        ctx.reject()
      }
    }).on('ready', function () {}).on('end', function () {
      t.pass('SSH client disconnected.')
    })
  }).listen(0, '127.0.0.1', function () {
    // Create a connection
    let tunnel = new NGN.Tunnel({
      host: '127.0.0.1:' + this.address().port,
      user: 'foo',
      password: 'bar',
      port: LOCAL_PORT,
      remoteport: REMOTE_PORT
    })

    let tunnel2 = new NGN.Tunnel({
      host: '127.0.0.1:' + this.address().port,
      user: 'foo',
      key: './test/files/ssh-client-private.key',
      port: LOCAL_PORT,
      remoteport: REMOTE_PORT
    })

    tunnel.on('ready', function () {
      t.pass('Tunnel established.')

      // Attempt to communicate over the tunnel
      let sshClient = net.connect({
        port: LOCAL_PORT
      }, function () { // 'connect' listener
        t.pass('Connected to remote server via local port.')
        sshClient.setNoDelay()

//        console.log('Writing data to remote host.')
//        let x = ssh_client.write('world!\r\n')
//        console.log(">>>",x)
      })

//      ssh_client.on('data', function (chunk) {
//        console.log(chunk)
//      })

      sshClient.on('end', function () {
        console.info('Ignore ADMINISTRATIVELY_PROHIBITED error. This is an sshd_config false positive.')
        t.pass('Disconnected from local port.')
        tunnel.disconnect()
      })
    })

    tunnel.on('close', function () {
      t.pass('Tunnel disconnected.')
      tunnel2.connect()
    })

    tunnel2.on('ready', function () {
      t.pass('Tunnel established with key authentication key.')
      tunnel2.close()
    })

    tunnel2.on('close', function () {
      sshserver.close()
    })

    tunnel.connect()
  })
  server.on('close', function () {
    t.end()
  })
  sshserver.on('close', function () {
    server.close()
  })
})
