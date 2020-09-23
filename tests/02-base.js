import test from 'tappedout'
import NGN from 'ngn'

const isEnumerable = (obj, property) => Object.keys(obj).indexOf(property) >= 0
const EmptyFn = function () { }

test('NGN.public', function (t) {
  const obj = {}

  Object.defineProperty(obj, 'test', NGN.public('value'))
  t.ok(isEnumerable(obj, 'test') && obj.test === 'value', 'NGN.public creates an enumerable property.')

  obj.test = 'changed'
  t.ok(obj.test === 'changed', 'NGN.public property can be changed.')

  try { delete obj.test } catch (e) { }
  t.ok(obj.hasOwnProperty('test'), 'NGN.public property cannot be deleted.')

  Object.defineProperty(obj, 'testFn', NGN.public(EmptyFn))
  try { obj.testFn = 'nothing' } catch (e) { }
  t.ok(typeof obj.testFn === 'function', 'NGN.public function is non-writable.')

  t.end()
})

test('NGN.hidden', function (t) {
  const obj = {}

  Object.defineProperty(obj, 'test', NGN.hidden('value'))
  t.ok(!isEnumerable(obj, 'test') && obj.test === 'value', 'NGN.hidden creates an enumerable property.')

  obj.test = 'changed'
  t.ok(obj.test === 'changed', 'NGN.hidden property can be changed.')

  try { delete obj.test } catch (e) { }
  t.ok(obj.hasOwnProperty('test'), 'NGN.hidden property cannot be deleted.')

  Object.defineProperty(obj, 'testFn', NGN.hidden(EmptyFn))
  try { obj.testFn = 'nothing' } catch (e) { }
  t.ok(typeof obj.testFn === 'function', 'NGN.hidden function is non-writable.')

  t.end()
})

test('NGN.constant', function (t) {
  const obj = {}

  Object.defineProperty(obj, 'test', NGN.constant('value'))
  t.ok(isEnumerable(obj, 'test') && obj.test === 'value', 'NGN.const creates an enumerable property.')

  try { obj.test = 'changed' } catch (e) { }
  t.ok(obj.test !== 'changed', 'NGN.constant property cannot be changed.')

  try { delete obj.test } catch (e) { }
  t.ok(obj.hasOwnProperty('test'), 'NGN.const property cannot be deleted.')

  t.end()
})

test('NGN.hiddenconstant', function (t) {
  const obj = {}

  Object.defineProperty(obj, 'test', NGN.hiddenconstant('value'))
  t.ok(!isEnumerable(obj, 'test') && obj.test === 'value', 'NGN.hiddenconstant creates an non-enumerable property.')

  try { obj.test = 'changed' } catch (e) { }
  t.ok(obj.test !== 'changed', 'NGN.hiddenconstant property cannot be changed.')

  try { delete obj.test } catch (e) { }
  t.ok(obj.hasOwnProperty('test'), 'NGN.hiddenconstant property cannot be deleted.')

  t.end()
})

test('NGN.get (Getter)', function (t) {
  const obj = {}

  Object.defineProperty(obj, 'test', NGN.get(function () {
    return 'value'
  }))

  t.ok(!isEnumerable(obj, 'test') && obj.test === 'value', 'NGN.get creates an non-enumerable accessor function (getter).')

  try { obj.test = 'changed' } catch (e) { }
  t.ok(obj.test !== 'changed', 'NGN.get accessor property cannot be changed.')

  try { delete obj.test } catch (e) { }
  t.ok(obj.hasOwnProperty('test'), 'NGN.get accessor property cannot be deleted.')

  t.end()
})

test('NGN.set (Setter)', function (t) {
  const obj = {}
  let value = 'initial value'

  Object.defineProperty(obj, 'test', NGN.set(function (v) {
    value = v
  }))
  t.ok(!isEnumerable(obj, 'test') && obj.test === undefined, 'NGN.set creates an non-enumerable accessor function (setter) that returns undefined.')

  try { obj.test = 'changed' } catch (e) { }
  t.ok(value === 'changed', 'NGN.set accessor property successfully sets a value.')

  try { delete obj.test } catch (e) { }
  t.ok(obj.hasOwnProperty('test'), 'NGN.set accessor property cannot be deleted.')

  t.end()
})

test('NGN.getset (Getter/Setter)', function (t) {
  const obj = {}
  let value = 'initial value'

  Object.defineProperty(obj, 'test', NGN.getset(
    function () {
      return value
    },

    function (v) {
      value = v
    })
  )

  t.ok(!isEnumerable(obj, 'test') && obj.test === 'initial value', 'NGN.getset creates an non-enumerable accessor function (getter).')

  try { obj.test = 'changed' } catch (e) { }
  t.ok(value === 'changed', 'NGN.getset accessor property successfully sets a value (setter).')

  try { delete obj.test } catch (e) { }
  t.ok(obj.hasOwnProperty('test'), 'NGN.set accessor property cannot be deleted.')

  t.end()
})

test('NGN.before', t => {
  let count = 0
  const fn = NGN.before(() => { count += 1 }, () => { count += 2 })

  fn()
  t.ok(count === 3, 'Before function executes. Expected a result of 3, recognized ' + count)
  t.end()
})

test('NGN.after', t => {
  let count = 0
  const fn = NGN.after(() => { count += 1 }, () => { count += 2 })

  fn()

  setTimeout(() => {
    t.ok(count === 3, 'After function executes. Expected a result of 3, recognized ' + count)
    t.end()
  }, 50)
})

test('NGN.wrap', t => {
  let count = 0
  const wrapped = NGN.wrap(fn => { count += 1; fn() })

  wrapped(() => {
    t.ok(count === 1, 'Wrapper executed before calling the wrapped method.')
    t.end()
  })
})

test('NGN.deprecate', t => {
  const done = () => {
    t.pass('Deprecated method is still executed.')
    t.end()
  }

  const dep = NGN.deprecate(done)
  t.ok(typeof dep === 'function', 'The deprecation wrapper is a function.')

  dep()
})

test('NGN.nodelike', function (t) {
  t.ok(NGN.nodelike === (typeof window !== 'object'), 'NGN.nodelike recognizes the environment correctly.')
  t.end()
})

test('NGN.stack', function (t) {
  const stack = NGN.stack

  t.ok(Array.isArray(stack), 'Stack returns an array.')
  t.ok(
    stack[0].hasOwnProperty('path') &&
    stack[0].hasOwnProperty('line') &&
    stack[0].hasOwnProperty('column'),
    'Stack elements contains path, line, and column attributes.'
  )

  t.end()
})

test('NGN.wrapClass', function (t) {
  let pre = false
  let value = 0

  class myClass {
    constructor () {
      value++
    }
  }

  const WrappedClass = NGN.wrapClass(() => { pre = true }, myClass)

  t.ok(!pre && value === 0, 'The wrapper method is not triggered before the class is instantiated.')

  const entity = new WrappedClass() // eslint-disable-line no-unused-vars

  t.ok(pre && value === 1, 'The wrapper executed before returning the updated class.')

  t.end()
})

test('NGN.deprecateClass', function (t) {
  let value = 0

  class myClass {
    constructor () {
      value++
    }
  }

  const WrappedClass = NGN.deprecateClass(myClass)

  t.ok(value === 0, 'The deprecation class is not triggered before instantiation.')

  const entity = new WrappedClass() // eslint-disable-line no-unused-vars

  t.ok(value === 1, 'The deprecated class still instantiates as normal.')

  t.end()
})

test('NGN.defineException', function (t) {
  NGN.defineException({
    name: 'TestError',
    type: 'TestError',
    severity: 'critical',
    message: 'A test message',
    category: 'programmer',
    custom: {
      help: 'Test help.',
      cause: 'Test cause.'
    }
  })

  t.ok(typeof TestError === 'function', 'Create a global exception.')

  var e = new TestError()

  t.ok(Array.isArray(e.trace), 'Exception trace returns an array.')
  t.ok(e.name === 'TestError', 'Recognized custom error name.')
  t.ok(e.message === 'A test message', 'Recognized custom error message.')

  NGN.LEDGER.on(NGN.ERROR_EVENT, err => {
    t.expect('TestError', err.name, 'Custom exception recognized by NGN Ledger.')
    t.end()
  })

  t.throws(() => {
    throw new TestError() // eslint-disable-line no-undef
  }, 'Throwing a custom global exception functions the same way a standard error functions.')
})

test('NGN.typeof', t => {
  t.ok(NGN.typeof('test') === 'string', 'NGN.typeof recognizes strings.')
  t.ok(NGN.typeof(1) === 'number', 'NGN.typeof recognizes numbers.')
  t.ok(NGN.typeof(true) === 'boolean', 'NGN.typeof recognizes booleans.')
  t.ok(NGN.typeof(/\s{1,10}/gi) === 'regexp', 'NGN.typeof recognizes regular expressions.')
  t.ok(NGN.typeof({}) === 'object', 'NGN.typeof recognizes objects.')
  t.ok(NGN.typeof(EmptyFn) === 'emptyfn', 'NGN.typeof recognizes unique function names as types.')
  t.ok(NGN.typeof([]) === 'array', 'NGN.typeof recognizes arrays.')
  t.ok(NGN.typeof(null) === 'null', 'NGN.typeof recognizes null.')
  t.ok(NGN.typeof() === 'undefined', 'NGN.typeof recognizes undefined.')

  function myFn () { }
  t.ok(NGN.typeof(myFn) === 'myfn', 'NGN.typeof recognizes custom function names.')

  class myClass {
    constructor () {
      console.log('Nothing')
    }
  }

  t.ok(NGN.typeof(myClass) === 'myclass', 'NGN.typeof recognizes classes.')
  t.ok(NGN.typeof(() => { console.log('nothing') }) === 'function', 'NGN.typeof recognizes fat arrow methods as functions.')
  t.end()
})

test('NGN.acceptableType()', t => {
  class TestClass {
    get x () { return 'x' }
  }

  const types = ['string', 'number', 'object', TestClass]

  let el = 'basic'
  t.ok(NGN.acceptableType(el, ...types), 'Accepted string')
  el = 1
  t.ok(NGN.acceptableType(el, ...types), 'Accepted number')
  el = Object.create({})
  t.ok(NGN.acceptableType(el, ...types), 'Accepted object')
  el = new TestClass()
  t.ok(NGN.acceptableType(el, ...types), 'Accepted custom class')
  el = true
  t.ok(!NGN.acceptableType(el, ...types), 'Rejected unlisted type.')
  t.end()
})

test('NGN.unacceptableType()', t => {
  class TestClass {
    get x () { return 'x' }
  }

  const types = ['string', 'number', 'object', TestClass]

  let el = 'basic'
  t.ok(!NGN.unacceptableType(el, ...types), 'Rejected string')
  el = 1
  t.ok(!NGN.unacceptableType(el, ...types), 'Rejected number')
  el = Object.create({})
  t.ok(!NGN.unacceptableType(el, ...types), 'Rejected object')
  el = new TestClass()
  t.ok(!NGN.unacceptableType(el, ...types), 'Rejected custom class')
  el = true
  t.ok(NGN.unacceptableType(el, ...types), 'Accepted unlisted type.')
  t.end()
})

// test('NGN.extend', function (t) {
//   NGN.extend('test', {
//     enumerable: true,
//     writable: true,
//     configurable: true,
//     value: 'extended test'
//   })

//   t.ok(NGN.hasOwnProperty('test') && NGN.test === 'extended test', 'NGN.extend adds a property to the NGN namespace.')

//   delete NGN.test

//   NGN.extend({
//     testa: {
//       enumerable: true,
//       writable: true,
//       configurable: true,
//       value: 'atest'
//     },
//     testb: {
//       enumerable: true,
//       writable: true,
//       configurable: true,
//       value: 'btest'
//     }
//   })

//   t.ok(NGN.hasOwnProperty('testa') && NGN.testa === 'atest' && NGN.hasOwnProperty('testb') && NGN.testb === 'btest', 'NGN.extend adds multiple properties to the NGN namespace when provided an object (akin to Object.defineProperties).')

//   delete NGN.testa
//   delete NGN.testb

//   t.end()
// })
