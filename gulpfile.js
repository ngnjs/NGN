'use strict'

const path = require('path')
const fs = require('fs')
const gulp = require('gulp')
const stripper = require('gulp-strip-comments')
// const concat = require('gulp-concat')
const header = require('gulp-header')
const del = require('del')
const cp = require('child_process')
const pkg = require('./package.json')

let headerComment = '/**\n  * v' + pkg.version + ' generated on: ' +
  (new Date()) + '\n  * Copyright (c) 2014-' + (new Date()).getFullYear() +
  ', Ecor Ventures LLC. All Rights Reserved. See LICENSE (BSD3).\n  */\n'

const DIR = {
  source: path.resolve('./'),
  shared: path.resolve('./shared'),
  dist: path.resolve('./dist')
}

const walk = function (dir) {
  let files = []
  fs.readdirSync(dir).forEach(function (filepath) {
    filepath = path.join(dir, filepath)
    const stat = fs.statSync(filepath)
    if (stat.isDirectory()) {
      files = files.concat(walk(filepath))
    } else {
      files.push(filepath)
    }
  })
  return files
}

const clean = function () {
  try {
    fs.accessSync(DIR.dist, fs.F_OK)
    del.sync(DIR.dist)
  } catch (e) {}
}

gulp.task('clear', function () {
  clean()
})

// Create a clean build
gulp.task('clean', function (next) {
  console.log('Cleaning distribution.')
  clean()
  fs.mkdirSync(DIR.dist)
  next()
})

gulp.task('generate', function () {
  // Primary codebase
  const primary = walk(path.join(DIR.source, 'lib'))
  let primaryjs = []
  let primaryother = []

  primary.forEach(function (file) {
    if (file.indexOf('.git') < 0) {
      if (/[^.*\.js]$/gi.test(file)) {
        primaryother.push(file)
      } else {
        primaryjs.push(file)
      }
    }
  })

  console.log('Stripping comments from:', primaryjs)
  primaryjs.forEach(function (file) {
    let localpath = path.dirname(file.replace(DIR.source + path.sep, ''))
    gulp.src(file)
      .pipe(stripper())
      .pipe(header(headerComment))
      .pipe(gulp.dest(path.join(DIR.dist, localpath)))
  })

  console.log('Copying', primaryother)
  primaryother.forEach(function (file) {
    let localpath = path.dirname(file.replace(DIR.source + path.sep, ''))
    gulp.src(file)
      .pipe(header(headerComment))
      .pipe(gulp.dest(path.join(DIR.dist, localpath)))
  })

  // Shared codebase
  const primaryshared = walk(DIR.shared)
  let primarysharedjs = []
  let primarysharedother = []

  primaryshared.forEach(function (file) {
    if (file.indexOf('.git') < 0) {
      if (/[^.*\.js]$/gi.test(file)) {
        primarysharedother.push(file)
      } else {
        primarysharedjs.push(file)
      }
    }
  })

  console.log('Stripping comments from', primarysharedjs)
  primarysharedjs.forEach(function (file) {
    let localpath = path.dirname(file.replace(DIR.source + path.sep, ''))
    gulp.src(file)
      .pipe(stripper())
      .pipe(header(headerComment))
      .pipe(gulp.dest(path.join(DIR.dist, localpath)))
  })

  console.log('Copying', primarysharedother)
  primarysharedother.forEach(function (file) {
    let localpath = path.dirname(file.replace(DIR.source + path.sep, ''))
    gulp.src(file)
      .pipe(header(headerComment))
      .pipe(gulp.dest(path.join(DIR.dist, localpath)))
  })

  // Primary Files
  const files = ['NGN.js'].map(function (file) {
    return path.join(DIR.source, file)
  }).filter(function (file) {
    try {
      fs.accessSync(file, fs.F_OK)
      return true
    } catch (e) {
      return false
    }
  })

  let filesjs = []
  let filesother = []

  files.forEach(function (file) {
    if (file.indexOf('.git') < 0) {
      if (/[^.*\.js]$/gi.test(file)) {
        filesother.push(file)
      } else {
        filesjs.push(file)
      }
    }
  })

  console.log('Stripping comments from', filesjs)
  filesjs.forEach(function (file) {
    let localpath = path.dirname(file.replace(DIR.source + path.sep, ''))
    gulp.src(file)
      .pipe(stripper())
      .pipe(header(headerComment))
      .pipe(gulp.dest(path.join(DIR.dist, localpath)))
  })

  console.log('Copying', filesother)
  filesother.forEach(function (file) {
    let localpath = path.dirname(file.replace(DIR.source + path.sep, ''))
    gulp.src(file)
      .pipe(header(headerComment))
      .pipe(gulp.dest(path.join(DIR.dist, localpath)))
  })

  // Copy other files
  const assets = ['LICENSE', '.npmignore'].map(function (file) {
    return path.join(DIR.source, file)
  })

  console.log('Copying other assets', assets)
  gulp.src(assets)
    .pipe(gulp.dest(DIR.dist))

  // Update package.json for production release
  let newpkg = {}
  const pkgitems = [
    'name',
    'version',
    'description',
    'main',
    'repository',
    'keywords',
    'preferGlobal',
    'engines',
    'author',
    'contributors',
    'homepage',
    'license',
    'dependencies'
  ]

  Object.keys(pkg).forEach(function (attr) {
    if (pkgitems.indexOf(attr) >= 0) {
      newpkg[attr] = pkg[attr]
    }
  })

  console.log('Generating package.json...')
  fs.writeFileSync(path.join(DIR.dist, 'package.json'), JSON.stringify(newpkg, null, 2))

  console.log('DONE!')
})

gulp.task('prereleasecheck', function (next) {
  console.log('Checking if package already exists.')
  const child = cp.spawn('npm', ['info', pkg.name])

  let data = ''
  child.stdout.on('data', function (chunk) {
    data += chunk.toString()
  })
  child.on('close', function () {
    const re = new RegExp('latest: \'' + pkg.version + '\'')
    if (re.exec(data) === null) {
      fs.writeFileSync(path.join('./', 'postprocess.sh'), 'npm publish')
      next()
    } else {
      fs.writeFileSync(path.join('./', 'postprocess.sh'), 'echo "The version has not changed (' + pkg.version + '). A new release is unnecessary. Aborting deployment with success code."')
      console.log('The version has not changed (' + pkg.version + '). A new release is unnecessary. Aborting deployment with success code.')
      process.exit(0)
    }
  })
})

gulp.task('build', ['clean', 'generate'])
