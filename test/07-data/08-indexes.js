import 'source-map-support/register.js'
import test from 'tape'
import NGN from '../.node/index.js'
import TaskRunner from 'shortbus'
import Meta from './helper.js'

NGN.BUS.on(NGN.WARNING_EVENT, function (msg) {
  console.log('\n\n\n\n:::WARNING:::', msg)
})

test('NGN.DATA.Index', function (t) {
  var index = new NGN.DATA.Index()
  var Model = new NGN.DATA.Model(Meta())
  var records = [
    new Model({ firstname: 'John', lastname: 'Doe' }),
    new Model({ firstname: 'Jill', lastname: 'Doe' }),
    new Model({ firstname: 'Jake', lastname: 'Doe' }),
    new Model({ firstname: 'John', lastname: 'Dearborn' })
  ]

  for (var i = 0; i < records.length; i++) {
    index.add(records[i].firstname, records[i].OID)
  }

  var indexes = index.recordsFor('John')
  t.ok(indexes.length === 2 &&
    records[0].OID === indexes[0] &&
    records[records.length - 1].OID === indexes[1], 'Identifies the appropriate records.'
  )

  t.ok(
    index.keys.length === 3 &&
    index.keys[0] === 'John' &&
    index.keys[1] === 'Jill' &&
    index.keys[2] === 'Jake',
    'Identifies unique keys correctly.'
  )

  index.update(records[0].OID, 'John', 'Johnny')
  t.ok(
    index.recordsFor('John').length === 1 &&
    index.recordsFor('Johnny').length === 1 &&
    records[records.length - 1].OID === indexes[1],
    'Update index with new value.'
  )

  t.ok(
    index.keys.length === 4 &&
    index.keys[0] === 'John' &&
    index.keys[3] === 'Johnny' &&
    index.keys[1] === 'Jill' &&
    index.keys[2] === 'Jake',
    'Updates unique keys correctly.'
  )

  index.remove(records[0].OID, 'Johnny')
  t.ok(index.uniqueValues.size === 3 && !index.uniqueValues.has('Johnny'), 'Remove index with value.')

  index.remove(records[records.length - 1].OID)
  t.ok(index.uniqueValues.size === 2, 'Remove index without value.')

  index.reset()
  t.ok(index.uniqueValues.size === 0, 'Reset empties the index.')
  t.ok(index.keys.length === 0, 'No unique keys remain after reset.')

  t.end()
})

test('NGN.DATA.BTree', function (t) {
  var tasks = new TaskRunner()
  var tree = new NGN.DATA.BTree()

  tasks.add('Put values into BTree', function (next) {
    var data = [2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36]

    for (var i = 0; i < data.length; i++) {
      tree.put(data[i], 'value_' + data[i].toString())
    }

    t.ok(tree.length === data.length, 'BTree has correct number of nodes/leafs.')

    next()
  })

  tasks.add('Append nodes', function (next) {
    var currentSize = tree.length
    var data = [7, 9, 11, 13]

    for (var i = 0; i < data.length; i++) {
      tree.put(data[i], 'value_' + data[i].toString())
    }

    t.ok(tree.length === (data.length + currentSize), 'BTree appends the correct number of nodes/leafs after initialization.')

    next()
  })

  tasks.add('Retrieve values', function (next) {
    t.ok(tree.get(8) === 'value_8', 'Retrieve correct value from tree.')
    t.ok(tree.get(3) === undefined, 'Return undefined when no value exists.')

    next()
  })

  tasks.add('Delete values', function (next) {
    tree.delete(8)
    tree.delete(14)
    tree.delete(36)
    tree.delete(37)

    t.ok(
      tree.get(8) === undefined &&
      tree.get(14) === undefined &&
      tree.get(36) === undefined &&
      tree.get(37) === undefined,
      'Removal of a key deletes it from the index.'
    )

    next()
  })

  tasks.add('Walk tree (ascending)', function (next) {
    var comp = [2, 4, 5, 6, 7, 9, 10, 11, 12, 13]
    var res = []

    tree.walk(2, 14, function (key, val) {
      res.push(key)

      if ('value_' + key.toString() !== val) {
        throw new Error('Invalid key/pair for ' + key + ':' + val.toString())
      }
    })

    for (var i = 0; i < comp.length; i++) {
      if (res[i] !== comp[i]) {
        t.fail('Walking tree failed to traverse each node.')
      }
    }

    t.pass('Ascended walk succeeds.')

    next()
  })

  tasks.add('Walk tree (descending)', function (next) {
    var comp = [18, 16, 13, 12, 11, 10, 9, 7, 6, 5, 4, 2]
    var res = []

    tree.walkDesc(2, 18, function (key, val) {
      res.push(key)

      if ('value_' + key.toString() !== val) {
        throw new Error('Invalid key/pair for ' + key + ':' + val.toString())
      }
    })

    for (var i = 0; i < comp.length; i++) {
      if (res[i] !== comp[i]) {
        t.fail('Descended walk through tree failed to traverse each node.')
      }
    }

    t.pass('Descended walk succeeds.')

    next()
  })

  tasks.add('Restricted count', function (next) {
    t.ok(tree.count(2, 18) === 12, 'Retrieves the correct number of indexes.')

    next()
  })

  tasks.add('Walk empty ranges', function (next) {
    tree.walk(37, 40, function (key, val) { t.fail('Failed to walk empty range (ascending).') })
    tree.walk(0, 1, function (key, val) { t.fail('Failed to walk empty range (ascending).') })
    tree.walkDesc(37, 40, function (key, val) { t.fail('Failed to walk empty range (descending).') })
    tree.walkDesc(0, 1, function (key, val) { t.fail('Failed to walk empty range (descending).') })

    t.ok(tree.length === 20, 'Walk results in proper number of nodes/leafs.')

    next()
  })

  tasks.on('complete', t.end)

  tasks.run(true)
})
