'use strict'

var test = require('tape')

require('../')

test('Custom Exceptions', function (t) {
  // Create a custom exception
  NGN.createException({
    name: 'Test Problem',
    message: 'This is a test problem.',
    custom: {
      a: 'a'
    }
  })

  t.throws(function () {
    throw TestProblem() // eslint-disable-line
  }, 'The custom exception can be thrown.')

  try {
    throw TestProblem() // eslint-disable-line no-undef
    t.fail('An unhandled error was thrown.') // eslint-disable-line no-unreachable
  } catch (e) {
    t.ok(e.trace.length > 0, 'The custom trace method returns an array.')
    t.ok(e.name === 'TestProblem', 'Error contains a proper name.')
    t.ok(e.type === 'TypeError', 'Error contains a proper type.')
    t.ok(e.severity === 'minor', 'Error defaults to the appropriate severity level.')
    t.ok(e.message === 'This is a test problem.', 'The custom error message is attached to the error object.')
    t.ok(e.category === 'operational', 'The default error category is set to operational.')
    t.ok(e.stack !== undefined, 'A stack is available.')
    t.ok(e.a === 'a', 'Custom attribute exists.')
  }

  t.end()
})
