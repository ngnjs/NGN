import Request from './Request'
import Network from './Network'
import Resource from './Resource'
import * as Utility from './utility'

/**
 * @namespace NGN.NET
 * A library to issue HTTP/S requests.
 * This acts as an AJAX library.
 * @author Corey Butler
 * @singleton
 */

// [INCLUDE: ./Request.js]
// [INCLUDE: ./Network.js]
// [INCLUDE: ./Resource.js]

// NGN.extend('NET', NGN.const(new Network()))
// NGN.NET.normalizeUrl = normalizeUrl

Network.prototype.Resource = Resource

const normalizeUrl = Utility.normalizeUrl
const networkInterfaces = Utility.networkInterfaces
const Library = new Network()

export { Library, normalizeUrl, networkInterfaces, Request, Resource }

// Network = null // eslint-disable-line
// NetworkResource = null // eslint-disable-line
