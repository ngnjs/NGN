import NGN from '../core.js'
import Utility from './Utility.js'
import EventEmitter from '../emitter/core.js'
/* node-only */
import URL from 'url'
/* end-node-only*/

const localschemes = new Set(Utility.networkInterfaces.map(host => host.trim().toLowerCase()))

/**
 * @class NGN.NET.URL
 * Represents a **URL**. This is a lightweight wrapper around the standard [URL API](https://developer.mozilla.org/en-US/docs/Web/API/URL),
 * which is supported in browsers and Node-like environments.
 * All of the properties of these modules are inherited in this class.
 * 
 * **Differences from Standard URL API:**
 * 1. The `toString` method accepts a optional configuration to modify the generated URL string.
 * 1. Protocols are stripped of separator (i.e. `:`), the port is converted to an integer, and the hash sign (`#`) is stripped from the hash attribute.
 * 1. Password is masked by default. This can be overridden with a constructor configuration argument.
 * 1. A `formatString` method is available for simplistic URL templating.
 * 1. Provides an alternative/simpler object (query) for managing search parameters. The native `searchParams` is still available for those who prefer to use it.
 * 1. Extends NGN.EventEmitter (i.e. fires change events).
 * ---
 * 1) Complies with [RFC 3986](https://tools.ietf.org/html/rfc3986),
 * always assuming that a URL has an authority. See [syntax components](https://tools.ietf.org/html/rfc3986#section-3)
 * for details about the "authority" component. The main point is
 * all URL's will use the `://` separator, i.e. `scheme://authority/path`
 * as opposed to `scheme:path` UR**I** syntax.
 */
export default class NgnURL extends EventEmitter {
  #uri
  #originalURI
  #parts = null
  #protocol = 'http'
  #username
  #password
  #hostname = Utility.hostname
  #port = null
  #path = '/'
  #querystring = null
  #queryObject = {}
  #querymode = 'boolean'
  #hash = null
  #parsed = false
  #insecure = false
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

  #parse(force = false) {
    if (this.#parsed && !force) {
      return
    }

    const parts = new NGN.global.URL(this.#uri, `${this.#protocol}://${this.#hostname}`)
    this.#parts = parts
    this.#protocol = NGN.coalesceb(parts.protocol, this.#protocol).replace(':', '')
    this.#hostname = NGN.coalesceb(parts.hostname, this.#hostname)
    this.#port = NGN.coalesceb(parts.port, this.#defaultPort[this.#protocol])
    this.#username = NGN.coalesceb(parts.username)
    this.#password = NGN.coalesceb(parts.password)
    this.#path = NGN.coalesceb(parts.pathname, '/')
    this.#querystring = NGN.coalesce(parts.search, '').replace(/^\?/, '').trim()
    this.#hash = NGN.coalesceb(parts.hash.replace(/^#+/, ''))
    this.#queryObject = this.#deserializeQueryParameters(this.#querystring)
    
    if (this.#port !== null) {
      this.#port = NGN.forceNumber(this.#port)
    }

    this.#parsed = true
  }

  /**
   * @param {string} uri
   * The URI. This can be fully qualified or a relative path.
   * Examples: `https://domain.com`, `./path/to/my.html`
   * Produces [RFC 3986](https://tools.ietf.org/html/rfc3986) compliant URL's.
   * @param {boolean} [insecure=false]
   * Setting this to `true` will display the #password in plain text instead of a masked format.
   */
  constructor (uri = './', insecure = false) {
    super()

    /* browser-only */
    this.#protocol = window.location.protocol.replace(':', '')
    /* end-browser-only */

    this.#insecure = NGN.forceBoolean(NGN.coalesceb(insecure, false))
    this.href = uri

    /**
     * @property {object} query
     * Represents the query string as an object.
     */
    // Proxy query parameters and handle change events.
    this.query = new Proxy({}, {
      get: (obj, prop) => {
        !this.#parsed && this.#parse()
        const result = this.#queryObject.get(prop)
        switch (this.#querymode) {
          case 'string':
            return ''
          case 'null':
            return null
        }

        return result
      },

      set: (obj, prop, value) => {
        const oldParamVal = this.#queryObject.get(prop)

        if (oldParamVal === value) {
          return false
        }

        const old = Object.freeze(Object.fromEntries(this.#queryObject))
        
        switch (this.#querymode) {
          case 'null':
          case 'string':
            if (value === '' || value === null) {
              value = true
            }
            break
        }
        
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
      let old = NGN.coalesce(this.#password, '')
      if (!this.#insecure) {
        old.replace(/./g, '*')
      }
      this.#password = value
      this.emit('update.password', { old, new: !value ? null : value.replace(/./g, '*') })
    }
  }

  get password () {
    !this.#parsed && this.#parse()
    if (this.#insecure) {
      return NGN.coalesce(this.#password, '')
    }

    return NGN.coalesce(this.#password, '').replace(/./g, '*')
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
        this.#port = NGN.coalesce(this.#defaultPort[this.#protocol])
        this.emit('update.port', { old, new: this.port })
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
      throw new Error(`${value} is an invalid port number. Must be an integer between 1-65535 or "default" to use the protocol's default port.`)
    }

    if (value !== this.#port) {
      const old = this.#port
      this.#port = value
      this.emit('update.port', { old, new: value })
    }
  }

  get port () {
    !this.#parsed && this.#parse()
    return NGN.coalesce(this.#port, this.#defaultPort[this.#protocol], 80)
  }

  /**
   * A method for resetting the port to the default.
   * The default value is determined by the protocol.
   * If the protocol is not recognized, port `80` is used.
   * This is the equivalent of setting port = `null`.
   */
  resetPort () {
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

  /**
   * @property {string}
   * The full URL represented by this object.
   */
  get href () {
    return this.toString()
  }

  set href (uri) {
    this.#originalURI = uri
    this.#uri = uri
    this.#parsed = false
    this.#parse()
  }

  get searchParams () {
    !this.#parsed && this.#parse()
    return this.#parts.searchParams
  }

  get origin () {
    !this.#parsed && this.#parse()
    return this.#parts.origin
  }

  get search () {
    !this.#parsed && this.#parse()
    return this.#parts.search
  }

  get local () {
    !this.#parsed && this.#parse()
    return localschemes.has(this.hostname.toLowerCase())
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
   * @param { string } [cfg.queryMode]
   * Override the default #queryMode ('boolean' by default).
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
        if ((username || password) && this.#username !== null && this.#username.trim().length > 0) {
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
    if (NGN.coalesceb(cfg.querystring, true) && this.#protocol !== 'file' && this.queryParameterCount > 0) {
      let qs = []
      const shrink = NGN.coalesce(cfg.shrinkQuerystring, false)
      
      this.#queryObject.forEach((value, key) => {
        // Shrink
        if (typeof value === 'boolean' && shrink) {
          if (value) {
            qs.push(key)
          }
        } else {
          qs.push(`${key}${value.toString().trim().length === 0 ? '' : '=' + value}`)
        }
      })

      if (qs.length > 0) {
        result += `?${qs.join('&')}`
      }
    }

    if (NGN.coalesce(cfg.hash, true) && NGN.coalesce(this.#hash, '').trim().length > 0) {
      result += `#${ this.hash }`
    }

    result = result.trim().replace(/:\/{3,}/, '://')

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
   * @param {string} [template={{protocol}}{{separator}}{{hostname}}{{port}}{{path}}{{querystring}}{{hash}}]
   * The template to use for constructing the output.
   * @param {boolean} [encode=true]
   * URI encode the result string.
   * @param {string} [separator=://]
   * The optional separator is defined dynamically, but defaults to `://`.
   * @returns {string}
   */
  formatString (template = '{{protocol}}{{separator}}{{hostname}}{{port}}{{path}}{{querystring}}{{hash}}', encode = true, separator = '://') {
    const hasQueryString = this.queryParameterCount > 0
    const hasHash = NGN.coalesceb(this.#hash) !== null
    const result = template
      .replace(/{+protocol}+/gi, NGN.coalesce(this.protocol))
      .replace(/{+scheme}+/gi, NGN.coalesce(this.protocol))
      .replace(/{+username}+/gi, NGN.coalesce(this.username))
      .replace(/{+password}+/gi, NGN.coalesce(this.password))
      .replace(/{+hostname}+/gi, NGN.coalesce(this.hostname))
      .replace(/{+host}+/gi, NGN.coalesce(this.hostname))
      .replace(/{+port}+/gi, this.#defaultPort.hasOwnProperty(this.#protocol) ? '' : ':' + this.port)
      .replace(/{+path}+/gi, this.path)
      .replace(/{+querystring}+/gi, hasQueryString ? '?' + this.querystring : '')
      .replace(/{+query}+/gi, hasQueryString ? '?' + this.querystring : '')
      .replace(/{+hash}+/gi, hasHash ? '#' + this.hash : '')
      .replace(/{+separator}+/gi, separator)

    return encode ? encodeURI(result) : result
  }

  #deserializeQueryParameters (paramString = '') {
    const map = new Map()
    if (paramString === null) {
      return map
    }

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

  /**
   * Map a protocol to a default port. This will override any existing setting.
   * Common TCP/UDP ports can be found [here](https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers).
   * @param {string|object} protocol
   * The protocol, such as `http`. Case insensitive.
   * This can also be an object, specifying multiple protocol/port combinations.
   * For example:
   * ```
   * {
   *   snmp: 162,
   *   nntp: 563
   * }
   * ```
   * @param {number} port
   * The port number to assign as the protocol default.
   */
  setDefaultProtocolPort (protocol, port) {
    if (typeof protocol === 'object') {
      Object.keys(protocol).forEach(key => this.setDefaultProtocolPort(key, protocol[key]))
      return
    }

    protocol = protocol.trim().toLowerCase()
    port = NGN.forceNumber(port, 10)
    const old = this.#defaultPort[protocol]
    this.#defaultPort[protocol] = port

    if (old !== port) {
      this.emit('update.defaultport', {
        protocol,
        old,
        new: port
      })
    }
  }

  /**
   * Remove default port mapping for a protocol.
   * @param {string} protocol
   * The protocol, such as `http`. Case insensitive.
   * Multiple protocols can be specified, using multiple arguments `unsetDefaultProtocolPort('http', 'https', 'ssh')`
   * @warning **DESTRUCTIVE METHOD:** If a default protocol was overridden, unsetting it with this method will not rollback to the prior value.
   */
  unsetDefaultProtocolPort() {
    for (let protocol of arguments) {
      protocol = protocol.trim().toLowerCase()
      const old = this.#defaultPort[protocol]

      if (old) {
        delete this.#defaultPort[protocol]
        this.emit('delete.defaultport', { protocol, old })
      }
    }
  }

  /**
   * Determine if accessing a URL is considered a cross origin request or part of the same domain.
   * @param {string|NGN.NET.URL} [alternativeUrl]
   * Optionally provide an alternative URL to compare the #url with.
   * @param {boolean} [strictProtocol=false]
   * Requires the protocol to be the same (not just the hostname).
   * @returns {boolean}
   * `true` = same origin
   * `false` = different origin (cross origin)
   */
  isSameOrigin (url, strictProtocol = false) {
    !this.#parsed && this.#parse()
    const parts = typeof url === 'string' ? new NGN.global.URL(url, `${this.#protocol}://${this.#hostname}`) : url
    const host = NGN.coalesceb(parts.hostname, this.#hostname)
    return host === this.#hostname && (strictProtocol ? (parts.protocol === this.protocol) : true)
  }

  get hasQueryParameters () {
    return this.queryParameterCount > 0
  }

  get queryParameterCount () {
    return Object.keys(this.query).length
  }

  /**
   * @property {string} [mode=boolean] (boolean, string, null)
   * Specify how to treat "empty" query parameters.
   * For example, a query string of `?a=1&b=demo&c` has a
   * non-descript query parameter (`c`). The presence of
   * this attribute suggests it could be a boolean (`true`).
   * It could also be an empty string or a null value.
   * 
   * The following modes are available:
   * 
   * 1. `boolean`: Non-descript query parameters are assigned a value of `true` when present.
   * 1. `string`: Non-descript query parameters are assigned a zero-length (empty) string.
   * 1. `null`: Non-descript query parameters are assigned a value of `null`.
   */
  set queryMode (mode = 'boolean') {
    if (mode === null) {
      NGN.WARN('Query mode was set to a null object. Expected a string (\'null\'). The value was auto-converted to a string, but this method is only supposed to receive string values.')
    }

    mode = NGN.coalesce(mode, 'null').trim().toLowerCase()

    if (mode !== this.#querymode) {
      if (new Set(['boolean', 'string', 'null']).has(mode)) {
        const old = this.#querymode
        this.#querymode = mode
        this.emit('update.querymode', { old, new: mode })
      }
    }
  }
}
