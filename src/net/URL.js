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
  #query
  query
  #queryObject = null
  #hash = null
  #parsed = false
  #parse (force = false) {
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
    this.#query = this.#deserializeQueryParameters(this.#querystring)
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

    this.#originalURI = uri

    if (uri === null) {
      uri = 
        /* node-only */
        `http://${this.#hostname}`
        /* node-only */
        /* browser-only */
        window.location.href
        /* end-browser-only */
    }

    this.#uri = Utility.normalizeUrl(uri)

    /**
     * @property {object} query
     * Represents the query string as an object.
     */
    // Proxy query parameters and handle change events.
    this.query = new Proxy({}, {
      get (obj, prop) {
        return this.#query.get(prop)
      },
      
      set (obj, prop, value) {
        const oldParamVal = obj.get(prop)

        if(oldParamVal === value) {
          return
        }

        const old = Object.freeze(Object.from(obj))
        obj.set(prop, value)
        const newValue = Object.freeze(Object.from(obj))

        this.#querystring = Array.from(x).map(items => `${items[0]}=${items[1]}`).join('&')
        this.emit('updated.query', { old, new: newValue, parameter: { name: prop, old: oldParamVal, new: value } })
      },

      has (obj, prop) {
        return this.#query.has(prop)
      },

      deleteProperty(obj, prop) {
        return this.#query.delete(prop)
      },

      ownKeys (obj) {
        return Array.from(this.#query.keys())
      },

      defineProperty(obj, prop, descriptor) {
        return Reflect.defineProperty(this.#query)
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
    if (value.length > 0 && value !== this.#password) {
      const old = this.#password.replace(/./g, '*')
      this.#password = value
      this.emit('update.password', { old, new: value.replace(/./g, '*') })
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
      this.#deserializeQueryParameters()
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
   * Returns the value of #toString()
   */
  get value () {
    return this.toString()
  }

  /**
   * The canonical URL as a string.
   * @param {boolean} [displayKnownPort=false]
   * By default, no port is output in the string for known
   * protocols/schemes. Set this to `true` to force the
   * output to contain the port. This is ignored for URL's
   * with a `file` protocol.
   */
  toString (forcePort = false) {
    !this.#parsed && this.#parse()

    return (
      `${this.#protocol}://`
      + (this.#protocol === 'file' ? '' : this.#hostname + (
          NGN.coalesce(this.#port, this.#defaultPort[this.#protocol]) === this.#defaultPort[this.#protocol] && !forcePort
            ? ''
            : `:${NGN.coalesce(this.#port, this.#defaultPort[this.#protocol], 80)}`
        ))
      + this.#path.replace(/\/+/g, '/')
      + (this.#query.size > 0 ? `?${this.#querystring}` : '')
      + (NGN.coalesce(this.#hash, '').trim().length > 0 ? `#${this.hash}` : '')
    ).trim().replace(/:\/{3,}/, '/')
  }
}
