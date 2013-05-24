var p = require('path'),
    fs = require('fs'),
    child_process = require('child_process'),
    files = {};

// Handle new monitoring request from parent
process.on('message',function(data){
  files[data] && delete files[data];
  files[data] = fs.watchFile(data,{persistent: true, interval: 1007},function(curr, prev){
    if (curr == null && prev == null){
      return;
    }
    // Handle file deletion
    if (curr.nlink == 0){
      try {
        process.send({action:'deleted',file:data});
      } catch (e){
        if (e.message.indexOf('closed') < 0){
          throw e;
        }
      }
      return;
    }
    // Handle changes
    if (curr.mtime.getTime() !== prev.mtime.getTime()){
      try {
        process.send({action:'modified',file:data});
      } catch (e){
        if (e.message.indexOf('closed') < 0){
          throw e;
        }
      }
    }
  });
});