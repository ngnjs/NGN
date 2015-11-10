'use strict'

require('colors')

const pkg = require('./package.json')
const Log = require('./lib/Log')
const Tunnel = require('./lib/Tunnel')
const Base = require('./lib/Base')
const Exception = require('./lib/exception/bootstrap')

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
    value: Exception.create
  },

  Class: {
    enumerable: false,
    writable: false,
    configurable: false,
    value: Base
  },

  Log: {
    enumerable: false,
    writable: false,
    configurable: false,
    value: new Log()
  },

  log: {
    enumerable: false,
    get: function () {
      return this.Log
    }
  },

  Tunnel: {
    enumerable: false,
    writable: false,
    configurable: false,
    value: Tunnel
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

  bus: {
    enumerable: false,
    get: function () {
      return this.BUS
    }
  },

  rpc: {
    enumerable: true,
    writable: false,
    configurable: false,
    value: {
      Client: require('./lib/rpc/Client'),
      Server: require('./lib/rpc/Server')
    }
  },

  RPC: {
    enumerable: false,
    get: function () {
      return this.RPC
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
