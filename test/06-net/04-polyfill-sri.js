import 'source-map-support/register.js'
import test from 'tape'
import NGN from '../.node/index.js'

if (NGN.nodelike) {
  test('Node SRI Polyfill', t => {
    const sri = NGN.NET.Request.SRI
    const source = 'console.log(\'hello\');'
    const hash = 'sha512-/9wXJrT4fVC90Fxko/AY9VO6E6C1+atlV9CThcRFlmWODDqwRABAr/4EwtzU0W7yJy6PGyvNc9kZV66XEmkrKA=='
    const integrity = sri.generate(source)

    t.ok(integrity === hash, `Generated hash. Expected '${hash}', received '${integrity}'`)

    let result = sri.verify(integrity, source)
    t.ok(result.valid, 'Successfully verified integrity hash.')

    result = sri.verify(integrity.replace('sha512', 'sha384'), source)
    t.ok(!result.valid && result.reason === 'Integrity mismatch.', 'Mismatch successfully identified.')

    result = sri.verify('123', source)
    t.ok(!result.verified && result.reason.indexOf('improper format') > 0, 'Improper hash successfully identified.')
    t.end()
  })
} else {
  test('Node SRI Polyfill', t => {
    t.ok(NGN.NET.Request.SRI === undefined, 'Subresource integrity does not need to be polyfilled in browser environments.')
    t.end()
  })
}
