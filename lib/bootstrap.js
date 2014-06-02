/* global UTIL */

// Add colors globally
require('colors');

// Basic requirements
var fs = require('fs'),
    p  = require('path');

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

// Add the base Class to the namespace
Object.defineProperty(namespace,'Class',{
  enumerable: true,
  writable: true,
  value: require('./Class')
});

// Add all known and available modules to the namespace.
var modules = require('../package.json').ngn.modules;
for (var _mod in modules){
  var mod = p.join(__dirname,'..','..',_mod);
  if (fs.existsSync(mod)){
    try {
      var objs = require(mod)(namespace,UTIL);
      for (var o in objs){
        if (objs.hasOwnProperty(o)){
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
      }
    } catch (e) {
      console.error(e);
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
  get: function(){
    return global.NGN;
  }
});

delete namespace;

if (global.NGN.hasOwnProperty('Log')){
  global.NGN.Log = new global.NGN.Log();
}

// Capture unhandled errors
process.on('uncaughtException',function(e){
  console.error(e);
  throw e;
});

require('./Errors');
