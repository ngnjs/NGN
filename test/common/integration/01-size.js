const test = require('tape')

test('Distribution File Sizes', function (t) {
  let stats = require('fs').statSync(require('path').resolve('./test/lib/ngn.js'))

  t.ok(stats.size/1000 < 10, `Distributable file is under 10kb (${stats.size/1000}kb).`)

  t.end()
})
