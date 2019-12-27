import 'source-map-support/register.js'
import test from 'tape'
import NGN from '../.node/index.js'

NGN.BUS.on(NGN.WARNING_EVENT, function (msg) {
  console.log('\n\n\n\n:::WARNING:::', msg)
})

test('NGN.NET Sanity Checks', function (t) {
  t.ok(NGN.NET !== undefined, 'NGN.NET namespace exists')
  t.ok(typeof NGN.NET.Plugin === 'function', 'NGN.NET.Plugin class available for extension.')
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
  t.ok(typeof NGN.NET.normalizeUrl === 'function', 'NGN.NET.normalizeUrl is available.')

  t.end()
})
