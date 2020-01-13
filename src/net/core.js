import URL from './URL.js'
import Request from './Request.js'
import Network from './Network.js'
import Resource from './Resource.js'
import Utility from './Utility.js'

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
Network.prototype.URL = URL

const networkInterfaces = Utility.networkInterfaces
const Library = new Network()

export { Library, networkInterfaces, Request, Resource, URL }
