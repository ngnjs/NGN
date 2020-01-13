import NGN from '../core.js'
/* node-only */
import os from 'os'
/* end-node-only */

// TODO: Convert the normalizer to use the standard URL API (browser and Node will be a little different)
// https://developer.mozilla.org/en-US/docs/Web/API/URL

/**
 * @class NGN.NET.Utility
 * A utility library for network communications.
 * @private
 */
class NetworkUtilities {
  #hostname = null
  #networkInterfaces = []
  
  constructor () {
    Object.defineProperties(this, {
      // hostname: NGN.private(null),
      // networkInterfaces: NGN.private([]),
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
    this.#hostname = os.hostname() // eslint-disable-line comma-style
    /* end-node-only */
    /* browser-only */
    this.#hostname = window.location.host // eslint-disable-line comma-style
    /* end-browser-only */

    this.#networkInterfaces = [
      '127.0.0.1'
      , 'localhost' // eslint-disable-line comma-style
      /* node-only */
      , os.hostname() // eslint-disable-line comma-style
      /* end-node-only */
      /* browser-only */
      , window.location.host // eslint-disable-line comma-style
      /* end-browser-only */
    ]

    /* node-only */
    // Retreive local IP's and hostnames
    const data = os.networkInterfaces()
    const interfaces = Object.keys(data)

    for (let i = 0; i < interfaces.length; i++) {
      const iface = data[interfaces[i]]

      for (let x = 0; x < iface.length; x++) {
        if (iface[x].family === 'IPv4') {
          this.#networkInterfaces.push(iface[x].address)
        }
      }
    }
    /* end-node-only */

    this.#networkInterfaces = NGN.dedupe(this.#networkInterfaces)
  }

  get networkInterfaces () {
    return this.#networkInterfaces
  }

  get hostname () {
    return this.#hostname
  }
}

const Utility = new NetworkUtilities()
const networkInterfaces = Utility.networkInterfaces
const hostname = Utility.hostname

export {
  Utility as default,
  networkInterfaces,
  hostname
}
