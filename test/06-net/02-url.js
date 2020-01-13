import 'source-map-support/register.js'
import test from 'tape'
import NGN from '../.node/index.js'

NGN.BUS.on(NGN.WARNING_EVENT, msg => console.log('\n\n\n\n:::WARNING:::', msg))

test('NGN.NET.URL Basic Parsing', t => {
  let url = new NGN.NET.URL()

  t.ok(url.path === '/', `Recognizes current root as base path when no root is specified. "/" === "${url.path}"`)
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

test('NGN.NET.URL Basic Modifications', t => {
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

  url.resetPort()
  t.ok(url.port === 443, 'Port successfully cleared.')
  t.comment(url.toString())
  t.ok(url.toString() === 'https://domain.com/path/to/file.html?min=0&max=1&safe=true#h1', 'Port not displayed after being cleared with a well known protocol.')
  t.ok(url.toString({ forcePort: true }) === 'https://domain.com:443/path/to/file.html?min=0&max=1&safe=true#h1', 'Port still displayed after being cleared with a well known protocol (forcing port in toString).')

  t.end()
})

test('NGN.NET.URL Query Parameters', t => {
  const url = new NGN.NET.URL('https://domain.com:4443/path/to/file.html?min=0&max=1&safe#h1')
  t.ok(Object.keys(url.query).length === 3, 'Query object enumerates values correctly.')
  t.ok(url.query.min === 0, `Identify numeric attributes. Expected value of 0, received value of ${url.query.min}`)
  t.ok(url.query.safe === true, `Identify boolean attributes. Expected value of true, received value of ${url.query.safe}`)

  delete url.query.max
  t.ok(Object.keys(url.query).length === 2, 'Query object enumerates values correctly after deletion.')

  url.query.test = 'value'
  t.ok(url.query.test === 'value', 'Adding new query parameter is reflected in query object.')
  t.ok(url.querystring === 'min=0&safe=true&test=value', `Querystring modifications reflect query object. Expected "min=0&safe=true&test=value", received "${url.querystring}"`)
  t.ok(url.toString() === 'https://domain.com:4443/path/to/file.html?min=0&safe=true&test=value#h1')

  url.querystring = 'a=a&b&c=c'
  t.ok(url.toString({ shrinkQuerystring: true }) === 'https://domain.com:4443/path/to/file.html?a=a&b&c=c#h1', `Overwriting querystring generates appropriate URL. Expected "https://domain.com:4443/path/to/file.html?a=a&b&c=c#h1", received "${url.toString()}".`)
  t.ok(url.query.b === true, 'Overwritten query object returns appropriate new default values.')
  url.query.b = false
  t.ok(url.toString() === 'https://domain.com:4443/path/to/file.html?a=a&b=false&c=c#h1', `Overwriting querystring generates appropriate URL. Expected "https://domain.com:4443/path/to/file.html?a=a&b=false&c=c#h1", received "${url.toString()}".`)
  t.ok(url.query.a === 'a' && url.query.b === false && url.query.c === 'c', 'Overwritten query string is properly reflected in query object.')
  t.end()
})

test('NGN.NET.URL Hash', t => {
  const url = new NGN.NET.URL('https://domain.com:4443/path/to/file.html?min=0&max=1&safe#h1')

  t.ok(url.hash === 'h1', 'Properly parsed hash.')
  url.hash = 'h2'
  t.ok(url.hash === 'h2', 'Properly updated hash.')
  t.ok(url.toString() === 'https://domain.com:4443/path/to/file.html?min=0&max=1&safe=true#h2', 'Hash update reflected in URL.')
  t.ok(url.toString({ hash: false }) === 'https://domain.com:4443/path/to/file.html?min=0&max=1&safe=true', 'Hash successfully ignored.')

  url.hash = null
  t.ok(url.toString() === 'https://domain.com:4443/path/to/file.html?min=0&max=1&safe=true', 'Hash successfully removed.')

  t.end()
})

test('NGN.NET.URL Credentials', t => {
  const url = new NGN.NET.URL('https://admin:supersecret@domain.com:4443/path/to/file.html?min=0&max=1&safe#h1')

  t.ok(url.username === 'admin', 'Successfully parsed username.')
  t.ok(url.password === '***********', 'Successfully parsed and hid password.')
  t.ok(url.toString() === 'https://domain.com:4443/path/to/file.html?min=0&max=1&safe=true#h1', 'Credentials are not generated in toString by default.')
  t.ok(url.toString({ username: true, password: true }) === 'https://admin:supersecret@domain.com:4443/path/to/file.html?min=0&max=1&safe=true#h1', 'Credentials are generated in toString when requested.')
  t.ok(url.toString({ password: true }) === 'https://admin:supersecret@domain.com:4443/path/to/file.html?min=0&max=1&safe=true#h1', 'Credentials are generated in toString when password is requested.')
  t.ok(url.toString({ username: true }) === 'https://admin@domain.com:4443/path/to/file.html?min=0&max=1&safe=true#h1', 'Username is generated in toString when requested.')
  url.password = null
  t.ok(url.toString({ username: true, password: true }) === 'https://admin@domain.com:4443/path/to/file.html?min=0&max=1&safe=true#h1', 'Username is generated in toString when credentials are requested but only a username exists.')

  t.end()
})

test('NGN.NET.URL Formatting', t => {
  const url = new NGN.NET.URL('https://admin:supersecret@domain.com:443/path/to/file.html?min=0&max=1&safe#h1')

  t.ok(url.formatString() === 'https://domain.com/path/to/file.html?min=0&max=1&safe#h1', `Standard formatting works. Expected "https://domain.com/path/to/file.html?min=0&max=1&safe=true#h1", received "${url.formatString()}".`)
  t.ok(url.formatString('{{protocol}}://{{hostname}}') === 'https://domain.com', 'Basic formatting works.')
  t.ok(url.formatString('{{protocol}}://{{hostname}}/{{hash}}') === 'https://domain.com/#h1', 'Basic formatting works.')

  t.ok(url.toString({ querystring: false, hash: false }) === 'https://domain.com/path/to/file.html', `Configuration options in toString works properly. Expected "https://domain.com/path/to/file.html", received "${url.toString({ querystring: false, hash: false })}"`)
  t.end()
})

test('NGN.NET.URL Special Protocols', t => {
  const url = new NGN.NET.URL('mailto://john@doe.com')

  url.setDefaultProtocolPort('mailto', 587)
  t.ok(url.port === 587, `Successfully mapped a custom protocol to a default port. 587 === ${url.port}`)

  url.setDefaultProtocolPort({
    snmp: 162,
    ssh: 2222
  })

  url.href = 'ssh:user@domain.com'
  t.ok(url.port === 2222, 'Overriding a default port is successful.')

  url.unsetDefaultProtocolPort('ssh', 'mailto')
  t.ok(url.port === 2222, 'Unsetting a default port does not change the current value of the port.')
  url.resetPort()
  t.ok(url.port === 80, 'Resetting a port with a removed default protocol defaults to port 80.')

  t.end()
})

test('NGN.NET.URL Local Path Parsing', t => {
  const tmpurl = new NGN.NET.URL('path/to/file.html')
  t.ok(tmpurl.path === '/path/to/file.html', 'Properly handles local paths.')
  t.end()
})
