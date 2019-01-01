const test = require('tape')
const Meta = require('../helper').Meta

// Remember to run `npm run test:build` before executing,
// otherwise the lib directory will not exist.

require('../../lib/ngn')

NGN.BUS.on(NGN.WARNING_EVENT, function (msg) {
  console.log('\n\n\n\n:::WARNING:::', msg)
})

test('NGN.DATA.Relationship (Single Model)', function (t) {
  var Model = new NGN.DATA.Model(Meta())
  var field = new NGN.DATA.Relationship({
    audit: true,
    name: 'test',
    join: Model
  })

  t.ok(field.value instanceof NGN.DATA.Entity, 'Correctly returns the nested model.')

  field.value.firstname = 'John'
  field.value.lastname = 'Doe'
  field.value.firstname = 'Jill'

  field.undo()
  t.ok(field.value.firstname === 'John' && field.value.lastname === 'Doe', 'Undo operation yields prior value.')

  field.redo()
  t.ok(field.value.firstname === 'Jill' && field.value.lastname === 'Doe', 'Redo operation yields next value.')

  field.undo(2)
  t.ok(field.value.firstname === 'John' && field.value.lastname === null, 'Multiple undo operation yields appropriate value.')

  field.redo(2)
  t.ok(field.value.firstname === 'Jill' && field.value.lastname === 'Doe', 'Multiple redo operation yields appropriate value.')

  t.ok(field.value.changelog.length === 3, 'Proper changelog length.')

  t.end()
})
