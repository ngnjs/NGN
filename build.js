const path = require('path')
const ProductionLine = require('productionline')

class NGNBuilder extends ProductionLine {
  constructor () {
    super()

    // Override standard source
    this.source = path.resolve('./src/common')

    // Create a header with attribution.
    this.header = `v${this.version} generated on: ${(new Date())}\n` +
      `Copyright (c) 2014-${(new Date()).getFullYear()}` +
      `, ${this.author} and contributors. All Rights Reserved. License: ${this.package.license}.`

    // Tokenizers
    this.tokenizer = /\/\/\s{0,30}\[INCLUDE\:\s{0,30}(.*)\]/i
    this.exclusion = /\/\/\s{0,30}\[PARTIAL\](.*)/im

    // Hold partial files
    this.PARTIALS = {}
  }

  testBuild () {
    this.output = path.resolve('./test/lib')

    this.clean()

    this.tasks.add(`Generate test files in ${this.output}`, next => {
      let excluded = []
      let ui = new this.Table()

      ui.div({
        text: this.COLORS.subtle('Generated Files:'),
        padding: [1, 0, 0, 5]
      })

      console.log(ui.toString())

      this.walk(this.source).forEach(filepath => {
        let content = this.readFileSync(filepath)

        // If the file is a partial, exclude it
        if (this.exclusion.test(content)) {
          this.PARTIALS[filepath] = content
          excluded.push(this.relativePath(filepath))
        } else {
          this.writeFileSync(this.outputDirectory(filepath), this.includePartials(filepath, content))
          this.success(`     ${this.relativePath(filepath)}`)
        }
      })

      ui = new this.Table()

      ui.div({
        text: this.COLORS.subtle('Partials Identified:') + '\n' + this.COLORS.info(excluded.join('\n')),
        padding: [1, 0, 1, 5]
      })

      console.log(ui.toString())

      next()
    })
  }

  includePartials (file, content) {
    let tokens = this.tokenizer.exec(content)

    // Replace all tokens
    while (tokens) {
      let filepath = path.join(path.dirname(file), tokens[1])

      if (!this.PARTIALS.hasOwnProperty(filepath)) {
        this.PARTIALS[filepath] = this.readFileSync(filepath)
      }

      content = content.replace(tokens[0], this.PARTIALS[filepath])
      tokens = this.tokenizer.exec(content)
    }

    return content
  }
}

// Use the custom builder
let pipeline = new NGNBuilder()

// Command Line Interface
switch (process.argv[2]) {
  case '--test':
    pipeline.testBuild()
    break

  default:
    return pipeline.error('No argument specified. Did you mean to run --build?')
}

pipeline.run()
