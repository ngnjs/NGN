import Request from './Request'
import Network from './Network'
import Resource from './Resource'
import Utility from './Utility'

/**
 * @namespace NGN.NET
 * A library to issue HTTP/S requests.
 * This acts as an AJAX library.
 * @author Corey Butler
 * @singleton
 */

Network.prototype.Resource = Resource
Network.prototype.Plugin = Network
Network.prototype.Utility = Utility

const normalizeUrl = Utility.normalizeUrl
const networkInterfaces = Utility.networkInterfaces
const Library = new Network()

export { Library, normalizeUrl, networkInterfaces, Request, Resource }
