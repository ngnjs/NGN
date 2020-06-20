import path from 'path'
import fs from 'fs'
import config from './lib/config.js'
import Build from './lib/build.js'
import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'

// Install source map support
import 'source-map-support/register.js'

// Add our own functionality
const build = new Build()

// Identify source file
const input = path.resolve(`../${build.pkg.main}`)

// Configure metadata for the build process.
const rootdir = path.resolve(config.output) // Main output directory
let outdir = path.join(rootdir, build.name) // Active output directory
let configuration = [] // Rollup Configurations
let output = `${outdir}/index.js`

// Pre-process: Check if the build actually needs to be updated.
// if (build.isUnnecessaryBuild(input, output)) {
//   process.exit(0)
// }

// 1. Clean prior builds
if (fs.existsSync(rootdir)) {
  console.log('Cleaning directory:', rootdir)
  fs.rmdirSync(rootdir, { recursive: true })
}

// Identify plugins
process.env.BROWSERSLIST_ENV = 'current'
const plugins = [
  babel({
    // presets: [['@babel/preset-env', { targets: { node: true } }]],
    presets: [['@babel/env']],
    plugins: [
      ['@babel/plugin-proposal-class-properties', { 'loose': false }],
      ['@babel/plugin-proposal-private-methods', { 'loose': false }]
    ]
  })
]

// 2. Build Node Production Package: Standard (Minified/Munged)
const onwarn = build.ignoreCircularDependency('../src/internal.js')

let terserCfg = config.terser
terserCfg.module = true
terserCfg.compress.module = true
terserCfg.compress.drop_console = false

plugins.push(terser(terserCfg))

if (plugins.length > 0) {
  console.log(`\n[Processing with ${plugins.map(p => p.name).join(', ')}]`)
} else {
  console.log('\n[Processing with no build plugins]')
}

if (plugins.map(p => p.name.toLowerCase()).indexOf('terser') >= 0) {
  output = output.replace(/\.js$/i, '.min.js')
}

configuration.push({
  input,
  onwarn,
  plugins,
  output: {
    banner: config.banner,
    file: output,
    format: 'esm',
    sourcemap: true,
    name: build.name
  },
  external: config.external
})

export default configuration
