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

Network.prototype.Resource = Resource

const normalizeUrl = Utility.normalizeUrl
const networkInterfaces = Utility.networkInterfaces
const Library = new Network()

export { Library, normalizeUrl, networkInterfaces, Request, Resource }
