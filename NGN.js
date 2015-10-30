'use strict'

require('colors')

const pkg = require('./package.json')
const Log = require('./lib/Log')

let NGN = {}

// Create non-configurable attributes
Object.defineProperties(NGN, {

  /**
   * @property {string} version
   * The version of NGN that's running.
   */
  version: {
    enumerable: false,
    writable: false,
    configurable: false,
    value: pkg.version
  },

  /**
   * @method createException
   */
  createException: {
    enumerable: false,
    writable: false,
    configurable: false,
    value: require('./lib/Exception').create
  },

  Class: {
    enumerable: false,
    writable: false,
    configurable: false,
    value: require('./lib/NgnClass')
  },

  Log: {
    enumerable: false,
    writable: false,
    configurable: false,
    value: new Log()
  },

  Tunnel: {
    enumerable: false,
    writable: false,
    configurable: false,
    value: require('./lib/SshTunnel')
  },

  Server: {
    enumerable: false,
    writable: false,
    configurable: false,
    value: require('./lib/Server')
  },

  BUS: {
    enumerable: true,
    writable: false,
    configurable: false,
    value: require('./lib/BUS')
  },

  rpc: {
    enumerable: true,
    writable: false,
    configurable: false,
    value: {
      Client: require('./lib/rpc/Client'),
      Server: require('./lib/rpc/Server')
    }
  }

})

// Append to global object
Object.defineProperties(global, {
  NGN: {
    enumerable: true,
    writable: false,
    configurable: false,
    value: NGN
  },
  ngn: {
    enumerable: true,
    get: function () {
      return this.NGN
    }
  }
})
