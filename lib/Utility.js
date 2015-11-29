'use strict'

const net = require('net')

module.export = {
  // Creates an SSH Tunnel
  createTunnel: function (options, callback) {
    let me = this
    let tunnel
    let sshcfg = {
      host: this.host + ':' + (options.sshport || 22),
      user: options.username,
      remoteport: this.port
    }

    if (options.password) {
      sshcfg.password = options.password
    }

    if (options.key) {
      sshcfg.key = options.key
    }

    // Dynamically determine port by availability or via option.
    // Then open the tunnel.
    if (options.port) {
      sshcfg.port = options.port
      tunnel = new NGN.Tunnel(sshcfg)
      tunnel.on('ready', function () {
        NGN.BUS.emit('sshtunnel.create', tunnel)
        callback && callback(me.host, options.port)
      })
      tunnel.connect()
    } else {
      // Create a quick TCP server on random port to secure the port,
      // then shut it down and use the newly freed port.
      let tmp = net.createServer().listen(0, '127.0.0.1', function () {
        sshcfg.port = this.address().port
        tmp.close()
      })

      tmp.on('close', function () {
        // Launch the tunnel
        tunnel = new NGN.Tunnel(sshcfg)
        tunnel.on('ready', function () {
          callback && callback('127.0.0.1', sshcfg.port)
        })
        tunnel.connect()
      })
    }
  }
}
