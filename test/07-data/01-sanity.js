import 'source-map-support/register.js'
import test from 'tape'
import NGN from '../.node/index.js'

NGN.BUS.on(NGN.WARNING_EVENT, function (msg) {
  console.log('\n\n\n\n:::WARNING:::', msg)
})

test('Data Sanity Checks', function (t) {
  t.ok(typeof NGN.DATA === 'object', 'NGN.DATA exists as an object/namespace.')
  t.ok(typeof NGN.DATA.UTILITY === 'function', 'NGN.DATA.UTILITY exists as singleton class.')
  t.ok(typeof NGN.DATA.TransactionLog === 'function', 'NGN.DATA.TransactionLog exists as a class.')
  t.ok(typeof NGN.DATA.Rule === 'function', 'NGN.DATA.Rule exists as a class.')
  t.ok(typeof NGN.DATA.RangeRule === 'function', 'NGN.DATA.RangeRule exists as a class.')
  t.ok(typeof NGN.DATA.Field === 'function', 'NGN.DATA.Field exists as a class.')
  t.ok(typeof NGN.DATA.VirtualField === 'function', 'NGN.DATA.VirtualField exists as a class.')
  t.ok(typeof NGN.DATA.Relationship === 'function', 'NGN.DATA.Relationship exists as a class.')
  t.ok(typeof NGN.DATA.FieldMap === 'function', 'NGN.DATA.FieldMap exists as a class.')
  t.ok(typeof NGN.DATA.Entity === 'function', 'NGN.DATA.Entity exists as a class.')
  t.ok(typeof NGN.DATA.Model === 'function', 'NGN.DATA.Model exists as a class.')
  t.ok(typeof NGN.DATA.Index === 'function', 'NGN.DATA.Index exists as a class.')
  t.ok(typeof NGN.DATA.Store === 'function', 'NGN.DATA.Store exists as a class.')
  t.ok(typeof NGN.DATA.BTree === 'function', 'NGN.DATA.BTree exists as a class.')
  t.end()
})
