/**
 * @class NGN.NET
 * A library to issue HTTP/S requests.
 * This acts as an AJAX library.
 * @fires NETWORKERROR
 * Triggered if a network error occurs. Fired on the global `NGN.BUS`.
 * @author Corey Butler
 * @singleton
 */
(function () {
  // CONSTANTS USED INTERNALLY
  // Normalize URL syntax
  const normalizeUrl = function (url) { // eslint-disable-line no-unused-vars
    let uri = []

    url = url.split('/')

    for (let i = 0; i < url.length; i++) {
      if (url[i] === '..') {
        uri.pop()
      } else if (url[i] !== '.') {
        uri.push(url[i])
      }
    }

    uri = uri.join('/').replace(/:\/{3,50}/gi, '://')

    // Handle query parameter normalization
    let match = /(.*:\/\/.*)[?](.*)/.exec(uri)
    let path = match === null ? uri : match[1]
    let queryString = match !== null ? match[2] : ''

    uri = path

    if (queryString.trim().length > 0) {
      let params = {}

      queryString.split('&').forEach(attr => {
        let keypair = attr.split('=')
        params[keypair[0]] = keypair.length > 1 ? keypair[1] : null
      })

      queryString = []
      Object.keys(params).forEach((param, i) => {
        queryString.push(`${param}${params[param] !== null ? '=' + encodeURIComponent(params[param]) : ''}`)
      })

      uri = `${uri}?${queryString.join('&')}`
    }

    return uri
  }

  const hostname = NGN.nodelike ? require('os').hostname() : window.location.host

  let networkInterfaces = [
    '127.0.0.1',
    'localhost',
    hostname
  ]

  // Retreive local IP's and hostnames
  if (NGN.nodelike) {
    let data = require('os').networkInterfaces()
    let interfaces = Object.keys(data)

    for (let i = 0; i < interfaces.length; i++) {
      let iface = interfaces[i]

      for (let x = 0; x < iface.length; x++) {
        if (iface[x].family === 'IPv4') {
          networkInterfaces.push(iface[x].address)
        }
      }
    }
  }

  networkInterfaces = NGN.dedupe(networkInterfaces)

  const HttpMethods = [ // eslint-disable-line no-unused-vars
    'OPTIONS',
    'HEAD',
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'TRACE',
    'CONNECT'
  ]

  // [INCLUDE: ./Request.js]
  // [INCLUDE: ./Network.js]
  // [INCLUDE: ./Resource.js]

  NGN.extend('NET', NGN.const(new Network()))

  // Network = null // eslint-disable-line
  // NetworkResource = null // eslint-disable-line
})()
