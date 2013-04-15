var obj = {};

// Utilities
Object.defineProperties(obj,{

  // STATICS
  testing: {
    enumerable: false,
    writable: true,
    configurable: false,
    value: false
  },

  _cfg:{
    enumerable: false,
    writable: true,
    value: null
  },


  // METHODS
  bufferjoiner: {
    enumerable: true,
    get: function(){return require('./bufferjoiner');}
  },

  watch: {
    enumerable: false,
    get: function(){
      return require('watch');
    }
  },

  wrench: {
    enumerable: false,
    get: function(){
      return require('wrench');
    }
  },

  writeableDir: {
    enumerable: false,
    writable: true,
    value: function(dir){
      var fs = require('fs');
      if (!dir || !fs.existsSync(dir))
        return undefined;

      if (!fs.statSync(dir).isDirectory())
        return undefined;

      /*var testFile = dir+'/'+;
      try {
        fs.writeFileSync(testFile, ' ');
        fs.unlinkSync(testFile);
        return dir;
      } catch (e) {
        return undefined;
      }*/
     return dir;
    }
  },

  tempDir: {
    enumerable: true,
    writable: false,
    value: require('os').tmpDir()
  },

  notImplemented: {
    enumerable: true,
    writable: false,
    configurable: false,
    value: function(filename,msg){
      if (!this.testing){
        console.log('\nNOT IMPLEMENTED:'.bold.cyan);
        console.log((filename+':').cyan,msg.yellow,'\n');
      }
    }
  },

  sleep: {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function(period){
      var st = new Date().getTime();
      while(new Date().getTime() <= st+(period*1000)){}
      return;
    }
  }

});

module.exports = obj;