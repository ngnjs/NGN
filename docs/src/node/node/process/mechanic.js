/**
 * @class process.mechanic
 * The `mechanic` property is added to the global `process` property in node.js.
 * It represents the connection between a running process and the [NGN Mechanic](#!/guide/mechanic)
 * service that manages the server/network.
 * 
 * Most of the properties are read-only in this feature, but they can be configured
 * using NGN.core.Process or NGN#run.
 */

/**
 * @property {Number} [port=55555]
 * The port on which [NGN Mechanic](#!/guide/mechanic) is running.
 * @readonly
 */
      
/**
 * @property {String} [server=127.0.0.1]
 * The server on which [NGN Mechanic](#!/guide/mechanic) is running.
 * @readonly
 */

/**
 * @property {Boolean} [remote=false]
 * When using [NGN Mechanic](#!/guide/mechanic), this can
 * be set to force Mechanic to recognize the process as
 * a remote running process.
 * @readonly 
 */

/**
 * @property {Boolean} [internal=true]
 * Indicator that NGN Mechanic is hosted on the same server
 * @readonly
 */

/**
 * @property {String} [key=null]
 * The process key used to sign into [NGN Mechanic](#!/guide/mechanic). 
 * @readonly
 */

/**
 * @property {Number} [healthcheckFrequency=5]
 * The interval (in seconds) on which the process sends a health report to [NGN Mechanic](#!/guide/mechanic).  
 * @readonly
 */

/**
 * @method broadcastEvent
 * Send an event to [NGN Mechanic](#!/guide/mechanic).
 * @param {String} eventName
 * @param {Any} meta
 * Metadata associated with the event.
 */

/**
 *@event eventFailure
 * Fired when the process unsuccessfully sends an event to [NGN Mechanic](#!/guide/mechanic).
 * This event is only fired if a connection to an NGN Mechanic process exists, but cannot be
 * completed. The most common use case is when an NGN process has established a connection
 * but has not yet registered/authenticated with the NGN Mechanic service.
 *@returns {Object}
 * The resulting object contains two attributes:
 * - *name*: The event name that failed.
 * - *meta*: Any metadata fired by the event. 
 */