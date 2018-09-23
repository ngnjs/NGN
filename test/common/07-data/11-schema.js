const test = require('tap').test

// Remember to run `npm run test:build` before executing,
// otherwise the lib directory will not exist.

require('../../lib/ngn')

NGN.BUS.on(NGN.WARNING_EVENT, function (msg) {
  console.log('\n\n\n\n:::WARNING:::', msg)
})

test('JSON Schema', function (t) {
  var schema = new NGN.DATA.JSONSchema('http://json.schemastore.org/project')
  // var schema = new NGN.DATA.JSONSchema('http://json-schema.org/example/calendar.json')

  schema.getModelDefinitions(definitions => {
    console.log(definitions[0])
    console.log('\n\n\n==========\n\n\n')
    console.log(definitions[1])
    // console.log(JSON.stringify(definitions, null, 2))
    t.end()
  })
})
