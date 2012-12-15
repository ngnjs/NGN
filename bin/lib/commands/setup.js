require('colors');
var Seq = require('seq'),
    OS = require('os'),
    isWin = OS.platform().toLowerCase().indexOf('win') !== -1;

console.log('setup'.green);

// Identify the OS & configure logging to Windows Events or Syslog.
//if ()

// Check for Mechanic & offer to install it if it isn't already.

// Configure Mechanic if installed