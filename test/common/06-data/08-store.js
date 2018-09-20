const test = require('tap').test
const TaskRunner = require('shortbus')
const Meta = require('../meta')

// Remember to run `npm run test:build` before executing,
// otherwise the lib directory will not exist.

require('../../lib/ngn')

NGN.BUS.on(NGN.WARNING_EVENT, function (msg) {
  console.log('\n\n\n\n:::WARNING:::', msg)
})

test('NGN.DATA.Store Basic Functionality', function (t) {
  var MetaModel = new NGN.DATA.Model(Meta())
  var GoodStore = new NGN.DATA.Store({
    model: MetaModel
  })

  t.ok(GoodStore.name === 'Untitled Data Store', 'Correctly named store.')

  t.throws(function () {
    var BadStore = new NGN.DATA.Store() // eslint-disable-line no-unused-vars
  }, 'An invalid or missing configuration throws an error.')

  var tasks = new TaskRunner()

  tasks.add('Add records', function (next) {
    var record = GoodStore.add({
      firstname: 'John',
      lastname: 'Doe'
    })

    t.ok(GoodStore.length === 1, 'Record added.')
    t.ok(record.firstname === 'John', 'Added record accurately represents the stored data.')
    t.ok(GoodStore.contains(record), 'Store recognizes that it contains the new record.')
    t.ok(GoodStore.indexOf(record) === 0, 'Store accurately returns the index of the new record.')

    GoodStore.add({
      firstname: 'Jill',
      lastname: 'Doe'
    })

    GoodStore.once('record.create', function (rec) {
      t.pass('Adding a record to a store emits a record.create event.')
      t.ok(record === GoodStore.first, 'First accessor returns the first record within the store.')
      t.ok(rec === GoodStore.last, 'Last accessor returns the last record within the store.')
      t.ok(GoodStore.last.firstname === 'Jake', 'Last accessor returns proper values.')
      t.ok(GoodStore.first.firstname === 'John', 'First accessor returns proper values.')
      t.ok(GoodStore.length === 3, 'Correct number of records identified.')

      next()
    })

    GoodStore.add({
      firstname: 'Jake',
      lastname: 'Doe'
    })
  })

  tasks.add('Remove records', function (next) {
    var removedRecord = GoodStore.remove(0)

    t.ok(GoodStore.length === 3, 'Store record manifest is unaffected upon remove by index.')
    t.ok(GoodStore.size === 2, 'Active record count is decremented upon remove by index.')
    t.ok(removedRecord.firstname === 'John', 'Correctly returns the removed record when removing by index.')
    t.ok(GoodStore.first.firstname === 'Jill', 'Removing the first record automatically moves the first index cursor forward.')
    t.ok(GoodStore.last.firstname === 'Jake', 'Removing the first record does not affect the last index cursor.')

    GoodStore.once('record.delete', function (rec) {
      t.pass('record.remove event triggered upon record deletion.')
      t.ok(GoodStore.length === 3, 'Store record manifest is unaffected upon remove by model.')
      t.ok(GoodStore.size === 1, 'Active record count is decremented upon remove by model.')
      t.ok(rec.firstname === 'Jake', 'Correctly returns the removed record when removing by model.')
      t.ok(GoodStore.first.firstname === 'Jill', 'Removing the last record automatically moves the first index cursor forward.')
      t.ok(GoodStore.last.firstname === 'Jill', 'Removing the last record does not affect the last index cursor.')

      t.ok(GoodStore.remove(2) === null, 'Removal fails when passing an invalid index.')

      next()
    })

    GoodStore.remove(GoodStore.last)
  })

  tasks.add('Clear store.', function (next) {
    GoodStore.once('clear', function () {
      t.pass('clear event fired when store is cleared.')
      t.ok(GoodStore.length === 0, 'Cleared store of all records.')

      next()
    })

    GoodStore.clear()
  })

  tasks.add('Add multiple records simultaneously.', function (next) {
    var results = GoodStore.add([{
      firstname: 'John',
      lastname: 'Doe'
    }, {
      firstname: 'Jill',
      lastname: 'Doe'
    }, {
      firstname: 'Jake',
      lastname: 'Doe'
    }, {
      firstname: 'Jean',
      lastname: 'Doe'
    }])

    t.ok(GoodStore.length === 4, 'Added array of records.')
    t.ok(results.length === 4, 'Returned the correct number of results synchronously.')
    t.ok(
      GoodStore.getRecord(0).firstname === 'John' &&
      GoodStore.getRecord(1).firstname === 'Jill' &&
      GoodStore.getRecord(2).firstname === 'Jake' &&
      GoodStore.getRecord(3).firstname === 'Jean',
      'Proper records recognized when added in bulk.'
    )

    next()
  })

  tasks.add('Doubly Linked list', function (next) {
    GoodStore.clear()
    GoodStore.add([{
      firstname: 'John',
      lastname: 'Doe'
    }, {
      firstname: 'Jill',
      lastname: 'Doe'
    }, {
      firstname: 'Jake',
      lastname: 'Doe'
    }, {
      firstname: 'Jean',
      lastname: 'Doe'
    }])

    var record = GoodStore.first

    var curr = record.previous()
    t.ok(curr === null, 'Calling previous() on first item returns null.')

    curr = record.previous(true)
    t.ok(curr.OID === GoodStore.last.OID, 'Calling previous() on first record with cycling returns last record.')

    curr = record.previous(3, true)
    t.ok(curr.OID === GoodStore.getRecord(1).OID, 'Calling previous() on the first record with cycling (skipping 2) returns appropriate record.')

    curr = record.previous(5, true)
    t.ok(curr.OID === GoodStore.last.OID, 'Calling previous() (w/ cycling) for more records than the store contains returns the correct record (multicycle).')

    record = GoodStore.last
    curr = record.next()
    t.ok(curr === null, 'Calling next() on the last item returns null.')

    curr = record.next(true)
    t.ok(curr.OID === GoodStore.first.OID, 'Calling next() on last record with cycling returns first record.')

    curr = record.next(3, true)
    t.ok(curr.OID === GoodStore.getRecord(2).OID, 'Calling next() on the last record with cycling (skipping 2) returns appropriate record.')

    curr = record.next(5, true)
    t.ok(curr.OID === GoodStore.first.OID, 'Calling next() (w/ cycling) for more records than the store contains returns the correct record (multicycle).')

    next()
  })

  tasks.add('Remove a model from a store, from the model.', function (next) {
    var record = GoodStore.first
    var firstname = record.firstname

    record.destroy()

    t.ok(GoodStore.size === 3 && firstname !== GoodStore.first.firstname, 'Model.destroy() removes an individual model from its parent store.')

    next()
  })

  tasks.add('Basic Iteration (forEach)', function (next) {
    GoodStore.forEach(function (record) {
      record.lastname = 'changed'
    })

    t.ok(
      GoodStore.first.lastname === 'changed' &&
      GoodStore.getRecord(1).lastname === 'changed' &&
      GoodStore.last.lastname === 'changed',
      'Method properly applied to each record within the store.'
    )

    next()
  })

  tasks.add('Compact Store', function (next) {
    GoodStore.clear()

    var x = 0
    var shortLived = []

    while (x < 220) {
      var r = GoodStore.add({
        firstname: x.toString()
      })

      if (x >= 40 && x < 150) {
        shortLived.push(r)
      }

      x++
    }

    GoodStore.remove(shortLived)

    GoodStore.compact()

    t.ok(GoodStore.size === GoodStore.length, 'Compacted store contains correct number of results.')

    GoodStore.forEach(function (record) {
      var val = parseInt(record.firstname, 10)

      if (!(val < 40 || val >= 150)) {
        t.fail('Removed record still exists.')
      }
    })

    next()
  })

  // TODO: B-Tree indexing of numeric and date values
  // TODO: Load
  // tasks.add('Load Records', function (next) {
  //   GoodStore.clear()
  //
  //   var dataset = []
  //   var count = 100
  //
  //   for (var i = 0; i < count; i++) {
  //     dataset.push({
  //       firstname: 'First ' + i,
  //       lastname: 'Last ' + i
  //     })
  //   }
  //
  //   // GoodStore.once('loaded')
  //   GoodStore.load(dataset)
  //
  //   t.ok(GoodStore.size === count, 'Loaded records.')
  //
  //   next()
  // })

  var timer
  tasks.add('Performance Benchmark: Bulk Load', function (next) {
    GoodStore.clear()

    timer = setTimeout(function () {
      t.fail('Bulk load did not complete in a timely manner.')
    }, 1000)

    // console.time('Build Test Data')
    var count = 200000
    var dataset = new Array(count)

    for (var i = 0; i < count; i++) {
      dataset[i] = {
        firstname: 'First ' + i,
        lastname: 'Last ' + i
      }
    }

    // console.timeEnd('Build Test Data')

    // GoodStore.once('loaded')
    GoodStore.load(dataset)

    t.ok(GoodStore.size === count, 'Loaded records in bulk.')
    t.ok(GoodStore.first.firstname === 'First 0', 'Retrieved first record from large load.')
    t.ok(GoodStore.last.firstname === 'First ' + (count - 1), 'Retrieved last record from large load.')
    t.ok(GoodStore.last.val !== null, 'Make sure default values are retrieved, even if unspecified.')
    t.ok(GoodStore.data[1567].firstname === 'First 1567', 'Retrieved middle record from large load.')

    next()
  })

  // TODO: Reload
  // TODO: Find/Query
  // TODO: Filtering (& Clearing)
  // TODO: Sorting
  // TODO: Deduplicate
  // TODO: Invalid/valid field events for store records
  // TODO: Undo/Redo

  tasks.on('complete', function () {
    clearTimeout(timer)
    t.end()
  })

  tasks.run(true)
})

// test('NGN.DATA.Store Indexing', function (t) {
//   var MetaModel = new NGN.DATA.Model(Meta())
//   var Store = new NGN.DATA.Store({
//     model: MetaModel,
//     index: ['firstname', 'lastname']
//   })
//
//   t.ok(Store.METADATA.INDEXFIELDS.size === 2, 'Indexes applied to store.')
//   t.ok(
//     Store.indexedFieldNames[0] === 'firstname' &&
//     Store.indexedFieldNames[1] === 'lastname',
//     'Store recognizes its indexed fields by name.'
//   )
//
//   Store.add([
//     { firstname: 'John', lastname: 'Doe', val: 17 },
//     { firstname: 'Jill', lastname: 'Doe', val: 13 },
//     { firstname: 'Jake', lastname: 'Doe', val: 14 },
//     { firstname: 'John', lastname: 'Dearborn', val: 14 }
//   ])
//
//   var records = Store.getIndexRecords('lastname', 'Doe')
//
//   t.ok(
//     records.length === 3 &&
//     records[0].firstname === 'John' &&
//     records[1].firstname === 'Jill' &&
//     records[2].firstname === 'Jake',
//     'Indexed records retrieved successfully.'
//   )
//
//   Store.removeIndex('firstname')
//   t.ok(Store.indexedFieldNames[0] === 'lastname', 'Remove index by name.')
//
//   Store.removeIndex()
//   t.ok(Store.indexedFieldNames.length === 0, 'Remove all indexes.')
//
//   // Use BTree index for numeric fields
//   Store.createIndex('val')
//   t.ok(
//     Store.indexedFieldNames.length === 1 &&
//     Store.indexedFieldNames[0] === 'val' &&
//     Store.METADATA.INDEX.val.isBTree &&
//     Store.getIndexRecords('val', 14).length === 2 &&
//     Store.METADATA.INDEX.val.BTREE.get(13) === 1,
//     'Add B-Tree index on numeric field.'
//   )
//
//   t.end()
// })

// TODO: Store-level Validation Rules
// TODO: Filters
// TODO: Proxy
