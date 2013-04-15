// Add colors globally
require('colors');

// Basic requirements
var fs = require('fs'),
	  p	= require('path'),
    INCLUDE_MODELS = process.execArgv.indexOf('--harmony') > -1;

// Niceties
process.title = 'NGN';

// Add the utilities
Object.defineProperty(global,'UTIL',{
  enumerable: false,
  writable: false,
  configurable: false,
  value: require('./UTIL')
});

// Basic namespace structure with initial class
var namespace = {};

Object.defineProperty(namespace,'Class',{
  enumerable: false,
  writable: true,
  value: require('./NGN.Class')
});

// Add all known and available modules to the namespace.
var modules = require('../bin/modules.json').modules;
for (var _mod in modules){
  var mod = p.join(__dirname,'..','..',_mod);
  if (_mod !== 'ngn-core' && fs.existsSync(mod)){
    try {
      console.log(mod.magenta)
      var objs = require(mod)(namespace,UTIL);
      for (var o in objs){
        Object.defineProperty(namespace,o,{
          enumerable: true,
          writable: true,
          value: objs[o]
        });
        if (!namespace.hasOwnProperty('availablemodules')){
          Object.defineProperty(namespace,'availablemodules',{
            enumerable: true,
            writable: true,
            configurable: false,
            value: {}
          });
        }
        if (!namespace.availablemodules.hasOwnProperty(_mod)){
          Object.defineProperty(namespace.availablemodules,_mod,{
            enumerable: true,
            writable: false,
            configurable: false,
            value: modules[_mod]
          });
        }
      }
    } catch (e) {
      console.error(e)
    }
  }
};

// Export the module as a global variable
var NGN = require('./NGN');
Object.defineProperty(global,'NGN',{
  enumerable: false,
  writable: true,
  configurable: false,
  value: new NGN({namespace:namespace})
});

// Create Primary Pointers
Object.defineProperty(global,'ngn',{
  enumerable: true,
  get:    function(){ return global.NGN;}
});

delete namespace;