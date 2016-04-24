'use strict'

let test = require('tape')
let path = require('path')
let os = require('os')

test('Utility', function (t) {
  require('../')

  // Sanity checks
  t.ok(typeof NGN.util.createTunnel === 'function', 'NGN.util.createTunnel is a valid JS method.')
  t.ok(typeof NGN.util.pathExists === 'function', 'NGN.util.pathExists is a valid JS method.')
  t.ok(typeof NGN.util.pathReadable === 'function', 'NGN.util.pathReadable is a valid JS method.')
  t.ok(typeof NGN.util.pathWritable === 'function', 'NGN.util.pathWritable is a valid JS method.')
  t.ok(typeof NGN.util.fileExecutable === 'function', 'NGN.util.fileExecutable is a valid JS method.')

  t.ok(NGN.util.pathExists(path.resolve('./test/files/test.txt')), 'NGN.util.pathExists returned true.')
  t.ok(NGN.util.pathReadable(path.resolve('./test/files/test.txt')), 'NGN.util.pathReadable returned true.')
  t.ok(NGN.util.pathWritable(path.resolve('./test/files/test.txt')), 'NGN.util.pathWritable returned true.')

  if (os.platform() !== 'win32') {
    t.ok(!NGN.util.fileExecutable(path.resolve('./test/files/test.txt')), 'NGN.util.fileExecutable returned false.')
  }

  t.end()
})
