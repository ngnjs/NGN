const test = require('tap').test
const TaskRunner = require('shortbus')
const Meta = require('../meta')

// Remember to run `npm run test:build` before executing,
// otherwise the lib directory will not exist.

require('../../lib/ngn')

NGN.BUS.on(NGN.WARNING_EVENT, function (msg) {
  console.log('\n\n\n\n:::WARNING:::', msg)
})

test('NGN.DATA.Model', function (t) {
  var tasks = new TaskRunner()
  var Person
  var p

  tasks.add('Create model', function (next) {
    Person = new NGN.DATA.Model(Meta())
    t.ok(typeof Person === 'function', 'Model creation works.')
    next()
  })

  tasks.add('Create record', function (next) {
    p = new Person()

    t.ok(p !== undefined, 'Model instantiation works.')
    t.ok(p.METADATA.name === 'metamodel', 'Model has a custom name.')

    t.ok(
      p.METADATA.knownFieldNames.has('firstname') &&
      p.METADATA.knownFieldNames.has('lastname') &&
      p.METADATA.knownFieldNames.has('val') &&
      p.METADATA.knownFieldNames.has('testid') &&
      p.METADATA.knownFieldNames.has('virtual') &&
      !p.METADATA.knownFieldNames.has('not_a_field'),
      'Recognized all field names'
    )

    t.ok(p.getField('firstname').type === 'string', 'Properly unconfigured field as string.')
    t.ok(p.getField('val').type === 'number', 'Autoidentify data type.')

    t.ok(p.virtual === 'test 15', 'Virtual field successfully generated value.')

    next()
  })

  tasks.add('Modify Record', function (next) {
    p.once('field.update', function (change) {
      t.ok(change.field.name === 'firstname', 'Event fired for data change.')
      t.ok(!change.old, 'Old value recognized.')
      t.ok(change.new === 'Corey', 'New value recognized.')

      next()
    })

    p.firstname = 'Corey'
  })

  tasks.add('Field Creation', function (next) {
    p.once('field.create', function (field) {
      t.ok(field instanceof NGN.DATA.Field, 'Emitted the field in the payload.')
      t.ok(field.name === 'middle', 'Proper field name recognized in emitted payload.')
      t.ok(p.hasOwnProperty('middle'), 'Model contains new field as a getter/setter.')

      next()
    })

    p.addField('middle')
  })

  tasks.add('Field Removal', function (next) {
    p.once('field.remove', function (field) {
      t.ok(field instanceof NGN.DATA.Field, 'Emitted the field in the payload.')
      t.ok(field.name === 'middle', 'Proper field name recognized in emitted payload.')
      t.ok(!p.hasOwnProperty('middle'), 'Model no longer contains field as a getter/setter.')

      next()
    })

    p.removeField('middle')
  })

  tasks.add('Data Serialization', function (next) {
    t.ok(JSON.stringify(p.data) === '{"firstname":"Corey","lastname":null,"val":15,"testid":null}', 'Data serialized into JSON object.')
    t.ok(JSON.stringify(p.representation) === '{"firstname":"Corey","lastname":null,"val":15,"testid":null,"virtual":"test 15"}', 'Representation serialized into JSON object.')

    next()
  })

  tasks.add('Field Mapping', function (next) {
    var cfg = Meta()

    cfg.fieldmap = {
      firstname: 'gn',
      lastname: 'sn',
      testid: 'someid',
      invalid: function () {}
    }

    var Person = new NGN.DATA.Model(cfg)
    var p = new Person({
      gn: 'Joe',
      sn: 'Dirt',
      value: 17,
      val: 16
    })

    t.ok(
      p.firstname === 'Joe' &&
      p.lastname === 'Dirt',
      'Successfully loaded data using field mapping'
    )
    t.ok(p.val === 16, 'Skipped invalid mapping and used raw value.')

    t.ok(JSON.stringify(p.data) === '{"val":16,"gn":"Joe","sn":"Dirt","someid":null}', 'Serialized output respects inverse data mappings.')
    t.ok(JSON.stringify(p.unmappedData) === '{"firstname":"Joe","lastname":"Dirt","val":16,"testid":null}', 'Serialized unmapped output respects model fields.')
    t.ok(JSON.stringify(p.representation) === '{"val":16,"virtual":"test 16","gn":"Joe","sn":"Dirt","someid":null}', 'Serialized representation output respects inverse data mappings.')
    t.ok(JSON.stringify(p.unmappedRepresentation) === '{"firstname":"Joe","lastname":"Dirt","val":16,"testid":null,"virtual":"test 16"}', 'Serialized unmapped representation output respects model fields.')

    next()
  })

  tasks.add('Automatic ID (Basic)', function (next) {
    var cfg = Meta()

    delete cfg.idField
    delete cfg.fields.testid

    cfg.autoid = true

    var AutoModel = new NGN.DATA.Model(cfg)
    var instance = new AutoModel()
    var id = instance.id

    t.ok(/[0-9A-Za-z]{8}-[0-9A-Za-z]{4}-[0-9A-Za-z]{4}-[0-9A-Za-z]{4}-[0-9A-Za-z]{12}/i.test(id), 'UUID generated for ID automatically.')

    id = instance.id
    t.ok(/[0-9A-Za-z]{8}-[0-9A-Za-z]{4}-[0-9A-Za-z]{4}-[0-9A-Za-z]{4}-[0-9A-Za-z]{12}/i.test(id), 'UUID remains consistend on each request.')

    next()
  })

  tasks.add('Automatic ID (Custom Field)', function (next) {
    var cfg = Meta()

    cfg.autoid = true

    var AutoModel = new NGN.DATA.Model(cfg)
    var instance = new AutoModel()

    t.ok(/[0-9A-Za-z]{8}-[0-9A-Za-z]{4}-[0-9A-Za-z]{4}-[0-9A-Za-z]{4}-[0-9A-Za-z]{12}/i.test(instance.testid), 'UUID generated for custom ID field automatically.')

    next()
  })

  tasks.add('Automatic ID (Ignore)', function (next) {
    var cfg = Meta()

    cfg.autoid = true

    var AutoModel = new NGN.DATA.Model(cfg)
    var instance = new AutoModel({
      testid: 'test'
    })

    t.ok(instance.id === 'test', 'Recognize ID when it is explicitly set (ignore autoID)')

    next()
  })

  tasks.add('Expiration (TTL)', function (next) {
    var cfg = new Meta()

    cfg.expires = 600

    var MetaModel = new NGN.DATA.Model(cfg)
    var MetaRecord = new MetaModel({
      firstname: 'John',
      lastname: 'Doe'
    })

    MetaRecord.once('expire', function () {
      t.pass('Record expiration event triggered using milliseconds.')

      MetaRecord.once('expire', function () {
        t.ok(MetaRecord.expired, 'Record is marked as expired.')
        t.pass('Record expiration event triggered using future date.')
        next()
      })

      MetaRecord.expires = new Date((new Date()).getTime() + 300)
      t.ok(!MetaRecord.expired, 'Record is not expired if the expiration is reset.')
    })
  })

  tasks.on('complete', t.end)

  tasks.run(true)
})

test('NGN.DATA.Model Data Field Auditing (Changelog)', function (t) {
  var config = Meta()
  config.audit = true

  var Model = new NGN.DATA.Model(config)
  var m = new Model()

  m.firstname = 'John'
  m.lastname = 'Doe'
  m.val = 17
  m.id = '12345'

  m.firstname = 'Jill'
  m.lastname = 'Rey'

  m.undo()
  t.ok(m.firstname === 'Jill' && m.lastname === 'Doe', 'Undo rolls back a single change.')

  m.undo()
  t.ok(m.firstname === 'John' && m.lastname === 'Doe', 'Second undo rolls back another change (different fields).')

  m.redo(2)
  t.ok(m.firstname === 'Jill' && m.lastname === 'Rey', 'Redo advances the transaction log forward.')

  m.undo(2)
  m.firstname = 'Billy'
  m.lastname = 'Bob'
  m.undo(2)
  t.ok(m.firstname === 'John' && m.lastname === 'Doe', 'Rollback limited to start of transaction log.')

  m.redo(10)
  t.ok(m.firstname === 'Billy' && m.lastname === 'Bob', 'Transaction log rewritten at appropriate location.')

  t.end()
})

test('NGN.DATA.Model Virtual Field Caching', function (t) {
  var Model = new NGN.DATA.Model(Meta())
  var model = new Model()

  t.ok(model.METADATA.fields.virtual.METADATA.caching === true, 'Caching enabled by default.')
  t.ok(model.METADATA.fields.virtual.METADATA.cachedValue === model.METADATA.fields.virtual.METADATA.CACHEKEY, 'Cache is empty before first reference to virtual field.')

  var throwAway = model.virtual
  t.ok(throwAway === 'test 15' && model.METADATA.fields.virtual.METADATA.cachedValue === 'test 15', 'Cache is set after first reference to virtual field.')

  // Wait for cache.clear event to complete the test.
  model.funnelOnce(['field.cache.clear', 'done'], 'end.test')
  model.once('end.test', function () {
    t.pass('cache.clear event triggered.')
    t.end()
  })

  model.val = 11
  t.ok(model.virtual === 'test 11', 'Successfully cleared cache and returned updated value.')
  t.ok(model.METADATA.fields.virtual.METADATA.cachedValue === 'test 11', 'Updated cache value.')

  model.emit('done')
})
