import test from 'tappedout'
import NGN from 'ngn'

test('Namespace', t => {
  t.ok(NGN !== undefined, 'NGN namespace is recognized.')
  t.end()
})

test('Method Existence', t => {
  const methodList = new Set([
    // 'define',
    'public',
    'hidden',
    'constant',
    'hiddenconstant',
    'get',
    'set',
    'getset',
    'before',
    'after',
    'wrap',
    'wrapClass',
    'deprecate',
    'deprecateClass',
    'acceptableType',
    'unacceptableType',
    'typeof',
    'nodelike',
    'stack',
    'defineException',
    'runtime',
    'platform',
    'platformVersion',
    'OS',
    'WARN',
    'WARN_EVENT',
    'INFO',
    'INFO_EVENT',
    'ERROR',
    'ERROR_EVENT',
    'INTERNAL',
    'INTERNAL_EVENT',

    // Classes
    'Class',
    'Middleware',
    'EventEmitter',
    'Relationships',
    'Relationship',

    // Extras
    'version',
    'BUS',
    'LEDGER',

    // Plugins
    'plugins'
  ])

  for (const method of methodList) {
    t.ok(NGN[method] !== undefined, `NGN.${method} exists.`)
  }

  const keys = Object.getOwnPropertyNames(NGN)

  for (const key of keys) {
    if (!methodList.has(key)) {
      t.fail(`NGN.${key} has no sanity check.`)
    }
  }

  // Make sure the reference is available globally.
  const ref = Object.getOwnPropertySymbols(globalThis).filter(s => {
    if (globalThis[s] instanceof Map) {
      return s === globalThis[s].get('REFERENCE_ID')
    } else {
      return false
    }
  })

  t.ok(typeof NGN.OS === 'string', `${NGN.OS} operating systems recognized as a "${typeof NGN.OS}" (expected string).`)
  t.ok(typeof NGN.platform === 'string', `${NGN.platform} operating system type recognized as a "${typeof NGN.platform}" (expected string).`)
  t.ok(ref.length === 1, 'NGN metadata available via global symbol reference.')

  const versionTest = async () => {
    t.ok(NGN.platformVersion instanceof Promise, 'NGN.platformVersion returns a promise.')
    const pv = await NGN.platformVersion
    t.ok(typeof pv === 'string', `NGN.platformVersion promise returned a "${typeof pv}" (expected string).`)
    t.end()
  }

  versionTest()
})

test('Exception Existence', t => {
  t.ok(MissingNgnDependencyError !== undefined, 'NGN missing dependency error is recognized.')
  t.ok(ReservedWordError !== undefined, 'Reserved word error is recognized.')
  t.ok(InvalidConfigurationError !== undefined, 'Configuration error is recognized.')

  t.throws(() => { throw MissingNgnDependencyError() }, 'MissingNgnDependencyError throws')
  t.throws(() => { throw ReservedWordError() }, 'ReservedWordError throws')
  t.throws(() => { throw InvalidConfigurationError() }, 'InvalidConfigurationError throws')
  // throw MissingNgnDependencyError()
  t.end()
})
