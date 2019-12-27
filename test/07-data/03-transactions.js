import 'source-map-support/register.js'
import test from 'tape'
import NGN from '../.node/index.js'

NGN.BUS.on(NGN.WARNING_EVENT, function (msg) {
  console.log('\n\n\n\n:::WARNING:::', msg)
})

test('NGN.DATA.TransactionLog', function (t) {
  var log = new NGN.DATA.TransactionLog()

  log.funnel(['advance', 'rollback', 'reset', 'commit'], 'done')

  t.ok(log.cursor === null, 'Initialize with null cursor.')
  t.ok(log.getCommit() === undefined, 'Fails to return a commit when none exist.')

  log.advance()
  log.rollback()
  t.ok(log.cursor === null, 'Advancing and rolling back on an empty log does nothing.')

  var ida = log.commit('a')
  t.ok(typeof ida === 'symbol', 'Committing an entry generates an ID.')
  t.ok(log.getCommit(ida).value === 'a', 'Retrieving a record by ID returns a transaction object.')

  var idb = log.commit('b')
  var idc = log.commit('c')
  var idd = log.commit('d')
  var ide = log.commit('e')

  t.ok(log.length === 5, 'Correct number of logs committed.')
  t.ok(log.cursor === ide, 'Cursor successfully advances with each commit.')

  log.rollback()
  t.ok(log.cursor === idd, 'Default rollback moves cursor back one index.')
  t.ok(log.cursorIndex === 3, 'Proper cursor index number retrieved.')
  t.ok(log.currentValue === 'd', 'Proper cursor value returned for currentValue.')

  log.rollback(2)
  t.ok(log.cursor === idb, 'Multistep rollback moves cursor back appropriately.')

  log.once('advance', function (data) {
    t.ok(typeof data === 'symbol', 'Advance event triggered with ID.')
  })

  log.once('commit', function (data) {
    t.ok(typeof data === 'symbol', 'Log event triggered with ID.')
  })

  log.once('rollback', function (data) {
    t.ok(typeof data === 'symbol', 'Rollback event triggered with ID.')
  })

  log.advance()
  t.ok(log.cursor === idc, 'Default advance moves cursor forward one index.')

  log.advance(2)
  t.ok(log.cursor === ide, 'Multistep advance moves cursor forward appropriately.')

  log.rollback(-1)
  t.ok(log.cursor === ide, 'Negative rollback ignored.')

  log.advance(-1)
  t.ok(log.cursor === ide, 'Negative advance ignored.')

  log.rollback(10)
  t.ok(log.cursor === ida, 'Rollback limited to beginning of log.')

  log.advance(100)
  t.ok(log.cursor === ide, 'Advance limited to end of log.')

  log.rollback(2)
  var idf = log.commit('f')

  t.ok(log.length === 4, 'Committing after rollback contains correct number of entries.')
  t.ok(log.cursor === idf, 'Commit returns latest cursor.')

  log.rollback()
  log.flush()
  log.advance()
  t.ok(log.length === 3 && log.cursor === idc, 'Flush removes correct entries.')

  t.ok(log.log.length === 3, 'Correctly generates an array-based log/report.')

  log.once('done', function () {
    t.ok(log.length === 0, 'Reset clears the log.')

    log = new NGN.DATA.TransactionLog(3)

    log.commit('aa')
    log.commit('bb')
    const idcc = log.commit('cc')
    log.commit('dd')
    log.commit('ee')
    log.rollback(10)

    t.ok(log.cursor === idcc, 'Max entries supported with LIFO pattern.')

    t.end()
  })

  log.reset()
})
