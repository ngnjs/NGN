const test = require('tap').test

// Remember to run `npm run test:build` before executing,
// otherwise the lib directory will not exist.

require('../../lib/ngn')

NGN.BUS.on(NGN.WARNING_EVENT, function (msg) {
  console.log('\n\n\n\n:::WARNING:::', msg)
})

test('NGN.DATA.UTILITY', function (t) {
  var data = {
    a: 1,
    b: true,
    c: 'three'
  }

  // Data Serialization
  var originalData = Object.assign({}, data)

  data[Symbol('test')] = 'symbol'
  data.fn = function () {}
  data = NGN.DATA.UTILITY.serialize(data)

  t.ok(JSON.stringify(data) === JSON.stringify(originalData), 'Serialization returns an object stripped of functions.')

  data.d = /^s.*/
  originalData.d = '/^s.*/'

  t.ok(JSON.stringify(NGN.DATA.UTILITY.serialize(data)) === JSON.stringify(originalData), 'Serialization returns an object with proper RegEx conversion (to string).')

  var dt = new Date(2000, 0, 1, 0, 0, 0)

  data.d = dt
  originalData.d = dt.toISOString()
  t.ok(JSON.stringify(NGN.DATA.UTILITY.serialize(data)) === JSON.stringify(originalData), 'Serialization returns an object with proper date conversion (to ISO string).')

  delete data.d

  // Checksum Creation
  t.ok(NGN.DATA.UTILITY.checksum(data) === 1627578237, 'Checksum calculates for an object.')

  // UUID
  t.ok(/[0-9A-Za-z]{8}-[0-9A-Za-z]{4}-[0-9A-Za-z]{4}-[0-9A-Za-z]{4}-[0-9A-Za-z]{12}/i.test(NGN.DATA.UTILITY.UUID()), 'UUID() returns a properly formatted identifier.')

  // GUID
  t.ok(/[0-9A-Za-z]{8}-[0-9A-Za-z]{4}-[0-9A-Za-z]{4}-[0-9A-Za-z]{4}-[0-9A-Za-z]{12}/i.test(NGN.DATA.UTILITY.GUID()), 'GUID() returns a properly formatted identifier.')

  // Data Diffing
  var left = {
    a: 1,
    b: true,
    c: 'three',
    nested: {
      element: 'is here',
      and: 'here'
    }
  }

  var right = {
    a: 1,
    b: false,
    nested: {
      element: 'is here',
      and: 'there'
    },
    x: {
      y: 'new value'
    }
  }

  console.log(NGN.DATA.UTILITY.diff(left, right))

  t.end()
})
