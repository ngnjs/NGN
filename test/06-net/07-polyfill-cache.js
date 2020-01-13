import 'source-map-support/register.js'
import test from 'tape'
import http, { request } from 'http'
import express from 'express'
import bodyParser from 'body-parser'
import TaskRunner from 'shortbus'
import NGN from '../.node/index.js'

if (NGN.nodelike) {
  let service
  let baseurl
  let requestCount = 0
  const app = express({ etag: true, maxAge: 100 })
  const server = http.createServer(app)
  const tasks = new TaskRunner()

  app.use(bodyParser.json({ strict: false }))
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use((req, res, next) => {
    requestCount++
    next()
  })
  app.get('/static', (req, res) => res.json({ text: 'static' }))

  tasks.add('Launch Test Server', next => {
    service = server.listen(0, '127.0.0.1', () => {
      baseurl = `http://${server.address().address}:${server.address().port}`
      next()
    })
  })

  tasks.add('Basic Tests', next => {
    test('Node Private HTTP Cache: no-store', t => {
      const req = new NGN.NET.Request({
        url: `${baseurl}/static`
      })

      const cache = req.HttpCache

      t.ok(cache !== undefined, 'HTTP Cache exists in Node-like environments.')

      req.send(res => {
        t.ok(cache.size === 0, 'no-store cache mode (default for Node-like environments) does not increase the cache size.')
        t.end()
        next()
      })
    })
  })

  tasks.add('Default Mode', next => {
    requestCount = 0

    test('Node Private HTTP Cache: default', t => {
      const req = new NGN.NET.Request({
        url: `${baseurl}/static`,
        cacheMode: 'default'
      })

      const cache = req.HttpCache

      req.send(res => {
        t.ok(requestCount === 1, 'Request was sent to server.')
        t.ok(cache.size === 1, 'default cache mode (default for Node-like environments) increases the cache size when the response has not yet been cached.')

        const req2 = new NGN.NET.Request({
          url: `${baseurl}/static`,
          cacheMode: 'default'
        })

        req2.send(nextres => {
          t.ok(requestCount === 1, `Caching prevented request to server. Request count: ${requestCount}`)
          t.ok(cache.size === 1, 'default cache mode does not increase cache when new requests are sent to a previously cached request endpoint.')
          t.ok(res.body === nextres.body, 'Proper body is returned from cache.')
          t.end()
          next()
        })
      })
    })
  })

  tasks.on('complete', () => server.close())

  tasks.run(true)
} else {
  test('Node Cache Polyfill', t => {
    t.pass(NGN.NET.Request.HttpCache === undefined, 'The HTTP Cache does not need to be polyfilled for browser environments.')
    t.end()
  })
}
