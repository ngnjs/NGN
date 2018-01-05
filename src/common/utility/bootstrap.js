(function () {
  // [INCLUDE: ./Lexer.js]
  // [INCLUDE: ./Tokenizer.js]
  // [INCLUDE: ./Set.js]

  NGN.extend('UTILITY', NGN.const(Object.defineProperties({}, {
    Lexer: NGN.const(NGNLexer), // eslint-disable-line no-undef
    Tokenizer: NGN.const(NGNTokenizer), // eslint-disable-line no-undef
    Set: NGN.const(NGNSet) // eslint-disable-line no-undef
  })))
})()
