import 'source-map-support/register.js'
import test from 'tape'
import NGN from '../.node/index.js'
import fs from 'fs'
import path from 'path'
import TaskRunner from 'shortbus'

const uri = JSON.parse(fs.readFileSync(path.resolve('./package.json')).toString()).endpoints
const hostname = (new RegExp('://(.*?)/', 'i')).exec(uri.get)[1]

NGN.BUS.on(NGN.WARNING_EVENT, function (msg) {
  console.log('\n\n\n\n:::WARNING:::', msg)
})

test('NGN.NET.Request', function (t) {
  var request = new NGN.NET.Request({
    username: 'test',
    password: 'test',
    url: uri.get,
    body: {
      test: 'test'
    }
  })

  request.setHeader('X-NGN', 'test')

  t.ok(request.getHeader('X-NGN') === 'test', 'Request.getHeader returns proper value.')
  t.ok(request.password === undefined, 'Password is not exposed.')
  t.ok(request.hostname === hostname, 'Properly parsed hostname: ' + request.hostname)
  t.ok(request.protocol === uri.get.split(':')[0], 'Properly parsed protocol.')
  t.ok(request.method === 'GET', 'Defaults to GET method.')
  t.ok(request.headers.hasOwnProperty('x-ngn'), 'Custom header applied.')
  t.ok(request.headers.hasOwnProperty('content-length'), 'Content-Length header present for secure requests (basic auth).')
  t.ok(request.headers.hasOwnProperty('content-type'), 'Content-Type header present for secure requests (basic auth).')
  t.ok(request.headers.hasOwnProperty('authorization'), 'Authorization header present for secure requests (basic auth).')
  t.ok(request.headers['content-type'] === 'application/json', 'Content-Type correctly identifies JSON.')
  t.ok(request.headers['content-length'] === 15, 'Content-Type correctly identifies length of JSON string.')
  t.ok(request.headers['x-ngn'] === 'test', 'Custom header contains appropriate value.')
  t.ok(request.headers.authorization.indexOf('Basic ') === 0, 'Authorization basic auth digest correctly assigned to header.')
  t.ok(request.hash === '', 'Correct hash identified.')

  t.ok(request.maxRedirects === 10, 'Default to a maximum of 10 redirects.')
  request.maxRedirects = 30
  t.ok(request.maxRedirects === 25, 'Prevent exceeding 25 redirect threshold.')
  request.maxRedirects = -1
  t.ok(request.maxRedirects === 0, 'Do not allow negative redirect maximum.')
  request.maxRedirects = 15
  t.ok(request.maxRedirects === 15, 'Support custom redirect maximum between 0-25.')

  request.accessToken = '12345'

  t.ok(request.headers.hasOwnProperty('authorization'), 'Authorization header present for secure requests (token).')
  t.ok(request.headers.authorization === 'Bearer 12345', 'Authorization token correctly assigned to header.')
  t.ok(request.crossOriginRequest, 'Correctly identifies request as a cross-domain request.')

  var params = request.queryParameters
  t.ok(Object.keys(params).length === 1, 'Correctly identifies and parses query parameters.')

  request.removeHeader('X-NGN')
  t.ok(!request.headers.hasOwnProperty('x-ngn'), 'Removed header no longer part of request.')

  request.setQueryParameter('mytest', 'ok')
  t.ok(request.queryParameters.hasOwnProperty('mytest'), 'Added query parameter key.')
  t.ok(request.queryParameters.mytest === 'ok', 'Added correct query parameter value.')

  request.queryParameters.mytest = 'done'
  t.ok(request.queryParameters.hasOwnProperty('mytest'), 'Modification of existing query parameter does not remove key.')
  t.ok(request.queryParameters.mytest === 'done', 'Inline update of query parameter correctly identifies new value.')

  request.removeQueryParameter('mytest')
  t.ok(!request.queryParameters.hasOwnProperty('mytest'), 'Removing query parameter yields a URL without the parameter.')

  request.method = 'post'
  t.ok(request.method === 'POST', 'Dynamically setting method returns proper HTTP method.')
  t.ok(request.port === (request.protocol === 'https' ? 443 : 80), 'Proper port identified.')

  request.parseUri('http://user:passwd@test.com:7788/path/to/file.html')

  t.ok(request.username === 'user', 'Properly parsed basic auth string')
  t.ok(request.isCrossOrigin, 'CORS recognition correctly identifies cross origin request.')

  request.url = 'http://test.com:7788/path/to/to/../file.html'
  t.ok(request.url === 'http://test.com:7788/path/to/file.html', 'Properly normalized URL.')

  request.body = {
    form: {
      a: 'test',
      b: 1,
      c: {
        nested: true
      }
    }
  }

  t.ok(typeof request.body === 'string', 'Properly converted structured form to string-based body.')

  request.body = 'data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg=='
  t.ok(request.getHeader('content-type') === 'image/png', 'Correctly identified data image body type.')

  request.body = '<?xml version="1.0" encoding="UTF-8"?><note><to>Tove</to><from>Jani</from><heading>Reminder</heading><body>Don\'t forget me this weekend!</body></note>'
  t.ok(request.getHeader('content-type') === 'application/xml', 'Correctly identified XML body type.')

  request.body = '<html><body>test</body></html>'
  t.ok(request.getHeader('content-type') === 'text/html', 'Correctly identified HTML body type.')

  request.body = 'Basic text body.'
  t.ok(request.getHeader('content-type') === 'text/plain', 'Correctly identified HTML body type.')

  request = new NGN.NET.Request({
    url: uri.get,
    maxRedirects: 7
  })

  t.ok(request.maxRedirects === 7, 'Maximum redirects can be set via configuration.')

  var tmpurl = request.parseUri('path/to/file.html')
  t.ok(tmpurl.path === '/path/to/file.html', 'Properly handles local paths.')

  t.end()
})

test('NGN.NET Basic Requests', function (t) {
  var reqs = new TaskRunner()

  reqs.add('OPTIONS', function (next) {
    try {
      NGN.NET.OPTIONS(uri.options, function (res) {
        t.pass('NGN.NET.OPTIONS alias points to NGN.NET.options')
        t.ok(res.status === 200, 'NGN.NET.OPTIONS sends and receives. Received: ' + res.status)
        next()
      })
    } catch (eeee) {
      console.error(eeee)
      next()
    }
  })

  reqs.add('HEAD', function (next) {
    NGN.NET.HEAD(uri.head, function (res) {
      t.pass('NGN.NET.HEAD alias points to NGN.NET.head')
      t.ok(res.status === 200, 'NGN.NET.HEAD sends and receives. Received: ' + res.status)
      next()
    })
  })

  if (NGN.nodelike) {
    reqs.add('TRACE', function (next) {
      NGN.NET.TRACE(uri.trace, function (res) {
        t.pass('NGN.NET.TRACE alias points to NGN.NET.trace')

        if (res.status === 405) {
          t.pass('NGN.NET.TRACE sends and receives.')
        } else {
          t.ok(res.status === 200, 'NGN.NET.TRACE sends and receives. Received: ' + res.status)
        }

        next()
      })
    })
  } else {
    t.skip('Skipping HTTP TRACE alias test (unsupported in browsers).')
    t.skip('Skipping HTTP TRACE request (unsupported in browsers).')
  }

  reqs.add('GET', function (next) {
    NGN.NET.GET(uri.get, function (res) {
      t.pass('NGN.NET.GET alias points to NGN.NET.get')
      t.ok(res.status === 200, 'NGN.NET.GET sends and receives. Received: ' + res.status)
      next()
    })
  })

  reqs.add('Redirected GET', function (next) {
    NGN.NET.GET(uri.redirect, function (res) {
      t.ok(res.status === 200, 'NGN.NET.GET follows a redirect. Received: ' + res.status)
      next()
    })
  })

  reqs.add('POST', function (next) {
    NGN.NET.POST({
      url: uri.post,
      body: {
        test: 'test'
      }
    }, function (res) {
      t.pass('NGN.NET.POST alias points to NGN.NET.post')
      t.ok(res.status === 200 || res.status === 201, 'NGN.NET.POST sends and receives. Received: ' + res.status)
      next()
    })
  })

  reqs.add('PUT', function (next) {
    NGN.NET.PUT({
      url: uri.put,
      body: {
        test: 'test'
      }
    }, function (res) {
      t.pass('NGN.NET.PUT alias points to NGN.NET.put')
      t.ok(res.status === 200, 'NGN.NET.PUT sends and receives. Received: ' + res.status)
      next()
    })
  })

  reqs.add('DELETE', function (next) {
    NGN.NET.DELETE(uri.del, function (res) {
      t.pass('NGN.NET.DELETE alias points to NGN.NET.delete')
      t.ok(res.status === 200, 'NGN.NET.DELETE sends and receives. Received: ' + res.status)
      next()
    })
  })

  reqs.add('JSON', function (next) {
    NGN.NET.JSON(uri.json, function (err, data) {
      t.pass('NGN.NET.JSON alias points to NGN.NET.json')
      t.ok(err === null, 'NGN.NET.JSON sends and receives.' + (err !== null ? err.message : ''))
      next()
    })
  })

  reqs.add('JSONP', function (next) {
    NGN.NET.JSONP(uri.jsonp, function (err, data) {
      t.pass('NGN.NET.JSONP alias points to NGN.NET.jsonp')

      if (NGN.nodelike) {
        t.ok(err !== null, 'NGN.NET.JSONP throws error in node-like environment.')
      } else {
        t.ok(err === null && data.ok, 'NGN.NET.JSONP sends and receives.')
      }

      next()
    })
  })

  reqs.add('Custom Request', function (next) {
    NGN.NET.request({
      url: uri.get,
      method: 'GET'
    }, function () {
      next()
    })
  })

  reqs.on('complete', t.end)

  reqs.run(true)
})
