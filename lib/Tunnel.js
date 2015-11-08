'use strict'
let Base = require('./Base')
let SSH2 = require('ssh2')

/**
 * @class NGN.Tunnel
 * Establish an SSH tunnel and port forwarding between servers.
 *
 * ```js
 * var tunnel = new NGN.Tunnel({
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
 */
class Tunnel extends Base {
  /**
   * @method constructor
   * Create an SSH tunnel.
   * @cfg {string} [host=127.0.0.1:22]
   * The remote SSH host to connect to.
   * @cfg {string} user
   * The username to establish as SSH connection with.
   * @cfg {string} [password]
   * The password used to connect to establish the SSH connection.
   * @cfg {string} [key]
   * The path to the identity file (SSH key), or the contents of the file.
   * @cfg {number} remoteport
   * The port on the remote server to connect to after the SSH connection is established.
   * @cfg {number} port
   * The port on the local system that will be mapped to the remote port.
   */
  constructor (config, callback) {
    super()

    config = config || {}
    config.host = config.host || '127.0.0.1:22'
    config.user = config.user || null
    config.password = config.password || null
    config.key = config.key || null
    config.remoteport = config.remoteport || null
    config.port = config.port || null

    let me = this
    let ready = false
    let sshport = 22

    // Extract the SSH port from hostname
    if (config.host.split(':').length > 1) {
      sshport = config.host.split(':')[1]
    }

    // Setup the connection options
    let sshconn = {
      host: config.host,
      port: sshport
    }

    // Create an SSH proxy server
    let proxy = require('net').createServer(function (sock) {
      if (!ready) {
        return sock.destroy()
      }

      me.tunnel.forwardOut(sock.remoteAddress, sock.remotePort, config.sshhost, config.remoteport, function (err, stream) {
        if (err) {
          return sock.destroy()
        }
        sock.pipe(stream)
        stream.pipe(sock)
      })
    })

    proxy.on('close', function () {
      ready = false
      me.emit('close')
    })

    proxy.on('listening', function () {
      me.tunnel.connect(sshconn)
    })

    // Create the SSH2 client
    this.tunnel = new SSH2()

    // Handle connection
    this.tunnel.on('connect', function () {
      me.emit('connected')
    })

    // Indicate when ready
    this.tunnel.on('ready', function () {
      ready = true
      config.callback && config.callback()
      callback && callback()
      me.emit('ready')
    })

    this.tunnel.on('error', function (err) {
      me.emit('error', err)
      console.log('ERROR', config, arguments)
    })

    this.tunnel.on('end', function () {
      ready = false
      proxy.close()
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
      me.tunnel.end()
    }

    if (config.user !== null) {
      sshconn.username = config.user
      sshconn.password = config.password
    }
  }

  get connected () {
    return this.ready
  }

}

module.exports = Tunnel
