const test = require('tape')

// Remember to run `npm run test:build` before executing,
// otherwise the lib directory will not exist.

require('../lib/core')
require('../lib/exception')
require('../lib/eventemitter')

test('NGN.EventEmitter', function (t) {
  t.ok(NGN.EventEmitter !== undefined, 'NGN.EventEmitter exists')
  t.ok(NGN.BUS !== undefined, 'NGN.BUS exists')

  t.end()
})
