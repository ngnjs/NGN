import test from 'tappedout'
import { Middleware } from '/app/.dist/ngn/index.js'

test('Sync Middleware', t => {
  const mw = new Middleware()

  mw.use((m, next) => { count++; next() })
  mw.use((m, next) => { count++; next() })
  mw.use((m, next) => { count++; next() })

  let count = 0
  mw.run({ test: true }, () => {
    t.ok(count === 3, `Ran 3 middleware operations. Recognized ${count}.`)
    t.end()
  })
})

test('Async Middleware w/ Final Method', t => {
  const mw = new Middleware()

  mw.use((m, next) => { count++; next() })
  mw.use((m, next) => setTimeout(() => { count++; next() }, 10))
  mw.use((m, next) => { count++; next() })

  let count = 0
  mw.run({ test: true }, () => {
    count++
    t.ok(count === mw.size + 1, `Ran ${mw.size + 1} total middleware operations (w/ final op) with one async operation. Recognized ${count}.`)
    t.end()
  })
})

test('Async Middleware w/o Final Method', t => {
  const mw = new Middleware()

  mw.use(next => { count++; next() })
  mw.use(next => {
    setTimeout(() => { count++; next() }, 10)
  })
  mw.use(next => { count++; next() })

  let count = 0

  mw.run()
  setTimeout(() => {
    t.ok(count === mw.size, `Ran ${mw.size} total middleware operations (w/o final op) with one async operation. Recognized ${count}.`)
    t.end()
  }, 300)
})
