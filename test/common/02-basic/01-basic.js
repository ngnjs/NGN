const test = require('tap').test

// Remember to run `npm run test:build` before executing,
// otherwise the lib directory will not exist.

require('../../lib/ngn')

const isEnumerable = (obj, property) => {
  return Object.keys(obj).indexOf(property) >= 0
}

const EmptyFn = function () {}

test('NGN.define', function (t) {
  let obj = {}

  Object.defineProperty(obj, 'test', NGN.define(true, true, true, 'value'))
  t.ok(isEnumerable(obj, 'test') && obj.test === 'value', 'NGN.define creates an enumerable property.')

  obj.test = 'changed'
  t.ok(obj.test === 'changed', 'NGN.define writable property can be changed.')

  delete obj.test
  t.ok(!obj.hasOwnProperty('test'), 'NGN.define configurable property can be deleted.')

  Object.defineProperty(obj, 'test', NGN.define(false, true, true, 'value'))
  t.ok(!isEnumerable(obj, 'test') && obj.test === 'value', 'NGN.define creates non-enumerable (semi-private) property.')

  delete obj.test

  Object.defineProperty(obj, 'test', NGN.define(true, false, true, 'value'))
  obj.test = 'changed'
  t.ok(obj.test === 'value', 'NGN.define read-only property does not change when a value is set.')

  delete obj.test

  Object.defineProperty(obj, 'test', NGN.define(true, true, false, 'value'))
  delete obj.test
  t.ok(obj.hasOwnProperty('test'), 'NGN.define non-configurable property cannot be deleted.')

  t.end()
})

test('NGN.public', function (t) {
  let obj = {}

  Object.defineProperty(obj, 'test', NGN.public('value'))
  t.ok(isEnumerable(obj, 'test') && obj.test === 'value', 'NGN.public creates an enumerable property.')

  obj.test = 'changed'
  t.ok(obj.test === 'changed', 'NGN.public property can be changed.')

  delete obj.test
  t.ok(obj.hasOwnProperty('test'), 'NGN.public property cannot be deleted.')

  Object.defineProperty(obj, 'testFn', NGN.public(EmptyFn))
  obj.testFn = 'nothing'
  t.ok(typeof obj.testFn === 'function', 'NGN.public function is non-writable.')

  t.end()
})

test('NGN.private', function (t) {
  let obj = {}

  Object.defineProperty(obj, 'test', NGN.private('value'))
  t.ok(!isEnumerable(obj, 'test') && obj.test === 'value', 'NGN.public creates an enumerable property.')

  obj.test = 'changed'
  t.ok(obj.test === 'changed', 'NGN.private property can be changed.')

  delete obj.test
  t.ok(obj.hasOwnProperty('test'), 'NGN.private property cannot be deleted.')

  Object.defineProperty(obj, 'testFn', NGN.private(EmptyFn))
  obj.testFn = 'nothing'
  t.ok(typeof obj.testFn === 'function', 'NGN.private function is non-writable.')

  t.end()
})

test('NGN.const', function (t) {
  let obj = {}

  Object.defineProperty(obj, 'test', NGN.const('value'))
  t.ok(isEnumerable(obj, 'test') && obj.test === 'value', 'NGN.const creates an enumerable property.')

  obj.test = 'changed'
  t.ok(obj.test !== 'changed', 'NGN.const property cannot be changed.')

  delete obj.test
  t.ok(obj.hasOwnProperty('test'), 'NGN.const property cannot be deleted.')

  t.end()
})

test('NGN.privateconst', function (t) {
  let obj = {}

  Object.defineProperty(obj, 'test', NGN.privateconst('value'))
  t.ok(!isEnumerable(obj, 'test') && obj.test === 'value', 'NGN.privateonst creates an non-enumerable property.')

  obj.test = 'changed'
  t.ok(obj.test !== 'changed', 'NGN.privateconst property cannot be changed.')

  delete obj.test
  t.ok(obj.hasOwnProperty('test'), 'NGN.privateconst property cannot be deleted.')

  t.end()
})

test('NGN.get (Getter)', function (t) {
  let obj = {}

  Object.defineProperty(obj, 'test', NGN.get(function () {
    return 'value'
  }))
  t.ok(!isEnumerable(obj, 'test') && obj.test === 'value', 'NGN.get creates an non-enumerable accessor function (getter).')

  obj.test = 'changed'
  t.ok(obj.test !== 'changed', 'NGN.get accessor property cannot be changed.')

  delete obj.test
  t.ok(obj.hasOwnProperty('test'), 'NGN.get accessor property cannot be deleted.')

  t.end()
})

test('NGN.set (Setter)', function (t) {
  let obj = {}
  let value = 'initial value'

  Object.defineProperty(obj, 'test', NGN.set(function (v) {
    value = v
  }))
  t.ok(!isEnumerable(obj, 'test') && obj.test === undefined, 'NGN.set creates an non-enumerable accessor function (setter) that returns undefined.')

  obj.test = 'changed'
  t.ok(value === 'changed', 'NGN.set accessor property successfully sets a value.')

  delete obj.test
  t.ok(obj.hasOwnProperty('test'), 'NGN.set accessor property cannot be deleted.')

  t.end()
})

test('NGN.getset (Getter/Setter)', function (t) {
  let obj = {}
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

  obj.test = 'changed'
  t.ok(value === 'changed', 'NGN.getset accessor property successfully sets a value (setter).')

  delete obj.test
  t.ok(obj.hasOwnProperty('test'), 'NGN.set accessor property cannot be deleted.')

  t.end()
})

test('NGN.extend', function (t) {
  NGN.extend('test', {
    enumerable: true,
    writable: true,
    configurable: true,
    value: 'extended test'
  })

  t.ok(NGN.hasOwnProperty('test') && NGN.test === 'extended test', 'NGN.extend adds a property to the NGN namespace.')

  delete NGN.test

  NGN.extend({
    testa: {
      enumerable: true,
      writable: true,
      configurable: true,
      value: 'atest'
    },
    testb: {
      enumerable: true,
      writable: true,
      configurable: true,
      value: 'btest'
    }
  })

  t.ok(NGN.hasOwnProperty('testa') && NGN.testa === 'atest' && NGN.hasOwnProperty('testb') && NGN.testb === 'btest', 'NGN.extend adds multiple properties to the NGN namespace when provided an object (akin to Object.defineProperties).')

  delete NGN.testa
  delete NGN.testb

  t.end()
})

test('NGN.inherit', function (t) {
  let obj = {}

  Object.defineProperties(obj, {
    a: NGN.public('a'),
    b: NGN.private('b'),
    c: NGN.const('c'),
    d: NGN.privateconst('d')
  })

  let target = {}

  NGN.inherit(obj, target)

  target.c = 'changed'
  target.d = 'changed'

  t.ok(
    target.a === 'a' &&
    target.b === 'b' &&
    target.c === 'c' &&
    target.d === 'd' &&
    !isEnumerable(target, 'b') &&
    !isEnumerable(target, 'd'),
    'NGN.inherit applies source descriptors to a target object.'
  )

  t.end()
})

test('NGN.nullIf', function (t) {
  t.ok(NGN.nullIf('') === null, 'NGN.nullIf identifies blank/empty strings as null by default.')
  t.ok(NGN.nullIf('test', 'test') === null, 'NGN.nullIf returns null for matching values.')
  t.ok(NGN.nullIf('test') === 'test', 'NGN.nullIf returns non-blank/empty values by default.')
  t.ok(NGN.nullIf('test', 'not_test') === 'test', 'NGN.nullIf return test value when it does not match the null qualifier.')

  var obj = {}

  t.ok(
    NGN.nullIf({}) !== null &&
    NGN.nullIf(1) === 1 &&
    NGN.nullIf(true) === true &&
    NGN.nullIf(false) === false &&
    NGN.nullIf(EmptyFn) !== null &&
    NGN.nullIf(obj, obj) === null &&
    NGN.nullIf(EmptyFn, EmptyFn) === null &&
    NGN.nullIf(1, 1) === null &&
    NGN.nullIf(true, true) === null,
    'NGN.nullIf works with non-string arguments'
  )
  t.ok(NGN.nullif('') === null, 'NGN.nullif alias executes NGN.nullIf.')
  t.end()
})

test('NGN.converge', function (t) {
  t.ok(NGN.converge(false, null, undefined, '', 'test') === '', 'NGN.converge recognizes blank values as valid arguments.')
  t.ok(NGN.converge(false, null, undefined, true, 'test') === true, 'NGN.converge recognizes boolean values as valid arguments.')
  t.ok(NGN.converge(true, null, undefined, '', 'test') === 'test', 'NGN.converge skips blank values when requested.')
  t.end()
})

test('NGN.coalesce', function (t) {
  t.ok(NGN.coalesce(null, undefined, '', 'test') === '', 'NGN.coalesce recognizes blank values as valid arguments.')
  t.ok(NGN.coalesce(null, undefined, true, 'test') === true, 'NGN.coalesce recognizes boolean values as valid arguments.')
  t.ok(NGN.coalesce(null, undefined, '', 'test') === '', 'NGN.coalesce does not skip blank values.')
  t.end()
})

test('NGN.coalesceb', function (t) {
  t.ok(NGN.coalesceb(null, undefined, true, 'test') === true, 'NGN.coalesceb recognizes boolean values as valid arguments.')
  t.ok(NGN.coalesceb(null, undefined, '', 'test') === 'test', 'NGN.coalesceb ignores blank/empty string values.')
  t.end()
})

test('NGN.nodelike', function (t) {
  t.ok(NGN.nodelike === (typeof window !== 'object'), 'NGN.nodelike recognizes the environment correctly.')
  t.end()
})

test('NGN.dedupe', function (t) {
  let test = NGN.dedupe(['a', 'b', 'a', 'c', 'a', 'd', 'b', 'e', 'e'])

  t.ok(
    test[0] === 'a' &&
    test[1] === 'b' &&
    test[2] === 'c' &&
    test[3] === 'd' &&
    test[4] === 'e',
    'NGN.dedupe removes duplicate items from a simple array'
  )

  let obj = {
    a: 'a',
    b: 'b',
    c: true
  }

  test = ['a', obj, obj]
  let match = NGN.dedupe(test)

  test.pop()

  t.ok(
    test[0] === match[0] &&
    test[1] === match[1],
    'NGN.dedupe works with complex array values.'
  )

  t.end()
})

test('NGN.typeof', function (t) {
  t.ok(NGN.typeof('test') === 'string', 'NGN.typeof recognizes strings.')
  t.ok(NGN.typeof(1) === 'number', 'NGN.typeof recognizes numbers.')
  t.ok(NGN.typeof(true) === 'boolean', 'NGN.typeof recognizes booleans.')
  t.ok(NGN.typeof(/\s{1,10}/gi) === 'regexp', 'NGN.typeof recognizes regular expressions.')
  t.ok(NGN.typeof({}) === 'object', 'NGN.typeof recognizes objects.')
  t.ok(NGN.typeof(EmptyFn) === 'emptyfn', 'NGN.typeof recognizes unique function names as types.')
  t.ok(NGN.typeof([]) === 'array', 'NGN.typeof recognizes arrays.')
  t.ok(NGN.typeof(null) === 'null', 'NGN.typeof recognizes null.')
  t.ok(NGN.typeof() === 'undefined', 'NGN.typeof recognizes undefined.')

  function myFn () {}
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

// NGN.slice & NGN.splice are just array prototype accessors.
test('NGN.slice & NGN.splice', function (t) {
  let tempFn = function () {
    let x = NGN.slice(arguments)
    let y = NGN.splice(arguments)

    t.ok(NGN.typeof(x) === 'array', 'NGN.slice returns an array.')
    t.ok(NGN.typeof(y) === 'array', 'NGN.splice returns an array.')
    t.end()
  }

  tempFn(1, 2)
})

test('NGN.forceArray', function (t) {
  t.ok(NGN.typeof(NGN.forceArray('test')) === 'array', 'Non-array converted to array.')
  t.ok(NGN.typeof(NGN.forceArray(['a'])) === 'array' && NGN.forceArray(['a'])[0] === 'a', 'Array remains untouched.')
  t.end()
})

test('NGN.forceBoolean', function (t) {
  t.ok(NGN.typeof(NGN.forceBoolean('test')) === 'boolean', 'Non-boolean converted to boolean.')
  t.ok(NGN.forceBoolean(0) === false, 'Number converted to boolean.')
  t.ok(NGN.typeof(NGN.forceBoolean(false)) === 'boolean' && NGN.forceBoolean(false) === false, 'Boolean remains untouched.')
  t.end()
})

test('NGN.forceNumber', function (t) {
  let dt = new Date(2000, 1, 1, 0, 0, 0, 0).getTime()

  t.ok(NGN.forceNumber(dt) === 949384800000, 'Parsing date into time since epoch succeeds.')
  t.ok(NGN.forceNumber(true) === 1 && NGN.forceNumber(false) === 0, 'Parsing boolean succeeds.')
  t.ok(NGN.forceNumber('100.1') === 100.1, 'Float parsing succeeds.')
  t.ok(NGN.forceNumber('100.1', 10) === 100, 'Integer parsing succeeds.')

  t.end()
})

test('NGN.stack', function (t) {
  let stack = NGN.stack

  t.ok(NGN.typeof(stack) === 'array', 'Stack returns an array.')
  t.ok(
    stack[0].hasOwnProperty('path') &&
    stack[0].hasOwnProperty('file') &&
    stack[0].hasOwnProperty('line') &&
    stack[0].hasOwnProperty('column') &&
    stack[0].hasOwnProperty('operation'),
    'Stack elements contains path, file, line, column, and operation attributes.'
  )

  t.end()
})

test('NGN.isFn', function (t) {
  t.ok(NGN.isFn(EmptyFn), 'Identifies a standard function.')
  t.ok(NGN.isFn(() => {}), 'Identifies a fat arrow function.')
  t.ok(
    !NGN.isFn('test') &&
    !NGN.isFn('test') &&
    !NGN.isFn(/\s{1,10}/gi) &&
    !NGN.isFn({}) &&
    !NGN.isFn(1) &&
    !NGN.isFn(new Date()) &&
    !NGN.isFn(true),
    'Does not identify primitives as a function.'
  )
  t.end()
})

test('NGN.wrap', function (t) {
  let pre = false
  let value = 0
  let fn = (val) => {
    value += val
  }

  let wrappedFn = NGN.wrap(() => { pre = true }, fn)

  t.ok(!pre && value === 0, 'The wrapper method is not triggered before the primary method.')

  wrappedFn(2)

  t.ok(pre && value === 2, 'Wrapper runs a pre-method and the specified method.')

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

  let WrappedClass = NGN.wrapClass(() => { pre = true }, myClass)

  t.ok(!pre && value === 0, 'The wrapper method is not triggered before the class is instantiated.')

  let entity = new WrappedClass() // eslint-disable-line no-unused-vars

  t.ok(pre && value === 1, 'The wrapper executed before returning the updated class.')

  t.end()
})

// Deprecation notices are non-functional notifications only.

test('NGN.createAlias', function (t) {
  let aliases = {}
  let value = 0
  let aliasFn = () => {
    return value
  }

  NGN.createAlias(aliases, 'test', aliasFn)
  t.ok(aliases.hasOwnProperty('test'), 'Alias created.')
  t.ok(aliases.test() === 0, 'Successfully alias a value.')

  value = 2
  t.ok(aliases.test() === 2, 'Alias is dynamic.')

  t.end()
})

test('NGN.getObjectMissingPropertyNames', function (t) {
  let obj = {
    a: 1,
    b: 2,
    c: 3,
    e: 5
  }

  let missing = NGN.getObjectMissingPropertyNames(obj, 'a', 'b', 'c', 'd', 'e', 'f')
  t.ok(missing[0] === 'd' && missing[1] === 'f', 'Returns list of missing attributes.')

  t.end()
})

test('NGN.getObjectExtraneousPropertyNames', function (t) {
  let obj = {
    a: 1,
    b: 2,
    c: 3,
    d: 4,
    e: 5,
    f: 6
  }

  let extra = NGN.getObjectExtraneousPropertyNames(obj, 'a', 'b', 'c', 'e')

  t.ok(extra[0] === 'd' && extra[1] === 'f', 'Returns list of extraneous attributes.')

  t.end()
})

test('NGN.objectHasAll', function (t) {
  let obj = {
    a: 1,
    b: 2,
    c: 3,
    e: 5
  }

  let check = NGN.objectHasAll(obj, 'a', 'b', 'c')
  let badCheck = NGN.objectHasAll(obj, 'a', 'b', 'c', 'd')

  t.ok(NGN.typeof(check) === 'boolean' && check, 'Responds with a proper true value.')
  t.ok(NGN.typeof(badCheck) === 'boolean' && !badCheck, 'Responds with a proper false value.')

  t.end()
})

test('NGN.objectHasAny', function (t) {
  let obj = {
    a: 1,
    b: 2,
    c: 3,
    e: 5
  }

  let check = NGN.objectHasAny(obj, 'a', 'b', 'c', 'd')
  let badCheck = NGN.objectHasAny(obj, 'x', 'y', 'z')

  t.ok(NGN.typeof(check) === 'boolean' && check, 'Responds with a proper boolean value.')
  t.ok(!badCheck, 'Responds with false when none of the specificed properties exist.')

  t.end()
})

test('NGN.objectHasExactly', function (t) {
  let obj = {
    a: 1,
    b: 2,
    c: 3
  }

  let justRight = NGN.objectHasExactly(obj, 'a', 'b', 'c')
  let tooMany = NGN.objectHasExactly(obj, 'a', 'b', 'c', 'd')
  let tooFew = NGN.objectHasExactly(obj, 'a', 'b')

  t.ok(justRight, 'Exact match returns true.')
  t.ok(!tooMany, 'Inexact match returns false (too many).')
  t.ok(!tooFew, 'Inexact match returns false (too few).')

  t.end()
})

test('NGN.objectRequires', function (t) {
  let obj = {
    a: 1,
    b: 2,
    c: 3
  }

  try {
    NGN.objectRequires(obj, 'a', 'b', 'c')
    t.pass('Object with correct attributes does not throw an error.')
  } catch (e) {
    console.error(e)
    t.fail('Object with correct attributes throws error.')
  }

  try {
    NGN.objectRequires(obj, 'a', 'b')
    t.pass('Object with correct attributes does not throw an error (even if more attributes exist).')
  } catch (e) {
    console.error(e)
    t.fail('Object with correct attributes throws error.')
  }

  try {
    NGN.objectRequires(obj, 'a', 'b', 'x')
    t.fail('Object with incorrect attributes does not throw an error.')
  } catch (e) {
    t.pass('Object with incorrect attributes throws an error.')
  }

  t.end()
})

// ALL CUSTOM EXCEPTION-RELATED TESTS BELOW HERE (to prevent unit test confusion)
test('NGN.needs', function (t) {
  try {
    NGN.needs('coalesce', 'coalesceb')
    t.pass('Exact match does not throw a MissingNgnDependencyError.')
  } catch (e) {
    console.log(e)
    t.fail('Exact match does not throw a MissingNgnDependencyError.')
  }

  try {
    NGN.needs('private', 'const', 'define', 'JUNK')
    t.fail('Missing any attribute throws a MissingNgnDependencyError.')
  } catch (e) {
    t.pass('Missing any attribute throws a MissingNgnDependencyError.')
  }

  t.end()
})

test('NGN.deprecate', function (t) {
  let fn = function () {
    t.pass('Deprecated method executed.')
    t.end()
  }

  let tmpFn = NGN.deprecate(fn)

  tmpFn()
})

test('NGN.deprecate', function (t) {
  class tmpClass {
    constructor () {
      t.pass('Deprecated method executed.')
      t.end()
    }
  }

  let tempClass = NGN.deprecateClass(tmpClass)

  let x = new tempClass() // eslint-disable-line
})

test('NGN.createException', function (t) {
  NGN.createException({
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

  try {
    throw new TestError() // eslint-disable-line no-undef
  } catch (e) {
    if (NGN.nodelike) {
      console.log(e)
      t.ok(NGN.typeof(e.trace) === 'array', 'Exception trace returns an array.')
    } else {
      t.skip('Exception trace attribute unavailable in browser (use stack trace instead).')
    }
    t.ok(e.name === 'TestError', 'Recognized custom error name.')
    t.ok(e.message === 'A test message', 'Successfully thrown.')
  }

  t.end()
})

test('NGN.getType', function (t) {
  t.ok(NGN.getType('number') === Number, 'Identifies number.')
  t.ok(NGN.getType('regexp') === RegExp, 'Identifies regexp.')
  t.ok(NGN.getType('regex') === RegExp, 'Identifies regex w/ warning.')
  t.ok(NGN.getType('boolean') === Boolean, 'Identifies boolean.')
  t.ok(NGN.getType('symbol') === Symbol, 'Identifies symbol.')
  t.ok(NGN.getType('date') === Date, 'Identifies date.')
  t.ok(NGN.getType('array') === Array, 'Identifies array.')
  t.ok(NGN.getType('object') === Object, 'Identifies object.')
  t.ok(NGN.getType('function') === Function, 'Identifies function.')
  t.ok(NGN.getType('string') === String, 'Identifies string.')
  t.ok(NGN.getType('nada', String) === String, 'Identifies default type.')
  t.ok(NGN.getType('nada') === undefined, 'Defaults to undefined when no type is recognized.')

  t.end()
})
