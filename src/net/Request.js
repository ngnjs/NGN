import NGN from '../core.js'
import Utility from './Utility.js'
import URL from './URL.js'
/* node-only */
import libhttp from 'http'
import libhttps from 'https'
import fs from 'fs'
import SRI from './polyfills/SRI.js'
import NodeReferralPolicy from './polyfills/ReferrerPolicy.js'
import NodeHttpCache from './polyfills/Cache.js'
import { Transport } from 'stream'
/* end-node-only */

/**
 * @class NGN.NET.Request
 * Represents a network request. This class can be used
 * to create and manipulate HTTP requests, but it does not
 * actually transmit them. To send the request, use NGN.NET#request
 * or one of the many common helper methods.
 * @private
 */
export default class Request { // eslint-disable-line no-unused-vars
  #uri = null
  #httpmethod = 'GET'
  #headers = null
  #requestbody = null
  #user = null
  #secret = null
  #bearerAccessToken = null
  #cacheMode = 'default'
  /* node-only */
  #cache = null
  /* end-node-only */
  #corsMode = 'cors'
  referrer = null
  #referrerPolicy = 'unsafe-url'
  sri = null
  #controller

  constructor (cfg = {}) {
    // Require URL and HTTP method
    NGN.objectRequires(cfg, 'url')

    if (NGN.objectHasAny(cfg, 'form', 'json')) {
      NGN.WARN('NET.Request', '"form" and "json" configuration properties are invalid. Use "body" instead.')
    }

    /**
     * @cfgproperty {string} url (required)
     * The complete URL for the request, including query parameters.
     * This value is automatically normalized.
     */
    // Use the setter to configure the URL
    // The setter will configure the private URL attribute (NGN.NET.URL instance)
    this.url = cfg.url

    /**
     * @cfg {string} [method=GET]
     * The HTTP method to invoke when the request is sent. The standard
     * RFC 2616 HTTP methods include:
     *
     * - OPTIONS
     * - HEAD
     * - GET
     * - POST
     * - PUT
     * - DELETE
     * - TRACE
     * - CONNECT
     *
     * There are many additional non-standard methods some remote hosts
     * will accept, including `PATCH`, `COPY`, `LINK`, `UNLINK`, `PURGE`,
     * `LOCK`, `UNLOCK`, `VIEW`, and many others. If the remote host
     * supports these methods, they may be used in an NGN.NET.Request.
     * Non-standard methods will not be prevented, but NGN will trigger
     * a warning event if a non-standard request is created.
     */
    /**
     * @cfg {object} [headers]
     * Optionally supply custom headers for the request. Most standard
     * headers will be applied automatically (when appropriate), such
     * as `Content-Type`, `Content-Length`, and `Authorization`.
     * In Node-like environments, a `User-Agent` will be applied containing
     * the `hostname` of the system making the request. Any custom headers
     * supplied will override headers managed by NGN.NET.
     */
    this.#headers = NGN.coalesceb(cfg.headers, {})

    /**
     * @cfg {object|string|binary} [body]
     * The body configuration supports text, an object, or a data URL or
     * binary content. **For multi-part form data (file uploads), use
     * the #files configuration _instead_ of this attribute.**
     *
     * It is also possible to construct a simple form submission
     * (x-www-form-urlencoded) from a specially formatted key/value object
     * conforming to the following syntax:
     *
     * ```json
     * {
     *   form: {
     *     form_field_1: "value",
     *     form_field_2: "value",
     *     form_field_3: "value",
     *   }
     * }
     * ```
     * The object above will be automatically converted & url-encoded as:
     *
     * ```js
     * form_field_1=value&form_field_2=value&form_field_3=value
     * ```
     *
     * The appropriate request headers are automatically applied.
     */
    this.#requestbody = NGN.coalesce(cfg.body)

    /**
     * @cfgproperty {string} username
     * A username to authenticate the request with (basic auth).
     */
    this.#user = NGN.coalesceb(cfg.username)

    /**
     * @cfgproperty {string} password
     * A password to authenticate the request with (basic auth).
     * @readonly
     */
    this.#secret = NGN.coalesceb(cfg.password)

    /**
     * @cfgproperty {string} accessToken
     * An access token to authenticate the request with (Bearer auth).
     * If this is configured, it will override any basic auth settings.
     */
    this.#bearerAccessToken = NGN.coalesceb(cfg.accessToken)

    /**
     * @cfgproperty {string} [cacheMode=default] (default, no-store, reload, no-cache, force-cache, only-if-cached)
     * The [caching mechanism](https://developer.mozilla.org/en-US/docs/Web/API/Request/cache) applied to the request.
     * Node-like environments do not have a native HTTP cache. NGN provides
     * a limited HTTP cache for Node-like environments, adhering to the principles
     * defined in the [MDN HTTP Cache Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching).
     * The most noticeable differences are:
     * 1. Incomplete results (HTTP Status 206 / Partial Content) won't be cached.
     * 1. Redirects are handled differently (internally only, results are the same).
     */
    this.cacheMode = NGN.coalesce(cfg.cacheMode, NGN.nodelike ? 'no-store' : 'default')
    
    /* node-only */
    // Apply a global HTTP cache for Node-like environments (polyfills browser functionality)
    if (!NGN.global.__NodeHttpCache__) {
      NGN.global.__NodeHttpCache__ = new NodeHttpCache(NGN.coalesce(process.env.HTTP_CACHE_DIR, 'memory'))
    }
    
    this.#cache = NGN.coalesce(cfg.cache, NGN.global.__NodeHttpCache__)
    /* end-node-only */

    /**
     * @cfgproperty {string} [referrer]
     * The referrer URL to send to the destination. By default, this will be the current URL
     * of the page or the hostname of the process.
     * See the [MDN overview of referrers](https://hacks.mozilla.org/2016/03/referrer-and-cache-control-apis-for-fetch/) for details.
     */
    this.referrer = NGN.coalesceb(cfg.referrer)

    /**
     * @cfgproperty {string} [referrerPolicy=unsafe-url] (no-referrer, no-referrer-when-downgrade, same-origin, origin, strict-origin, origin-when-cross-origin, strict-origin-when-cross-origin, unsafe-url)
     * Specify the [referrer policy](https://w3c.github.io/webappsec-referrer-policy/#referrer-policies). This can be empty/null.
     */
    this.referrerPolicy = NGN.coalesce(cfg.referrerPolicy)

    /**
     * @cfgproperty {string} [sri]
     * The [subresource integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) value of the request.
     * Example: `sha256-BpfBw7ivV8q2jLiT13fxDYAe2tJllusRSZ273h2nFSE=`
     */
    this.sri = NGN.coalesceb(cfg.sri, cfg.integrity, cfg.subresourceintegrity, cfg.subresourceIntegrity)

    Object.defineProperties(this, {
      /**
       * @cfg {boolean} [enforceMethodSafety=true]
       * According to [RFC 2616](https://www.w3.org/Protocols/rfc2616/rfc2616-sec9.html),
       * some HTTP methods are considered idempotent (safe). These methods
       * should have no significance to data (i.e. read-only). For example,
       * `OPTIONS`, `HEAD`, and `GET` are all idempotent. By default, NGN.NET
       * loosely enforces idempotence by ignoring the #body when making a
       * request. While it is not advised, nor officially supported, NGN.NET can
       * technically ignore method safety, allowing a request body to be
       * sent to a remote server. Set this configuration to `false` to
       * prevent NGN.NET from enforcing idempotence/safety.
       */
      enforceMethodSafety: NGN.private(NGN.coalesce(cfg.enforceMethodSafety, cfg.enforcemethodsafety, true)),
      
      /**
       * @cfg {string} [responseType=text]
       * Specifies the type of data expected in the response.
       * Values conform with those available in the XHR spec.
       * See [MDN: XMLHttpRequest.responseType](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType)
       */
      responseType: NGN.public(NGN.coalesce(cfg.responseType, '')),

      /**
       * @cfgproperty {boolean} [withCredentials=false]
       * Indicates whether or not cross-site `Access-Control` requests should
       * be made using credentials such as cookies, authorization headers or
       * TLS client certificates. Setting `withCredentials` has no effect on
       * same-site requests.
       *
       * In addition, this flag is also used to indicate when cookies are to
       * be ignored in the response. The default is `false`. XMLHttpRequest
       * from a different domain cannot set cookie values for their own
       * domain unless `withCredentials` is set to true before making the
       * request. The third-party cookies obtained by setting `withCredentials`
       * to true will still honor same-origin policy and hence can not be
       * accessed by the requesting script through
       * [document.cookie](https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie)
       * or from response headers.
       */
      withCredentials: NGN.private(NGN.coalesce(cfg.withCredentials, false)),

      /**
       * @cfgproperty {Number} [timeout=30000]
       * The number of milliseconds to wait before considering the request to
       * have timed out. Defaults to `30000` (30 seconds).
       */
      timeout: NGN.public(NGN.coalesce(cfg.timeout, 30000)),

      /**
       * @method timer
       * A placeholder for a timeout monitor.
       * @private
       */
      timer: NGN.private(null),

      /**
       * @method isCrossOrigin
       * Determine if accessing a URL is considered a cross origin request.
       * @param {string} url
       * The URL to identify as a COR.
       * @returns {boolean}
       * @private
       */
      isCrossOrigin: NGN.privateconst(url => !this.#uri.isSameOrigin(url)),

      /**
       * @method applyAuthorizationHeader
       * Generates and applies the authorization header for the request,
       * based on the presence of #username, #password, or #accessToken.
       * @private
       */
      applyAuthorizationHeader: NGN.privateconst(() => {
        if (NGN.coalesceb(this.#bearerAccessToken) !== null) {
          this.setHeader('Authorization', `Bearer ${this.#bearerAccessToken}`, true)
        } else if (NGN.coalesceb(this.#user) && NGN.coalesceb(this.#secret)) {
          this.setHeader('Authorization', this.basicAuthToken(this.#user, this.#secret), true)
        }
      }),

      /**
       * @method basicAuthToken
       * Generates a basic authentication token from a username and password.
       * @return {[type]} [description]
       * @private
       */
      basicAuthToken: NGN.privateconst((user, secret) => {
        // Binary to base64-ascii conversions
        /* node-only */
        return 'Basic ' + Buffer.from(`${user}:${secret}`, 'binary').toString('base64')
        /* end-node-only */
        /* browser-only */
        return 'Basic ' + NGN.global.btoa(`${user}:${secret}`) // eslint-disable-line no-unreachable
        /* end-browser-only */
      }),

      /**
       * @cfgproperty {Number} [maxRedirects=10]
       * Set the maximum number of redirects. There is a hard-cap of 25
       * redirects to prevent cyclic requests (endless loop).
       */
      maximumRedirects: NGN.private(10),
      redirectAttempts: NGN.private(0),

      prepareBody: NGN.private(() => {
        // Request body management
        if (this.#requestbody !== null) {
          const contentType = NGN.coalesceb(this.getHeader('content-type'))

          if (typeof this.#requestbody === 'object') {
            if (NGN.objectHasExactly(this.#requestbody, 'form')) {
              const form = this.#requestbody.form
              const keys = Object.keys(form)
              const dataString = []

              for (let i = 0; i < keys.length; i++) {
                if (NGN.isFn(form[keys[i]])) {
                  throw new Error('Invalid form data. Form data cannot be a complex data format such as an object or function.')
                } else if (typeof form[keys[i]] === 'object') {
                  dataString.push(`${keys[i]}=${encodeURIComponent(JSON.stringify(form[keys[i]]))}`)
                } else {
                  dataString.push(`${keys[i]}:${encodeURIComponent(form[keys[i]])}`)
                }
              }

              this.#requestbody = dataString.join('&')
            } else {
              this.#requestbody = JSON.stringify(this.#requestbody).trim()
              this.setHeader('Content-Length', this.#requestbody.length, false)
              this.setHeader('Content-Type', NGN.coalesceb(contentType, 'application/json'), false)
              this.responseType = 'json'
            }
          }

          if (typeof this.#requestbody === 'string') {
            if (contentType !== null) {
              // Check for form data
              let match = /([^=]+)=([^&]+)/.exec(this.#requestbody)

              if (match !== null && this.#requestbody.trim().substr(0, 5).toLowerCase() !== 'data:' && this.#requestbody.trim().substr(0, 1).toLowerCase() !== '<') {
                this.setHeader('Content-Type', 'application/x-www-form-urlencoded', false)
              } else {
                this.setHeader('Content-Type', 'text/plain')

                if (this.#requestbody.trim().substr(0, 5).toLowerCase() === 'data:') {
                  // Crude Data URL mimetype detection
                  match = /^data:(.*);/gi.exec(this.#requestbody.trim())

                  if (match !== null) {
                    this.setHeader('Content-Type', match[1])
                  }
                } else if (/^<\?xml.*/gi.test(this.#requestbody.trim())) {
                  // Crude XML Detection
                  this.setHeader('Content-Type', 'application/xml')
                } else if (/^<html.*/gi.test(this.#requestbody.trim())) {
                  // Crude HTML Detection
                  this.setHeader('Content-Type', 'text/html')
                }
              }
            }

            this.setHeader('Content-Type', this.#requestbody.length, false)
          } else {
            NGN.WARN('NET.Request.body', `The request body must cannot be ${typeof this.#requestbody}. Please provide a string, object, or binary value for the body.`)
          }
        }
      })
    })

    if (cfg.maxRedirects) {
      this.maxRedirects = cfg.maxRedirects
    }

    this.method = NGN.coalesceb(cfg.method, 'GET')

    this.prepareBody()

    // Apply authorization if applicable
    if (NGN.coalesce(this.#user, this.#secret, this.#bearerAccessToken) !== null) {
      this.applyAuthorizationHeader()
    }
  }

  /* node-only */
  static get ReferralPolicy () {
    return NodeReferralPolicy
  }

  static get SRI () {
    return SRI
  }

  get HttpCache () {
    return this.#cache
  }
  /* end-node-only */

  get cacheMode () {
    return this.#cacheMode
  }

  set cacheMode (value) {
    if (value === null || value === undefined || typeof value !== 'string') {
      throw new Error(`Cache mode must be default, no-store, reload, no-cache, force-cache, or only-if-cached. "${value}" is invalid.`)
    }

    value = value.trim().toLowerCase()

    if (['default', 'no-store', 'reload', 'no-cache', 'force-cache', 'only-if-cached'].indexOf(value) < 0) {
      throw new Error(`"${value}" is an unrecognized cache mode.Must be one of: default, no-store, reload, no-cache, force-cache, or only-if-cached.`)
    } else {
      this.#cacheMode = value
    }

    if (value === 'only-if-cached' && this.#corsMode !== 'same-origin') {
      this.#corsMode = 'same-origin'
      NGN.WARN('Request\'s CORS mode automatically set to "same-origin" for caching mode of "only-if-cached".')
    }
  }

  get corsMode () {
    return this.#corsMode
  }

  set corsMode (value) {
    if (value === null || value === undefined || typeof value !== 'string') {
      throw new Error(`CORS mode must be cors, no-cors, or same-origin. "${value}" is invalid.`)
    }

    if (this.#cacheMode !== 'only-if-cached') {
      value = value.trim().toLowerCase()
      if (['cors', 'no-cors', 'same-origin'].indexOf(value) < 0) {
        throw new Error(`"${value} is an invalid CORS mode. Must be one of: cors, no-cors, same-origin.`)
      }
    }
  }

  get referrerPolicy() {
    return this.#referrerPolicy
  }

  set referrerPolicy(value) {
    if (NGN.coalesceb(value) === null) {
      this.#referrerPolicy = null
      return
    }

    if (value === null || value === undefined || typeof value !== 'string') {
      throw new Error(`Referrer Policy mode must be no-referrer, no-referrer-when-downgrade, same-origin, origin, strict-origin, origin-when-cross-origin, strict-origin-when-cross-origin, unsafe-url, null, or an empty/blank string. "${value}" is invalid.`)
    }

    value = value.trim().toLowerCase()

    if (['no-referrer', 'no-referrer-when-downgrade', 'same-origin', 'origin', 'strict-origin', 'origin-when-cross-origin', 'strict-origin-when-cross-origin', 'unsafe-url'].indexOf(value) < 0) {
      throw new Error(`"${value}" is an invalid referrer policy. Must be one of: no-referrer, no-referrer-when-downgrade, same-origin, origin, strict-origin, origin-when-cross-origin, strict-origin-when-cross-origin, unsafe-url, null, or an empty/blank string.`)
    }

    this.#referrerPolicy = value
  }

  get maxRedirects () {
    return this.maximumRedirects
  }

  set maxRedirects (value) {
    if (value > 25) {
      value = 25
    }

    if (value < 0) {
      value = 0
    }

    this.maximumRedirects = value
  }

  /**
   * @property {string} protocol
   * The protocol used to make the request.
   * @readonly
   */
  get protocol () {
    return this.#uri.protocol
  }

  /**
   * @property {string} host
   * The hostname/domain of the request (includes port if applicable).
   */
  get host () {
    return this.#uri.toString({
      protocol: false,
      username: false,
      password: false,
      urlencode: false,
      hash: false,
      querystring: false
    })
  }

  /**
   * @property {string} host
   * The hostname/domain of the request (does not include port).
   */
  get hostname () {
    return this.#uri.hostname
  }

  /**
   * @property {number} port
   * The port of the remote host.
   */
  get port () {
    return this.#uri.port
  }

  /**
   * @property {string} path
   * The pathname of the URL.
   */
  get path () {
    return this.#uri.path
  }

  /**
   * @property {string} querystring
   * The raw query string of the URI. To retrieve a key/value list,
   * use #queryParameters instead.
   */
  get querystring () {
    this.#uri.querystring
  }

  /**
   * @property {object} query
   * Returns a key/value object containing the URL query parameters of the
   * request, as defined in the #url. The paramter values (represented as keys
   * in this object) may not be modified or removed (use setQueryParameter or removeQueryParameter
   * to modify/delete a query parameter).
   * @readonly
   */
  get query () {
    return Object.freeze(Object.assign({}, this.#uri.query))
  }

  /**
   * @property {string} hash
   * The hash part of the URL (i.e. everything after the trailing `#`).
   */
  get hash () {
    return NGN.coalesceb(this.#uri.hash) || ''
  }

  /**
   * @property {string} url
   * The URL where the request will be sent.
   */
  get url () {
    return this.#uri.toString()
  }

  set url (value) {
    if (NGN.coalesceb(value) === null) {
      NGN.WARN('NET.Request.url', 'A blank URL was identified for a request. Using current URL instead.')
    }

    this.#uri = new URL(value)
    this.#user = NGN.coalesceb(this.#uri.username, this.#user)
    this.#secret = NGN.coalesceb(this.#uri.password, this.#secret)
  }

  get method () {
    return this.httpmethod
  }

  set method (value) {
    if (this.httpmethod !== value) {
      if (NGN.coalesceb(value) === null) {
        NGN.WARN('NET.Request.method', 'No HTTP method specified.')
      }

      value = value.trim().toUpperCase()

      if (Utility.HttpMethods.indexOf(value) < 0) {
        NGN.WARN('NET.Request.method', `A non-standard HTTP method was recognized in a request: ${value}.`)
      }

      this.httpmethod = value
    }
  }

  get body () {
    return this.#requestbody
  }

  set body (value) {
    this.#requestbody = value
    this.prepareBody()
  }

  /**
   * @property {boolean} crossOriginRequest
   * Indicates the request will be made to a domain outside of the
   * one hosting the request.
   */
  get crossOriginRequest () {
    return this.#uri.isSameOrigin('./')
  }

  /**
   * @property {string} username
   * The username that will be used in any basic authentication operations.
   */
  get username () {
    return NGN.coalesceb(this.#user)
  }

  set username (user) {
    user = NGN.coalesceb(user)

    if (this.#user !== user) {
      this.#user = user

      if (NGN.coalesceb(this.#secret) !== null) {
        this.applyAuthorizationHeader()
      }
    }
  }

  /**
   * @property {string} password
   * It is possible to set a password for any basic authentication operations,
   * but it is not possible to read a password.
   * @writeonly
   */
  set password (secret) {  
    secret = NGN.coalesceb(secret)

    if (this.#secret !== secret) {
      this.#secret = secret

      if (NGN.coalesceb(this.#user) !== null) {
        this.applyAuthorizationHeader()
      }
    }
  }

  /**
   * @property {string} accessToken
   * Supply a bearer access token for basic authenticaiton operations.
   * @writeonly
   */
  set accessToken (token) {
    token = NGN.coalesceb(token)

    if (this.#bearerAccessToken !== token) {
      this.#bearerAccessToken = token
      this.applyAuthorizationHeader()
    }
  }

  get headers () {
    return this.#headers
  }

  set headers (value = null) {
    this.#headers = NGN.coalesceb(value, {})
  }

  /**
   * @method setHeader
   * Add a header to the request.
   * @param {string} header
   * The name of the header.
   * @param {string} value
   * Value of the header.
   * @param {Boolean} [overwriteExisting=true]
   * If the header already exists, setting this to `false` will prevent
   * the original header from being overwritten.
   */
  setHeader (key, value, overwriteExisting = true) {
    key = key.replace(/'|"/gi, '').toLowerCase()

    if (this.#headers[key] === undefined || overwriteExisting) {
      this.#headers[key] = value
    }
  }

  /**
   * @method getHeader
   * @param  {string} header
   * The name of the header to retrieve.
   * @return {string}
   * Returns the current value of the specified header.
   */
  getHeader (key) {
    if (!this.#headers.hasOwnProperty(key.toLowerCase())) { // eslint-disable-line no-prototype-builtins
      return undefined
    }

    return this.#headers[key.toLowerCase()]
  }

  /**
   * @method removeHeader
   * Removes a header from the request. Nothing happens if the header does
   * not exist.
   * @param  {string} header
   * The header to remove.
   */
  removeHeader (key) {
    delete this.#headers[key.toLowerCase()]
    delete this.#headers[key]
  }

  /**
   * @method setQueryParameter
   * Add a query parameter to the request.
   * @param {string} parameter
   * The name of the parameter.
   * @param {string} value
   * Value of the parameter. The value is automatically URL encoded. If the
   * value is null, only the key will be added to the URL (ex: `http://domain.com/page.html?key`)
   * @param {Boolean} [overwriteExisting=true]
   * If the parameter already exists, setting this to `false` will prevent
   * the original parameter from being overwritten.
   */
  setQueryParameter (key, value, overwriteExisting = true) {
    if (!overwriteExisting && this.#uri.query.has(key)) {
      return
    }

    this.#uri.query[key] = value
  }

  /**
   * @method removeQueryParameter
   * Remove a query parameter from the request URI.
   * @param {string} key
   */
  removeQueryParameter (key) {
    delete this.#uri.query[key]
  }

  get queryParameterCount() {
    return this.#uri.queryParameterCount
  }

  get hasQueryParameters() {
    return this.#uri.hasQueryParameters
  }

  abort () {
    if (this.#controller !== null && !this.#controller.signal.aborted) {
      this.#controller.abort()
    }
  }

  startMonitor () {
    if (this.timer === null) {
      this.timer = setTimeout(() => {
        this.emit('timedout', 'Timed out requesting ' + this.url)
        throw new Error('Timed out requesting ' + this.url)
      }, this.timeout)
    }
  }

  stopMonitor () {
    clearTimeout(this.timer)
    this.timer = null
  }

  /**
   * @method send
   * Send the request.
   * @param {Function} callback
   * The callback is executed when the request is complete.
   * @param {Object} callback.response
   * The response object returned by the server.
   */
  send (callback) {
    let body = this.body

    // Disable body when safe methods are enforced.
    if (NGN.coalesce(body)) {
      if (this.enforceMethodSafety && 'OPTIONS|HEAD|GET'.indexOf(this.method) >= 0) {
        body = null
      }
    }

    /* node-only */
    // Run request in Node-like environments
    // Support local file system retrieval in node-like environments.
    // This short-circuits the request and reads the file system instead.
    if (this.protocol === 'file') {
      if (!NGN.isFn(callback)) {
        throw new Error('A callback is required when retrieving system files in a node-like environment.')
      }

      const filepath = this.#uri.toString().replace('file://', '')
      const response = {
        status: fs.existsSync(filepath) ? 200 : 400
      }

      response.responseText = response.status === 200 ? fs.readFileSync(filepath).toString() : 'File does not exist or could not be found.'

      if (this.sri) {
        const integrity = SRI.verify(this.sri, response.responseText)
        if (!integrity.valid) {
          return callback(new Error(integrity.reason))
        }
      }

      return callback(response)
    }

    const http = this.protocol === 'https' ? libhttps : libhttp

    let referrer = NGN.coalesceb(this.referrer, `http://${Utility.hostname}/`)

    // const agent = new http.Agent()
    const reqOptions = {
      hostname: this.hostname,
      port: this.port,
      method: this.method,
      headers: this.#headers,
      path: this.#uri.formatString('{{path}}{{querystring}}{{hash}}')
    }

    const req = http.request(reqOptions, response => {
      response.setEncoding('utf8')

      let resbody = ''
      response.on('data', chunk => { resbody = resbody + chunk })

      response.on('end', () => {
        switch (response.statusCode) {
          case 412:
          case 304:
            // Respond from cache (no modifications)
            const res = this.#cache.get(request)
            if (res) {
              return callback(res)
            } else {
              return callback({
                headers: response.headers,
                status: 500,
                statusText: 'Internal Server Error',
                responseText: 'Failed to retrieve cached response.'
              })
            }
          case 301:
          case 302:
          case 307:
          case 308:
            if (this.redirectAttempts > this.maxRedirects) {
              this.redirectAttempts = 0

              this.stopMonitor()

              return callback(this.#cache.put(req, { // eslint-disable-line standard/no-callback-literal
                headers: response.headers,
                status: 500,
                statusText: 'Too many redirects',
                responseText: 'Too many redirects'
              }, this.#cacheMode))
            }

            if (response.headers.location === undefined) {
              this.stopMonitor()

              return callback(this.#cache.put(req, { // eslint-disable-line standard/no-callback-literal
                headers: response.headers,
                status: 502,
                statusText: 'Bad Gateway',
                responseText: 'Bad Gateway'
              }, this.#cacheMode, response))
            }

            this.redirectAttempts++
            this.url = response.headers.location

            return this.send(res => callback(this.#cache.put(req, res, this.#cacheMode, response)))

          default:
            this.stopMonitor()

            if (this.sri) {
              const integrity = SRI.verify(this.sri, resbody)
              if (!integrity.valid) {
                throw new Error(integrity.reason)
              }
            }
            
            return callback(this.#cache.put(req, { // eslint-disable-line standard/no-callback-literal
              headers: response.headers,
              status: response.statusCode,
              statusText: NGN.coalesce(response.statusMessage, response.statusText),
              responseText: resbody,
            }, this.#cacheMode, response))
        }
      })
    })

    // Check the cache
    let cachedResponse = this.#cache.get(req)
    if (cachedResponse) {
      return callback(cachedResponse)
    }

    req.on('error', (err) => {
      this.stopMonitor()

      if (NGN.isFn(callback)) {
        callback({ // eslint-disable-line standard/no-callback-literal
          status: 400,
          statusText: err.message,
          responseText: err.message,
          // responseXML: err.message,
          // readyState: 0
        })
      } else {
        throw err
      }
    })

    this.startMonitor()

    if (body) {
      req.write(body)
    }

    this.#cache.capture(req, this.#cacheMode)

    req.end()
    /* end-node-only */
    /* browser-only */
    // Create the request configuration
    let init = {
      method: this.method,
      // CORS mode must be same-origin if the cache mode is "only-if-cached": https://developer.mozilla.org/en-US/docs/Web/API/Request/cache
      mode: this.#cacheMode === 'only-if-cached' ? 'same-origin' : this.#corsMode,
      cache: this.#cacheMode,
      redirect: 'follow',
      referrer: NGN.coalesce(this.referrer, window.location.href),
      referrerPolicy: NGN.coalesceb(this.#referrerPolicy, 'unsafe-url')
    }

    // Apply Request Headers
    if (this.#headers !== null) {
      init.headers = new Headers()
      Object.keys(this.#headers).forEach(header => init.headers.append(header, this.#headers[header]))
    }

    // Apply request body (if applicable)
    if (this.#requestbody !== null && ['HEAD', 'GET'].indexOf(init.method) < 0) {
      init.body = this.#requestbody
    }

    // Apply timer
    if (this.timeout > 0) {
      this.#controller = new AbortController()
      
      init.signal = this.#controller.signal
      init.signal.addEventListener('abort', e => {
        // Reset the controller for the next request.
        this.#controller = null
      })
      
      setTimeout(() => {
        this.abort()
        this.emit('timeout', `Timed out after ${this.timeout}ms.`)
      }, this.timeout)
    }

    // Apply credentials
    init.credentials = this.withCredentials ? 'include' : 'same-origin'

    // Apply subresource identity
    if (NGN.coalesceb(this.sri, this.integrity)) {
      this.integrity = NGN.coalesce(this.sri, this.integrity)
    }

    // Execute the request
    let result
    fetch(this.#uri.toString(), init)
      .then(response => {
        result = {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          redirected: response.redirected,
          type: response.type,
          url: response.url,
          body,
          responseText: ''
        }

        switch (this.responseType) {
          case 'arraybuffer':
            return response.arrayBuffer()
          case 'document':
          case 'blob':
            return response.blob()
          // case 'json':
          //   return response.json()
        }

        return response.text()
      })
      .then(responseBody => {
        switch (this.responseType) {
          case 'document':
            if (/^text\/.*/.test(responseBody.type)) {
              responseBody.text()
                .then(data => {
                  request.responseText = data
                  callback(request)
                })
                .catch(callback)
              return
            }
          case 'arraybuffer':
          case 'blob':
            request.body = new Blob(responseBody.slice(), { type: NGN.coalesce(result.headers['content-type']) })
            break

          default:
            result.responseText = responseBody
        }
        
        callback(result)
      })
      .catch(e => {
        if (e.name === 'AbortError') {
          callback(new Error(`Timed out after ${this.timeout}ms.`))
        } else {
          callback(e)
        }
      })
    /* end-browser-only */
  }
}
