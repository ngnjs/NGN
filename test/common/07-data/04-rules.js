const test = require('tap').test

// Remember to run `npm run test:build` before executing,
// otherwise the lib directory will not exist.

require('../../lib/ngn')

NGN.BUS.on(NGN.WARNING_EVENT, function (msg) {
  console.log('\n\n\n\n:::WARNING:::', msg)
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

  rule = new NGN.DATA.Rule(function (value) {
    return value === 'another test'
  })

  t.ok(rule.type === 'function', 'Correctly identifies custom function rule.')
  t.ok(rule.test('another test'), 'Valid value passes custom validation.')
  t.ok(!rule.test('bob'), 'Invalid value fails custom validation.')

  t.end()
})

test('NGN.DATA.RangeRule', function (t) {
  var rule = new NGN.DATA.RangeRule('rangetest', [
    [null, -50],
    [-10, -5],
    [10, 20],
    ['25->50'],
    ['100->null']
  ])

  t.ok(rule.range.length === 5, 'Correct number of ranges created.')
  t.ok(!rule.test(0), 'Number outside of range is flagged as invalid.')
  t.ok(rule.test(150), 'Number within range is flagged as valid.')

  rule.removeRange([null, -50])

  t.ok(rule.range.length === 4, 'Correct number of ranges detected after removal.')
  t.ok(!rule.test(-75), 'Test fails after validation range is removed.')

  rule.addRange([-70, -60])
  t.ok(rule.range.length === 5, 'Correct number of rules detected after adding new one.')
  t.ok(rule.test(-65), 'Validation succeeds after new range is added.')

  rule.range = [1, 5]
  t.ok(rule.range.length === 1, 'Resetting the range yields correct number of ranges.')
  t.ok(rule.test(3) && !rule.test(10), 'Correctly validates using new rule range.')

  t.end()
})
