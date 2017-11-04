const test = require('tape')

// Remember to run `npm run test:build` before executing,
// otherwise the lib directory will not exist.

require('../lib/core')
require('../lib/eventemitter')
require('../lib/net/NET')
require('../lib/tasks/bootstrap')

test('Namespace', (t) => {
  t.ok(NGN !== undefined, 'NGN namespace is recognized.')
  t.ok(MissingNgnDependencyError !== undefined, 'NGN missing dependency error is recognized.')
  t.end()
})

test('Method Existance', (t) => {
  const methodList = [
    'global',
    'define',
    'public',
    'private',
    'const',
    'privateconst',
    'get',
    'set',
    'getset',
    'extend',
    'inherit',
    'slice',
    'splice',
    'nullIf',
    'nullif',
    'converge',
    'coalesce',
    'coalesceb',
    'nodelike',
    'dedupe',
    'typeof',
    'forceArray',
    'processStackItem',
    'stack',
    'isFn',
    'wrap',
    'wrapClass',
    'deprecate',
    'deprecateClass',
    'getObjectMissingPropertyNames',
    'getObjectExtraneousPropertyNames',
    'objectHasAll',
    'objectHasAny',
    'objectHasExactly',
    'objectRequires',
    'needs',
    'createAlias',
    'CustomExceptionClass',
    'CustomException',
    'createException',
    'LEDGER_EVENT',
    'WARNING_EVENT',
    'INFO_EVENT',
    'ERROR_EVENT',
    'WARN',
    'INFO',
    'ERROR',

    // Classes
    'EventEmitter',
    'BUS',
    'NET',
    'Task',
    'Tasks'
  ]

  for (let method of methodList) {
    t.ok(NGN.hasOwnProperty(method), `NGN.${method} exists.`)
  }

  let keys = Object.getOwnPropertyNames(NGN)

  for (let key of keys) {
    if (methodList.indexOf(key) < 0) {
      t.fail(`NGN.${key} has no sanity check.`)
    }
  }

  t.end()
})
