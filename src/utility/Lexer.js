import NGN from '../core.js'

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
export default class NGNLexer { // eslint-disable-line no-unused-vars
  #tokens = []
  #rules = []
  #remove = 0
  #state = 0
  #index = 0
  #statement = ''
  #reject = false
  #lastLineIndex = 0
  #currentLength = 0
  #currentMatch = null
  #row = 1
  #unrecognizedCharacters = false

  /**
   * Create a new lexer instance.
   * @param  {String} [input='']
   * Initialize with text input.
   */
  constructor (statement = '') {
    this.#statement = statement

    // Identify beginning of file/statement
    this.addRule(/^/, () => 'BOF')

    // Identify end of file/statement
    this.addRule(/$/, () => 'EOF')

    if (statement && statement.length > 0) {
      this.input = statement
    }
  }

  /**
   * @property {String} value
   * The input text to analyze. Changing this automatically resets the lexer.
   */
  set input (value) {
    this.#remove = 0
    this.#state = 0
    this.#index = 0
    this.#currentMatch = null
    this.#tokens = []
    this.#row = 1
    this.#statement = value
  }

  get input () {
    return this.#statement
  }

  get statement () {
    return this.#statement
  }

  get index () {
    return this.#index
  }

  get currentLength () {
    return this.#currentLength
  }

  /**
   * @property {number} lines
   * The number of lines in the input text.
   */
  get lines () {
    return this.#statement.split('\n').length
  }

  /**
   * @property {boolean} unrecognized
   * Set this to `true` within a rule if a value is unrecognized.
   * The more common approach is to use the #error method, which
   * sets this to `true` when a rule should produce an error.
   */
  get unrecognized () {
    return this.#unrecognizedCharacters
  }

  set unrecognized (value) {
    this.#reject = true
    this.#unrecognizedCharacters = NGN.forceBoolean(value)
  }

  /**
   * @property {number} currentLine
   * Retrieves the current line wherever the lexer left off (i.e. last
   * recognized token).
   */
  get currentLine () {
    return this.#row
  }

  /**
   * @property {number} currentColumn
   * Retrieves the current column wherever the lexer left off (i.e. last
   * recognized token).
   */
  get currentColumn () {
    const col = (this.#index - this.#lastLineIndex) - this.#currentLength

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
      const col = (this.#index - this.#lastLineIndex) - 1

      throw new Error(`${message} at line ${this.#row}, column ${col < 1 ? 1 : col}.`)
    }

    this.#unrecognizedCharacters = true
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
      actionFn = () => action
    } else {
      actionFn = action
    }

    if (!NGN.isFn(actionFn)) {
      throw new Error(`INVALID LEXER ATTRIBUTES: ${pattern.toString()} rule is missing a valid handler function (action) or token name.`)
    }

    const actionString = actionFn.toString()

    if (actionString.indexOf('this.error(') >= 0 && /^\(.*\)\s{0,10}=>\s{0,10}\{/.test(actionString)) {
      throw new Error('Cannot use a non-lexical expression (arrow function) as a lexer rule.')
    }

    this.#rules.push({
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
    if (this.#tokens.length) {
      return this.#tokens.shift()
    }

    this.#reject = true

    while (this.#index <= this.#statement.length) {
      // Count any new line & reset column
      if (/\n/i.test(this.#statement.charAt(this.#index))) {
        this.#row++
        this.#lastLineIndex = this.#index
      }

      const matches = this.scan().splice(this.#remove)
      const index = this.#index

      while (matches.length) {
        if (this.#reject) {
          const match = matches.shift()
          const result = match.result
          const length = match.length

          this.#index += length
          this.#currentLength = length
          this.#reject = false
          this.#remove++
          let token = match.action.apply(this, result)

          if (this.#reject) {
            this.#index = result.index
          } else if (token !== undefined) {
            switch (NGN.typeof(token)) {
              case 'array':
                this.#tokens = token.slice(1)
                token = token[0]

              default: // eslint-disable-line no-fallthrough
                if (length) {
                  this.#remove = 0
                }

                return token
            }
          }
        } else {
          break
        }
      }

      const input = this.#statement

      if (index < input.length) {
        if (this.#reject) {
          this.#remove = 0

          const token = this.unexpected(input.substr(this.#index++, this.#index + input.length))

          if (token !== undefined) {
            if (NGN.typeof(token) === 'array') {
              this.#tokens = token.slice(1)
              return token[0]
            } else {
              return token
            }
          }
        } else {
          if (this.#index !== index) {
            this.#remove = 0
          }

          this.#reject = true
        }
      } else if (matches.length) {
        this.#reject = true
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
    const matches = []
    let index = 0
    const state = this.#state
    const lastIndex = this.#index
    const input = this.#statement

    for (let i = 0, length = this.#rules.length; i < length; i++) {
      const rule = this.#rules[i]
      const start = rule.start
      const states = start.length

      if (
        (!states || start.indexOf(state) >= 0) ||
          (state % 2 && states === 1 && !start[0])
      ) {
        const pattern = rule.pattern
        pattern.lastIndex = lastIndex
        const result = pattern.exec(input)

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
            const k = j - 1

            if (matches[j].length > matches[k].length) {
              const temple = matches[j]
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
    if (this.#unrecognizedCharacters) {
      const col = (this.#index - this.#lastLineIndex) - 1

      throw new Error(`Unexpected syntax at line ${this.#row}, column ${col < 1 ? 1 : col}\nat ${str}\n   ^`)
    }
  }
}
