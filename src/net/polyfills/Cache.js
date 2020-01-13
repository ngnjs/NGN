import path from 'path'
import fs from 'fs'
import NGN from '../../core.js'
import { request } from 'http'

const modes = new Set([
  'default',
  'no-store',
  'reload',
  'no-cache',
  'force-cache',
  'only-if-cached'
])

const cacheable = new Set([
  'GET',
  'HEAD',
  'POST'
])

// const pattern = {
//   request: /^([A-Z]+)\s+([^\s]+)\s+(.*)\n/i,
//   header: /((.*):\s+(.*))\n/i,
//   body: 
// }

export default class Cache {
  #storageEngine
  #dir = null
  #store = new Map()

  #parse (content) {
    return content
  }

  #write (request, response, rawResponse = null) {
    const conn = this.connection(request)
    if (!this.#store.has(conn.host)) {
      this.#store.set(conn.host, new Map())
    }
    if (!this.#store.get(conn.host).has(conn.method)) {
      this.#store.get(conn.host).set(conn.method, new Map())
    }

    let item = {}

    Object.defineProperties(item, {
      request: {
        enumerable: true,
        get: () => {
          if (this.#storageEngine === 'memory') {
            return request
          } else {
            try {
              return this.#parse(fs.readFileSync(path.resolve(this.#dir, conn.host, conn.method, conn.path + '.cache')).toString().split(/\n-{3,}\n/)[0], 'response')
            } catch (e) {
              return null
            }
          }
        }
      },
      
      response: {
        enumerable: true,
        get: () => {
          if (this.#storageEngine === 'memory') {
            response.headers = NGN.coalesce(rawResponse.headers, response.headers)
            return response
          } else if (this.#storageEngine === 'disk') {
            try {
              return this.#parse(fs.readFileSync(path.resolve(this.#dir, conn.host, conn.method, conn.path + '.cache')).toString().split(/\n-{3,}\n/)[1], 'response')
            } catch (e) {
              return null
            }
          }
        }
      }
    })

    this.#store.get(conn.host).get(conn.method).set(conn.path, item)

    if (this.#storageEngine === 'disk' && rawResponse !== null && response.hasOwnProperty('rawResponse')) {
      fs.mkdirSync(path.join(this.#dir, conn.host, conn.method, path.dirname(conn.path)), { recursive: true })
      
      let cache = request._header
      // let cache = `${conn.method} ${conn.path} HTTP/${rawResponse.version}\n` + Object.keys(rawResponse.headers).map(key => `${key.trim().toLowerCase()}: ${rawResponse.headers[key]}`).join('\n')
      if (NGN.coalesceb(request.body)) {
        cache = `${rawRequest}\n\n${request.body.trim()}`
      }

      cache = `${cache}\n---\n`
      fs.writeFileSync(path.join(this.#dir, conn.host, conn.method, conn.path + '.cache'), cache)
      fs.appendFile(path.join(this.#dir, conn.host, conn.method, conn.path + '.cache'), response.rawResponse)
    }

    console.log('Cached req/res in ' + this.#storageEngine)
  }

  constructor (storage = 'memory') {
    this.#storageEngine = storage.trim().toLowerCase()

    // Handle shared cache
    if (this.#storageEngine !== 'memory') {
      this.#dir = path.resolve(this.#storageEngine)
      this.#storageEngine = 'directory'

      if (!fs.accessSync(this.#dir, fs.constants.W_OK) || !fs.statSync(this.#dir).isDirectory()) {
        throw new Error(`Cannot access the cache storage directory "${this.#dir}". Make sure the path exists and is a writable directory.`)
      }

      // fs.readdirSync(path.resolve(this.#dir)).forEach(filepath => {
      //     try {
      //       const content = fs.readFileSync(path.join(this.#dir, filepath)).toString()

      //     }
          
      // })
    }
  }

  get size () {
    let ct = 0
    for (const [host, hosts] of this.#store) {
      for (const [method, responses] of hosts) {
        ct += responses.size
      }
    }

    return ct
  }

  // Retrieve a response from the cache
  // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching#Freshness for cache freshness.
  get (request) {
    const conn = this.connection(request)
    let result = {
      response: {
        age: 0,
        status: 'stale'
      },
      exists: false
    }

    if (this.has(request)) {
      const item = this.#store.get(conn.host).get(conn.method).get(conn.path)
      result.exists = true

      Object.defineProperty(result.response, 'content', {
        get: () => item
      })

      let freshnessLifetime = null

      if (item.response.headers['cache-control']) {
        freshnessLifetime = NGN.coalesce(/^max-age\s+?=\s+?([0-9]+)/i.exec(item.response.headers.get('cache-control')), [null, null])[1]
      }

      if (item.response.headers['date']) {
        if (freshnessLifetime === null && item.response.headers['expires']) {
          try {
            freshnessLifetime = NGN.forceNumber(item.response.headers['expires']) - NGN.forceNumber(item.response.headers['date'])
          } catch (e) {}
        }

        if (freshnessLifetime === null && item.response.headers['last-modified']) {
          try {
            freshnessLifetime = (NGN.forceNumber(item.response.headers['date']) - NGN.forceNumber(item.response.headers['last-modified'])) / 10
          } catch (e) {}
        }
      }

      let currentDateTime = (new Date()).getTime()
      result.age = (new Date()).getTime() - NGN.coalesce(item.cacheDate, 0)
      let expirationTime = (currentDateTime + NGN.coalesce(freshnessLifetime, 0)) - result.response.age
    
      if (expirationTime > 0) {
        result.status = 'fresh'
      }
    } else {
      // Object.defineProperty(result, 'response', {
      //   get: () => null
      // })
      return null
    }

    return NGN.coalesce(result.response)
  }

  // Add a response to the cache
  put (request, response, cachemode = 'default', rawResponse = null) {
    if (!modes.has(cachemode)) {
      throw new Error(`"${cachemode}" is an invalid caching mode. Must be one of: ${Array.from(modes).map(', ')}.`)
    }

    if (!cacheable.has(request.method.toUpperCase()) || !NGN.coalesce(rawResponse, {}).hasOwnProperty('rawResponse')) {
      return response
    }

    // Respect cache-control: no-store response header
    const control = NGN.coalesce(rawResponse, response).headers['cache-control'] || ''
    if (control.toLowerCase() === 'no-store') {
      return response
    }

    request.headers = NGN.coalesce(request.headers, {})

    switch (cachemode) {
      // case 'no-store':
      //  break
      case 'reload':
      case 'force-cache':
        this.#write(request, response, rawResponse)
        break
      // case 'only-if-cached':
      //   break
      case 'default':
      case 'no-cache':
        if (response.status !== 304) {
          this.#write(request, response, rawResponse)
        }
        break
    }

    return response
  }

  connection (request) {
    return {
      method: request.method.toUpperCase(),
      protocol: NGN.coalesce(request.protocol, request.agent.protocol).replace(/:/gi, ''),
      host: /^(.*:[0-9]+):?/i.exec(Object.keys(request.agent.sockets)[0])[1],
      path: request.path
    }
  }

  // Matches request on headers
  match (request, cacheItem = null) {
    let vary = NGN.coalesce(request.getHeader('vary'), '')

    if (vary.length === '') {
      return true
    }

    let item = cacheItem
    
    if (!item) {
      const conn = this.connection(request)

      try {
        item = this.#store.get(conn.host).get(conn.method).get(conn.path)
      } catch (e) {
        return false
      }
    }

    if (!item) {
      return false
    }

    if (vary.length === 0) {
      return true
    }

    vary = vary.split(',')

    const headers = new Set(Array.from(item.headers.keys()).map(header => header.trim().toLowerCase()))
    if (vary.length === 1 && vary[0].trim() === '*') {
      return vary.filter(header => !headers.has(header.trim().toLowerCase())).length === 0
    }

    if (vary.filter(header => headers.delete(header.trim().toLowerCase())).length === 0) {
      return headers.size === 0
    }

    return false
  }

  has (request) {
    const conn = this.connection(request)
    if (this.#store.has(conn.host)) {
      if (this.#store.get(conn.host).has(conn.method)) {
        if (this.#store.get(conn.host).get(conn.method).has(conn.path)) {
          return this.match(request, this.#store.get(conn.host).get(conn.method).get(conn.path))
        }
      }
    }

    return false
  }

  shouldCapture(request, cachemode = 'no-store') {
    if (cacheable.has(request.method.trim().toUpperCase()) && modes.has(cachemode)) {
      // let URI = `${request.agent.protocol}//${host}${request.path}`
      
      switch (cachemode) {
        // case 'no-store':
          // return false
        case 'reload':
          return true
        case 'force-cache':
          return !this.has(request)
        // case 'only-if-cached':
        //   return false
        case 'default':
          if (!this.has(request)) {
            return true
          }

          const item = this.get(request)
          if (item.status === 'stale') {
            request.headers['If-None-Match'] = NGN.coalesce(item.response.headers.get('etag'), '*')
            return true
          }

          break
        case 'no-cache':
          if (this.has(request)) {
            const item = this.get(request)
            request.headers['If-None-Match'] = NGN.coalesce(item.response.headers.get('etag'), '*')
          }
          
          return true
      }
    }

    return false
  }

  capture (request, cachemode = 'no-store') {
    if (this.shouldCapture(request, cachemode)) {
      let response = Buffer.from([])

      request.on('socket', socket => {
        socket.on('data', chunk => {
          response = Buffer.concat([response, chunk], response.length + chunk.length)
        })
      })

      request.on('response', res => res.rawResponse = response)
    }
  }

  // Remove a specific URL
  flush (url) {}

  // Clear multiple URL's
  clear () {}

  // Empty the entire cache
  empty () {}
}