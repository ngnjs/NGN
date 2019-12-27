import 'source-map-support/register.js'
import test from 'tape'
import NGN from '../.node/index.js'

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
  t.ok(NGN.UTILITY.checksum(data) === '1627578237', 'Checksum calculates for an object.')

  t.end()
})
