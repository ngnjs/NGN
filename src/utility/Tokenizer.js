import NGN from '../core.js'

/**
 * @class NGN.UTILITY.Tokenizer
 * Given a grammar, a tokenizer will perform lexical analysis of text.
 * In simple terms, it will extract tokens from text. This is accomplished
 * by applying rules with a NGN.UTILITY.Lexer and capturing responses.
 *
 * The NGN.DATA.JSQL class is an implementation of a tokenizer. It extracts
 * tokens from JSQL queries, splitting them into tokens that can be used in
 * programs.
 */
export default class NGNTokenizer { // eslint-disable-line no-unused-vars
  /**
   * Create a new tokenizer. This will return an instance of itself,
   * allowing for methods to be chained like `(new Tokenizker([...])).parse('...')`.
   * @param  {Array}  [grammar=[]]
   * A grammar is a collection of rules that are passed to
   * NGN.UTILITY.Lexer#addRule.
   *
   * The following example provides a subset of the NGN.DATA.JQL grammar.
   *
   * ```js
   * new Tokenizer([
   *   // Disallow irrelevant keywords (SQL)
   *   [
   *     /FROM/i,
   *     function () {
   *       this.error('FROM is not a valid JQL query descriptor. Found')
   *     }
   *   ],
   *
   *   // Skip whitespace
   *   [/\s+/, function () {}],
   *
   *   // Common tokens
   *   [/SELECT\s{1,1000}/i, 'SELECT'],
   *   [/DISTINCT\s{1,1000}/i, 'DISTINCT'],
   *   [/WHERE\s{1,1000}/i, 'WHERE'],
   *   [/ORDER BY\s{1,1000}/i, 'ORDERBY']
   * ])
   * ```
   */
  constructor (grammar = []) {
    if (grammar.length === 0) {
      throw new Error('No grammaer rules specified.')
    }

    Object.defineProperties(this, {
      statement: NGN.private(null),
      rules: NGN.privateconst(grammar),

      PROTECTED: NGN.privateconst({
        lexer: new NGN.UTILITY.Lexer(),
        activeText: null,
        orderedList: new Set()
      })
    })

    // Add rules
    for (let i = 0; i < this.rules.length; i++) {
      this.PROTECTED.lexer.addRule(this.rules[i][0], this.rules[i][1])
    }

    return this
  }

  /**
   * @property {string} text
   * The text being "tokenized".
   */
  get text () {
    return this.PROTECTED.activeText
  }

  /**
   * @property {Array} orderedTokenList
   * An ordered list of tokens as they appear within the text.
   *
   * **Example Result:**
   *
   * ```js
   * [{
   *   column: 1,
   *   index: 0,
   *   input: 'original string',
   *   length: 15,
   *   line: 4,
   *   token: 'mytoken'
   * }, {
   *   ...
   * }]
   * ```
   */
  get orderedTokenList () {
    return Array.from(this.PROTECTED.orderedList).map(item => item.detail)
  }

  /**
   * Parses text to generate a token list.
   * @param  {string} text
   * The text to parse.
   * @param  {Boolean} [suppressXOF=true]
   * By default, `BOF` (Beginning of File) and `EOF` (End of File) tokens are
   * suppressed. Set this to `false` to enable them.
   * @return {Array}
   * Returns an array of tokens.
   *
   * **Example Result:**
   *
   * ```js
   * [{
   *   column: 1,
   *   index: 0,
   *   input: 'original string',
   *   length: 15,
   *   line: 4,
   *   token: 'mytoken'
   * }, {
   *   ...
   * }]
   * ```
   */
  parse (text, ignoreXOF = true) {
    if (!NGN.coalesce(text) || typeof text !== 'string') {
      throw new Error('Cannot parse empty string or non-string.')
    }

    this.PROTECTED.activeText = text

    let tokens = {}
    let token

    this.PROTECTED.lexer.input = text
    this.PROTECTED.orderedList.clear()

    while (token = this.PROTECTED.lexer.next()) { // eslint-disable-line no-cond-assign
      if (!ignoreXOF || (token !== 'BOF' && token !== 'EOF')) {
        tokens[token] = NGN.coalesce(tokens[token], [])

        tokens[token].push({
          line: this.PROTECTED.lexer.currentLine,
          column: this.PROTECTED.lexer.currentColumn,
          length: this.PROTECTED.lexer.currentLength,
          index: this.PROTECTED.lexer.index - this.PROTECTED.lexer.currentLength,
          input: this.PROTECTED.lexer.statement.substr(this.PROTECTED.lexer.index - this.PROTECTED.lexer.currentLength, this.PROTECTED.lexer.currentLength)
        })

        const index = tokens[token].length - 1

        this.PROTECTED.orderedList.add({
          index: index,
          token: token,
          get detail () {
            return Object.assign(tokens[this.token][this.index], {token: this.token})
          }
        })
      }
    }

    return tokens
  }
}
