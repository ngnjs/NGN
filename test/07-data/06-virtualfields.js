import 'source-map-support/register.js'
import test from 'tape'
import NGN from '../.node/index.js'

NGN.BUS.on(NGN.WARNING_EVENT, function (msg) {
  console.log('\n\n\n\n:::WARNING:::', msg)
})

test('NGN.DATA.VirtualField', function (t) {
  var field = new NGN.DATA.VirtualField({
    scope: {
      multiplier: 3
    },
    method: function () {
      return 5 * this.multiplier
    }
  })

  t.ok(field.value === 15, 'Generated correct value.')
  t.ok(!field.hidden, 'Not hidden by default.')

  field.value = 'nothing'
  t.ok(field.value === 15, 'Generated correct value after attempting to set value.')

  field.hidden = true
  t.ok(field.hidden, 'Hidden by request.')

  t.end()
})
