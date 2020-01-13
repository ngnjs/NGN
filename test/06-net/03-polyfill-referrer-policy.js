import 'source-map-support/register.js'
import test from 'tape'
import NGN from '../.node/index.js'

if (NGN.nodelike) {
  test('Node ReferralPolicy Polyfill Sanity Check', t => {
    const rp = new NGN.NET.Request.ReferralPolicy()
    t.ok(rp.policy === 'no-referrer-when-downgrade', `Default policy is no-referrer-when-downgrade. Detected "${rp.policy}"`)
    t.end()
  })

  test('Node ReferralPolicy Checks', t => {
    const rp = new NGN.NET.Request.ReferralPolicy()
    let from
    let to
    let result

    // All tests come from examples at https://www.w3.org/TR/referrer-policy/#referrer-policies

    // no-referrer-when-downgrade
    rp.policy = 'no-referrer-when-downgrade'
    t.ok(rp.policy === 'no-referrer-when-downgrade', `Set policy to 'no-referrer-when-downgrade'. Class recognizes '${rp.policy}'`)
    from = 'https://example.com/page.html'
    to = 'https://not.example.com/'
    result = rp.referrerURL(from, to)
    t.ok(result === 'https://example.com/page.html', `Expected 'no-referrer-when-downgrade' referrer from "${from}" to "${to}" to be "https://example.com/page.html". Received "${result}"`)
    to = 'http://not.example.com/'
    result = rp.referrerURL(from, to)
    t.ok(result === null, `Expected 'no-referrer-when-downgrade' referrer from "${from}" to "${to}" to be null. Received "${result}"`)
    from = 'http://example.com/page.html'
    to = 'https://not.example.com/'
    result = rp.referrerURL(from, to)
    t.ok(result === 'http://example.com/page.html', `Expected 'no-referrer-when-downgrade' referrer from "${from}" to "${to}" to be "https://example.com/page.html". Received "${result}"`)

    // no-referrer
    rp.policy = 'no-referrer'
    t.ok(rp.policy === 'no-referrer', `Set policy to 'no-referrer'. Class recognizes '${rp.policy}'`)
    from = 'https://example.com/page.html'
    to = 'https://example.com/'
    result = rp.referrerURL(from, to)
    t.ok(result === null, `Expected 'no-referrer' referrer from "${from}" to "${to}" to be null. Received "${result}"`)

    // same-origin
    rp.policy = 'same-origin'
    t.ok(rp.policy === 'same-origin', `Set policy to 'same-origin'. Class recognizes '${rp.policy}'`)
    from = 'https://example.com/page.html'
    to = 'https://example.com/not-page.html'
    result = rp.referrerURL(from, to)
    t.ok(result === 'https://example.com/page.html', `Expected 'same-origin' referrer from "${from}" to "${to}" to be 'https://example.com/page.html'. Received "${result}"`)
    to = 'https://not.example.com/'
    result = rp.referrerURL(from, to)
    t.ok(result === null, `Expected same-origin' referrer from "${from}" to "${to}" to be null. Received "${result}"`)

    // origin
    rp.policy = 'origin'
    t.ok(rp.policy === 'origin', `Set policy to 'origin'. Class recognizes '${rp.policy}'`)
    from = 'https://example.com/page.html'
    to = 'http://another.example.com/not-page.html'
    result = rp.referrerURL(from, to)
    t.ok(result === 'https://example.com/', `Expected 'origin' referrer from "${from}" to "${to}" to be 'https://example.com/'. Received "${result}"`)

    // strict-origin
    rp.policy = 'strict-origin'
    t.ok(rp.policy === 'strict-origin', `Set policy to 'strict-origin'. Class recognizes '${rp.policy}'`)
    from = 'https://example.com/page.html'
    to = 'https://not.example.com'
    result = rp.referrerURL(from, to)
    t.ok(result === 'https://example.com/', `Expected 'strict-origin' referrer from "${from}" to "${to}" to be 'https://example.com/'. Received "${result}"`)
    to = 'http://not.example.com'
    result = rp.referrerURL(from, to)
    t.ok(result === null, `Expected 'strict-origin' referrer from "${from}" to "${to}" to be null. Received "${result}"`)
    from = 'http://example.com/page.html'
    to = 'http://not.example.com'
    result = rp.referrerURL(from, to)
    t.ok(result === 'http://example.com/', `Expected 'strict-origin' referrer from "${from}" to "${to}" to be 'http://example.com/'. Received "${result}"`)
    from = 'http://example.com/page.html'
    to = 'https://example.com'
    result = rp.referrerURL(from, to)
    t.ok(result === 'http://example.com/', `Expected 'strict-origin' referrer from "${from}" to "${to}" to be 'http://example.com/'. Received "${result}"`)

    // origin-when-cross-origin
    rp.policy = 'origin-when-cross-origin'
    t.ok(rp.policy === 'origin-when-cross-origin', `Set policy to 'origin-when-cross-origin'. Class recognizes '${rp.policy}'`)
    from = 'https://example.com/page.html'
    to = 'https://example.com/not-page.html'
    result = rp.referrerURL(from, to)
    t.ok(result === 'https://example.com/page.html', `Expected 'origin-when-cross-origin' referrer from "${from}" to "${to}" to be 'https://example.com/page.html'. Received "${result}"`)
    to = 'https://not.example.com/'
    result = rp.referrerURL(from, to)
    t.ok(result === 'https://example.com/', `Expected 'origin-when-cross-origin' referrer from "${from}" to "${to}" to be 'https://example.com/'. Received "${result}"`)

    // strict-origin-when-cross-origin
    rp.policy = 'strict-origin-when-cross-origin'
    t.ok(rp.policy === 'strict-origin-when-cross-origin', `Set policy to 'strict-origin-when-cross-origin'. Class recognizes '${rp.policy}'`)
    from = 'https://example.com/page.html'
    to = 'https://example.com/not-page.html'
    result = rp.referrerURL(from, to)
    t.ok(result === 'https://example.com/page.html', `Expected 'strict-origin-when-cross-origin' referrer from "${from}" to "${to}" to be 'https://example.com/page.html'. Received "${result}"`)
    to = 'https://not.example.com/'
    result = rp.referrerURL(from, to)
    t.ok(result === 'https://example.com/', `Expected 'strict-origin-when-cross-origin' referrer from "${from}" to "${to}" to be 'https://example.com/'. Received "${result}"`)
    to = 'http://not.example.com/'
    result = rp.referrerURL(from, to)
    t.ok(result === null, `Expected 'strict-origin-when-cross-origin' referrer from "${from}" to "${to}" to be null. Received "${result}"`)

    // unsafe-url
    rp.policy = 'unsafe-url'
    t.ok(rp.policy === 'unsafe-url', `Set policy to 'unsafe-url'. Class recognizes '${rp.policy}'`)
    from = 'https://example.com/sekrit.html'
    to = 'http://not.example.com/'
    result = rp.referrerURL(from, to)
    t.ok(result === 'https://example.com/sekrit.html', `Expected 'unsafe-url' referrer from "${from}" to "${to}" to be 'https://example.com/sekrit.html. Received "${result}"`)

    try {
      rp.policy = 'unrecognized'
      t.fail('Invalid policies should throw an error.')
    } catch (e) {
      t.pass('Setting an invalid policy throws an error.')
    }

    t.end()
  })
} else {
  test('Node ReferralPolicy Polyfill', t => {
    t.ok(NGN.NET.Request.ReferralPolicy === undefined, 'Referral policies do not need to be polyfilled in browser environments.')
    t.end()
  })
}
