/**
 * @class NGN.NET.Utility
 * A utility library for network communications.
 * @private
 */
class NetworkUtilities {
  constructor () {
    Object.defineProperties(this, {
      hostname: NGN.private(null),
      networkInterfaces: NGN.private([]),
      UrlPattern: NGN.const(/^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/), // eslint-disable-line no-useless-escape
      HttpMethods: NGN.const([ // eslint-disable-line no-unused-vars
        'OPTIONS',
        'HEAD',
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'TRACE',
        'CONNECT'
      ])
    })

    /* node-only */
    this.hostname = require('os').hostname() // eslint-disable-line comma-style
    /* end-node-only */
    /* browser-only */
    this.hostname = window.location.host // eslint-disable-line comma-style
    /* end-browser-only */

    this.networkInterfaces = [
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
          this.networkInterfaces.push(iface[x].address)
        }
      }
    }
    /* end-node-only */

    this.networkInterfaces = NGN.dedupe(this.networkInterfaces)
  }

  /**
   * @method normalizeUrl
   * Normalize a URL by removing extraneous characters,
   * applying protocol, and resolving relative links.
   * @param {string} URI
   * The URI to normalize.
   * @return {string}
   * The normalized URL.
   */
  normalizeUrl (url) {
    let uri = []

    if (/^(\.|\/|\\).+/.test(url)) {
      /* node-only */
      url = `http://${this.hostname}/${url}`
      /* end-node-only */
      /* browser-only */
      let path = window.location.pathname.split('/')
      path.pop()

      url = `${window.location.origin}/${path.join('/')}/${url}`
      /* end-browser-only */
    }

    let protocol = /^(.*):\/.*/.exec(url)

    if (!protocol) {
      protocol = ''
    }

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

  /**
   * @method parseUri
   * Parses the URI into composable parts.
   * @param {string} URL
   * The URI/URL to parse.
   * @return {Object}
   * Returns a key/value object:
   *
   * ```js
   * {
   *   protocol: 'http',
   *   hostname: 'domain.com',
   *   path: '/path/to/file.html',
   *   query: 'a=1&b=2',
   *   hash: null
   * }
   * ```
   * @private
   */
  parseUri (uri) {
    // URL Pattern Regex
    let part = uri.match(/^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/) // eslint-disable-line no-useless-escape
    let protocol
    /* node-only */
    protocol = 'http'
    /* end-node-only */
    /* browser-only */
    protocol = window.location.protocol.replace(':', '').toLowerCase()
    /* end-browser-only */
    let url = {
      uri,
      protocol: NGN.coalesce(part[2], protocol),
      hostname: NGN.coalesce(part[4], hostname),
      path: NGN.coalesceb(part[5], '/'),
      query: NGN.coalesceb(part[7]),
      hash: NGN.coalesceb(part[9])
    }

    // URL contains a username/password.
    if (url.hostname.indexOf('@') > 0) {
      let credentials = uri.match(/^.*\/{1,2}(.*):(.*)@/i)

      url.hostname = url.hostname.split('@').pop()

      this.user = credentials[1]
      this.secret = credentials[2]
      // this.applyAuthorizationHeader()
    }

    url.port = NGN.coalesce(url.hostname.match(/:([0-9]{1,6})/), url.protocol === 'https' ? 443 : 80)

    if (url.hostname.indexOf(':') > 0) {
      url.hostname = url.hostname.split(':')[0]
    }

    if (url.path.charAt(0) !== '/') {
      url.path = `/${url.path}`
    }

    return url
  }

  /**
   * @method isCrossOrigin
   * Determine if accessing a URL is considered a cross origin request.
   * @param {string} url
   * The URL to identify as a COR.
   * @param {string} [alternativeUrl]
   * Optionally provide an alternative URL to compare the #url with.
   * @returns {boolean}
   * @private
   */
  isCrossOrigin (url, altUrl = null) {
    let uri = this.parseUri(url)

    if (altUrl !== null) {
      altUrl = this.parseUri(altUrl)

      return uri.hostname !== altUrl.hostname
    }

    /* node-only */
    if (this.networkInterfaces.indexOf(uri.hostname) < 0) {
      return true
    }
    /* end-node-only */

    return uri.hostname !== this.hostname
  }
}

const Utility = new NetworkUtilities()
const networkInterfaces = Utility.networkInterfaces
const hostname = Utility.hostname
const normalizeUrl = Utility.normalizeUrl

export {
  Utility as default,
  networkInterfaces,
  hostname,
  normalizeUrl
}
