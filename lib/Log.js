'use strict'

/**
 * @class NGN.Log
 */
class Log {
  constructor (config) {
    config = config || {}
    config = typeof config === 'string' ? { message: config } : config
    config.custom = config.custom || {}

    // name = config.name || 'NgnError';
    // type = config.type || 'TypeError';
    // severity = config.severity || 'minor';
    // message = config.message || 'Unknown Error';
    // category = config.category || 'operational'; // Alternative is "programmer"
    //
    // // Cleanup name
    // name = config.name.replace(/[^a-zA-Z0-9_]/gi,'');
  }
}

module.exports = Log
