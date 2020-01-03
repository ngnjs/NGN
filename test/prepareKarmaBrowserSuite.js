import fs from 'fs'
import path from 'path'
import rollup from 'rollup'
import multi from '@rollup/plugin-multi-entry'

const config = JSON.parse(fs.readFileSync('../build/config.json'))
const pkg = JSON.parse(fs.readFileSync('../package.json'))
const file = path.resolve(path.join(config.testOutput, '.testsuite', 'browser-test.js'))

// if (fs.existsSync(path.dirname(file))) {
//   // a. Check the timestamp of the last build file and determine if it is outdated.
//   const lastbuildtime = fs.statSync(file).mtime.getTime()

//   // b. Check all source files for last modification dates
//   let updatedfiles = []
//   fs.readdirSync('./')
//     .filter(item => fs.statSync(path.resolve(item)).isDirectory() && /[0-9]+-[^0-9]+/.test(item))
//     .forEach(dir => {
//       updatedfiles = updatedfiles.concat(fs.readdirSync(dir).filter(item => fs.statSync(path.resolve(path.join(dir, item))).mtime.getTime() > lastbuildtime))
//     })

//   if (updatedfiles.length === 0) {
//     console.log('Build is unnecessary (no changes since last build).')
//     process.exit(0)
//   }
//   console.log(updatedfiles)
// }

fs.rmdirSync(path.dirname(file), { recursive: true })
fs.mkdirSync(path.dirname(file))

const outputOptions = {
  file,
  format: 'cjs'
}

const external = config.external
external.push('.node/index.js')
external.push('./.node/index.js')
external.push('../.node/index.js')
external.push('../../.node/index.js')
// external.push('.browser/index.js')
// external.push('./.browser/index.js')
// external.push('../.browser/index.js')
// external.push('../../.browser/index.js')

async function build () {
  const bundle = await rollup.rollup({
    input: path.resolve('./*-*/*-*.js'),
    external,
    plugins: [multi()]
  })

  // const { output } = await bundle.generate(outputOptions)

  await bundle.write(outputOptions)

  // Override the sourcemapping to work w/ CJS
  const content = /* `import NGN from './ngn-${pkg.version}.min.js'\n` + */fs.readFileSync(file)
    .toString()
    .replace("require('source-map-support/register.js');", '\n')
    .replace(/var NGN\s+=\s+_interop.*\n?/gi, '')
    // .replace('.node/index.js', `.browser/ngn-${pkg.version}.min.js`)
    // .replace("require('source-map-support/register.js');", "var sourcemap = require('source-map-support');\nsourcemap.install();\n")

  fs.writeFileSync(file, content)
}

build()
