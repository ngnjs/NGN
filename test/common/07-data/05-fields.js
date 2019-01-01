const test = require('tape')
const TaskRunner = require('shortbus')

// Remember to run `npm run test:build` before executing,
// otherwise the lib directory will not exist.

require('../../lib/ngn')

NGN.BUS.on(NGN.WARNING_EVENT, function (msg) {
  console.log('\n\n\n\n:::WARNING:::', msg)
})

test('NGN.DATA.Field (Standard String Field)', function (t) {
  var field = new NGN.DATA.Field('testfield')

  t.ok(field.type === 'string', 'String by default.')
  t.ok(field.fieldType === 'data', 'Recognized as a standard data field.')
  t.ok(!field.required, 'Not required by default.')
  t.ok(field.value === null, 'Null by default.')
  t.ok(!field.hidden, 'Not hidden by default.')
  t.ok(!field.virtual, 'Not virtual by default.')
  t.ok(!field.identifier, 'Not an identifier by default.')
  t.ok(field.name === 'testfield', 'Recognized name of the field.')
  t.ok(field.isNew, 'Field is recognized as new by default.')

  field.required = 1
  t.ok(field.required, 'Field can be manually set to be required after initial configuration.')

  field.value = 'test value'
  t.ok(field.value === 'test value', 'Setting a value reflects the appropriate value.')
  t.ok(!field.modified, 'Field is not considered modified on the initial value set.')

  field.disallowInvalid()
  t.throws(() => { field.value = 1 }, 'Invalid value throws an error.')

  field.value = 'changed'
  t.ok(field.modified, 'Modification recognizes alterations as a change.')

  // Test events
  var tasks = new TaskRunner()

  tasks.add('Hide Field', function (next) {
    field.once('hidden', function () {
      t.ok(field.hidden, 'Hiding field triggers an event and successfully updates the "hidden" flag.')
      next()
    })

    field.hide()
  })

  tasks.add('Unhide Field', function (next) {
    field.once('unhidden', function () {
      t.ok(!field.hidden, 'Unhiding field triggers an event and successfully updates the "hidden" flag.')
      next()
    })

    field.unhide()
  })

  tasks.add('Modification triggers update event.', function (next) {
    field.once('update', function () {
      t.ok(field.modified, 'Modification reflects recognizes update.')
      next()
    })

    field.value = 'different'
  })

  tasks.add('Custom Rules', function (next) {
    field = new NGN.DATA.Field({
      name: 'testingField',
      type: String,
      rules: function (value) {
        return value === 'ok'
      },
      allowInvalid: true
    })

    field.value = 'ok'
    t.ok(field.valid, 'Configured custom rule validates correctly.')

    field.value = 'not ok'
    t.ok(!field.valid, 'Configured custom rule invalidates correctly.')

    field = new NGN.DATA.Field({
      name: 'testField',
      type: String,
      rules: [
        function (value) {
          return /^o.*/.test(value)
        },
        function (value) {
          return value === 'ok' || value === 'ok already!'
        }
      ],
      allowInvalid: true
    })

    field.value = 'ok'
    t.ok(field.valid, 'Configured custom rule set 1 validates correctly.')

    field.value = 'ok already!'
    t.ok(field.valid, 'Configured custom rule set 2 validates correctly.')

    field.value = 'not ok'
    t.ok(!field.valid, 'Configured custom rule set 1 invalidates correctly.')

    field.value = 'okie dokie'
    t.ok(!field.valid, 'Configured custom rule set 2 invalidates correctly.')

    next()
  })

  tasks.on('complete', t.end)

  tasks.run(true)
})

test('NGN.DATA.Field (Pattern String Field)', function (t) {
  var field = new NGN.DATA.Field({
    name: 'testfield',
    type: String,
    pattern: /^X.*/
  })

  t.ok(field.METADATA.rules.length === 2, 'Pattern match configured as part of the validation rules.')

  field.value = 'X-test'
  t.ok(field.valid, 'Proper value passes pattern match test.')

  field.value = 'problemX'
  t.ok(field.valid === false, 'Proper value fails pattern match test.')

  t.end()
})

test('NGN.DATA.Field (Enumeration)', function (t) {
  var field = new NGN.DATA.Field({
    name: 'enumfield',
    type: String,
    enum: [
      'a',
      'b'
    ],
    allowInvalid: true
  })

  t.ok(field.METADATA.rules.length === 2, 'Enumeration match configured as part of the validation rules.')

  field.value = 'b'
  t.ok(field.valid, 'A value within the enumeration set is marked as valid.')

  field.value = 'x'
  t.ok(!field.valid, 'A value outside the enumeration set is marked as invalid.')

  t.end()
})

test('NGN.DATA.Field (Rejected Values)', function (t) {
  var field = new NGN.DATA.Field({
    name: 'enumfield',
    type: String,
    not: [
      'a',
      'b'
    ],
    allowInvalid: true
  })

  t.ok(field.METADATA.rules.length === 2, 'Rejection match configured as part of the validation rules.')

  field.value = 'b'
  t.ok(!field.valid, 'A value within the enumeration set is marked as invalid.')

  field.value = 'x'
  t.ok(field.valid, 'A value outside the enumeration set is marked as valid.')

  t.end()
})

test('NGN.DATA.Field (Number Field)', function (t) {
  var field = new NGN.DATA.Field({
    name: 'testfieldnumber',
    type: Number,
    range: [
      [null, -50],
      [-10, -5],
      [10, 20],
      ['25->50'],
      ['100->null']
    ],
    autocorrectInput: true
  })

  t.ok(field.type === 'number', 'Correctly recognized number value.')
  t.ok(field.fieldType === 'data', 'Recognized as a standard data field.')
  t.ok(!field.required, 'Not required by default.')
  t.ok(field.value === null, 'Null by default.')
  t.ok(!field.hidden, 'Not hidden by default.')
  t.ok(!field.virtual, 'Not virtual by default.')
  t.ok(!field.identifier, 'Not an identifier by default.')
  t.ok(field.name === 'testfieldnumber', 'Recognized name of the field.')
  t.ok(field.isNew, 'Field is recognized as new by default.')

  field.value = 0
  t.ok(!field.valid, 'Number outside of range is flagged as invalid.')

  field.value = 150
  t.ok(field.valid, 'Number inside range is flagged as valid.')

  field.value = '-3'
  t.ok(field.value === -3 && !field.valid, 'Autocorrected input yields appropriate result.')

  try {
    field = new NGN.DATA.Field({
      name: 'testfieldnumber',
      type: Number,
      range: [50, 10]
    })

    t.fail('Allowed to set a min/max range where max is less than min')
  } catch (e) {
    t.pass('Do not allow a min/max range where max is less than min.')
  }

  field = new NGN.DATA.Field({
    name: 'testfieldnumber',
    type: Number,
    min: 10
  })

  field.value = 5
  t.ok(!field.valid, 'Value below minimum is invalid.')

  field.value = 10
  t.ok(field.valid, 'Value at minimum is valid.')

  field = new NGN.DATA.Field({
    name: 'testfieldnumber',
    type: Number,
    max: 10
  })

  field.value = 15
  t.ok(!field.valid, 'Value above maximum is invalid.')

  field.value = 10
  t.ok(field.valid, 'Value at maximum is valid.')

  field = new NGN.DATA.Field({
    name: 'testfieldnumber',
    type: Number,
    min: 1,
    max: 10
  })

  field.value = 15
  t.ok(!field.valid, 'Value above minimum/maximum threshold is invalid.')

  field.value = 0
  t.ok(!field.valid, 'Value below minimum/maximum threshold is invalid.')

  field.value = 5
  t.ok(field.valid, 'Value in minimum/maximum threshold is valid.')

  // Multiples
  field = new NGN.DATA.Field({
    name: 'testfieldnumber',
    type: Number,
    multipleOf: 10
  })

  field.value = 100
  t.ok(field.valid, 'Positive value matching a multipleOf constraint is valid.')

  field.value = -100
  t.ok(field.valid, 'Negative value matching a multipleOf constraint is valid.')

  field.value = 101
  t.ok(!field.valid, 'A value outside of a specified multiple is not valid.')

  t.end()
})

test('NGN.DATA.Field (Array Field)', function (t) {
  var field = new NGN.DATA.Field({
    name: 'testfield',
    type: Array,
    min: 1,
    max: 5,
    listType: Number
  })

  field.value = [1, 2, 3]
  t.ok(field.valid, 'Acceptable array is valid.')

  field.value = []
  t.ok(!field.valid, 'Array with too few items is invalid.')

  field.value = [1, 2, 3, 4, 5, 6]
  t.ok(!field.valid, 'Array with too many items is invalid.')

  field.value = [1, 2, 3, 'no']
  t.ok(!field.valid, 'Array that violates listType is invalid.')

  field = new NGN.DATA.Field({
    name: 'testfield',
    type: Array,
    tuples: [{
      type: Number
    }, {
      enum: ['a', 'b']
    }]
  })

  field.value = [1, 'a', 1, 2, 3, 4]
  t.ok(field.valid, 'Array matching tuples is valid.')

  field.value = ['test', 'a']
  t.ok(!field.valid, 'Array violating tuples type is invalid.')

  field.value = [1, 'c']
  t.ok(!field.valid, 'Array violating tuples enum is invalid.')

  t.end()
})

test('NGN.DATA.Field (Multitype Field)', function (t) {
  var field = new NGN.DATA.Field({
    name: 'testfield',
    type: [String, Number]
  })

  field.value = 'X-test'
  t.ok(field.valid, 'Acceptable data type value passes data type validation.')

  field.value = 5
  t.ok(field.valid, 'Acceptable alternative data type value passes data type validation.')

  field.value = true
  t.ok(field.valid === false, 'Unacceptable data type value fails data type validation.')

  t.end()
})

test('NGN.DATA.Field Basic Auditing (Changelog)', function (t) {
  var field = new NGN.DATA.Field({
    name: 'test',
    audit: true
  })

  field.value = 'a'
  field.value = 'b'
  field.value = 'c'
  field.value = 'd'
  field.value = 'e'

  field.undo()
  t.ok(field.value === 'd', 'Basic undo rolls back one change.')

  field.redo()
  t.ok(field.value === 'e', 'Basic redo advances one change.')

  field.undo(3)
  t.ok(field.value === 'b', 'Multistep rollback quietly updates value.')

  field.redo(3)
  t.ok(field.value === 'e', 'Multistep redo quietly updates value.')

  field.undo(2)
  field.value = 'f'
  t.ok(field.METADATA.AUDITLOG.length === 4, 'Correctly truncated newer values.')
  t.ok(field.METADATA.AUDITLOG.currentValue === 'f', 'Correctly advanced cursor.')

  field.undo()
  t.ok(field.value === 'c', 'Correctly reverted value after committing change.')

  field.redo(10)
  t.ok(field.value === 'f', 'Correctly advanced value after committing change.')

  t.end()
})

test('NGN.DATA.Field Transformations', function (t) {
  var field = new NGN.DATA.Field({
    name: 'testfield',
    default: 'none',
    transformer: function (input) {
      return input + '_test'
    }
  })

  t.ok(field.value === 'none', 'Transformation does not affect default value.')

  field.value = 'a'
  t.ok(field.value === 'a_test', 'Transformation successfully applied to input.')

  t.end()
})

test('NGN.DATA.Model Field Mapping', function (t) {
  // TODO: Convert this to use the DiffEngine instead of JSON.stringify comparison
  var map = {
    father: 'pa',
    mother: 'ma',
    brother: 'bro',
    sister: 'sis',
    invalid: function () {}
  }

  var inverse = {
    pa: 'father',
    ma: 'mother',
    bro: 'brother',
    sis: 'sister'
  }

  var fieldMap = new NGN.DATA.FieldMap(map)

  delete map.invalid

  t.ok(JSON.stringify(fieldMap.map) === JSON.stringify(map), 'Map created while removing invalid items.')
  t.ok(JSON.stringify(fieldMap.inverse) === JSON.stringify(inverse), 'Inverse map created while removing invalid items.')

  var result = fieldMap.applyMap({
    pa: 'John',
    ma: 'Jill',
    bro: 'Joe',
    sis: 'Jane'
  })

  var expectedResult = {
    father: 'John',
    mother: 'Jill',
    brother: 'Joe',
    sister: 'Jane'
  }

  t.ok(JSON.stringify(result) === JSON.stringify(expectedResult), 'Applied map to data correctly.')

  result = fieldMap.applyInverseMap({
    father: 'John',
    mother: 'Jill',
    brother: 'Joe',
    sister: 'Jane'
  })

  var expectedInvertedResult = {
    pa: 'John',
    ma: 'Jill',
    bro: 'Joe',
    sis: 'Jane'
  }

  t.ok(JSON.stringify(result) === JSON.stringify(expectedInvertedResult), 'Applied inverted map to data correctly.')

  t.end()
})
