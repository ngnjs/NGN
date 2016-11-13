'use strict'

const SSH2 = require('ssh2').Client
const fs = require('fs')
const path = require('path')

/**
 * @class NGN.Tunnel
 * Establish an SSH tunnel and port forwarding between servers.
 *
 * ```js
 * let tunnel = new NGN.Tunnel({
 *   host: 'remoteserver.com:22', // SSH server to connect to
 *   user: 'remoteuser',          // SSH user account
 *   password: 'remotepwd',       // SSH user password
 *   remoteport: 5432,            // Port on the remote server to listen to local
 *   port: 5432                   // Port on the local computer to pipe to from local --> remote
 * }, [callback])
 *
 * tunnel.on('ready',function(){
 *   // do something
 * })
 * ```
 *
 * Callback is optional. It can be used INSTEAD of the tunnel.on('ready')
 *
 * It is also possible to establish a connection with an RSA private key
 * (typically `~/.ssh/id_rsa`).
 *
 * ```js
 * let tunnel = new NGN.Tunnel({
 *   host: 'remoteserver.com:22', // SSH server to connect to
 *   user: 'remoteuser',          // SSH user account
 *   key: '~/.ssh/id_rsa',        // SSH key
 *   remoteport: 5432,            // Port on the remote server to listen to local
 *   port: 5432                   // Port on the local computer to pipe to from local --> remote
 * })
 * ```
 *
 * The key can be the path to the file or the file content (string or buffer).
 * @fires connected
 * Fired when the tunnel connection has been established. This only
 * indicates a link has been created. Handshake/negotiation communication
 * begins _after_ this event fires.
 * @fires ready
 * Fired after a connection is established and all handshake/negotiation
 * is complete. Communication over the tunnel id possible after this
 * event fires.
 * @fires error
 * Fired when an error occurs.
 */
class Tunnel extends NGN.EventEmitter {
  /**
   * @method constructor
   * Create an SSH tunnel.
   * @cfg {string} [host=127.0.0.1:22]
   * The remote SSH host to connect to.
   * @cfg {string} user
   * The username to establish as SSH connection with.
   * @cfg {string} [password]
   * The password used to connect to establish the SSH connection.
   * @cfg {string|file|buffer} [key]
   * The path to the identity file (SSH private key), or the contents of the file.
   * @cfg {number} port
   * The local port on the that will be mapped to the remote port.
   * @cfg {number} remoteport
   * The port on the remote server to connect to after the SSH connection is established.
   */
  constructor (config, callback) {
    super()

    config = config || {}
    config.host = config.host || '127.0.0.1:22' // Host and SSH port
    config.user = config.user || null
    config.password = config.password || null
    config.key = config.key || null
    config.port = config.port || null // Local port
    config.remoteport = config.remoteport || null // Destination port

    let me = this
    let ready = false
    let sshport = 22

    // Extract the SSH port from hostname
    if (config.host.split(':').length > 1) {
      sshport = config.host.split(':')[1]
    }

    // Setup the connection options
    let sshconn = {
      host: config.host.split(':')[0],
      port: sshport
    }

    if (config.user !== null) {
      sshconn.username = config.user
    }

    if (config.password !== null) {
      sshconn.password = config.password
    }

    if (config.key) {
      let p = path.resolve(config.key)
      if (fs.existsSync(p)) {
        sshconn.privateKey = fs.readFileSync(p).toString()
      } else if (fs.existsSync(path.join(__dirname, p))) {
        sshconn.privateKey = fs.readFileSync(path.join(__dirname, p)).toString()
      } else {
        sshconn.privateKey = config.key
      }
    }

    // Create the SSH2 client
    let tunnel = new SSH2()

    // Create an SSH proxy server
    let proxy = require('net').createServer(function (sock) {
      if (!ready) {
        return sock.destroy()
      }

      sock.setNoDelay()

      tunnel.forwardOut(sock.remoteAddress, sock.remotePort, sshconn.host, config.remoteport, function (err, stream) {
        if (err) {
          if (err.reason && err.message) {
            console.warn(err.message, err.reason)
          }
          return sock.destroy()
        }
        stream.setNoDelay()
        sock.pipe(stream)
        stream.pipe(sock)
      })
    })

    proxy.on('close', function () {
      ready = false
      me.emit('close')
    })

    proxy.on('listening', function () {
      tunnel.connect(sshconn)
    })

    // Indicate when ready
    tunnel.on('ready', function () {
      ready = true

      config.callback && config.callback()

      callback && callback()

      me.emit('ready')
    })

    tunnel.on('error', function (err) {
      if (err.code === 'ENOTFOUND') {
        me.emit('error', new Error('host unreachable'))
      } else {
        me.emit('error', err)
      }

      me.close()
    })

    tunnel.on('end', function () {
      ready = false
      proxy.close()
    })

    // Handle connection
    tunnel.on('connect', function () {
      me.emit('connected')
    })

    /**
     * @method connect
     * Connect to the remote host.
     */
    this.connect = function () {
      proxy.listen(config.port, '127.0.0.1')
    }

    /**
     * @method disconnect
     * Disconnect from the remote host.
     */
    this.disconnect = function () {
      tunnel.end()

      if (!tunnel._sock.readable) {
        tunnel.emit('end')
      }
    }
  }

  close () {
    this.disconnect()
  }

  get connected () {
    return NGN.coalesce(this.ready, false)
  }
}

module.exports = Tunnel
