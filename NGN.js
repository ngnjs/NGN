'use strict'

const pkg = require('./package.json')

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
    value: require('./lib/Log')
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

//  BUS: {
//    enumerable: true,
//    writable: false,
//    configurable: false,
//    value: require('./lib/BUS')
//  },

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
