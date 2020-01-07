import NGN from '../core.js'
import Utility from './Utility.js'
import EventEmitter from '../emitter/core.js'

/**
 * @class NGN.NET.URL
 * Represents a **URL**. Complies with [RFC 3986](https://tools.ietf.org/html/rfc3986),
 * always assuming that a URL has an authority. See [syntax components](https://tools.ietf.org/html/rfc3986#section-3)
 * for details about the "authority" component. The main point is
 * all URL's will use the `://` separator, i.e. `scheme://authority/path`
 * as opposed to `scheme:path` UR**I** syntax.
 */
export default class URL extends EventEmitter {
  #uri
  #originalURI
  #protocol = 'http'
  #username
  #password
  #hostname = Utility.hostname
  #port = 80
  #path
  #querystring
  #queryObject = {}
  #hash = null
  #parsed = false
  #parse (force = false) {
    console.log('.\n\nPREPARSE\n\n.')
    if (this.#parsed && !force) {
      return
    }

    const parts = Utility.parseUri(this.#uri)

    this.#protocol = parts.protocol
    this.#hostname = NGN.coalesce(parts.hostname, Utility.hostname)
    this.#path = parts.path
    this.#querystring = NGN.coalesceb(parts.query, ' ').trim()
    this.#hash = parts.hash
    this.#port = NGN.forceNumber(parts.port)
    this.#username = parts.username
    this.#password = parts.password
    this.#queryObject = this.#deserializeQueryParameters(this.#querystring)
    this.#parsed = true
  }

  #deserializeQueryParameters (paramString = '') {
    const map = new Map()
    paramString = paramString.trim()

    if (paramString.length === 0) {
      return map
    }

    paramString.split('&').forEach(param => {
      const keypair = param.split('=')
      const key = keypair[0]
      let value = NGN.coalesceb(keypair[1], true)

      if (typeof value === 'string') {
        if (value.trim().toLowerCase() === 'true') {
          value = NGN.forceBoolean(value)
        } else if (!isNaN(value)) {
          value = NGN.forceNumber(value)
        }
      }

      map.set(key, value)
    })

    return map
  }

  #defaultPort = {
    http: 80,
    https: 443,
    ssh: 22,
    ldap: 389,
    sldap: 689,
    ftp: 20,
    ftps: 989,
    sftp: 21
  }

  /**
   * @param {string} uri
   * The URI. This can be fully qualified or a relative path.
   * Examples: `https://domain.com`, `./path/to/my.html`
   * Produces [RFC 3986](https://tools.ietf.org/html/rfc3986) compliant URL's.
   */
  constructor (uri = null) {
    super()

    this.url = uri

    /**
     * @property {object} query
     * Represents the query string as an object.
     */
    // Proxy query parameters and handle change events.
    this.query = new Proxy({}, {
      get: (obj, prop) => {
        !this.#parsed && this.#parse()
        return this.#queryObject.get(prop)
      },

      set: (obj, prop, value) => {
        const oldParamVal = this.#queryObject.get(prop)

        if (oldParamVal === value) {
          return false
        }

        const old = Object.freeze(Object.fromEntries(this.#queryObject))
        this.#queryObject.set(prop, value)
        const newValue = Object.freeze(Object.fromEntries(this.#queryObject))

        this.#querystring = Array.from(this.#queryObject).map(items => `${items[0]}=${items[1]}`).join('&')
        this.emit('updated.query', { old, new: newValue, parameter: { name: prop, old: oldParamVal, new: value } })
        return true
      },

      has: (obj, prop) => this.#queryObject.has(prop),

      deleteProperty: (obj, prop) => this.#queryObject.delete(prop),

      ownKeys: obj => Array.from(this.#queryObject.keys()),

      defineProperty: (obj, prop, descriptor) => {
        if (NGN.coalesce(descriptor.enumerable, true)) {
          this.#queryObject.add(prop, NGN.coalesce(descriptor.value, descriptor.get))
        }
      },

      getOwnPropertyDescriptor: (obj, prop) => {
        const val = this.#queryObject.get(prop)
        return {
          enumerable: val !== undefined,
          configurable: true,
          writable: val !== undefined,
          value: val
        }
      }
    })

    /**
     * @property {string} scheme
     * Alias for #property.
     */
    NGN.createAlias(this, 'scheme', this.protocol)
  }

  get protocol() {
    !this.#parsed && this.#parse()
    return this.#protocol
  }

  set protocol (value) {
    value = /^(.*)\:?\/+?.*/i.exec(value)

    if (value !== null && value.length > 0 && value[1] !== this.#protocol) {
      const old = this.#protocol
      this.#protocol = value[1]
      this.emit('update.protocol', { old, new: this.#protocol })
    }
  }

  set username (value) {
    if (value.length > 0 && value !== this.#username) {
      const old = this.#username
      this.#username = value
      this.emit('update.username', { old, new: value })
    }
  }

  get username () {
    !this.#parsed && this.#parse()
    return this.#username
  }

  set password (value) {
    value = NGN.coalesceb(value)

    if ((value === null || value.length > 0) && value !== this.#password) {
      const old = this.#password.replace(/./g, '*')
      this.#password = value
      this.emit('update.password', { old, new: !value ? null : value.replace(/./g, '*') })
    }
  }

  get password () {
    !this.#parsed && this.#parse()
    return this.#password.replace(/./g, '*')
  }

  set hostname (value) {
    value = NGN.coalesceb(value, '').trim().toLowerCase()
    if (value.length > 0 && value !== this.#hostname) {
      const old = this.#hostname
      this.#hostname = value
      this.emit('update.hostname', { old, new: value })
    }
  }

  get hostname () {
    !this.#parsed && this.#parse()
    return this.#hostname
  }

  set port (value) {
    if (value === null) {
      if (value !== this.#port) {
        const old = this.#port
        this.#port = value
        this.emit('update.port', { old, new: value })
      }
      
      return
    }

    if (typeof value === 'string') {
      if (value.trim().toLowerCase() !== 'default') {
        throw new Error(`"${value}" is an invalid port. Must be a number between 1-65535 or "default" to use the protocol's default port.`)
      }

      value = NGN.coalesce(this.#defaultPort[this.#protocol], 80)
    }

    if (value < 1 || value > 65535) {
      throw new Error(`${value} is an invalid port number. Must be a number between 1-65535 or "default" to use the protocol's default port.`)
    }

    if (value !== this.#port) {
      const old = this.#port
      this.#port = value
      this.emit('update.port', { old, new: value })
    }
  }

  get port () {
    !this.#parsed && this.#parse()
    return this.#port
  }

  /**
   * A method for removing/clearing the port from the URL.
   * This is the equivalent of setting port = `null`.
   */
  clearPort () {
    this.port = null
  }

  set path (value) {
    value = NGN.coalesceb(value, '/')
    if (value !== this.#path) {
      const old = this.#path
      this.#path = value
      this.emit('update.path', { old, new: value })
    }
  }

  get path () {
    !this.#parsed && this.#parse()
    return this.#path
  }

  set querystring(value) {
    value = NGN.coalesceb(value) || ''
    if (value !== this.#querystring) {
      const old = this.#querystring
      this.#querystring = value
      this.#queryObject = this.#deserializeQueryParameters(value)
      this.emit('update.querystring', { old, new: value })
    }
  }

  get querystring() {
    !this.#parsed && this.#parse()
    return this.#querystring
  }

  set hash(value) {
    value = (NGN.coalesceb(value) || '').replace(/^#+/, '')

    if (value !== this.#hash) {
      const old = this.#hash
      this.#hash = value
      this.emit('update.hash', { old, new: value })
    }
  }

  get hash() {
    !this.#parsed && this.#parse()
    return this.#hash
  }

  get sourceURI () {
    return this.#originalURI
  }

  get rawURI () {
    return this.#uri
  }

  /**
   * @property {string}
   * The full URL represented by this object.
   */
  get url () {
    return this.toString()
  }

  set url (uri) {
    if (uri === this.#originalURI) {
      return
    }

    this.#originalURI = uri

    if (!uri) {
      uri =
        /* node-only */
        `http://${this.#hostname}`
        /* node-only */
        /* browser-only */
        window.location.href
        /* end-browser-only */
    }

    this.#uri = Utility.normalizeUrl(uri)
    this.#parsed = false
    this.#parse()
  }

  /**
   * The canonical URL as a string.
   * @param {object} [cfg]
   * There are a number of flags that can be used to change
   * the result of this method. The refer to the following:
   * 
   * http://username@password:domain.com/path/to/file.html?optionA=a&optionB=b#demo
   * |__|   |______| |______| |________||________________| |_________________| |__|
   *  1      2        3        4         5                  6                   7
   * 
   * 1. Protocol/Scheme
   * 1. Username
   * 1. Password
   * 1. Domain/Authority
   * 1. Path
   * 1. Querystring
   * 1. Hash
   * @param {boolean} [cfg.protocol=true]
   * Generate the protocol/scheme (i.e. `http://`)
   * @param { boolean } [cfg.hostname = true]
   * Generate the hostname.
   * @param { boolean } [cfg.username = false]
   * Generate the username. Example: `https://username@hostname.com`.
   * Setting this to `true` will force the hostname to also be generated,
   * (even if hostname is set to `false`).
   * @param { boolean} [cfg.password = false]
   * Generate the password. Example: `https://username:pasword@domain.com`.
   * This requires the `username` option to be `true`, and it will only be generated
   * if a username exists.
   * @param {boolean} [cfg.forcePort=false]
   * By default, no port is output in the string for known
   * protocols/schemes. Set this to `true` to force the
   * output to contain the port. This is ignored for URL's
   * with a `file` protocol.
   * @param {boolean} [cfg.path=true]
   * Generate the path.
   * @param {boolean} [cfg.querystring=true]
   * Generate the query string
   * @param {boolean} [cfg.shrinkQuerystring=false]
   * This unique flag can shrink boolean flags by stripping off `true` values and eliminating `false` parameters entirely. For
   * example, a query string of `?a=true&b=false&c=demo` would become `?a&c=demo`.
   * This is designed for interacting with API's that use "parameter presence" to toggle/filter responses,
   * especially when there are many boolean query parameters in the URL.
   * @param {boolean} [cfg.hash]
   * Generate the hash value.
   * @param { boolean } [cfg.urlencode=true]
   * Generate the query parameters with URL encoding.
   * @warning Displaying the password in plain text is a security vulnerability.
   */
  toString (cfg = null) {
    !this.#parsed && this.#parse()

    cfg = NGN.coalesce(cfg, {})
    const username = NGN.coalesce(cfg.username, false)
    const password = NGN.coalesce(cfg.password, false)

    let result = ''
    // Protocol
    if (NGN.coalesce(cfg.protocol, cfg.scheme, true)) {
      result += `${this.#protocol}://`
    }

    if (this.#protocol !== 'file') {
      if (NGN.coalesce(cfg.hostname, true) || username) {
        // Username
        if ((username || password) && this.#username.trim().length > 0) {
          result += this.#username

          // Password
          if (password && this.#password !== null && this.#password.trim().length > 0) {
            result += `:${this.#password.trim()}`
          }

          result += '@'
        }

        // Hostname
        result += this.#hostname + (
          NGN.coalesce(this.#port, this.#defaultPort[this.#protocol]) === this.#defaultPort[this.#protocol] && !NGN.coalesce(cfg.forcePort, false)
            ? ''
            : `:${NGN.coalesce(this.#port, this.#defaultPort[this.#protocol], 80)}`
        )
      }
    }

    // Path
    if (NGN.coalesce(cfg.path, true)) {
      result += this.#path.replace(/\/+/g, '/')
    }

    // Querystring
    if (this.#protocol !== 'file' && NGN.coalesce(cfg.querystring, true)) {
      let qs = []
      const shrink = NGN.coalesce(cfg.shrinkQuerystring, false)
      
      this.#queryObject.forEach((value, key) => {
        // Shrink
        if (typeof value === 'boolean' && shrink) {
          if (value) {
            qs.push(key)
          }
        } else {
          qs.push(`${key}=${value}`)
        }
      })

      if (qs.length > 0) {
        result += `?${qs.join('&')}`
      }
    }

    if (NGN.coalesce(cfg.hash, true) && NGN.coalesce(this.#hash, '').trim().length > 0) {
      result += `#${ this.hash }`
    }

    result = result.trim().replace(/:\/{3,}/, '/')

    if (NGN.coalesce(cfg.urlencodeQuerystring, true)) {
      result = encodeURI(result)
    }

    return result
  }

  /**
   * Uses a find/replace strategy to generate a custom URL string.
   * All variables surrounded in double brackets will be replaced
   * by the URL equivalent.
   * 
   * - `{{protocol}}` is the URL protocol, such as `http`, `https`, or `file`.
   * - `{{separator}}` is what separates the protocol from everything else. Default is `://`.
   * - `{{username}}` is the username.
   * - `{{password}}` is the ** plain text ** password.
   * - `{{hostname}}` is the domain/authority.
   * - `{{port}}` is the port number, prefixed by `:` (i.e. `:port`).
   * - `{{path}}` is the path.
   * - `{{querystring}}` is the querystring prefixed by `?` (i.e. `?a=1&b=2`).
   * - `{{hash}}` is the hash, prefixed by `#` (i.e. `#myhash`)
   * @param {string} [template={{protocol}}://{{hostname}}{{port}}{{path}}{{querystring}}{{hash}}]
   * The template to use for constructing the output.
   * @param {string} [separator=://]
   * The optional separator is defined dynamically, but defaults to `://`.
   * @returns {string}
   */
  formatString (template = '{{protocol}}://{{hostname}}{{port}}{{path}}{{querystring}}{{hash}}', separator = '://') {
    return template
      .replace(/{+protocol}+/gi, this.#protocol)
      .replace(/{+scheme}+/gi, this.#protocol)
      .replace(/{+username}+/gi, this.#username)
      .replace(/{+password}+/gi, this.#password)
      .replace(/{+hostname}+/gi, this.#hostname)
      .replace(/{+host}+/gi, this.#hostname)
      .replace(/{+port}+/gi, ':' + this.#port)
      .replace(/{+path}+/gi, this.#path)
      .replace(/{+querystring}+/gi, '?' + this.#querystring)
      .replace(/{+query}+/gi, '?' + this.#querystring)
      .replace(/{+hash}+/gi, '#' + this.#hash)
      .replace(/{+separator}+/gi, separator)
  }
}
