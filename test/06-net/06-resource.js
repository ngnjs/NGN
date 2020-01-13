import 'source-map-support/register.js'
import test from 'tape'
import NGN from '../.node/index.js'
import fs from 'fs'
import path from 'path'

const uri = JSON.parse(fs.readFileSync(path.resolve('./package.json')).toString()).endpoints

NGN.BUS.on(NGN.WARNING_EVENT, function (msg) {
  console.log('\n\n\n\n:::WARNING:::', msg)
})

test('NGN.NET.Resource Validation', function (t) {
  var req = new NGN.NET.Resource({
    baseUrl: 'https://test.author.io',
    method: 'GET'
  })

  req.username = 'john'
  req.password = 'passwd'

  t.ok(req.username === 'john', 'Properly set username.')
  t.ok(req.password === undefined, 'Password is not easily accessible.')

  req.username = 'bill'
  t.ok(req.username === 'bill', 'Properly reset username.')

  req.headers = req.globalHeaders // Forces code coeverage
  t.ok(req.headers === req.globalHeaders, 'NET Resource headers getter returns correct headers.')

  try {
    req.credentials = {
      accessToken: '12345abcde',
      username: 'unnecessary',
      password: 'unnecessary'
    }
  } catch (e) {}

  try {
    const exposedToken = req.credentials.accessToken
    t.fail('Access was allowed to read credentials when they should not be.')
  } catch (e) {
    t.pass('Explicitly deny credentials access.')
  }

  req.credentials = {
    username: 'bob',
    password: 'xpwd'
  }

  t.ok(req.username === 'bob', 'Properly set username via credentials.')

  var tmpurl = req.prepareUrl('/blah')
  t.ok(tmpurl === req.baseUrl + '/blah', 'Sucessfully prepended base URL to URI.')

  t.end()
})

test('NGN.NET.Resource', function (t) {
  var a = new NGN.NET.Resource({
    headers: {
      'X-NGN-TEST': 'test'
    },
    query: {
      nonce: 'easy'
    },
    credentials: {
      username: 'admin',
      password: 'secure'
    },
    unique: true,
    nocache: true
  })

  var b = new NGN.NET.Resource({
    headers: {
      'X-OTHER': 'other'
    },
    query: {
      other: 'simple'
    },
    credentials: {
      accessToken: '12345'
    },
    sslonly: true
  })

  t.ok(a.baseUrl.indexOf('https://') < 0, 'Not forcing SSL does not reqrite baseURL to use HTTPS')
  t.ok(b.baseUrl.indexOf('https://') === 0, 'Forcing SSL rewrites baseURL to use HTTPS')

  var req = new NGN.NET.Request({
    url: uri.get,
    method: 'GET'
  })

  var breq = new NGN.NET.Request({
    url: uri.get,
    method: 'GET'
  })

  a.preflight(req)
  b.preflight(breq)

  t.ok(req.headers.hasOwnProperty('x-ngn-test'), 'Custom header present.')
  t.ok(breq.headers.hasOwnProperty('x-other'), 'Custom header present on different resource.')
  t.ok(req.headers.hasOwnProperty('authorization'), 'Authorization header present for secure requests (basic auth).')
  t.ok(breq.headers.hasOwnProperty('authorization'), 'Authorization header present for secure requests (token auth).')
  t.ok(breq.headers.authorization === 'Bearer 12345', 'Authorization token correctly assigned to header.')
  t.ok(req.query.hasOwnProperty('nonce'), 'Proper query parameter appended to URL.')
  t.ok(req.headers.hasOwnProperty('cache-control'), 'Nocache query parameter applied to request.')
  t.ok(req.queryParameterCount === 2, 'Unique query parameter applied to request.')

  t.ok(req.headers['x-ngn-test'] === 'test', 'Header reference retrieves correct headers.')

  req.headers = {
    'X-TEST': 'test'
  }

  t.ok(req.headers['X-TEST'] === 'test', 'Properly set global headers.')

  req.credentials = {
    accessToken: '12345ABCDEF'
  }

  t.ok(req.credentials.accessToken === '12345ABCDEF' && req.credentials.username === undefined, 'Properly replaced basic auth with token.')

  a.query = { test: 1 }
  t.ok(a.query.test === 1, 'Properly set query parameters of a resource.')

  req.method = 'GET' // Does nothing, but induces code coverage
  req.method = 'head'

  t.ok(req.method === 'HEAD', 'Correctly sets method.')

  t.end()
})
