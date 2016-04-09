'use strict'

const net = require('net')
const fs = require('fs')
const os = require('os')

module.exports = {
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
  },

  /**
   * @method pathExists
   * Determines whether the specified file/directory path exists.
   * @param {string} path
   * Absolute path.
   */
  pathExists: function (dir) {
    try {
      fs.accessSync(dir)
      return true
    } catch (e) {
      return false
    }
  },

  /**
   * @method pathReadable
   * Determines whether the specified file/directory can be read.
   * @param {string} path
   * Absolute path.
   */
  pathReadable: function (dir) {
    try {
      fs.accessSync(dir, fs.R_OK)
      return true
    } catch (e) {
      return false
    }
  },

  /**
   * @method fileWritable
   * Determines whether the process can write to the specified file.
   * @param {string} path
   * Absolute path of the file.
   */
  pathWritable: function (dir) {
    try {
      fs.accessSync(dir, fs.W_OK)
      return true
    } catch (e) {
      return false
    }
  },

  /**
   * @method fileExecutable
   * Determines whether the process can execute the specified file.
   * @param {string} path
   * Absolute path of the file.
   */
  fileExecutable: function (dir) {
    if (os.platform() === 'win32') {
      throw new Error('NGN.util.fileExecutable() is not available on Windows')
    }
    try {
      fs.accessSync(dir, fs.X_OK)
      return true
    } catch (e) {
      return false
    }
  }
}
