// The last command line argument.
// const mode = (process.env.hasOwnProperty('BUILD_MODE') ? process.env.BUILD_MODE : 'dev').toLowerCase()

// Karma configuration
require('localenvironment')

var browserslist = require('browserslist')
var reporterEngines = ['spec']
// var reporterEngines = ['spec', 'coverage']
var sauceConfiguration = {  // eslint-disable-line no-unused-vars
  testName: 'NGN Core Unit Tests',
  build: process.env.SEMAPHORE_BUILD_NUMBER || 1,
  recordVideo: false,
  recordScreenshots: false
}

var b = {}
Object.keys(browserslist.data).filter(browser => {
  return /op_|opera|ie_mob|samsung/i.exec(browser) === null
}).map(browserName => {
  var browser = browserslist.data[browserName]
  return `${browser.name} ${browser.released.pop()}`
}).forEach(function (item, index, arr) {
  item = item.split(' ')
  var attr = (item[0] === 'edge' ? 'microsoft' : '') + item[0].toLowerCase()

  if (attr === 'ie') {
    attr = 'internet explorer'
  }

  b[attr] = item[1]
})

// Construct Browser Testing List
var browsers = {}
var keys = Object.keys(b)

for (var i = 0; i < keys.length; i++) {
  var brwsr = keys[i].replace(/\.|\s/, '_')

  browsers['sl_' + brwsr + '_' + b[keys[i]].replace(/\.|\s/, '_')] = {
    base: 'SauceLabs',
    browserName: keys[i],
    version: b[keys[i]]
  }
}

browsers['sl_chrome_45'] = {
  base: 'SauceLabs',
  browserName: 'chrome',
  version: '45'
}

browsers['sl_firefox_50'] = {
  base: 'SauceLabs',
  browserName: 'firefox',
  version: '50'
}

// console.log(JSON.stringify(browsers, null, 2))
var chalk = require('chalk')
var rows = [[chalk.bold('Browser'), chalk.bold('Version')]]
Object.keys(browsers).sort().forEach(slbrowser => {
  rows.push([browsers[slbrowser].browserName, browsers[slbrowser].version])
})

var tablemaker = require('table').table
console.log(tablemaker(rows, {
  columns: {
    1: {
      alignment: 'right'
    }
  }
}))

var getFiles = function () {
  var files

  files = [
    'core.js',
    'exception.js',
    'eventemitter.js',
    'net/NET.js'
  ].map(path => {
    return 'test/lib/' + path
  })

  // Run all tests by default
  let testfiles = 'test/common/*.js'

  // Only run the requested test set
  if (process.argv.indexOf('--test') > 1) {
    testfiles = 'test/common/*-' + process.argv[process.argv.indexOf('--test') + 1] + '.js'
  }

  return files.concat([
    testfiles,
    'test/test.html'
  ])
}

console.log(tablemaker([[chalk.bold('Included Files')]].concat(getFiles().map(file => { return [file] }))))

module.exports = function (config) {
  config.set({

    plugins: [
      // require('karma-coverage'),
      require('karma-browserify'),
      require('tape'),
      require('karma-tap'),
      require('karma-spec-reporter'),
      require('karma-chrome-launcher'),
      // require('karma-firefox-launcher'),
      // require('karma-safari-launcher'),
      // require('karma-ie-launcher'),
      // require('karma-ie-launcher'),
      // require('karma-edge-launcher'),
      // require('karma-phantomjs-launcher'),
      // require('karma-sauce-launcher'),
      require('karma-html2js-preprocessor')
    ],

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['tap', 'browserify'],

    // list of files / patterns to load in the browser
    files: getFiles(),

    // list of files to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/common/**/*.js': ['browserify'],
      'test/test.html': 'html2js'
      // , 'test/lib/**/*.js': 'coverage'
    },

    // coverageReporter: {
    //   type : 'html',
    //   dir : 'coverage/'
    // },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: reporterEngines, // ['progress'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultanous
    concurrency: 3
  })
}
