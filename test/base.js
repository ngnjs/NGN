'use strict'

var test = require('tape')

require('../')

test('Primary Namespace', function (t) {
  t.ok(NGN !== undefined, 'NGN is defined globally.')
  t.ok(ngn !== undefined, 'ngn is defined globally.')
  t.ok(NGN.version === require('../package.json').version, 'Version number is available.')
  t.end()
})
