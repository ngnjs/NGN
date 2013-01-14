var Base = require('../NGN.core');

/**
 * @class NGN.core.Command
 * A light utility wrapper around node's child_process.
 * @private
 * @extends NGN.core
 */
var Class = Base.extend({
	
	constructor: function() {
		
		Class.super.constructor.call();
		
		Object.defineProperties(this,{
			
			_child: {
				value:		require('child_process'),
				enumerable:	false,
				writable:	false
			}
			
		});
		
		this.merge(this._child);
		
		// Add event listeners
		var _e = [
			'exit',
			'close',
			'disconnect',
			'message',
			'response'
		];
		
		for(var i=0;i<_e.length;i++)
			this.on(_e[i],this['on'+_e[i].substr(0,1).toUpperCase()+_e[i].substr(1,_e.substr.length-1)])
	},
	
	/**
	 * @method exec
	 * Execute a command using a [node child_process](http://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback).
	 * @param {String} cmd
	 * Command
	 * @param {Object} [options]
	 * Options
	 * @param {Function} callback
	 * The callback method to execute upon completion of the command. Three arguments are passed: `error`, `stdout`, and `stderr`.
	 */
	
	/**
	 * @event exit
	 * Fired when the process exits.
	 * @returns {NGN.core.Command}
	 */
	onExit: function(){
		this.emit('exit',this);
	},
	
	/**
	 * @event close
	 * Fired when the process closes.
	 * @returns {NGN.core.Command}
	 */
	onClose: function(){
		this.emit('close',this);
	},
	
	/**
	 * @event disconnect
	 * Fired when the process disconnects.
	 * @returns {NGN.core.Command}
	 */
	onDisconnect: function(){
		this.emit('disconnect',this);
	},
	
	
	/**
	 * @event message
	 * Fired when the process responds with a message. This differs from #response based on what is returned.
	 * @returns {NGN.core.Command}
	 */
	onMessage: function(){
		this.emit('message',this);
		this.onResponse();
	},
	
	
	/**
	 * @event response
	 * Fired when the process responds with a message. This differs from #message based on wht is returned.
	 * @returns {Object}
	 * The object contains two keys. The first, called `cmd` contains the NGN.core.Command object. The second
	 * , called `response`, is an object containing the stream output.
	 * 
	 * 		{
	 * 			cmd: {NGN.core.Command},
	 * 			response: {...}
	 * 		}
	 * The response is whatever 
	 */
	onResponse: function(response){
		this.emit('response',{cmd:this,response:response||null});
	}
	
});

module.exports = Class;