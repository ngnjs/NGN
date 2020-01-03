import path from 'path'
import fs from 'fs'
import NgnPlugin from '../build/rollup-plugin-ngn.js'

const ngn = new NgnPlugin()
const pkg = JSON.parse(fs.readFileSync('../package.json').toString())
const content = fs.readFileSync('./assets/index.html')
  .toString()
  .replace(/\{\{script\}\}/g, './ngn.min.js')

fs.writeFileSync('./.testsuite/index.html', content)
fs.copyFileSync(`./.browser/ngn-${pkg.version}.min.js`, './.testsuite/ngn.min.js')
fs.copyFileSync(`./.browser/ngn-${pkg.version}.min.js.map`, `./.testsuite/ngn-${pkg.version}.min.js.map`)

const cwd = process.cwd()
const out = path.join(process.cwd(), '.testsuite')
ngn.walk('../src').forEach(file => {
  const input = path.resolve(file)
  const output = path.dirname(input).replace(path.join(cwd, '..'), out)
  if (fs.statSync(input).isFile() && !fs.existsSync(output)) {
    fs.mkdirSync(output)
  }

  const content = fs.readFileSync(input)
    .toString()
    .replace(/([\t ]*\/\* ?node-only ?\*\/)[\s\S]*?(\/\* ?end-node-only ?\*\/[\t ]*\n?)/gim, '')
    .replace(/<#(\s+)?REPLACE_VERSION(\s+)?#>/gi, pkg.version)

  fs.writeFileSync(input.replace(path.join(cwd, '..'), out), content)
})
