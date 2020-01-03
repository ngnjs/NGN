import 'source-map-support/register.js'
import test from 'tape'
import NGN from '../.node/index.js'
import TaskRunner from 'shortbus'
import Meta from './helper.js'

NGN.BUS.on(NGN.WARNING_EVENT, function (msg) {
  console.log('\n\n\n\n:::WARNING:::', msg)
})

test('NGN.DATA.Store Basic Functionality', function (t) {
  var MetaModel = new NGN.DATA.Model(Meta())
  var GoodStore = new NGN.DATA.Store({
    model: MetaModel
  })

  t.ok(GoodStore.name === 'Untitled Data Store', 'Correctly named store.')

  // t.throws(function () {
  //   var BadStore = new NGN.DATA.Store() // eslint-disable-line no-unused-vars
  // }, 'An invalid or missing configuration throws an error.')

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

  tasks.add('Filtering', function (next) {
    t.ok(typeof NGN.DATA.Filter === 'function', 'The filter class is recognized.')

    GoodStore.clear()
    GoodStore.add([{
      firstname: 'John',
      lastname: 'Doe'
    }, {
      firstname: 'Jane',
      lastname: 'Doe'
    }, {
      firstname: 'Bob',
      lastname: 'Doe'
    }, {
      firstname: 'Jack',
      lastname: 'Swanson'
    }])

    var DoeFamily = new NGN.DATA.Filter('doe_family', function (record) {
      return record.lastname === 'Doe'
    })

    var JNames = new NGN.DATA.Filter('j_names', function (record) {
      return record.firstname.charAt(0) === 'J'
    })

    GoodStore.addFilter(DoeFamily)
    GoodStore.addFilter(JNames)

    t.ok(GoodStore.METADATA.filters.size === 2, 'Correct number of filters applied.')
    t.ok(GoodStore.size === 4, 'Filters are not automatically applied.')

    GoodStore.filter()
    t.ok(GoodStore.size === 2, 'All filters reduce the resultset properly.')

    GoodStore.clearFilter()
    t.ok(GoodStore.size === 4, 'Clearing filters maximizes the resultset.')

    GoodStore.filter()
    GoodStore.disableFilter('j_names')
    t.ok(GoodStore.size === 3, 'Disabling a filter reapplies records to active resultset.')

    GoodStore.enableFilter('j_names')
    t.ok(GoodStore.size === 2, 'Enabling specific filters reduces the data set correctly.')

    GoodStore.filter('j_names')
    t.ok(GoodStore.size === 2, 'Repeating filter doesn\'t change results.')

    GoodStore.clearFilter()
    GoodStore.filter('j_names')
    GoodStore.filter('doe_family')
    t.ok(GoodStore.size === 2, 'Applying additional filters reduces the resultset correctly.')

    GoodStore.removeFilter('j_names')
    t.ok(GoodStore.METADATA.filters.size === 1, 'Successfully removed single filter.')
    t.ok(GoodStore.size === 3, 'Removing a single filter restores records.')

    GoodStore.removeFilter()
    t.ok(GoodStore.METADATA.filters.size === 0, 'Successfully removed all filters.')
    t.ok(GoodStore.size === 4, 'Removing all filters restores records.')

    next()
  })

  tasks.add('Insert record before another', function (next) {
    GoodStore.clear()
    GoodStore.clearFilter()

    var record = GoodStore.insertBefore(10, {
      firstname: 'John',
      lastname: 'Doe'
    })

    t.ok(GoodStore.length === 1, 'Inserted record into empty store.')
    t.ok(GoodStore.size === 1, 'Inserted record recognized in data set.')
    t.ok(record.firstname === 'John', 'Added record accurately represents the stored data.')
    t.ok(GoodStore.contains(record), 'Store recognizes that it contains the new record.')
    t.ok(GoodStore.indexOf(record) === 0, 'Store accurately returns the index of the new record.')

    GoodStore.once('record.create', function (rec) {
      t.pass('Inserting a record to a store emits a record.create event.')
      t.ok(rec.firstname === GoodStore.first.firstname, 'First accessor returns the inserted record within the store.')
      t.ok(GoodStore.first.firstname === 'Jill', 'First accessor returns proper values.')
      t.ok(GoodStore.last.firstname === 'John', 'Last accessor returns proper values.')
      t.ok(GoodStore.length === 2, 'Correct number of records identified.')

      next()
    })

    GoodStore.insertBefore(record, {
      firstname: 'Jill',
      lastname: 'Doe'
    })
  })

  tasks.add('Insert record after another', function (next) {
    GoodStore.clear()
    GoodStore.clearFilter()

    var record = GoodStore.insertAfter(10, {
      firstname: 'John',
      lastname: 'Doe'
    })

    t.ok(GoodStore.length === 1, 'Inserted record into empty store.')
    t.ok(GoodStore.size === 1, 'Inserted record recognized in data set.')
    t.ok(record.firstname === 'John', 'Added record accurately represents the stored data.')
    t.ok(GoodStore.contains(record), 'Store recognizes that it contains the new record.')
    t.ok(GoodStore.indexOf(record) === 0, 'Store accurately returns the index of the new record.')

    GoodStore.once('record.create', function (rec) {
      t.pass('Inserting a record after another emits a record.create event.')
      t.ok(rec.firstname === GoodStore.last.firstname, 'Last accessor returns the inserted record within the store.')
      t.ok(GoodStore.last.firstname === 'Jill', 'Last accessor returns proper values.')
      t.ok(GoodStore.first.firstname === 'John', 'First accessor returns proper values.')
      t.ok(GoodStore.size === 2, 'Correct number of records identified.')

      next()
    })

    GoodStore.insertAfter(record, {
      firstname: 'Jill',
      lastname: 'Doe'
    })
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
      firstname: 'Bob',
      lastname: 'Swanson'
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

    var noBobFilter = new NGN.DATA.Filter('no_bob', function (record) {
      return record.firstname !== 'Bob'
    })

    noBobFilter.apply(GoodStore)
    GoodStore.filter()
    curr = record.next(4, true)

    t.ok(curr.firstname === 'Jill', 'Calling next() (w/ cycling) for more records than the store contains WITH RECORDS FILTERED OUT returns appropriate value.')

    next()
  })

  tasks.add('Remove a model from a store, from the model.', function (next) {
    GoodStore.clearFilter()

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

  var timer
  tasks.add('Performance Benchmark: Bulk Load', function (next) {
    GoodStore.clear()

    var timedOut = false
    timer = setTimeout(function () {
      timedOut = true
      t.fail('Bulk load did not complete in a timely manner.')
      next()
    }, 1000)

    var count = 200000
    var dataset = new Array(count)

    for (var i = 0; i < count; i++) {
      dataset[i] = {
        firstname: 'First ' + i,
        lastname: 'Last ' + i
      }
    }

    GoodStore.once('loaded', function () {
      clearTimeout(timer)

      t.ok(GoodStore.size === count, 'Loaded records in bulk.')
      t.ok(GoodStore.first.firstname === 'First 0', 'Retrieved first record from large load.')
      t.ok(GoodStore.last.firstname === 'First ' + (count - 1), 'Retrieved last record from large load.')
      t.ok(GoodStore.last.val !== null, 'Make sure default values are retrieved, even if unspecified.')
      t.ok(GoodStore.data[1567].firstname === 'First 1567', 'Retrieved middle record from large load.')

      if (!timedOut) {
        next()
      }
    })

    GoodStore.load(dataset)
  })

  tasks.add('Reload', function (next) {
    var count = 300000
    var dataset = new Array(count)

    for (var i = 0; i < count; i++) {
      dataset[i] = {
        firstname: 'First ' + i,
        lastname: 'Last ' + i
      }
    }

    GoodStore.once('reloaded', function () {
      t.ok(count === GoodStore.size, 'Reloading records properly drops old records and adds new.')
      next()
    })

    GoodStore.reload(dataset)
  })

  tasks.add('Reset Store', function (next) {
    GoodStore.reset()
    t.ok(GoodStore.size === 0 &&
      GoodStore.length === 0 &&
      GoodStore.METADATA.filters.size === 0 &&
      GoodStore.snapshots.length === 0,
    'Store is reset to original state.'
    )

    next()
  })

  tasks.on('complete', function () {
    // clearTimeout(timer)
    t.end()
  })

  tasks.run(true)
})

test('NGN.DATA.Store Record Auto-expiration (TTL)', function (t) {
  var MetaModel = new NGN.DATA.Model(Meta())
  var Store = new NGN.DATA.Store({
    model: MetaModel,
    expires: 100,
    index: ['firstname', 'lastname']
  })

  Store.thresholdOnce('record.expired', 4, function () {
    t.pass('Expiration events occurred on all records.')

    t.ok(Store.size === 0, 'All expired records removed from the store.')
    t.end()
  })

  Store.add([{
    firstname: 'John',
    lastname: 'Doe'
  }, {
    firstname: 'Jill',
    lastname: 'Doe'
  }, {
    firstname: 'Jake',
    lastname: 'Doe'
  }, {
    firstname: 'Bob',
    lastname: 'Swanson'
  }])
})

test('NGN.DATA.Store Indexing', function (t) {
  var MetaModel = new NGN.DATA.Model(Meta())
  var Store = new NGN.DATA.Store({
    model: MetaModel,
    index: ['firstname', 'lastname']
  })

  t.ok(Store.METADATA.INDEXFIELDS.size === 2, 'Indexes applied to store.')
  t.ok(
    Store.indexedFieldNames[0] === 'firstname' &&
    Store.indexedFieldNames[1] === 'lastname',
    'Store recognizes its indexed fields by name.'
  )

  Store.add([
    { firstname: 'John', lastname: 'Doe', val: 17 },
    { firstname: 'Jill', lastname: 'Doe', val: 13 },
    { firstname: 'Jake', lastname: 'Doe', val: 14 },
    { firstname: 'John', lastname: 'Dearborn', val: 14 }
  ])

  var records = Store.getIndexRecords('lastname', 'Doe')

  t.ok(
    records.length === 3 &&
    records[0].firstname === 'John' &&
    records[1].firstname === 'Jill' &&
    records[2].firstname === 'Jake',
    'Indexed records retrieved successfully.'
  )

  Store.removeIndex('firstname')
  t.ok(Store.indexedFieldNames[0] === 'lastname', 'Remove index by name.')

  Store.removeIndex()
  t.ok(Store.indexedFieldNames.length === 0, 'Remove all indexes.')

  // Use BTree index for numeric fields
  Store.createIndex('val')
  t.ok(
    Store.indexedFieldNames.length === 1 &&
    Store.indexedFieldNames[0] === 'val' &&
    Store.METADATA.INDEX.val.isBTree &&
    Store.getIndexRecords('val', 14).length === 2 &&
    Store.METADATA.INDEX.val.BTREE.get(13) === 1,
    'Add B-Tree index on numeric field.'
  )

  t.end()
})

test('NGN.DATA.Store Record Movement', function (t) {
  var MetaModel = new NGN.DATA.Model(Meta())
  var Store = new NGN.DATA.Store({
    model: MetaModel
  })

  Store.add([{
    firstname: 'John',
    lastname: 'Doe'
  }, {
    firstname: 'Jill',
    lastname: 'Doe'
  }, {
    firstname: 'Jake',
    lastname: 'Doe'
  }, {
    firstname: 'Bob',
    lastname: 'Swanson'
  }])

  Store.move(Store.last, 1)
  t.ok(Store.last.firstname === 'Jake' && Store.getRecord(1).firstname === 'Bob', 'Moved record to new position.')

  Store.once('record.moved', function (delta) {
    t.pass('record.moved event triggered.')
    t.ok(Store.last.firstname === 'Bob' && Store.getRecord(1).firstname === 'Jill', 'Moved record to end of store.')

    Store.moveToStart(Store.last)
    t.ok(Store.first.firstname === 'Bob' && Store.last.firstname === 'Jake', 'Moved record to beginning of store.')

    t.end()
  })

  Store.moveToEnd(1)
})

test('NGN.DATA.Store Record Restoration', function (t) {
  var MetaModel = new NGN.DATA.Model(Meta())
  var Store = new NGN.DATA.Store({
    model: MetaModel,
    softDelete: true
  })

  Store.add([{
    firstname: 'John',
    lastname: 'Doe'
  }, {
    firstname: 'Jill',
    lastname: 'Doe'
  }])

  Store.once('record.restored', function (record) {
    t.pass('record.restored event triggered correctly.')
    t.ok(record === oldRecord, 'The appropriate record was restored.')
    t.ok(Store.size === 2, 'Store record counts are correct before and after the restore operation.')
    t.end()
  })

  var oldRecord = Store.remove(Store.first)
  t.ok(Store.size === 1 && Store.length === 2 && !Store.PRIVATE.ACTIVERECORDS.has(oldRecord.OID), 'Soft delete works.')

  Store.restore(oldRecord)
})

test('Store Cloning', function (t) {
  var MetaModel = new NGN.DATA.Model(Meta())
  var Store = new NGN.DATA.Store({
    model: MetaModel,
    softDelete: true
  })

  Store.add([{
    firstname: 'John',
    lastname: 'Doe'
  }, {
    firstname: 'Jill',
    lastname: 'Doe'
  }, {
    firstname: 'Jason',
    lastname: 'Doe'
  }, {
    firstname: 'Dylan',
    lastname: 'Johnson'
  }])

  Store.addFilter('j_names', function (record) {
    return record.firstname.charAt(0).toUpperCase() === 'J'
  })

  var Clone = Store.clone()
  Clone.name = 'Cloney'

  // console.log(Clone.size === Store.size
  //   , Clone.length === Store.length
  //   , Clone.METADATA.filters.size + ' --> ' + Store.METADATA.filters.size
  //   , Clone.OID !== Store.OID)

  t.ok(Clone.size === Store.size &&
    Clone.length === Store.length &&
    Clone.METADATA.filters.size === Store.METADATA.filters.size &&
    Clone.OID !== Store.OID,
  'Basic cloning produces a copy of the store.'
  )
  console.log('<--', Store.size, Clone.size)
  console.log('Filter Store')
  Store.filter()
  console.log('Filter Clone')
  Clone.filter()
  console.log(Clone.data)
  console.log('==>', Store.size, Clone.size)
  t.ok(Store.size === 3 &&
    Clone.size === Store.size &&
    Clone.length === Store.length &&
    Clone.METADATA.filters.size === Store.METADATA.filters.size &&
    Clone.OID !== Store.OID,
  'Basic cloning with filter produces a copy of the store.'
  )

  t.end()
})

// TODO: Find/Query
// TODO: Sorting
// TODO: Deduplicate
// TODO: Invalid/valid field events for store records
// TODO: Undo/Redo
// TODO: Merge & Split Store(s): By # of divisions, By # of records. Have a concat() method for merging.
// TODO: Store-level Validation Rules
// TODO: Proxy
// TODO: Split by queries
// TODO: pop() unshift()
// TODO: Make it possible to trace where events are triggered from.

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
