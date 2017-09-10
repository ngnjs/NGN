'use strict'

/**
 * @class NGN.DATA.HttpProxy
 * Provides a gateway to remote services such as HTTP and
 * websocket endpoints. This can be used directly to create
 * custom proxies.
 */
class NgnHttpProxy extends NGN.DATA.Proxy {
  constructor (config) {
    config = config || {}

    super(config)

    Object.defineProperties(this, {
      /**
       * @configproperty {string} [url=http://localhost
       * The root URL for making network requests (HTTP/WS/TLS).
       */
      url: NGN.public(config.url || 'http://localhost'),

      /**
       * @config {string} username
       * If using basic authentication, provide this as the username.
       */
      username: NGN.public(config.username || null),

      /**
       * @config {string} password
       * If using basic authentication, provide this as the password.
       */
      password: NGN.public(config.password || null),

      /**
       * @config {string} token
       * If using an access token, provide this as the value. This
       * will override basic authentication (#username and #password
       * are ignored). This sets an `Authorization: Bearer <token>`
       * HTTP header.
       */
      token: NGN.public(config.token || null)
    })
  }

  init (store) {
    super.init(store)
    NGN.inherit(this, store)
  }
}

NGN.DATA.HttpProxy = NgnHttpProxy
// Object.defineProperty(NGN.DATA, 'HttpProxy', NGN.const(NgnHttpProxy))
