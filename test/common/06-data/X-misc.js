const test = require('tap').test
const TaskRunner = require('shortbus')

// Remember to run `npm run test:build` before executing,
// otherwise the lib directory will not exist.

require('../../lib/ngn')

NGN.BUS.on(NGN.WARNING_EVENT, function (msg) {
  console.log('\n\n\n\n:::WARNING:::', msg)
})

// test('JSON Schema', function (t) {
//   var schema = new NGN.DATA.JSONSchema('http://json.schemastore.org/project')
//   // var schema = new NGN.DATA.JSONSchema('http://json-schema.org/example/calendar.json')
//
//   schema.getModelDefinitions(definitions => {
//     console.log(definitions[0])
//     console.log('\n\n\n==========\n\n\n')
//     console.log(definitions[1])
//     // console.log(JSON.stringify(definitions, null, 2))
//     t.end()
//   })
// })

// test('NGN.DATA.Relationship (Multi-Model)', function (t) {
//   var Model = new NGN.DATA.Model(Meta())
//   var field = new NGN.DATA.Relationship({
//     audit: true,
//     name: 'test',
//     join: [Model]
//   })
//
//   t.ok(field.value instanceof NGN.DATA.Store, 'Correctly returns the nested store.')
//
//   field.value.add([{
//     firstname: 'John',
//     lastname: 'Doe'
//   }, {
//     firstname: 'Jill',
//     lastname: 'Doe'
//   }])
// console.log(field.value.first.firstname)
// console.log('>>', field.value.last)
// console.log('>>', field.value.first)
//   t.ok(
//     field.value.first.firstname === 'John' &&
//     field.value.last.firstname === 'Jill',
//     'Added multiple records to relationship field.'
//   )
//
//   // field.value.firstname = 'John'
//   // field.value.lastname = 'Doe'
//   // field.value.firstname = 'Jill'
//   //
//   // field.undo()
//   // t.ok(field.value.firstname === 'John' && field.value.lastname === 'Doe', 'Undo operation yields prior value.')
//   //
//   // field.redo()
//   // t.ok(field.value.firstname === 'Jill' && field.value.lastname === 'Doe', 'Redo operation yields next value.')
//   //
//   // field.undo(2)
//   // t.ok(field.value.firstname === 'John' && field.value.lastname === null, 'Multiple undo operation yields appropriate value.')
//   //
//   // field.redo(2)
//   // t.ok(field.value.firstname === 'Jill' && field.value.lastname === 'Doe', 'Multiple redo operation yields appropriate value.')
//   //
//   // t.ok(field.value.changelog.length === 3, 'Proper changelog length.')
//
//   t.end()
// })
//
// test('Performance', function (t) {
//   t.fail('No performance tests.')
//   t.end()
// })
