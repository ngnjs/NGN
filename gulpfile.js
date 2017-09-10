'use strict'

// Imports
const path = require('path')
const fs = require('fs-extra')
const gulp = require('gulp')
const gutil = require('gulp-util')
const chalk = require('chalk')
const minimatch = require('minimatch')
const header = require('gulp-header')
const pkg = require('./package.json')
const Tasks = require('shortbus')

// Project Root
const gitignore = path.join(__dirname, './.gitignore')
const buildignore = path.join(__dirname, './.buildignore')

// Configuration
const DIR = {
  source: {
    common: path.resolve('./src/common'),
    browser: path.resolve('./src/browser'),
    runtime: path.resolve('./src/runtime')
  },
  dist: path.resolve('./dist'),
  test: path.resolve('./tests/lib')
}

let comments = {
  header: `/**\n  * v${pkg.version} generated on: ${(new Date())}\n` +
    `  * Copyright (c) 2014-${(new Date()).getFullYear()}` +
    `, ${pkg.author.name}. All Rights Reserved. See LICENSE (BSD3-Clause).\n  */\n`
}

// Tokenizers
let tokenizer = /\/\/\s{0,30}\[INCLUDE\:\s{0,30}(.*)\]/i
let exclusion = /\/\/\s{0,30}\[PARTIAL\](.*)/im

// Utilities
const globs = (
    fs
      .readFileSync(gitignore)
      .toString()
    + fs
      .readFileSync(buildignore)
      .toString()
  )
  .replace(/\#.*/gi, '')
  .split(require('os').EOL)
  .filter(glob => {
    if (glob.trim().charAt(0) === '!') {
      return false
    }

    return glob.trim().length > 0
  })

const ignored = (filepath) => {
  for (let i = 0; i < globs.length; i++) {
    if (minimatch(filepath, `/**/${globs[i]}`)) {
      gutil.log(chalk.bgBlack.keyword('gold')('  IGNORED ==> ') + chalk.bgBlack.hex('#666666')(`${filepath} matched ${chalk.keyword('cyan').bold(globs[i])}`))
      return true
    }
  }

  return false
}

const walk = function (dir) {
  let files = []

  fs.readdirSync(dir).forEach(function (filepath) {
    filepath = path.join(dir, filepath)

    if (!ignored(filepath)) {
      const stat = fs.statSync(filepath)

      if (stat.isDirectory()) {
        files = files.concat(walk(filepath))
      } else {
        files.push(filepath)
      }
    }
  })

  return files
}

// Cache for partial files
let partials = {}
const includePartials = function (file, content) {
  // Tokenize
  let tokens = tokenizer.exec(content)

  // Replace all tokens
  while (tokens) {
    let filepath = path.join(path.dirname(file), tokens[1])

    if (!partials.hasOwnProperty(filepath)) {
      partials[filepath] = fs.readFileSync(filepath)
    }

    content = content.replace(tokens[0], partials[filepath])
    tokens = tokenizer.exec(content)
  }

  return content
}

const testBuild = (callback) => {
  fs.emptyDirSync(DIR.test)

  gutil.log(chalk.bgBlack.magenta.bold(`  Generating test files in ${DIR.test}\n`))

  let files = walk(DIR.source.common)

  files.forEach((file, i) => {
    let content = fs.readFileSync(file).toString().trim()

    // Exclude files marked as partials.
    if (exclusion.test(content)) {
      gutil.log(chalk.bgBlack.hex('#805618')(`  __ ==> Excluded ${file}`))
      partials[file] = fs.readFileSync(file)
      return
    }

    fs.outputFileSync(file.replace(DIR.source.common, DIR.test), includePartials(file, content))
    gutil.log(chalk.bgBlack.hex('#97a3b5')(`  ${i+1} ==> ${file.replace(DIR.source.common, '')}`))
  })

  gutil.log(chalk.bgBlack.green('  ------------------------------'))
  gutil.log(chalk.bgBlack.green('  |  File Generation Complete  |'))
  gutil.log(chalk.bgBlack.green('  ------------------------------'))

  callback()
}

// PRIMARY TASKS
gulp.task('clean', (next) => {
  gutil.log('Cleaning distribution.')
  clean()
  fs.emptyDir(DIR.dist, next)
})

gulp.task('watch', () => {
  gulp.watch(`${DIR.source.common}/**/*`, ['test'])
  gulp.watch([`${DIR.test}/**/*`, `!${DIR.test}/lib/**/*`], ['test'])
})

gulp.task('test:build', (next) => testBuild(next))

gulp.task('test:clean', (next) => fs.remove(DIR.test, next))

gulp.task('test', (next) => {
  let tasks = new Tasks()

  tasks.add('Clean Library', (nextTask) => fs.remove(DIR.test, nextTask))

  tasks.add('Build Library', (nextTask) => testBuild(nextTask))

  tasks.add('Run "npm test"', (nextTask) => {
    let child = require('child_process').spawn('npm', ['run', 'test'], {
      cwd: __dirname,
      stdio: 'inherit'
    })

    child.on('close', nextTask)
  })

  tasks.on('stepstarted', (task) => gutil.log(chalk.underline.bgBlack.hex('#7aabd4').bold(`\n\n${task.number}: ${task.name.toUpperCase()}\n`)))

  tasks.on('complete', next)

  tasks.run(true)
})


// ACTIONS
gulp.task('clear', () => clean())
gulp.task('dev', ['test', 'watch'])
