const test = require('tape')
const TaskRunner = require('shortbus')
const uri = require('../../package.json').mocky

// Remember to run `npm run test:build` before executing,
// otherwise the lib directory will not exist.

require('../lib/core')
require('../lib/exception')
require('../lib/eventemitter')
require('../lib/net/NET')

test('NGN.NET Sanity Checks', function (t) {
  t.ok(NGN.NET !== undefined, 'NGN.NET namespace exists')
  t.ok(typeof NGN.NET.Resource === 'function', 'NGN.NET.Resource class available.')
  t.ok(typeof NGN.NET.Request === 'function', 'NGN.NET.Request class available.')
  t.ok(typeof NGN.NET.request === 'function', 'NGN.NET.request method available.')
  t.ok(typeof NGN.NET.send === 'function', 'NGN.NET.send method available.')
  t.ok(typeof NGN.NET.preflight === 'function', 'NGN.NET.preflight method available.')
  t.ok(typeof NGN.NET.options === 'function', 'NGN.NET.options request method available.')
  t.ok(typeof NGN.NET.OPTIONS === 'function', 'NGN.NET.OPTIONS alias method available.')
  t.ok(typeof NGN.NET.head === 'function', 'NGN.NET.head request method available.')
  t.ok(typeof NGN.NET.HEAD === 'function', 'NGN.NET.HEAD request alias available.')
  t.ok(typeof NGN.NET.get === 'function', 'NGN.NET.get request method available.')
  t.ok(typeof NGN.NET.GET === 'function', 'NGN.NET.GET request alias available.')
  t.ok(typeof NGN.NET.post === 'function', 'NGN.NET.post request method available.')
  t.ok(typeof NGN.NET.POST === 'function', 'NGN.NET.POST request alias available.')
  t.ok(typeof NGN.NET.put === 'function', 'NGN.NET.put request method available.')
  t.ok(typeof NGN.NET.PUT === 'function', 'NGN.NET.PUT request alias available.')
  t.ok(typeof NGN.NET.delete === 'function', 'NGN.NET.delete request method available.')
  t.ok(typeof NGN.NET.DELETE === 'function', 'NGN.NET.DELETE request alias available.')
  t.ok(typeof NGN.NET.trace === 'function', 'NGN.NET.trace request method available.')
  t.ok(typeof NGN.NET.TRACE === 'function', 'NGN.NET.TRACE request alias available.')
  t.ok(typeof NGN.NET.json === 'function', 'NGN.NET.json request method available.')
  t.ok(typeof NGN.NET.JSON === 'function', 'NGN.NET.JSON request alias available.')
  t.ok(typeof NGN.NET.jsonp === 'function', 'NGN.NET.jsonp request method available.')
  t.ok(typeof NGN.NET.JSONP === 'function', 'NGN.NET.JSONP request alias available.')

  t.end()
})

test('NGN.NET.Request', function (t) {
  let request = new NGN.NET.Request({
    username: 'test',
    password: 'test',
    url: uri.get,
    body: {
      test: 'test'
    }
  })

  request.setHeader('X-NGN', 'test')

  t.ok(request.password === undefined, 'Password is not exposed.')
  t.ok(request.hostname === 'mockbin.org', 'Properly parsed hostname.')
  t.ok(request.protocol === 'http', 'Properly parsed protocol.')
  t.ok(request.method === 'GET', 'Defaults to GET method.')
  t.ok(request.headers.hasOwnProperty('x-ngn'), 'Custom header applied.')
  t.ok(request.headers.hasOwnProperty('content-length'), 'Content-Length header present for secure requests (basic auth).')
  t.ok(request.headers.hasOwnProperty('content-type'), 'Content-Type header present for secure requests (basic auth).')
  t.ok(request.headers.hasOwnProperty('authorization'), 'Authorization header present for secure requests (basic auth).')
  t.ok(request.headers['content-type'] === 'application/json', 'Content-Type correctly identifies JSON.')
  t.ok(request.headers['content-length'] === 15, 'Content-Type correctly identifies length of JSON string.')
  t.ok(request.headers['x-ngn'] === 'test', 'Custom header contains appropriate value.')
  t.ok(request.headers.authorization.indexOf('Basic ') === 0, 'Authorization basic auth digest correctly assigned to header.')

  request.accessToken = '12345'

  t.ok(request.headers.hasOwnProperty('authorization'), 'Authorization header present for secure requests (token).')
  t.ok(request.headers.authorization === 'Bearer 12345', 'Authorization token correctly assigned to header.')
  t.ok(request.crossOriginRequest, 'Correctly identifies request as a cross-domain request.')

  let params = request.queryParameters
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

  t.ok(request.port === 80, 'Proper port identified.')

  t.end()
})

test('NGN.NET Basic Requests', function (t) {
  let reqs = new TaskRunner()

  reqs.add('OPTIONS', function (next) {
    NGN.NET.OPTIONS(uri.get, function (res) {
      t.pass('NGN.NET.OPTIONS alias points to NGN.NET.options')
      t.ok(res.status === 200, 'NGN.NET.OPTIONS sends and receives.')
      next()
    })
  })

  reqs.add('HEAD', function (next) {
    NGN.NET.HEAD(uri.head, function (res) {
      t.pass('NGN.NET.HEAD alias points to NGN.NET.head')
      t.ok(res.status === 200, 'NGN.NET.HEAD sends and receives.')
      next()
    })
  })

  reqs.add('TRACE', function (next) {
    NGN.NET.TRACE(uri.trace, function (res) {
      t.pass('NGN.NET.TRACE alias points to NGN.NET.trace')

      if (res.status === 405) {
        t.pass('NGN.NET.TRACE sends and receives.')
      } else {
        t.ok(res.status === 200, 'NGN.NET.TRACE sends and receives.')
      }

      next()
    })
  })

  reqs.add('GET', function (next) {
    NGN.NET.GET(uri.get, function (res) {
      t.pass('NGN.NET.GET alias points to NGN.NET.get')
      t.ok(res.status === 200, 'NGN.NET.GET sends and receives.')
      next()
    })
  })

  reqs.add('Redirected GET', function (next) {
    NGN.NET.GET(uri.redirect, function (res) {
      t.ok(res.status === 200, 'NGN.NET.GET follows a redirect.')
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
      t.ok(res.status === 200, 'NGN.NET.POST sends and receives.')
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
      t.ok(res.status === 200, 'NGN.NET.PUT sends and receives.')
      next()
    })
  })

  reqs.add('DELETE', function (next) {
    NGN.NET.DELETE(uri.del, function (res) {
      t.pass('NGN.NET.DELETE alias points to NGN.NET.delete')
      t.ok(res.status === 200, 'NGN.NET.DELETE sends and receives.')
      next()
    })
  })

  reqs.add('JSON', function (next) {
    NGN.NET.JSON(uri.json, function (err, data) {
      t.pass('NGN.NET.JSON alias points to NGN.NET.json')
      t.ok(err === null, 'NGN.NET.JSON sends and receives.')
      next()
    })
  })

  reqs.add('JSONP', function (next) {
    NGN.NET.JSONP(uri.json, function (err, data) {
      t.pass('NGN.NET.JSONP alias points to NGN.NET.jsonp')

      if (NGN.nodelike) {
        t.ok(err !== null, 'NGN.NET.JSONP throws error in node-like environment.')
      } else {
        t.ok(err === null, 'NGN.NET.JSONP sends and receives.')
      }

      next()
    })
  })

  reqs.on('complete', function () {
    t.end()
  })

  reqs.run()
})

test('NGN.NET.Resource', function (t) {
  let a = new NGN.NET.Resource({
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
    nocache: true
  })

  let b = new NGN.NET.Resource({
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

  let req = new NGN.NET.Request({
    url: uri.get,
    method: 'GET'
  })

  let breq = new NGN.NET.Request({
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
  t.ok(req.queryParameters.hasOwnProperty('nonce'), 'Proper query parameter appended to URL.')
  t.ok(Object.keys(req.queryParameters).length === 3, 'Nocache query parameter applied to request.')

  t.end()
})
