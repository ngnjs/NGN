'use strict'

const NgnClass = require('./NgnClass')
const RpcClient = require('./rpc/Client')

// #TODO:0 Use the RPC Client to connect to the bridge.
// Make sure reconnects work
// Make sure zeromq emits over the wire properly.

class BUS extends NgnClass {

  constructor () {
    super()

    Object.defineProperties(this, {

      server: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: 'localhost:5555'
      },

      remoteport: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: 5555
      },

      remote: {
        enumerable: false,
        writable: true,
        configurable: false,
        value: {
          connecting: false,
          connected: false
        }
      }

    })

    // Attempt to autostart
    let me = this
    setTimeout(function () {
      if (!me.connecting && !me.connected) {
        me.connect()
      }
    }, 500)
  }

  /**
   * @property {string} host
   * The remote host.
   * @readonly
   */
  get host () {
    return this.server
  }

  /**
   * @property {string} port
   * The remote host port.
   * @readonly
   */
  get port () {
    return this.remoteport
  }

  /**
   * @property {boolean} connected
   * Indicates the BUS connection is established.
   * @readonly
   */
  get connected () {
    return super.coalesce(this.remote.connected, false)
  }

  /**
   * @property {boolean} connecting
   * Indicates the BUS connection is initializing.
   * @readonly
   */
  get connecting () {
    return super.coalesce(this.remote.connecting, false)
  }

  /**
   * @method connect
   * Connect to a remote [NGN Bridge](#/guides/bridge)
   * @cfg {string} [host=localhost:5555]
   * The remote host.
   */
  connect (host) {
    host = host || this.server
    let port = host.split(':')
    let me = this
    host = port[0]
    port = parseInt(port.length === 1 ? 5555 : port[1], 10)

    this.remoteport = port
    this.remote = new RpcClient({
      host: host,
      port: port
    })

    this.remote.on('ready', function () {
      me.emit('connected')
      console.log('Ready!')
      console.log(this.remote.methods)
    })

    this.remote.on('disconnected', function () {
      me.emit('disconnected')
    })

    this.remote.connect()
  }

}

module.exports = new BUS()
