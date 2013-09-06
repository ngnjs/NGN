var cli = require('optimist'),
    p = require('path'),
    u = require('util'),
    fs = require('fs'),
    http = require('http'),
    sockjs = require('sockjs'),
    child_process = require('child_process'),
    spawn = child_process.spawn,
    fork = child_process.fork,
    procs = {},
    history = [],
    ip = '127.0.0.1';

require('colors');

// Basic CLI
var argv = cli
		  .usage('Usage: ngn develop <file> [--port 4444]')
		  .describe('port','Port number for realtime logging service.')
		  .alias('p','port')
		  .default('p',4444)
		  .argv,
		files = argv._.filter(function(value){return value !== 'develop'}),
		myPID = process.pid;

// Create a log viewer
var connected = false,
    connection = {},
    unhook = function(){},
    ws = sockjs.createServer();

// History Management
var addToHistory = function(data,src){
  history.push((src !== undefined ? src+'~':'')+data);
  if (history.length > 10){
    history.pop();
  }
};

// Broadcast data to all connected sockets
var broadcast = function(data,src){
  if (data.indexOf('GET') === 0 || data.indexOf('POST') === 0){
    return;
  }
  addToHistory(data,src);
  for (var id in connection){
    connection[id].write((src !== undefined ? src+'~':'')+data);
  }
}

// Connection
ws.on('connection', function(conn) {

  // Save Channel
  connection[conn.id] = conn;

  // Send metadata
  var s = [];
  for (var i in procs){
    s.push(procs[i].pid+'~'+i);
  }
  s.splice(0,0,'metadata');
  conn.write(s.join().toString());

  // Send History
  for (var i=0; i < history.length; i++){
    conn.write(history[i]);
  }

  conn.on('close', function() {
    delete connection[conn.id];
    console.log('Log Viewer Closed.')
  });
});

// Standard Output Hook
var hook = function(callback) {
  var old_write = process.stdout.write,
      err_write = process.stderr.write;

  process.stdout.write = (function(write) {
    return function(string, encoding, fd) {
      write.apply(process.stdout, arguments)
      callback(string, encoding, fd)
    }
  })(process.stdout.write);

  console.log = function (data) {
    broadcast(data);
    if (argv.debug){
      u.debug(data);
    }
  };

  console.error = function (data) {
    broadcast(data);
    if (argv.debug){
      u.debug(data);
    }
  };

  console.warn = function (data) {
    broadcast(data);
    if (argv.debug){
      u.debug(data);
    }
  };

  return function() {
    process.stdout.write = old_write;
  //  process.stderr.write = err_write;
  }
}

// Get the local IP Address
var nics = require('os').networkInterfaces();
for(var adapter in nics){
  for (var i=0;i<nics[adapter].length; i++){
    var nic = nics[adapter][i];
    if (nic.family == 'IPv4'){
      ip = nic.address;
      break;
    }
  }
  if (ip !== '127.0.0.1'){
    break;
  }
};

// Web Server
var www = http.createServer(function (req, res) {
// Static Content
var html = fs.readFileSync(p.join(__dirname,'..','..','utilities','logviewer','index.html')),
    css = fs.readFileSync(p.join(__dirname,'..','..','utilities','logviewer','main.css'));
  switch(req.url.toLowerCase()){
    case '/main.css':
      res.writeHead(200, {'Content-Type': 'text/css'});
      res.end(css);
      return;
    default:
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);
      return;
  }
});

www.addListener('upgrade', function(req,res){
  res.end();
});

ws.installHandlers(www, {prefix:'/logviewer'});
www.listen(argv.p, '0.0.0.0',function(){
  console.log(('Log Viewer: http://'+ip+':'+argv.p).cyan.bold);
  unhook = hook(function(string, encoding, fd) {
    if (argv.debug){
      require('util').debug(string);
    }
    broadcast(string);
  });
});


// Cleanup before exiting
var closeAll = function(){
  Object.keys(procs).forEach(function(file){
    broadcast(('Closed development process #'+procs[file].pid).red.bold);
    try {
      procs[file].child.kill();
    } catch(e) {
      require('util').debug('Process '+procs[file].pid+' not found.');
    }
    if (fs.existsSync(procs[file].out)){
      fs.unlinkSync(procs[file].out);
    };
  });
};

process.on('exit',closeAll);
process.on("SIGINT", closeAll);
process.on("SIGTERM", closeAll);
//process.on("uncaughtException", closeAll);

var cwd = p.dirname(p.resolve(argv.develop));
var createMonitoredProcess = function(file,output) {
  // Create output file
  var out = fs.openSync(output,'a');

  // Spawn process
  var child = spawn(process.execPath, ['--harmony',file],
    {
      cwd: cwd,
      env: process.env,
      //stdio: ['ignore',sout,out],
      detached: false
    });

  child.stdout.on('data',function(chunk){
    broadcast(child.pid+'~'+chunk.toString());
    if (argv.debug){
      u.debug(chunk);
    }
  });
  child.stderr.on('data',function(chunk){
    broadcast('ERROR~'+child.pid+'~'+chunk.toString());
    if (argv.debug){
      u.debug(chunk);
    }
  });

  // Track the process ID and log file for easy shutdown
  procs[file] = {child:child,out:output,pid:child.pid};

  // Unreference the parent
  //child.unref();

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
      procs[data.file].child.kill();
      console.log(('Deleted '+data.file).bold.red);
      break;
    case "modified":
      procs[data.file].child.kill();
      console.log(('Rebooted '+data.file.bold+' as process #'+createMonitoredProcess(data.file,procs[data.file].out).pid.toString().bold).cyan);
      break;
    default:
      break;
  }
});

// Initialize the processes
files.forEach(function(file){
  var nm = (p.resolve(file).replace(p.extname(file),'')+'-out.log').replace(/\/|\\|\:/g,'-').replace(/(\-)\1/gi,'-'),
      outfile = p.join(require('os').tmpdir(),nm),
      currfile = p.resolve(file);

  if (!fs.existsSync(currfile)){
    console.log((currfile+' not found.').red.bold);
  } else {
    var child = createMonitoredProcess(currfile,outfile);

    // Tell the worker to monitor the file
    monitor.send(currfile);

    // Console status update
    console.log(('Tracking '.bold+file.bold+' (process #'+child.pid+')').green);
  }
});

// Use TTY and keypress module to maintain an open process
var tty = require('tty');
var keypress = require('keypress');

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