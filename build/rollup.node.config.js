import path from 'path'
import fs from 'fs'
import config from './config.js'
import NgnPlugin from './rollup-plugin-ngn.js'
import { terser } from 'rollup-plugin-terser'
import babel from 'rollup-plugin-babel'

// Install source map support
import { install } from 'source-map-support'
install()

// Identify source file
const input = path.resolve('../src/main.js')

// Add NGN rollup support
const ngn = new NgnPlugin()

// Configure metadata for the build process.
const rootdir = config.nodeOutput // Main output directory
let outdir = rootdir // Active output directory
let configuration = [] // Rollup Configurations

// 1. Clean prior builds
fs.rmdirSync(rootdir, { recursive: true })

// Development: Standard (Unminified ES6+ Support)
// configuration.push({
//   input,
//   plugins: [
//     babel({
//       plugins: [['@babel/plugin-proposal-class-properties', { 'loose': false }]],
//       externalHelpersWhitelist: ['classPrivateFieldSet', 'classPrivateFieldGet']
//     }),
//     ngn.only('node'),
//     ngn.applyVersion(ngn.version)
//   ],
//   output: {
//     file: `${outdir}/${ngn.name}-${ngn.version}.js`,
//     format: 'esm',
//     sourcemap: false
//   },
//   external: ['os']
// })

// 2. Build Node Production Package: Standard (Minified/Munged)
outdir += '/node-ngn'
configuration.push({
  input,
  plugins: [
    babel({
      plugins: [['@babel/plugin-proposal-class-properties', { 'loose': false }]],
      externalHelpersWhitelist: ['classPrivateFieldSet', 'classPrivateFieldGet']
    }),
    ngn.only('node'),
    ngn.applyVersion(ngn.version),
    terser({
      module: true,
      mangle: {
        properties: true
      },
      compress: {
        drop_console: true,
        passes: 8,
        warnings: true,
        ecma: 6
      }
    })
  ],
  output: {
    file: `${outdir}/${ngn.name}-${ngn.version}.min.js`,
    format: 'esm',
    sourcemap: true
  },
  external: ['os']
})

// Move the sourcemap to the debug package
// configuration.push({

// })

export default configuration
