import NGN from '../core.js'
import Network from './Network'
import { hostname, normalizeUrl } from './Utility'

/**
 * @class NGN.NET.Resource
 * Represents a remote web resource, such as a backend web server or
 * an API server. This class inherits everything from NGN.NET, extending
 * it with customizable options for working with specific remote resources.
 *
 * This class was designed for use in applications where multiple requests
 * are made to multiple backends. For example, a common single page application
 * may make multiple requests for resources (media, templates, CSS, etc)
 * as well as multiple requests to an API server.
 *
 * For example:
 *
 * ```js
 * let server = new NGN.NET.Resource({
 *   credentials: {
 *     username: 'username',
 *     password: 'password'
 *   },
 *   headers: {
 *     'x-source': 'mydomain.com'
 *   }
 * })
 *
 * let API = new NGN.NET.Resource({
 *   credentials: {
 *     token: 'secret_token'
 *   },
 *   headers: {
 *     'user-agent': 'mobile'
 *   },
 *   baseUrl: 'https://api.mydomain.com'
 * })
 *
 * server.get('./templates/home.html', (response) => { ... })
 * API.json('/user', (data) => { ... })
 * ```
 *
 * Both `server` and `API` in the example above are instances of
 * NGN.NET. They each use different credentials to access the
 * remote endpoint, using different global headers and
 * a different base URL.
 *
 * This can be incredibly useful anytime a migration is required,
 * such as running code in dev ==> staging ==> production or
 * switching servers. It is also useful for creating connections
 * to different remote services, creating custom API clients,
 * and generally organizing/standardizing how an application connects
 * to remote resources.
 * @extends NGN.NET
 */
export default class NetworkResource extends Network {
  constructor (cfg) {
    super()

    cfg = cfg || {}

    Object.defineProperties(this, {
      /**
       * @cfg {object} headers
       * Contains headers (key/value) that are applied to all requests.
       */
      globalHeaders: NGN.private(NGN.coalesceb(cfg.headers, {})),

      /**
       * @cfg {object} credentials
       * Contains credentials that are applied to all requests.
       * @private
       */
      globalCredentials: NGN.private(NGN.coalesceb(cfg.credentials, {})),

      /**
       * @cfg {string} username
       * Use this to set a username (instead of using #credentials).
       */
      user: NGN.private(NGN.coalesceb(cfg.username)),

      /**
       * @cfg {string} password
       * Use this to set a password (instead of using #credentials).
       */
      secret: NGN.private(NGN.coalesceb(cfg.password)),

      /**
       * @cfg {string} accessToken
       * Use this to set an access token (instead of using #credentials).
       */
      accesstoken: NGN.private(NGN.coalesceb(cfg.token, cfg.accessToken, cfg.accesstoken)),

      /**
       * @cfg {object} query
       * Contains query parameters to be applied to all requests. All values
       * are automatically url-encoded.
       */
      globalQuery: NGN.private(NGN.coalesceb(cfg.query, {})),

      /**
       * @cfg {string} [baseUrl=window.loction.origin]
       * The root domain/base URL to apply to all requests to relative URL's.
       * This was designed for uses where a backend API may be served on
       * another domain (such as api.mydomain.com instead of www.mydomain.com).
       * The root will only be applied to relative paths that do not begin
       * with a protocol. For example, `./path/to/endpoint` **will** have
       * the root applied (`{root}/path/to/endpoint`) whereas `https://domain.com/endpoint`
       * will **not** have the root applied.
       */
      baseUrl: NGN.private(NGN.coalesce(cfg.baseURL, cfg.baseUrl, cfg.baseurl, `http://${hostname}/`)),

      /**
       * @cfg {boolean} [nocache=false]
       * This sets the `Cache-Control` header to `no-cache`.
       * Servers are supposed to honor these headers and serve non-cached
       * content. However; this is not always the case. Some servers
       * perform caching by matching on URL's. In this case, the #unique
       * attribute can be set to `true` to apply unique characters to the URL.
       */
      nocache: NGN.private(NGN.coalesce(cfg.nocache, false)),

      /**
       * @cfg {boolean} [unique=false]
       * Set this to `true` to add a unique URL parameter to all requests.
       * This guarantees a unique request. This can be used for
       * cache-busting, though setting #nocache to `true` is
       * recommended for these purposes. Only use this feature
       * for cache busting when the server does not honor `Cache-Control`
       * headers.
       */
      unique: NGN.private(NGN.coalesce(cfg.unique, false)),

      /**
       * @cfg {boolean} [sslonly=false]
       * Set this to true to rewrite all URL's to use HTTPS.
       */
      sslonly: NGN.public(NGN.coalesce(cfg.sslonly, false)),

      /**
       * @cfg {string} [useragent]
       * Specify a custom user agent to identify each request made
       * with the resource.
       * @nodeonly
       */
      useragent: NGN.private(NGN.coalesce(cfg.useragent)),

      /**
       * @cfg {boolean} [uniqueagent=false]
       * Guarantees each user agent is unique by appending a unique ID to the
       * user agent.
       * @nodeonly
       */
      uniqueagent: NGN.private(NGN.coalesce(cfg.uniqueagent, false))
    })

    if (this.baseUrl.indexOf('://') < 0 || this.baseUrl.indexOf('://') > 10) {
      this.baseUrl = `http${this.sslonly ? 's' : ''}://${this.baseUrl}`
    } else if (this.sslonly) {
      this.baseUrl = this.baseUrl.replace('http://', 'https://')
    }

    if (this.accesstoken !== null) {
      this.credentials = {
        accessToken: this.accesstoken
      }
    } else if (this.user !== null && this.secret !== null) {
      this.credentials = {
        username: this.user,
        password: this.secret
      }
    }

    this.parseRequestConfiguration = function (cfg, method = 'GET') {
      if (typeof cfg === 'string') {
        cfg = { url: cfg }
      }

      cfg = cfg || {}
      cfg.method = method
      cfg.url = this.prepareUrl(NGN.coalesceb(cfg.url, hostname)) // eslint-disable-line no-undef

      return new NGN.NET.Request(cfg)
    }
  }

  get username () {
    return this.user
  }

  set username (value) {
    if (this.user !== value) {
      this.user = value

      if (this.secret !== null) {
        this.credentials = {
          username: this.user,
          password: this.secret
        }
      }
    }
  }

  set password (value) {
    if (this.secret !== value) {
      this.secret = value

      if (this.user !== null) {
        this.credentials = {
          username: this.user,
          password: this.secret
        }
      }
    }
  }

  /**
   * @property {object} headers
   * Represents the current global headers.
   *
   * This is commonly used when a remote resource requires a specific
   * header on every call.
   *
   * **Example**
   *
   * ```js
   * let resource = new NGN.NET.Resource(...)
   *
   * resource.headers = {
   *   'user-agent': 'my custom agent name'
   * }
   * ```
   */
  get headers () {
    return this.globalHeaders
  }

  set headers (value) {
    this.globalHeaders = value
  }

  /**
   * @property credentials
   * Configure credentials that are applied to every request.
   * This is commonly used when communicating with a RESTful API.
   * This can accept a username and password or an access token.
   *
   * **Examples**
   *
   * ```js
   *  let resource = new NGN.NET.Resource(...)
   *
   *  resource.credentials = {
   *    username: 'user',
   *    password: 'pass'
   *  }
   * ```
   *
   * ```js
   * resource.credentials = {
   *   accessToken: 'token'
   * }
   * ```
   */
  set credentials (credentials) {
    if (credentials.hasOwnProperty('accesstoken') || credentials.hasOwnProperty('accessToken') || credentials.hasOwnProperty('token')) {
      credentials.accessToken = NGN.coalesce(credentials.accessToken, credentials.accesstoken, credentials.token)

      if (credentials.hasOwnProperty('username')) {
        delete credentials.username
      }

      if (credentials.hasOwnProperty('password')) {
        delete credentials.password
      }
    } else if (!(credentials.hasOwnProperty('username') && credentials.hasOwnProperty('password')) && !credentials.hasOwnProperty('accessToken')) {
      throw new Error('Invalid credentials. Must contain an access token OR the combination of a username AND password.')
    }

    this.globalCredentials = credentials

    if (credentials.username) {
      this.username = credentials.username
    }

    if (credentials.password) {
      this.password = credentials.password
    }
  }

  // Explicitly deny credential reading.
  get credentials () {
    NGN.WARN('Credentials are write-only. An attempt to read credentials was denied.')
    return {
      username: null,
      secret: null,
      password: null,
      accessToken: null
    }
  }

  /**
   * @property {object} query
   * Represents the current global query paramaters.
   *
   * This is commonly used when a remote resource requires a specific
   * query paramater on every call.
   *
   * **Example**
   *
   * ```js
   * let resource = new NGN.NET.Resource(...)
   *
   * resource.query = {
   *   'user_id': '12345'
   * }
   * ```
   *
   * All parameter values are automatically URL-encoded.
   */
  get query () {
    return this.globalQuery
  }

  set query (value) {
    this.globalQuery = value
  }

  /**
   * @method prepareUrl
   * Prepare a URL by applying the base URL (only when appropriate).
   * @param  {string} uri
   * The universal resource indicator (URI/URL) to prepare.
   * @return {string}
   * Returns a fully qualified URL.
   * @private
   */
  prepareUrl (uri) {
    if (uri.indexOf('://') < 0) {
      uri = normalizeUrl(`${this.baseUrl}/${uri}`)
    }

    return uri.replace(/\/{2,5}/gi, '/').replace(/:\/{1}/i, '://')
  }

  /**
   * @method preflight
   * Prepares a request before it is sent.
   * @param {NGN.NET.Request} request
   * The request object.
   * @private
   */
  preflight (request) {
    // Apply the base URL
    request.url = this.prepareUrl(request.url)

    // If global query parameters have been defined, apply them.
    Object.keys(this.globalQuery).forEach(param => request.setQueryParameter(param, this.globalQuery[param], true))

    // If global credentials are available, apply them.
    Object.keys(this.globalHeaders).forEach(header => request.setHeader(header, this.globalHeaders[header]))

    // If global headers/credentials are available, apply them.
    if (this.globalCredentials.accessToken) {
      request.accessToken = this.globalCredentials.accessToken
    } else if (this.globalCredentials.username) {
      request.username = this.globalCredentials.username
      request.password = this.globalCredentials.password
    }

    // Force unique URL
    if (this.unique) {
      request.setQueryParameter('nocache' + (new Date()).getTime().toString() + Math.random().toString().replace('.', ''), null)
    }

    // Request non-cached response
    if (this.nocache) {
      request.setHeader('Cache-Control', 'no-cache')
    }

    // Use custom user agents
    let useragent = NGN.coalesce(this.useragent)
    if (this.uniqueagent) {
      useragent += ` ID#${(new Date()).getTime().toString() + Math.random().toString().replace('.', '')}`
    }

    if (useragent !== null) {
      if (NGN.nodelike) {
        request.setHeader('User-Agent', useragent.trim())
      } else {
        request.removeHeader('user-agent')
        NGN.WARN(`Cannot set user agent to "${useragent.trim()}" in a browser. Browsers consider this an unsafe operation and will block the request.`)
      }
    }
  }

  /**
   * Set a global header. This will be sent on every request.
   * It is also possible to set multiple global headers at the same time by
   * providing an object, where each object
   * key represents the header and each value is the header value.
   *
   * For example:
   *
   * ```
   * setHeader({
   *   'x-header-a': 'value',
   *   'x-header-b': 'value'
   * })
   * ```
   * @param {string} header
   * The header name.
   * @param {string} value
   * The value of the header.
   */
  setHeader (key, value) {
    if (typeof key === 'object') {
      for (let [attr, val] of key) {
        this.globalHeaders[attr] = val
      }

      return
    }

    this.globalHeaders[key] = value
  }

  /**
   * Remove a global header so it is not sent
   * on every request. This method accepts multiple
   * keys, allowing for bulk delete via `removeHeader('a', 'b', '...')`
   * @param  {string} key
   * The header key to remove.
   */
  removeHeader (key) {
    if (arguments.length === 1) {
      delete this.globalHeaders[key]
      return
    }

    Array.from(arguments).forEach(key => delete this.globalHeaders[key])
  }

  /**
   * Remove all global headers.
   */
  clearHeaders () {
    this.globalHeaders = {}
  }

  /**
   * Set a global URL parameter. This will be sent on every request.
   * It is also possible to set multiple parameters at the same time by
   * providing an object, where each object
   * key represents the parameter name and each value is the parameter value.
   *
   * For example:
   *
   * ```
   * setParameter({
   *   'id': 'value',
   *   'token': 'value'
   * })
   * ```
   * @param {string} queryParameterName
   * The parameter name.
   * @param {string} value
   * The value of the parameter. This will be automatically URI-encoded.
   */
  setParameter (name, value) {
    if (typeof key === 'object') {
      for (let [attr, val] of key) {
        this.globalQuery[attr] = val
      }

      return
    }

    this.globalQuery[key] = value
  }

  /**
   * Remove a global query parameter so it is not sent
   * on every request. This method accepts multiple
   * parameters, allowing for bulk delete via `removeParameter('a', 'b', '...')`
   * @param  {string} queryParameterName
   * The name of the parameter to remove.
   */
  removeParameter () {
    if (arguments.length === 1) {
      delete this.globalQuery[key]
      return
    }

    Array.from(arguments).forEach(key => delete this.globalQuery[key])
  }

  /**
   * Remove all global query parameters.
   */
  clearParameters () {
    this.globalQuery = {}
  }
}
