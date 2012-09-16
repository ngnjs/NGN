/**
 * @class NGN.model.ModelObserver
 * This is actually a method used to wrap a harmony proxy around a NGN.model.Model object.
 * This class **will change**. It is a polyfill for ECMAScript 6 Direct Proxies. At the
 * time of this writing, the ES6 standard has not been fully implemented by V8, though a
 * substantial set of functionality has. As V8 and the ES6 specifications introduce more
 * native direct proxy and weakmap support, this class will refelct those changes.
 * @abstract
 * @private
 */
require('harmony-reflect');
/**
 * @constructor
 * Wrap a model object with a harmony proxy.
 * @param {NGN.model.Model}
 */
module.exports = function(modelObj){
	
	return Proxy(modelObj,{
		// GET trap
		get: function(obj,prop){

			// If the object property references a method, bind it.
			if (typeof obj[prop] === 'function') {
				return obj[prop].bind(obj);
			}
			
			// If the object property is not a part of the core object or
			// the proxy, and it is not a node.js inspect() requiest, fire a warning.
			if (this[prop] == undefined && obj[prop] == undefined && prop !== 'inspect')
				obj.fireWarning(prop+' of '+obj.type+' was requested but does not exist.');
	
			// Support the nodejs inspector
			else if (prop == 'inspect')
				return this.inspect(obj);
	
			// Return the property for the object, proxy, or undefined.
			return obj[prop];
		},
		
		// SET trap
		set: function(obj,prop,value){
			
			var me = this;
			
			// Create an array proxy for any array values
			if (value instanceof Array) {
				if (obj[prop] == undefined)
					me.fireEvent({warn:'Observed model arrays are slightly different from normal arrays.'})
				var _array = value;
				value = Proxy(value,{
					get: function(_obj, name){

						if (['shift','pop','reverse','sort','splice'].indexOf(name) >= 0){
							switch(name.toString().toLowerCase()){
								case 'shift':
									var val = _obj.slice(0)[0];
									delete _obj[0];
									var delta = {
										type: 'update',
										property: prop,
										array: {
											index: 0,
											value: val,
											action: 'delete'
										}
									};
									me.fireEvent(delta);
									return function(){return val;}
								case 'pop':
									var tmp = _obj.slice(0)
									var val = tmp[tmp.length-1];
									delete _obj[_obj.length-1];
									var delta = {
										type: 'update',
										property: prop,
										array: {
											index: 0,
											value: val,
											action: 'delete'
										}
									};
									me.fireEvent(delta);
									return function(){return val;}
								/*case 'unshift':
									console.log('Unshifting'.yellow,arguments,this);
									return _obj[name].bind(_obj);
									break;*/
								case 'splice':
									me.fireEvent({warn:'The splice method does not fully support change management or rollback.'});
									break;
								case 'reverse':
									if (_obj.length > 1){
										var delta = {
											type: 'update',
											property: prop,
											array: {
												action: 'reverse'
											}
										};
										me.fireEvent(delta);
									}
									break;
								case 'sort':
									if (_obj.length > 1){
										var delta = {
											type: 'update',
											property: prop,
											array: {
												action: 'sort'
											}
										};
										me.fireEvent(delta);
									}
									break;
								default:
									return _obj[name]
							}
						}
	
						if (typeof _obj[name] === 'function' && ['push','pop','shift','unshift','concat','splice'].indexOf(name) < 0)
							return _obj[name].bind(_obj); 
						
						// Support the nodejs inspector
						if (name == 'inspect')
							return this.inspect(_obj);
	
						return _obj[name];
					},
					deleteProperty: function(target,name){
						console.log('delete array'.blue)
						var delta = {
							type: 'update',
							property: prop,
							array: {
								index: parseInt(name),
								action: 'delete'
							}
						}
						me.fireEvent(delta);
					},
					enumerate: function(){
						console.log('enumerate'.yellow);
						return _obj;
					},
					set: function(_obj, name, val){
						if (!isNaN(name)){
							var tmp = _obj.slice(0);
							tmp[name] = val;
							var delta = {
								type: 'update',
								property: prop,
								array: {
									value: val,
									index: parseInt(name),
									action: _obj[name] == undefined ? 'add' : 'update'
								}
							}
							_obj[name] = val;
							me.fireEvent(delta);
						} else
							_obj[name] = val;
					},
					inspect: function(_obj){
						//console.log('Inspector Gadget'.yellow.bold,obj,obj instanceof Array);
						return require('util').inspect(_obj);
					}
				});
			}
			
			// Handle rollback variable requests
			if (prop.split('::')[0] == '___rollback'){
				prop = prop.replace('___rollback::','');
				obj[prop] = value;
				return;				
			}
	
			var delta = {
				type: obj[prop] == undefined ? 'create' : 'update',
				property: prop,
				value: _array || value
			};
			
			if (delta.type == 'update')
				delta.oldValue = obj[prop];
			
			this.fireEvent(delta);
			obj[prop] = value;
		},
		deleteProperty: function(_obj, prop){
			if (prop.split('::')[0] == '___rollback'){
				prop = prop.replace('___rollback::','');
				delete _obj[prop];
				return;
			}
			if (prop !== 'changelog'){
				var delta = {
					type: 'delete',
					property: prop,
					oldValue: _obj[prop]
				};
				delete _obj[prop];
				this.fireEvent(delta);
			}
			return false;
		},
		
		inspect: function(obj){
			return require('util').inspect(obj);
		},
		
		enumerate: function(target){
			console.log('enumerate'.red.bold);
		},
		
		fireEvent: function(e) {
			if (e.hasOwnProperty('warn'))
				modelObj.fireWarning(e['warn']);
			else {
				this.changelog.push(e);
				modelObj.onChange(e);
			}
			return undefined;
		},
		
		// Save original model values
		originalValues: {},
		changelog: []
	});
};