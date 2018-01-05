(function () {
  // [PARTIAL]

/**
 * @class NGN.UTILITY.Lexer
 * This class performs scans static text for tokens, based on a grammar.
 * It is designed to work with NGN.UTILITY.Tokenizer to convert text into
 * a sequence of tokens (strings with an identified "meaning").
 *
 * This class was inspired by https://github.com/aaditmshah/lexer (MIT).
 *
 * ```js
 * let lexer = new NGN.UTILITY.Lexer('hello\nworld\nand moon')
 *
 * lexer.addRule(/hello/i, function (str) {
 *   return 'hi' // "hi" is the name of the token
 * })
 *
 * lexer.addRule(/world/i, function (str) {
 *   return 'planet'
 * })
 *
 * // Create an error if a rule passes. In this case, prevent the word "moon".
 * lexer.addRule(/moon/i, function (str) {
 *   this.error()
 * })
 *
 * console.log(lexer.next())
 *
 * // OUTPUT
 * // {
 * //   line: 1,
 * //   column: 1,
 * //   index: 0,
 * //   token: 'hi',
 * //   length: 5,
 * //   input: 'hello'
 * // }
 *
 * lexer.next() // Returns the next token
 * ```
 *
 * The lexer contains two built-in rules to determine the beginning of
 * file/content (token `BOF`) and the end of file content (token `EOF`).
 */
class NGNLexer { // eslint-disable-line no-unused-vars
  /**
   * Create a new lexer instance.
   * @param  {String} [input='']
   * Initialize with text input.
   */
  constructor (statement = '') {
    Object.defineProperties(this, {
      tokens: NGN.private([]),
      rules: NGN.private([]),
      remove: NGN.private(0),
      state: NGN.private(0),
      index: NGN.private(0),
      statement: NGN.private(statement),
      reject: NGN.private(false),
      lastLineIndex: NGN.private(0),
      currentLength: NGN.private(0),
      currentMatch: NGN.private(null),
      row: NGN.private(1),
      unrecognizedCharacters: NGN.private(false)
    })

    // Identify beginning of file/statement
    this.addRule(/^/, function () {
      return 'BOF'
    })

    // Identify end of file/statement
    this.addRule(/$/, function () {
      return 'EOF'
    })

    if (statement && statement.length > 0) {
      this.input = statement
    }
  }

  /**
   * @property {String} value
   * The input text to analyze. Changing this automatically resets the lexer.
   */
  set input (value) {
    this.remove = 0
    this.state = 0
    this.index = 0
    this.currentMatch = null
    this.tokens = []
    this.row = 1
    this.statement = value
  }

  get input () {
    return this.statement
  }

  /**
   * @property {number} lines
   * The number of lines in the input text.
   */
  get lines () {
    return this.statement.split('\n').length
  }

  /**
   * @property {boolean} unrecognized
   * Set this to `true` within a rule if a value is unrecognized.
   * The more common approach is to use the #error method, which
   * sets this to `true` when a rule should produce an error.
   */
  get unrecognized () {
    return this.unrecognizedCharacters
  }

  set unrecognized (value) {
    // TODO: NGN.forceBoolean
    this.reject = true
    this.unrecognizedCharacters = NGN.forceBoolean(value)
  }

  /**
   * @property {number} currentLine
   * Retrieves the current line wherever the lexer left off (i.e. last
   * recognized token).
   */
  get currentLine () {
    return this.row
  }

  /**
   * @property {number} currentColumn
   * Retrieves the current column wherever the lexer left off (i.e. last
   * recognized token).
   */
  get currentColumn () {
    let col = (this.index - this.lastLineIndex) - this.currentLength

    return col === 0 ? 1 : col
  }

  /**
   * Called within a rule to force an error. This is most commonly used
   * when a block of text contains a value it shouldn't.
   * @param  {String} [message]
   * An optional message prefixed to the error message.
   */
  error (message) {
    if (message) {
      let col = (this.index - this.lastLineIndex) - 1

      throw new Error(`${message} at line ${this.currentLine}, column ${col < 1 ? 1 : col}.`)
    }

    this.unrecognized = true
  }

  /**
   * Add a rule for detecting a token.
   * @param {RegExp} pattern
   * The pattern is applied to the text to determine whether the action should
   * be triggered or not.
   * @param {Function|String} action
   * The action method is executed when a pattern match is detected. If the
   * action is a function, it must return the name of the token. Functions
   * receive a single argument, which is the text that matched the rule.
   *
   * If a string is provided as the action, that string will be returned as
   * the token value whenever a pattern match occurs. This is a convenient
   * way to avoid repetitively writing the following type of token handler:
   *
   * ```js
   * function () {
   *   return 'token'
   * }
   * ```
   * @param {Array} [start=[0]]
   * An optional array of unsigned integers acting as
   * [start conditions](http://flex.sourceforge.net/manual/Start-Conditions.html).
   * By default all rules are active in the initial state (i.e. `0`).
   */
  addRule (pattern, action, start = [0]) {
    if (!pattern.global) {
      let flags = 'g'

      if (pattern.multiline) {
        flags += 'm'
      }

      if (pattern.ignoreCase) {
        flags += 'i'
      }

      pattern = new RegExp(pattern.source, flags)
    }

    let actionFn
    if (typeof action === 'string') {
      actionFn = function () {
        return action
      }
    } else {
      actionFn = action
    }

    if (!NGN.isFn(actionFn)) {
      throw new Error(`INVALID LEXER ATTRIBUTES: ${pattern.toString()} rule is missing a valid handler function (action) or token name.`)
    }

    let actionString = actionFn.toString()

    if (actionString.indexOf('this.error(') >= 0 && /^\(.*\)\s{0,10}=>\s{0,10}\{/.test(actionString)) {
      throw new Error('Cannot use a non-lexical expression (arrow function) as a lexer rule.')
    }

    this.rules.push({
      pattern,
      global: pattern.global,
      action: actionFn,
      start
    })
  }

  /**
   * An iterator method.
   * @return {Object}
   * Returns the next recognized token as a detailed object:
   *
   * ```js
   * {
   *   line: 1,
   *   column: 1,
   *   index: 0,
   *   token: 'token name',
   *   length: 5,
   *   input: 'original input string'
   * }
   */
  next () {
    if (this.tokens.length) {
      return this.tokens.shift()
    }

    this.reject = true

    while (this.index <= this.statement.length) {
      // Count any new line & reset column
      if (/\n/i.test(this.statement.charAt(this.index))) {
        this.row++
        this.lastLineIndex = this.index
      }

      let matches = this.scan().splice(this.remove)
      let index = this.index

      while (matches.length) {
        if (this.reject) {
          let match = matches.shift()
          let result = match.result
          let length = match.length

          this.index += length
          this.currentLength = length
          this.reject = false
          this.remove++
          let token = match.action.apply(this, result)

          if (this.reject) {
            this.index = result.index
          } else if (token !== undefined) {
            switch (NGN.typeof(token)) {
              case 'array':
                this.tokens = token.slice(1)
                token = token[0]

              default: // eslint-disable-line no-fallthrough
                if (length) {
                  this.remove = 0
                }

                return token
            }
          }
        } else {
          break
        }
      }

      let input = this.statement

      if (index < input.length) {
        if (this.reject) {
          this.remove = 0

          let token = this.unexpected(input.substr(this.index++, this.index + input.length))

          if (token !== undefined) {
            if (NGN.typeof(token) === 'array') {
              this.tokens = token.slice(1)
              return token[0]
            } else {
              return token
            }
          }
        } else {
          if (this.index !== index) {
            this.remove = 0
          }

          this.reject = true
        }
      } else if (matches.length) {
        this.reject = true
      } else {
        break
      }
    }
  }

  /**
   * Scan the text and apply rules.
   * @private
   */
  scan () {
    let matches = []
    let index = 0
    let state = this.state
    let lastIndex = this.index
    let input = this.statement

    for (let i = 0, length = this.rules.length; i < length; i++) {
      let rule = this.rules[i]
      let start = rule.start
      let states = start.length

      if (
        (!states || start.indexOf(state) >= 0) ||
          (state % 2 && states === 1 && !start[0])
      ) {
        let pattern = rule.pattern
        pattern.lastIndex = lastIndex
        let result = pattern.exec(input)

        if (result && result.index === lastIndex) {
          let j = matches.push({
            result,
            action: rule.action,
            length: result[0].length
          })

          if (rule.global) {
            index = j
          }

          while (--j > index) {
            let k = j - 1

            if (matches[j].length > matches[k].length) {
              let temple = matches[j]
              matches[j] = matches[k]
              matches[k] = temple
            }
          }
        }
      }
    }

    return matches
  }

  /**
   * Handles unexpected character sequences.
   * This may throw an error if the characters are unrecognized.
   * @param  {String} characters
   * The characters which triggered the unexpected flag.
   * @private
   */
  unexpected (str) {
    if (this.unrecognizedCharacters) {
      let col = (this.index - this.lastLineIndex) - 1

      throw new Error(`Unexpected syntax at line ${this.currentLine}, column ${col < 1 ? 1 : col}\nat ${str}\n   ^`)
    }
  }
}

  // [PARTIAL]

/**
 * @class NGN.UTILITY.Tokenizer
 * Given a grammar, a tokenizer will perform lexical analysis of text.
 * In simple terms, it will extract tokens from text. This is accomplished
 * by applying rules with a NGN.UTILITY.Lexer and capturing responses.
 *
 * The NGN.DATA.JQL class is an implementation of a tokenizer. It extracts
 * tokens from JQL queries, splitting them into tokens that can be used in
 * programs.
 */
class NGNTokenizer { // eslint-disable-line no-unused-vars
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

  // [PARTIAL]

/**
 * @class NGN.UTILITY.Set
 * Provides advanced features for [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)
 * objects.
 */
class NGNSet { // eslint-disable-line
  /**
   * Indicates the subset is wholly contained within the main set.
   * @param  {Set}  mainset
   * @param  {Set}  subset
   * @return {Boolean}
   */
  static isSuperSet (mainset, subset) {
    if (subset.size > mainset.size || subset.size === 0) {
      return false
    }

    let elements = mainset.values()
    let element = elements.next()

    while (!element.done) {
      if (!mainset.has(element.value)) {
        return false
      }

      element = elements.next()
    }

    return true
  }

  /**
   * Join any number of sets together into a single aggregate set.
   * Only unique values will be added.
   * Accepts any number of Set arguments.
   * @return {Set}
   */
  static concat () {
    let aggregate = new Set(arguments[0])

    for (let i = 1; i < arguments.length; i++) {
      let elements = arguments[i].values()
      let element = elements.next()

      while (!element.done) {
        aggregate.add(element.value)
        element = elements.next()
      }
    }

    return aggregate
  }

  /**
   * Identify the intersection/overlap between two sets.
   * @param  {Set} setA
   * @param  {Set} setB
   * @return {Set}
   * Returns a Set containing the common elements of setA and setB.
   */
  static intersection (setA, setB) {
    let intersection = new Set()
    let a = setA.size < setB.size ? setA : setB
    let b = setA.size < setB.size ? setB : setA
    let elements = a.values()
    let element = elements.next()

    while (!element.done) {
      if (b.has(element.value)) {
        intersection.add(element.value)
      }

      element = elements.next()
    }

    return intersection
  }

  /**
   * Identify the elements that are NOT part of both sets.
   * @param  {Set} setA
   * @param  {Set} setB
   * @return {Set}
   * Returns a set containing elements that are NOT common between setA and setB.
   */
  static difference (setA, setB) {
    let diff = new Set(setA)
    let elements = setB.values()
    let element = elements.next()

    while (!element.done) {
      diff.delete(element.value)
      element = elements.next()
    }

    return diff
  }

  /**
   * Determines whether two sets contain the same values.
   * @param  {Set} setA
   * @param  {Set} setB
   * @return {Boolean}
   */
  static equal (setA, setB) {
    return NGN.UTILITY.Set.difference(setA, setB).size === 0
  }

  /**
   * A convenience method for appending the Set prototype with all
   * of the methods in this utility, where the first argument of
   * each method automatically refers to the Set.
   * @private
   */
  static applyAll () {
    Set.prototype.isSuperSet = function (subset) { // eslint-disable-line no-extend-native
      return NGN.UTILITY.Set.isSuperSet(this, subset)
    }

    Set.prototype.concat = function () { // eslint-disable-line no-extend-native
      return NGN.UTILITY.Set.concat(this, ...arguments)
    }

    Set.prototype.intersection = function () { // eslint-disable-line no-extend-native
      return NGN.UTILITY.Set.intersection(this, ...arguments)
    }

    Set.prototype.difference = function () { // eslint-disable-line no-extend-native
      return NGN.UTILITY.Set.difference(this, ...arguments)
    }

    Set.prototype.equals = function () { // eslint-disable-line no-extend-native
      return NGN.UTILITY.Set.equal(this, ...arguments)
    }
  }
}


  NGN.extend('UTILITY', NGN.const(Object.defineProperties({}, {
    Lexer: NGN.const(NGNLexer), // eslint-disable-line no-undef
    Tokenizer: NGN.const(NGNTokenizer), // eslint-disable-line no-undef
    Set: NGN.const(NGNSet) // eslint-disable-line no-undef
  })))
})()