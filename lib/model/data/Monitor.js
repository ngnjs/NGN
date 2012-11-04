require('harmony-reflect');
/**
 * @class NGN.model.data.Monitor
 * This is actually a method used to wrap a harmony proxy around a NGN.model.Model object.
 * This class **will change**. It is a polyfill for ECMAScript 6 Direct Proxies. At the
 * time of this writing, the ES6 standard has not been fully implemented by V8, though a
 * substantial set of functionality has. As V8 and the ES6 specifications introduce more
 * native direct proxy and weakmap support, this class will refelct those changes.
 * @abstract
 * @private
 * @requires harmony-reflect
 */

/**
 * @constructor createProxy
 * Wrap a model object with a harmony proxy.
 * @param {NGN.model.Model} modelObj
 * The model to monitor.
 */
var createProxy = function(modelObj){
	var prx = Proxy(modelObj,{
		// GET trap
		get: function(obj,prop){
			// If the object property references a method, bind it.
			if (typeof obj[prop] === 'function') {
				if (this.refs[prop] !== undefined){
					var val = this.refs[prop].t === Date 
												? new Date(this.refs[prop].v)
												: new RegExp(this.refs[prop].v);
					return val;
				}	
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
				//if (obj[prop] == undefined)
				//	me.fireEvent({warn:'Observed model arrays are slightly different from normal arrays.'})
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
									_obj.pop();
									var delta = {
										type: 'update',
										property: prop,
										array: {
											index: tmp.length-1,
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
						//console.log('delete array'.blue)
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
						//console.log('enumerate'.yellow);
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
									oldValue: null,
									value: tmp[name],
									index: parseInt(name),
									action: _obj[name] == undefined ? 'add' : 'update'
								}
							}
							if (delta.array.action == 'update')
								delta.array.oldValue = _obj[name];
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
			} else if (value instanceof Date){
				//console.log('set date'.magenta,prop,value);
				
				var me = this;
				
				var oldValue = this.refs[prop] == undefined ? undefined : new Date(this.refs[prop].v);
			
				this.refs[prop] = {
					t: Date,
					v: value.toJSON()
				};
				
				var _array = value;
				value = Proxy(Date,{
					get: function(_obj, _prop){
						var tmp = new Date(me.refs[prop].v);
					
						if (typeof tmp[_prop] === 'function'){
							if (['constructor','valueOf','toString'].indexOf(_prop) < 0){
								//TODO: Need to capture parameters
								/*
								var x = tmp[_prop].bind(tmp,2015);
								console.log(":::::::::::::".blue);
								console.log(new Date(x()),_prop);
								console.log(tmp);*/
								modelObj.fireWarning('"'+_prop+'" is not directly supported with this version of change management. Please see the documentation for instructions.');
								return tmp[_prop].bind(tmp);
							} else
								return _obj[_prop].bind(_obj);
						}
						if (_prop == 'name')
							return Date[_prop];
							
						if (_prop == 'inspect')
							return require('util').inspect(tmp);
							
						return tmp;
					},
					set: function(_obj, _prop, _value){
						var tmp = new Date(me.refs[prop].v);
						
					},
					has: function(target,name){
						return Object.prototype.hasOwnProperty.call(target,name);
					},
					hasOwnProperty: function(target,name){
						return Object.prototype.hasOwnProperty.call(target,name);
					},
					defineProperty: function(target,name,dsc){
						return Object.defineProperty(target,name,dsc);
					},
					getOwnPropertyNames: function(target) {
						return Object.getOwnPropertyNames(target);
					},
					getOwnPropertyDescriptor: function(target,name){
						switch(name){
							case 'hasOwnProperty':
								return {value: this.hasOwnProperty, configurable: true};
							default:
								return Reflect.getOwnPropertyDescriptor(target, name);
						}
					}
				});
			} else if (value instanceof RegExp){
				this.refs[prop] = {
					t: RegExp,
					v: value
				};
			} else if (value instanceof __NGN.model.Model || value instanceof __NGN.model.data.Association) {
				/*value.on('change',function(change){
					change.model = value;
					me.fireEvent(change);
				});*/
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
			
			if (delta.type == 'create' && prop == 'id') {
				if (modelObj.idAttribute !== undefined)
					delta.property = modelObj.idAttribute;
				delta.type = 'update';
			}
			
			if (delta.type == 'update')
				delta.oldValue = oldValue || obj[prop];
			
			if (modelObj.beforeDataChange(delta)) {
				if (this.fireBeforeEvent(delta)){
					this.fireEvent(delta);
					if (delta.type == 'create')
						modelObj.fields[prop] = {};
					obj[prop] = value;
				}
			}
		},
		deleteProperty: function(_obj, prop){
			if (prop.split('::')[0] == '___rollback'){
				prop = prop.replace('___rollback::','');
				delete _obj[prop];
				return;
			}
			if (prop !== 'changelog'){
				if (this.refs[prop])
					var	oldValue = this.refs[prop].t === Date ? new Date(this.refs[prop].v) : new RegExp(this.refs[prop].v);
				var delta = {
					type: 'delete',
					property: prop,
					oldValue: oldValue || _obj[prop]
				};
				delete _obj[prop];
				this.fireEvent(delta);
			}
			return false;
		},
		
		inspect: function(obj){
			return require('util').inspect(obj);
		},
		
		fireEvent: function(e) {
			if (e.hasOwnProperty('warn'))
				modelObj.fireWarning(e['warn']);
			else {
				switch (e.type){
					case 'create':
						modelObj.fields[e.property] = modelObj.fields[e.property] || {};
						break;
					case 'delete':
						delete modelObj.fields[e.property];
						break;
				}
				this.changelog.push(e);
				modelObj.onChange(e);
			}
			return undefined;
		},
		
		fireBeforeEvent: function(e) {
			if (e.hasOwnProperty('warn'))
				modelObj.fireWarning(e['warn']);
			else {
				return modelObj.onBeforeChange(e);
			}
			return true;
		},
		
		// Save original model values
		originalValues: {},
		changelog: [],
		refs: {}
	});
	
	return prx;
};

module.exports = createProxy;