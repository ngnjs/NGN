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
      this.walk(this.source).forEach((filepath, i) => {
        let content = this.readFileSync(filepath)

        // If the file is a partial, exclude it
        if (exclusion.test(content)) {
          this.PARTIALS[filepath] = content
          this.highlight(`Excluded ${filepath} (partial)`)
        } else {
          this.writeFileSync(this.output(filepath), this.includePartials(filepath, content))
          this.info(`  ${i + 1} ==> ${this.relativePath(filepath)}`)
        }

        next()
      })
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
      tokens = tokenizer.exec(content)
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
