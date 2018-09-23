let hostname
/* node-only */
hostname = require('os').hostname() // eslint-disable-line comma-style
/* end-node-only */
/* browser-only */
hostname = window.location.host // eslint-disable-line comma-style
/* end-browser-only */

// CONSTANTS USED INTERNALLY
// Normalize URL syntax
const normalizeUrl = function (url) { // eslint-disable-line no-unused-vars
  let uri = []

  let protocol = /^(.*):\/.*/.exec(url)

  protocol = protocol.length > 0 ? protocol[1] : null

  if (protocol) {
    url = url.replace(new RegExp(`${protocol}\\:\\/+`, 'i'), '')
  }

  url = url.split('/')

  for (let i = 0; i < url.length; i++) {
    if (url[i] === '..') {
      uri.pop()
    } else if (url[i] !== '.' && url[i].trim().length > 0) {
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

  return protocol ? `${protocol}://${uri}` : uri
}

let networkInterfaces = [
  '127.0.0.1'
  , 'localhost' // eslint-disable-line comma-style
  /* node-only */
  , require('os').hostname() // eslint-disable-line comma-style
  /* end-node-only */
  /* browser-only */
  , window.location.host // eslint-disable-line comma-style
  /* end-browser-only */
]

/* node-only */
// Retreive local IP's and hostnames
let data = require('os').networkInterfaces()
let interfaces = Object.keys(data)

for (let i = 0; i < interfaces.length; i++) {
  let iface = data[interfaces[i]]

  for (let x = 0; x < iface.length; x++) {
    if (iface[x].family === 'IPv4') {
      networkInterfaces.push(iface[x].address)
    }
  }
}
/* end-node-only */

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

export { hostname, normalizeUrl, networkInterfaces, HttpMethods }
