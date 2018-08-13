const path = require('path')
const ProductionLine = require('productionline')
const fs = require('fs')
const Parser = require('cherow')
const traverse = require('traverse')

class Generator extends ProductionLine {
  constructor (cfg) {
    // Remove assets (since there aren't any)
    cfg.assets = []

    // Override standard source
    cfg.source = path.resolve('./src')

    // Inherit from super class
    super(cfg)

    this.FILES = {}

    this.DATA = {
      globals: [],
      classes: {},
      exceptions: {},
      requires: {}
    }

    this.STANDARD_OPTIONS = {
      loc: true,
      ranges: true,
      skipShebang: true,
      next: true,
      jsx: false,
      module: true
      // tolerant: true
    }

    this.on('global.variable', name => {
      if (this.DATA.globals.indexOf(name) < 0) {
        this.DATA.globals.push(name)
      }
    })
  }

  lineAtToken (content, token) {
    let lines = []
    let lastLine = content.split(/\r|\n/).reduce((line, currentLine, index) => {
      if (line === 0 && currentLine.indexOf(token) >= 0) {
        line = index + 1
        lines.push(line)
      }

      return line
    }, 0)

    return lines
  }

  parseFile (file) {
    let source = new this.File(file)
    let ast = Parser.parse(source.content, this.STANDARD_OPTIONS)

    traverse(ast).reduce((x, node) => {
      if (Array.isArray(node)) {

      } else if (node.hasOwnProperty('type')) {
        switch (node.type.toLowerCase()) {
          case 'classdeclaration':
            console.log(node)
            break
//             // let Class = new ClassSnippet({
//             //   comments: this.FILES[file].comments
//             // })
// console.log('class')
//             break
//
//           case 'identifier':
//             // Identify NGN custom exceptions
//             if (node.name === 'createException' && node.parent.node.type.toLowerCase() === 'memberexpression' && node.parent.node.object && node.parent.node.object.name === 'NGN') {
// console.log('Process custom exception')
//               // let CustomException = new ExceptionSnippet()
//               //
//               // CustomException.parse(parent)
//               //
//               // if (this.DATA.exceptions.hasOwnProperty(CustomException.name)) {
//               //   this.warn(`Duplicate ${CustomException.name} defined at ${file}:${CustomException.start.line},${CustomException.start.column}`)
//               // } else {
//               //   CustomException.code = this.FILES[file].source.getSnippet(CustomException.start.line, CustomException.end.line).substr(CustomException.start.column)
//               //
//               //   this.DATA.exceptions[CustomException.name] = CustomException.json
//               // }
//             }
//
//             // Identify global variables
//             if ((node.name === 'window' || node.name === 'global') && node.parent.parent.key === 'expression' && node.parent.key === 'left') {
//               this.emit('global.variable', node.parent.node.property.name)
//             }
//
//             break
        }
      }
    }, {})
    // ast.body.forEach(snippet => console.log(snippet))
  }

  createJson () {
    this.addTask('Generate JSON', next => {
      this.walk(this.source).forEach((file, i) => {
        if (i === 3) {
          this.parseFile(file)
        }
      })

      next()
    })
  }
}

// Use the custom builder
const generator = new Generator({
  commands: {
    '--docs': () => {
      generator.output = path.resolve('./docs')
      generator.createJson()
    }
  }
})


generator.run()
// const BUS = require('events').EventEmitter
// const Parser = require('cherow')
//
// // Data Placeholder
// const DATA = {
//   globals: [],
//   classes: {},
//   exceptions: {},
//   requires: {}
// }
//
// // Default Parsing Options
// const options = {
//   loc: true,
//   ranges: true,
//   skipShebang: true,
//   next: true,
//   jsx: false
//   // tolerant: true
// }
//
