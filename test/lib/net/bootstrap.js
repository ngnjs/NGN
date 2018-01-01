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
      let iface = data[interfaces[i]]

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

  // [PARTIAL]

/**
 * @class NGN.NET.Request
 * Represents a network request. This class can be used
 * to create and manipulate HTTP requests, but it does not
 * actually transmit them. To send the request, use NGN.NET#request
 * or one of the many common helper methods.
 * @private
 */
class Request { // eslint-disable-line no-unused-vars
  constructor (cfg) {
    cfg = cfg || {}

    // Require URL and HTTP method
    NGN.objectRequires(cfg, 'url')

    if (NGN.objectHasAny(cfg, 'form', 'json')) {
      NGN.WARN('NET.Request', '"form" and "json" configuration properties are not valid. Use "body" instead.')
    }

    Object.defineProperties(this, {
      UrlPattern: NGN.privateconst(new RegExp('^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?')),

      /**
       * @cfgproperty {string} url (required)
       * The complete URL for the request, including query parameters.
       */
      uri: NGN.private(null),

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
      httpmethod: NGN.private(null),

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
       * @cfg {object} [headers]
       * Optionally supply custom headers for the request. Most standard
       * headers will be applied automatically (when appropriate), such
       * as `Content-Type`, `Content-Length`, and `Authorization`.
       * In Node-like environments, a `User-Agent` will be applied containing
       * the `hostname` of the system making the request. Any custom headers
       * supplied will override headers managed by NGN.NET.
       */
      headers: NGN.public(NGN.coalesceb(cfg.headers)),

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
      requestbody: NGN.public(NGN.coalesce(cfg.body)),

      /**
       * @cfgproperty {string} username
       * A username to authenticate the request with (basic auth).
       */
      user: NGN.private(NGN.coalesceb(cfg.username)),

      /**
       * @cfgproperty {string} password
       * A password to authenticate the request with (basic auth).
       * @readonly
       */
      secret: NGN.private(NGN.coalesceb(cfg.password)),

      /**
       * @cfgproperty {string} accessToken
       * An access token to authenticate the request with (Bearer auth).
       * If this is configured, it will override any basic auth settings.
       */
      bearerAccessToken: NGN.private(NGN.coalesceb(cfg.accessToken)),

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
      isCrossOrigin: NGN.privateconst(function (url) {
        if (NGN.nodelike && networkInterfaces.indexOf(this.host) < 0) {
          return true
        }

        return this.host !== hostname // eslint-disable-line no-undef
      }),

      /**
       * @method applyAuthorizationHeader
       * Generates and applies the authorization header for the request,
       * based on the presence of #username, #password, or #accessToken.
       * @private
       */
      applyAuthorizationHeader: NGN.privateconst(() => {
        if (NGN.coalesceb(this.bearerAccessToken) !== null) {
          this.setHeader('Authorization', `Bearer ${this.bearerAccessToken}`, true)
        } else if (NGN.coalesceb(this.user) && NGN.coalesceb(this.secret)) {
          this.setHeader('Authorization', this.basicAuthToken(this.user, this.secret), true)
        }
      }),

      /**
       * @method basicAuthToken
       * Generates a basic authentication token from a username and password.
       * @return {[type]} [description]
       * @private
       */
      basicAuthToken: NGN.privateconst((user, secret) => {
        let hash

        // Support browser and node binary to base64-ascii conversions
        if (NGN.nodelike) {
          hash = Buffer.from(`${user}:${secret}`, 'binary').toString('base64')
        } else {
          hash = NGN.global.btoa(`${user}:${secret}`)
        }

        return `Basic ${hash}`
      }),

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
      parseUri: NGN.privateconst((uri) => {
        let part = uri.match(this.UrlPattern)
        let url = {
          protocol: NGN.coalesce(part[2], NGN.nodelike ? 'http' : window.location.protocol.replace(':', '')).toLowerCase(),
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
          this.applyAuthorizationHeader()
        }

        url.port = NGN.coalesce(url.hostname.match(/:([0-9]{1,6})/), url.protocol === 'https' ? 443 : 80)

        if (url.hostname.indexOf(':') > 0) {
          url.hostname = url.hostname.split(':')[0]
        }

        if (url.path.charAt(0) !== '/') {
          url.path = `/${url.path}`
        }

        return url
      }),

      uriParts: NGN.private(null),

      /**
       * @cfgproperty {Number} [maxRedirects=10]
       * Set the maximum number of redirects. There is a hard-cap of 25
       * redirects to prevent cyclic requests (endless loop).
       */
      maximumRedirects: NGN.private(10),
      redirectAttempts: NGN.private(0),

      prepareBody: NGN.private(() => {
        // Request body management
        if (this.requestbody !== null) {
          if (this.headers === null) {
            this.headers = {}
          }

          let contentType = NGN.coalesceb(this.headers['Content-Type'], this.headers['content-type'], this.headers['Content-type'])

          if (typeof this.requestbody === 'object') {
            if (NGN.objectHasExactly(this.requestbody, 'form')) {
              let form = this.requestbody.form
              let keys = Object.keys(form)
              let dataString = []

              for (let i = 0; i < keys.length; i++) {
                if (NGN.isFn(form[keys[i]])) {
                  throw new Error('Invalid form data. Form data cannot be a complex data format such as an object or function.')
                } else if (typeof form[keys[i]] === 'object') {
                  dataString.push(`${keys[i]}=${encodeURIComponent(JSON.stringify(form[keys[i]]))}`)
                } else {
                  dataString.push(`${keys[i]}:${encodeURIComponent(form[keys[i]])}`)
                }
              }

              this.requestbody = dataString.join('&')
            } else {
              this.requestbody = JSON.stringify(this.requestbody).trim()
              this.setHeader('Content-Length', this.requestbody.length, false)
              this.setHeader('Content-Type', NGN.coalesceb(contentType, 'application/json'), false)
            }
          }

          if (typeof this.requestbody === 'string') {
            if (contentType !== null) {
              // Check for form data
              let match = /([^=]+)=([^&]+)/.exec(this.requestbody)

              if (match !== null && this.requestbody.trim().substr(0, 5).toLowerCase() !== 'data:' && this.requestbody.trim().substr(0, 1).toLowerCase() !== '<') {
                this.setHeader('Content-Type', 'application/x-www-form-urlencoded', false)
              } else {
                this.setHeader('Content-Type', 'text/plain')

                if (this.requestbody.trim().substr(0, 5).toLowerCase() === 'data:') {
                  // Crude Data URL mimetype detection
                  match = /^data:(.*);/gi.exec(this.requestbody.trim())

                  if (match !== null) {
                    this.setHeader('Content-Type', match[1])
                  }
                } else if (/^<\?xml.*/gi.test(this.requestbody.trim())) {
                  // Crude XML Detection
                  this.setHeader('Content-Type', 'application/xml')
                } else if (/^<html.*/gi.test(this.requestbody.trim())) {
                  // Crude HTML Detection
                  this.setHeader('Content-Type', 'text/html')
                }
              }
            }

            this.setHeader('Content-Type', this.requestbody.length, false)
          } else {
            NGN.WARN('NET.Request.body', `The request body must cannot be ${typeof this.requestbody}. Please provide a string, object, or binary value for the body.`)
          }
        }
      })
    })

    if (cfg.maxRedirects) {
      this.maxRedirects = cfg.maxRedirects
    }

    this.url = cfg.url
    this.method = NGN.coalesceb(cfg.method, 'GET')

    this.prepareBody()

    // Apply authorization if applicable
    if (NGN.coalesce(this.user, this.secret, this.bearerAccessToken) !== null) {
      this.applyAuthorizationHeader()
    }
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
    return NGN.coalesce(this.uriParts.protocol, 'http')
  }

  /**
   * @property {string} host
   * The hostname/domain of the request.
   */
  get host () {
    return NGN.coalesce(this.uriParts.hostname)
  }

  get hostname () {
    return this.host
  }

  /**
   * @property {number} port
   * The port of the remote host.
   */
  get port () {
    return this.uriParts.port
  }

  /**
   * @property {string} path
   * The pathname of the URL.
   */
  get path () {
    return NGN.coalesce(this.uriParts.path, '/')
  }

  /**
   * @property {string} query
   * The raw query string of the URI. To retrieve a key/value list,
   * use #queryParameters instead.
   */
  get query () {
    return NGN.coalesce(this.uriParts.query, '')
  }

  /**
   * @property {object} queryParameters
   * Returns a key/value object containing the URL query parameters of the
   * request, as defined in the #url. The paramter values (represented as keys
   * in this object) may be modified, but not removed (use removeQueryParameter
   * to delete a query parameter). No new query parameters can be added (use
   * setQueryParameter instead).
   * @readonly
   */
  get queryParameters () {
    let params = this.query.split('&')
    let resultSet = {}

    for (let i = 0; i < params.length; i++) {
      let keypair = params[i].split('=')
      let attr = `__qp__${keypair[0]}__qp__`

      Object.defineProperty(resultSet, attr, {
        enumerable: false,
        configurable: false,
        writable: true,
        value: NGN.coalesceb(keypair[1])
      })

      Object.defineProperty(resultSet, keypair[0], {
        enumerable: true,
        configurable: false,
        get: () => { return resultSet[attr] },
        set: (value) => {
          resultSet[attr] = value
          this.setQueryParameter(keypair[0], value, true)
        }
      })
    }

    return resultSet
  }

  /**
   * @method hash
   * The hash part of the URL (i.e. everything after the trailing `#`).
   */
  get hash () {
    return NGN.coalesce(this.uriParts.hash, '')
  }

  /**
   * @property {string} url
   * The URL where the request will be sent.
   */
  get url () {
    return this.uri
  }

  set url (value) {
    if (NGN.coalesceb(value) === null) {
      NGN.WARN('NET.Request.url', 'A blank URL was identified for a request.')
    }

    this.uri = normalizeUrl(value.trim())
    this.uriParts = this.parseUri(this.uri)
  }

  get method () {
    return this.httpmethod
  }

  set method (value) {
    if (this.httpmethod === value) {
      return
    }

    if (NGN.coalesceb(value) === null) {
      NGN.WARN('NET.Request.method', 'No HTTP method specified.')
    }

    value = value.trim().toUpperCase()

    if (HttpMethods.indexOf(value) < 0) {
      NGN.WARN('NET.Request.method', `A non-standard HTTP method was recognized in a request: ${value}.`)
    }

    this.httpmethod = value
  }

  get body () {
    return this.requestbody
  }

  set body (value) {
    this.requestbody = value
    this.prepareBody()
  }

  /**
   * @property {boolean} crossOriginRequest
   * Indicates the request will be made to a domain outside of the
   * one hosting the request.
   */
  get crossOriginRequest () {
    return this.isCrossOrigin(this.uri)
  }

  /**
   * @property {string} username
   * The username that will be used in any basic authentication operations.
   */
  get username () {
    return NGN.coalesce(this.user)
  }

  set username (user) {
    user = NGN.coalesceb(user)

    if (this.user !== user) {
      this.user = user

      if (NGN.coalesceb(this.secret) !== null) {
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

    if (this.secret !== secret) {
      this.secret = secret

      if (NGN.coalesceb(this.user) !== null) {
        this.applyAuthorizationHeader()
      }
    }
  }

  /**
   * @property {string} accessToken
   * Supply a bearer access token for basic authenticaiton operations.
   * @setonly
   */
  set accessToken (token) {
    token = NGN.coalesceb(token)

    if (this.bearerAccessToken !== token) {
      this.bearerAccessToken = token
      this.applyAuthorizationHeader()
    }
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

    if (this.headers === null || this.headers[key] === undefined || overwriteExisting) {
      if (this.headers === null) {
        this.headers = {}
      }

      this.headers[key] = value
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
    if (this.headers === null) {
      return undefined
    }

    if (!this.headers.hasOwnProperty(key.toLowerCase())) {
      return undefined
    }

    return this.headers[key.toLowerCase()]
  }

  /**
   * @method removeHeader
   * Removes a header from the request. Nothing happens if the header does
   * not exist.
   * @param  {string} header
   * The header to remove.
   */
  removeHeader (key) {
    if (this.headers !== null) {
      delete this.headers[key.toLowerCase()]
      delete this.headers[key]
    }
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
    let re = new RegExp("^.*(\\?|&)(" + key + ".*)(&.*)$|^.*(\\?|&)(" + key + ".*)$", 'i') // eslint-disable-line quotes
    let exists = (re.exec(this.uri) !== null)
    let match

    if (exists) {
      if (!overwriteExisting) {
        return
      }

      match = re.exec(this.uri)

      if (match !== null) {
        this.url = this.uri.replace(`${NGN.coalesceb(match[5], match[2])}`, `${key}${value !== null ? '=' + encodeURIComponent(value) : ''}`)
      }
    } else {
      this.url = `${this.uri}${this.query.length === 0 ? '?' : '&'}${key}${value !== null ? '=' + encodeURIComponent(value) : ''}`
    }
  }

  /**
   * @method removeQueryParameter
   * Remove a query parameter from the request URI.
   * @param {string} key
   */
  removeQueryParameter (key) {
    this.url = this.uri.replace(new RegExp(`${key}=(.[^&]+)|\\?${key}|&${key}`, 'gi'), '')
  }

  startMonitor () {
    if (this.timer === null) {
      this.timer = setTimeout(() => {
        throw new Error('Timed out retrieving ' + this.url)
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

    // Run request in Node-like environments
    if (NGN.nodelike) {
      // Support local file system retrieval in node-like environments.
      // This short-circuits the request and reads the file system instead.
      if (this.protocol === 'file') {
        if (!NGN.isFn(callback)) {
          throw new Error('A callback is required when retrieving system files in a node-like environment.')
        }

        let response = {
          status: require('fs').existsSync(this.uri.replace('file://', '')) ? 200 : 400
        }

        response.responseText = response.status === 200 ? require('fs').readFileSync(this.uri.replace('file://', '')).toString() : 'File does not exist or could not be found.'

        return callback(response)
      }

      const http = this.protocol === 'https' ? require('https') : require('http')

      let params = NGN.coalesceb(this.query)
      let reqOptions = {
        hostname: this.hostname,
        port: this.port,
        method: this.method,
        headers: this.headers,
        path: this.path
      }

      if (params !== null) {
        reqOptions.path = `${this.path}?${params}`
      }

      const req = http.request(reqOptions, (response) => {
        response.setEncoding('utf8')

        let body = ''
        response.on('data', (chunk) => {
          body += chunk
        })

        response.on('end', () => {
          switch (response.statusCode) {
            case 301:
            case 302:
            case 307:
            case 308:
              if (this.redirectAttempts > this.maxRedirects) {
                this.redirectAttempts = 0

                this.stopMonitor()

                return callback({ // eslint-disable-line standard/no-callback-literal
                  status: 500,
                  statusText: 'Too many redirects',
                  responseText: 'Too many redirects',
                  responseXML: 'Too many redirects',
                  readyState: 4
                })
              }

              if (response.headers.location === undefined) {
                this.stopMonitor()

                return callback({ // eslint-disable-line standard/no-callback-literal
                  status: 502,
                  statusText: 'Bad Gateway',
                  responseText: 'Bad Gateway',
                  responseXML: 'Bad Gateway',
                  readyState: 4
                })
              }

              this.redirectAttempts++
              this.url = response.headers.location

              return this.send(callback)

            default:
              this.stopMonitor()

              return callback({ // eslint-disable-line standard/no-callback-literal
                status: response.statusCode,
                statusText: NGN.coalesce(response.statusText),
                responseText: body,
                responseXML: body,
                readyState: 4
              })
          }
        })
      })

      req.on('error', (err) => {
        this.stopMonitor()

        if (NGN.isFn(callback)) {
          callback({ // eslint-disable-line standard/no-callback-literal
            status: 400,
            statusText: err.message,
            responseText: err.message,
            responseXML: err.message,
            readyState: 0
          })
        } else {
          throw err
        }
      })

      this.startMonitor()

      if (this.body) {
        req.write(this.body)
      }

      req.end()
    } else {
      let xhr = new XMLHttpRequest()
      let responded = false
      let me = this

      // Apply readystate change handler
      xhr.onreadystatechange = function () {
        if (responded) {
          return
        }

        if (xhr.readyState === XMLHttpRequest.DONE) {
          responded = true

          if (xhr.status === 0) {
            NGN.WARN(`Request Error: ${me.method} ${me.url} (likely a CORS issue).`)
          }

          if (NGN.isFn(callback)) {
            callback(xhr)
          }
        }
      }

      // Apply error handler
      xhr.onerror = function (e) {
        NGN.WARN('NET.error', e)

        if (!responded && NGN.isFn(callback)) {
          callback(xhr)
        }

        responded = true
      }

      xhr.ontimeout = function (e) {
        responded = true
        callback(xhr)
      }

      xhr.timeout = this.timeout

      // Open the request
      xhr.open(this.method, this.url, true)

      // Apply withCredentials
      xhr.withCredentials = this.withCredentials

      // Apply Request Headers
      if (this.headers !== null) {
        let headers = Object.keys(this.headers)
        for (let i = 0; i < headers.length; i++) {
          xhr.setRequestHeader(headers[i], this.headers[headers[i]])
        }
      }

      // Write the body (which may be null) & send the request
      xhr.send(body)
    }
  }
}

  // [PARTIAL]

class Network { // eslint-disable-line
  constructor () {
    Object.defineProperties(this, {
      /**
       * @method parseRequestConfiguration
       * Prepare common configuration attributes for a request.
       * @return {NGN.NET.Request}
       * @private
       */
      parseRequestConfiguration: NGN.private((cfg, method = 'GET') => {
        if (typeof cfg === 'string') {
          cfg = {
            url: cfg
          }
        }

        cfg = cfg || {}
        cfg.method = method
        cfg.url = NGN.coalesceb(cfg.url, hostname) // eslint-disable-line no-undef

        return new Request(cfg)
      }),

      // Returns a scoped method for sending the request, after preparing it.
      makeRequest: NGN.private((method) => {
        const me = this

        return function () {
          let args = NGN.slice(arguments)
          let callback

          if (NGN.isFn(args[args.length - 1])) {
            callback = args.pop()
          }

          args.push(method)

          let request = me.parseRequestConfiguration(...args)

          // Send the request
          me.send(request, callback)
        }
      }),

      // Helper aliases (undocumented)
      OPTIONS: NGN.privateconst(this.options.bind(this)),
      HEAD: NGN.privateconst(this.head.bind(this)),
      GET: NGN.privateconst(this.get.bind(this)),
      POST: NGN.privateconst(this.post.bind(this)),
      PUT: NGN.privateconst(this.put.bind(this)),
      DELETE: NGN.privateconst(this.delete.bind(this)),
      TRACE: NGN.privateconst(this.trace.bind(this)),
      JSON: NGN.privateconst(this.json.bind(this)),
      JSONP: NGN.privateconst(this.jsonp.bind(this))
    })
  }

  get Request () {
    return Request
  }

  /**
   * @method request
   * Send a request. In most cases, it is easier to use one of the built-in
   * request functions (#get, #post, #put, #delete, #json, etc). This method
   * is available for creating custom requests.
   * @param  {Object} configuration
   * Provide a #NGN.NET.Request configuration.
   * @param  {Function} callback
   * The callback to execute when the request is complete.
   */
  request (cfg, callback) {
    cfg = cfg || {}
    cfg.method = NGN.coalesceb(cfg.method, 'GET')

    if (NGN.isFn(this[cfg.method])) {
      this.makeRequest(cfg.method)(...arguments)
    } else {
      this.send(new Request(cfg), callback)
    }
  }

  /**
   * @method options
   * Issue a `OPTIONS` request.
   * @param {string|object} url
   * The URL to issue the request to, or a configuration object.
   * The configuration object accepts all of the #NGN.NET.Request
   * configuration options (except method, which is defined automatically).
   * @param {Function} callback
   * A callback method to run when the request is complete.
   * This receives the response object as the only argument.
   */
  options () {
    this.makeRequest('OPTIONS').apply(this, arguments)
  }

  /**
   * @method head
   * Issue a `HEAD` request.
   * @param {string|object} url
   * The URL to issue the request to, or a configuration object.
   * The configuration object accepts all of the #NGN.NET.Request
   * configuration options (except method, which is defined automatically).
   * @param {Function} callback
   * A callback method to run when the request is complete.
   * This receives the response object as the only argument.
   */
  head () {
    this.makeRequest('HEAD').apply(this, arguments)
  }

  /**
   * @method get
   * Issue a `GET` request.
   * @param {string|object} url
   * The URL to issue the request to.
   * The configuration object accepts all of the #NGN.NET.Request
   * configuration options (except method, which is defined automatically).
   * @param {Function} callback
   * A callback method to run when the request is complete.
   * This receives the response object as the only argument.
   */
  get () {
    this.makeRequest('GET').apply(this, arguments)
  }

  /**
   * @method post
   * Issue a `POST` request.
   * @param {string|object} url
   * The URL to issue the request to.
   * The configuration object accepts all of the #NGN.NET.Request
   * configuration options (except method, which is defined automatically).
   * @param {Function} callback
   * A callback method to run when the request is complete.
   * This receives the response object as the only argument.
   */
  post () {
    this.makeRequest('POST').apply(this, arguments)
  }

  /**
   * @method put
   * Issue a `PUT` request.
   * @param {string|object} url
   * The URL to issue the request to.
   * The configuration object accepts all of the #NGN.NET.Request
   * configuration options (except method, which is defined automatically).
   * @param {Function} callback
   * A callback method to run when the request is complete.
   * This receives the response object as the only argument.
   */
  put () {
    this.makeRequest('PUT').apply(this, arguments)
  }

  /**
   * @method delete
   * Issue a `DELETE` request.
   * @param {string|object} url
   * The URL to issue the request to.
   * The configuration object accepts all of the #NGN.NET.Request
   * configuration options (except method, which is defined automatically).
   * @param {Function} callback
   * A callback method to run when the request is complete.
   * This receives the response object as the only argument.
   */
  delete () {
    this.makeRequest('DELETE').apply(this, arguments)
  }

  /**
   * @method trace
   * Issue a `TRACE` request. This is a debugging method, which
   * echoes input back to the user. It is a standard HTTP method,
   * but considered a security risk by many practioners and may
   * not be supported by remote hosts.
   * @param {string|object} url
   * The URL to issue the request to.
   * The configuration object accepts all of the #NGN.NET.Request
   * configuration options (except method, which is defined automatically).
   * @param {Function} callback
   * A callback method to run when the request is complete.
   * This receives the response object as the only argument.
   */
  trace () {
    NGN.WARN('NGN.NET.Request.method', 'An HTTP TRACE request was made.')
    this.makeRequest('TRACE').apply(this, arguments)
  }

  /**
   * @method json
   * This is a shortcut method for creating a `GET` request and
   * auto-processing the response body into a JSON object.
   * @param  {string} url
   * The URL to issue the request to.
   * @param  {Function} callback
   * This receives a JSON response object from the server.
   * @param {Error} callback.error
   * If the request cannot be completed for any reason, this argument will be
   * populated with the error. If the request is successful, this will be `null`.
   * @param {Object} callback.data
   * The JSON response from the remote URL.
   */
  json (url, callback) {
    if (!NGN.isFn(callback)) {
      throw new Error('NGN.NET.json requires a callback method.')
    }

    // Request method is "GET"
    let request = this.parseRequestConfiguration({url})

    this.preflight(request)

    request.send((response) => {
      try {
        let responseData = JSON.parse(response.responseText)
        callback(null, responseData)
      } catch (e) {
        e.response = NGN.coalesce(response.responseText)
        callback(e, null)
      }
    })
  }

  /**
   * @method jsonp
   * Execute a request via JSONP. JSONP is only available in browser
   * environments, since it's operation is dependent on the existance of
   * the DOM. However; this may work with some headless browsers.
   * @param {string} url
   * The URL of the JSONP endpoint.
   * @param {function} callback
   * Handles the response.
   * @param {Error} callback.error
   * If an error occurred, this will be populated. If no error occurred, this will
   * be null.
   * @param {object|array} callback.response
   * The response.
   * @environment browser
   */
  jsonp (url, callback) {
    if (NGN.nodelike) {
      NGN.WARN('NET.Request', 'An unsupported JSONP request was made.')
      callback(new Error('JSONP unsupported in Node-like environments.'))
    } else {
      const fn = 'jsonp_callback_' + Math.round(100000 * Math.random())

      window[fn] = (data) => {
        delete window[fn]

        document.body.removeChild(script)

        return callback(null, data)
      }

      let script = document.createElement('script')

      script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + fn

      script.addEventListener('error', (e) => {
        delete window[fn]

        return callback(new Error('The JSONP request was blocked. This may be the result of an invalid URL, cross origin restrictions, or the remote server may not be online.'))
      })

      document.body.appendChild(script)
    }
  }

  // Apply a preflight request option to the network request.
  send (request, callback) {
    this.preflight(request)
    request.send(callback)
  }

  /**
   * @method preflight
   * This is a no-op method that runs before a request is sent.
   * This exists specicially to be overridden by class extensions.
   */
  preflight (request) {}
}

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


  NGN.extend('NET', NGN.const(new Network()))

  // Network = null // eslint-disable-line
  // NetworkResource = null // eslint-disable-line
})()