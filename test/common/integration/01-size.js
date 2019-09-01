const test = require('tape')
const gzip = require('gzip-size')

test('Distribution File Sizes', function (t) {
  let filepath = require('path').resolve('./test/lib/ngn.min.js')
  let stats = require('fs').statSync(filepath)
  let uncompressedSize = (stats.size / 1000).toFixed(2)

  t.ok(uncompressedSize < 100, 'Uncompressed distributable file is under 100kb (' + (stats.size / 1000) + 'kb).')

  let compressedSize = (gzip.fileSync(filepath, { level: 9 }) / 1000).toFixed(2)
  t.ok(compressedSize < 30, 'Compressed (minified) distributable is under 30kb (' + compressedSize + 'kb)')

  t.end()
})
