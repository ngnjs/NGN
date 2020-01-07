import 'source-map-support/register.js'
import test from 'tape'
import NGN from '../.node/index.js'

NGN.BUS.on(NGN.WARNING_EVENT, msg => console.log('\n\n\n\n:::WARNING:::', msg))

test('NGN.NET.URL Parsing Checks', t => {
  let url = new NGN.NET.URL()

  t.ok(url.path === '/', 'Recognizes current root as base path when no root is specified.')
  t.ok(url.protocol === 'http', 'Defaults to HTTP protocol.')
  t.ok(url.scheme === 'http', 'Scheme alias returns appropriate protocol.')

  url = new NGN.NET.URL('https://domain.com/path/to/file.html?min=0&max=1&safe#h1')
  t.ok(url.protocol === 'https', 'Proper protocol identified.')
  t.ok(url.hostname === 'domain.com', 'Identified hostname.')
  t.ok(url.port === 443, `Correctly identifies appropriate default port for known protocols. Expected 4443, received ${url.port}.`)
  t.ok(url.path === '/path/to/file.html', 'Identified the path.')
  t.ok(url.querystring === 'min=0&max=1&safe', 'Identified correct query string.')
  t.ok(url.hash === 'h1', 'Identified correct hash value.')

  url = new NGN.NET.URL('https://domain.com:4443/path/to/file.html?min=0&max=1&safe#h1')
  t.ok(url.protocol === 'https', 'Proper protocol identified.')
  t.ok(url.hostname === 'domain.com', 'Identified hostname.')
  t.ok(url.port === 4443, `Correctly identifies custom port for known protocols. Expected 4443, received ${url.port}.`)
  t.ok(url.path === '/path/to/file.html', 'Identified the path.')
  t.ok(url.querystring === 'min=0&max=1&safe', 'Identified correct query string.')
  t.ok(url.hash === 'h1', 'Identified correct hash value.')
  t.ok(true, url.toString())

  t.end()
})

test('NGN.NET.URL Modifications', t => {
  const url = new NGN.NET.URL('https://domain.com:4443/path/to/file.html?min=0&max=1&safe#h1')

  url.port = 'default'
  t.ok(url.port === 443, `Setting port to "default" leverages known protocols to determine port. Expected 443, received ${url.port}`)
  url.port = 7777
  t.ok(url.port === 7777, `Setting a non-standard port still works. Expected 7777, received ${url.port}`)

  try {
    url.port = 70000
    t.fail('Port was set out of bounds without throwing an error. (>65535)')
  } catch (e) {
    t.pass('Settting the port over 65535 throws an error.')
  }

  try {
    url.port = 0
    t.fail('Port was set out of bounds without throwing an error. (<1)')
  } catch (e) {
    t.pass('Settting the port below 1 throws an error.')
  }

  url.clearPort()
  t.ok(url.port === null, 'Port successfully cleared.')
  t.ok(url.toString() === 'https://domain.com/path/to/file.html?min=0&max=1&safe#h1', 'Port not displayed after being cleared with a well known protocol.')
  t.ok(url.toString(true) === 'https://domain.com:443/path/to/file.html?min=0&max=1&safe#h1', 'Port still displayed after being cleared with a well known protocol (forcing port in toString).')

  // TODO: query param tests
  // TODO: query param modification tests
  // TODO: querystring overwrite/modifications
  // TODO: hash CRUD
  // TODO: Credentials
  // TODO: Paths w/o domain/protocol

  t.end()
})
