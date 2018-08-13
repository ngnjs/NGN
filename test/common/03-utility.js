const test = require('tap').test

// Remember to run `npm run test:build` before executing,
// otherwise the lib directory will not exist.

require('../lib/ngn')

test('NGN.UTILITY Sanity Check', function (t) {
  t.ok(typeof NGN.UTILITY.Lexer === 'function', 'NGN.UTILITY.Lexer exists as a class.')
  t.ok(typeof NGN.UTILITY.Tokenizer === 'function', 'NGN.UTILITY.Tokenizer exists as a class.')
  t.ok(typeof NGN.UTILITY.Set === 'function', 'NGN.UTILITY.Set exists as a class (singleton).')

  t.end()
})

var statement = 'Hello World!\nHello Universe!\nYo Developer!'

test('NGN.UTILITY.Lexer', function (t) {
  var lexer = new NGN.UTILITY.Lexer(statement)

  t.ok(lexer.input === statement, 'Input recognized.')
  t.ok(lexer.lines === 3, 'Correct number of lines recognized.')

  lexer.addRule(/hello/i, 'hi')
  lexer.addRule(/world/i, function () { return 'planet' })

  t.ok(lexer.next() === 'BOF', 'Beginning of file recognized.')
  t.ok(lexer.next() === 'hi', 'First token recognized.')
  t.ok(lexer.next() === 'planet', 'Different token recognized.')
  t.ok(lexer.currentColumn === 6, 'Current column recognized.')
  t.ok(lexer.next() === 'hi', 'Next token recognized.')
  t.ok(lexer.currentLine === 2, 'Current line recognized.')

  lexer.addRule(/yo/i, function () {
    this.error()
  })

  t.throws(lexer.next, 'Error rule throws an actual error.')

  lexer.input = statement
  t.ok(lexer.currentLine === 1, 'Reset successfully.')

  t.end()
})

test('NGN.UTILITY.Tokenizer', function (t) {
  var tokenizer = new NGN.UTILITY.Tokenizer([
    [/hello/i, 'hi'],
    [/world/i, 'planet']
  ])

  var tokens = tokenizer.parse(statement)

  t.ok(
    tokens.hi.length === 2 &&
    tokens.planet.length === 1,
    'Successfully parse all tokens'
  )

  t.ok(
    tokens.hi[1].line === 2 &&
    tokens.hi[1].column === 1 &&
    tokens.hi[1].length === 5 &&
    tokens.hi[1].index === 13 &&
    tokens.hi[1].input === 'Hello',
    'Successfully retrieved details of each token.'
  )

  t.ok(tokenizer.text === statement, 'Text attribute represents the original statement.')

  tokens = tokenizer.orderedTokenList

  t.ok(tokens.length === 3, 'Ordered token list contains the right tokens')
  t.ok(
    tokens[0].token === 'hi' &&
    tokens[1].token === 'planet' &&
    tokens[2].token === 'hi',
    'Ordered token list returns the proper order of tokens.'
  )

  tokenizer.parse(statement, false)
  tokens = tokenizer.orderedTokenList

  t.ok(
    tokens.length === 5 &&
    tokens[0].token === 'BOF' &&
    tokens[tokens.length - 1].token === 'EOF',
    'BOF & EOF recognized.'
  )

  tokenizer = new NGN.UTILITY.Tokenizer([
    [/hello/i, 'hi'],
    [/world/i, function () { this.error() }]
  ])

  try {
    tokenizer.parse(statement)
    t.fail('Error rule fails to throw error.')
  } catch (e) {
    t.pass('Fails when error rule triggered.')
  }

  t.end()
})

test('NGN.UTILITY.Set', function (t) {
  var setA = new Set([1, 2, 3, 4])
  var setB = new Set([2, 3])
  var setC = new Set([3, 4, 5, 6])
  var setX = new Set([7])

  t.ok(NGN.UTILITY.Set.isSuperSet(setA, setB), 'Identify a superset')
  t.ok(NGN.UTILITY.Set.equal(setX, new Set([7])), 'Recognize equality of two sets.')
  t.ok(NGN.UTILITY.Set.equal(NGN.UTILITY.Set.concat(setA, setC, setX), new Set([1, 2, 3, 4, 5, 6, 7])), 'Concatenate multiple sets.')
  t.ok(NGN.UTILITY.Set.equal(NGN.UTILITY.Set.intersection(setA, setC), new Set([3, 4])), 'Intersection restricts set.')
  t.ok(NGN.UTILITY.Set.equal(NGN.UTILITY.Set.difference(setA, setC), new Set([1, 2])), 'Difference restricts set.')

  t.end()
})
