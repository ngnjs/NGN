// [PARTIAL]

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
class NetworkResource extends Network {
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
      accesstoken: NGN.private(NGN.coalesceb(cfg.token, cfg.accessToken)),

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
      baseUrl: NGN.private(NGN.coalesce(cfg.baseUrl, cfg.baseurl, `http://${hostname}/`)),

      /**
       * @cfg {boolean} [nocache=false]
       * Set this to `true` to add a unique cache-busting URL parameter to all requests.
       */
      nocache: NGN.private(NGN.coalesce(cfg.nocache, false)),

      /**
       * @cfg {boolean} [sslonly=false]
       * Set this to true to rewrite all URL's to use HTTPS.
       */
      sslonly: NGN.public(NGN.coalesce(cfg.sslonly, false))
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
    } else if (this.user !== null && this.ssecret !== null) {
      this.credentials = {
        username: this.user,
        password: this.secret
      }
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
    let qp = Object.keys(this.globalQuery)
    if (qp.length > 0) {
      let queryString = []
      for (let i = 0; i < qp.length; i++) {
        queryString.push(`${qp[i]}=${encodeURIComponent(this.globalQuery[qp[i]])}`)
      }

      if (request.query === '') {
        request.url = `${request.url}?${queryString.join('&')}`
      } else {
        request.url = `${request.url}&${queryString.join('&')}`
      }
    }

    // If global credentials are available, apply them.
    let gHeaders = Object.keys(this.globalHeaders)
    for (let i = 0; i < gHeaders.length; i++) {
      request.setHeader(gHeaders[i], this.globalHeaders[gHeaders[i]])
    }

    // If global headers/credentials are available, apply them.
    if (this.globalCredentials.accessToken) {
      request.accessToken = this.globalCredentials.accessToken
    } else if (this.globalCredentials.username) {
      request.username = this.globalCredentials.username
      request.password = this.globalCredentials.password
    }

    // Add a cache buster
    if (this.nocache) {
      request.setQueryParameter('nocache' + (new Date()).getTime().toString() + Math.random().toString().replace('.', ''), null)
    }
  }
}

Network.prototype.Resource = NetworkResource
