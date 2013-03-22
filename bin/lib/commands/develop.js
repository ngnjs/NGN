var util = require('ngn-util'),
    cli = util.require('optimist',true),
    p = require('path'),
    fs = require('fs'),
    child_process = require('child_process'),
    spawn = child_process.spawn,
    fork = child_process.fork,
    procs = {};
util.require('colors',true);

var argv = cli
		  .usage('Usage: ngn keepalive <file>')
		  .argv,
		files = argv._.filter(function(value){return value !== 'develop'}),
		myPID = process.pid;

// Cleanup before exiting
process.on('exit',function(){
  if (process.pid == myPID) {
    Object.keys(procs).forEach(function(file){
      console.log(('Closed development process #'+procs[file].pid).red.bold);
      process.kill(procs[file].pid);
      fs.exists(procs[file].out,function(exists){
        if (exists){
          fs.unlinkSync(procs[file].out);
        }
      });
    });
    process.kill(monitor.pid);
    process.exit();
  }
});
console.log('#',myPID);

var cwd = p.dirname(p.resolve(argv.develop));
var createMonitoredProcess = function(file,output) {
  // Create output file
  var out = fs.openSync(output,'a');

  // Spawn independent process
  var child = spawn(process.execPath, ['--harmony',file],
    {
      cwd: cwd,
      env: process.env,
      stdio: ['ignore',out,out],
      detached: true
    });

  // Unreference the parent
  child.unref();

  // Track the process ID and log file for easy shutdown
  procs[file] = {pid:child.pid,out:output};

  return child;
};

// Launch the worker
var monitor = fork(p.join(p.dirname(process.mainModule.filename),'lib','workers','devmonitor.js'),{
  env: process.env
});

// Handle messages from monitor.
monitor.on('message',function(data){
  switch(data.action){
    case "deleted":
      process.kill(procs[data.file].pid);
      console.log(('Deleted '+data.file).bold.red);
      break;
    case "modified":
      process.kill(procs[data.file].pid);
      var c = createMonitoredProcess(data.file,procs[data.file].out);
      console.log(('Rebooted '+data.file.bold+' as process #'+c.pid.toString().bold).cyan);
      break;
    default:
      break;
  }
});

// Initialize the processes
files.forEach(function(file){
  var nm = (p.resolve(file).replace(p.extname(file),'')+'-out.log').replace(/\/|\\|\:/g,'-').replace(/(\-)\1/gi,'-'),
      outfile = p.join(util.tempDir,nm),
      currfile = p.resolve(file);
      child = createMonitoredProcess(currfile,outfile);

  // Tell the worker to monitor the file
  monitor.send(currfile);

  // Console status update
  console.log(('Developing '.bold+file.bold+' (process #'+child.pid+')').green);

});

// Use TTY and keypress module to maintain an open process
var tty = require('tty');
var keypress = util.require('keypress',true);

// make `process.stdin` begin emitting "keypress" events
keypress(process.stdin);

// listen for the "keypress" event
process.stdin.on('keypress', function (ch, key) {
  if (key && key.ctrl && key.name == 'c') {
    process.exit(0);
  }
});

process.stdin.setRawMode(true);
process.stdin.resume();