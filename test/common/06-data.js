const test = require('tape')

// Remember to run `npm run test:build` before executing,
// otherwise the lib directory will not exist.

require('../lib/core')
require('../lib/eventemitter')
require('../lib/tasks/bootstrap')
require('../lib/data/DATA')

test('Data Sanity Checks', function (t) {
  t.ok(typeof NGN.DATA === 'object', 'NGN.DATA exists as an object/namespace.')
  t.ok(typeof NGN.DATA.Rule === 'function', 'NGN.DATA.Rule exists as a class.')
  t.ok(typeof NGN.DATA.Field === 'function', 'NGN.DATA.Field exists as a class.')
  t.ok(typeof NGN.DATA.Entity === 'function', 'NGN.DATA.Entity exists as a class.')
  t.ok(typeof NGN.DATA.Model === 'function', 'NGN.DATA.Model exists as a class.')
  t.ok(typeof NGN.DATA.Index === 'function', 'NGN.DATA.Index exists as a class.')
  t.ok(typeof NGN.DATA.Store === 'function', 'NGN.DATA.Store exists as a class.')
  t.end()
})

test('NGN.DATA.Rule', function (t) {
  var rule = new NGN.DATA.Rule('test')

  t.ok(rule.type === 'string', 'Correctly identifies a string-based exact-match rule.')
  t.ok(rule.test('test'), 'Exact match string passes string validation.')
  t.ok(!rule.test('testing'), 'Different text fails exact match string validation.')

  rule = new NGN.DATA.Rule(10)

  t.ok(rule.type === 'number', 'Correctly identifies a number-based exact-match rule.')
  t.ok(rule.test(10), 'Exact match number passes string validation.')
  t.ok(!rule.test(11), 'Different number fails exact match number validation.')

  rule = new NGN.DATA.Rule(true)

  t.ok(rule.type === 'boolean', 'Correctly identifies a boolean-based exact-match rule.')
  t.ok(rule.test(true), 'Exact match value passes boolean validation.')
  t.ok(!rule.test(false), 'Different value fails exact match boolean validation.')

  rule = new NGN.DATA.Rule(/^a.*/gi)

  t.ok(rule.type === 'regexp', 'Correctly identifies a regular express-based rule.')
  t.ok(rule.test('alpha'), 'Pattern match passes RegEx validation.')
  t.ok(!rule.test('beta'), 'Different pattern fails RegeEx validation.')

  rule = new NGN.DATA.Rule(['a', 1, true])

  t.ok(rule.type === 'array', 'Correctly identifies enumeration rule.')
  t.ok(rule.test(1), 'Included value match passes enumeration validation.')
  t.ok(!rule.test(false), 'Different value fails enumeration validation.')

  rule = new NGN.DATA.Rule((value) => {
    return value === 'another test'
  })

  t.ok(rule.type === 'function', 'Correctly identifies custom function rule.')
  t.ok(rule.test('another test'), 'Valid value passes custom validation.')
  t.ok(!rule.test('bob'), 'Invalid value fails custom validation.')

  t.end()
})

test('NGN.DATA.Field', function (t) {
  var field = new NGN.DATA.Field()

  t.ok(field.type === 'string', 'String by default.')
  t.ok(field.fieldType === 'data', 'Recognized as a data field.')
  t.ok(!field.required, 'Not required by default.')
  t.ok(!field.hidden, 'Not hidden by default.')
  t.ok(!field.virtual, 'Not virtual by default.')
  t.ok(!field.identifier, 'Not an identifier by default.')

  t.end()
})
