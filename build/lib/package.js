import fs from 'fs'
import path from 'path'
import config from './config.js'
import Build from './build.js'

let build = new Build()
let outdir = path.resolve(config.output)
let mapfile = `${outdir}/${build.name}/index.min.js.map`
const pkg = Object.assign({}, build.pkg)
const prodpkg = Object.assign({}, build.pkg)

// ---------------------------------------------
// Create the modern debug package
// ---------------------------------------------
console.log('Creating debug package at', `${outdir}/${build.name}-debug`)
fs.mkdirSync(`${outdir}/${build.name}-debug`)
fs.renameSync(mapfile, `${outdir}/${build.name}-debug/index.min.js.map`)

// Update the source map URL
let content = fs.readFileSync(mapfile.replace('.map', ''))
  .toString()
  .replace(/\/+#\s+?sourceMappingURL=/, `//# sourceMappingURL=../${build.name}-debug/`)

fs.writeFileSync(mapfile.replace('.map', ''), content)

// Copy modern debug package files
pkg.name = path.join(config.npmOrganization, `${build.name}-debug`)
pkg.description = `${pkg.description} (Debug Mappings)`.trim()
pkg.dependencies = {
  'source-map-support': '^0.5.16'
}
pkg.keywords = [build.name, 'debug', 'sourcemap']
delete pkg.scripts
delete pkg.devDependencies
delete pkg.main
delete pkg.directories

fs.writeFileSync(`${outdir}/${build.name}-debug/package.json`, JSON.stringify(pkg, null, 2))

// Add license
fs.copyFileSync('../LICENSE.md', `${outdir}/${build.name}-debug/LICENSE`)

// Add README
fs.writeFileSync(`${outdir}/${build.name}-debug/README.md`, `# ${build.name} ${build.version}\n\nPlease see [${build.homepage}](${build.homepage}).\n\nGenerated on ${(new Date())}.`)


// ---------------------------------------------
// Create modern production package
// ---------------------------------------------
console.log('Creating production package at', `${outdir}/${build.name}`)

prodpkg.name = path.join(config.npmOrganization, build.name)
delete prodpkg.scripts
prodpkg.dependencies = prodpkg.dependencies || {}
prodpkg.devDependencies = prodpkg.devDependencies || {}
prodpkg.devDependencies[`${prodpkg.name}-debug`] = prodpkg.version
prodpkg.type = 'module'

fs.writeFileSync(`${outdir}/${build.name}/package.json`, JSON.stringify(prodpkg, null, 2))
fs.renameSync(mapfile.replace('.map', ''), `${outdir}/${build.name}/index.js`)

// Add license
fs.copyFileSync('../LICENSE.md', `${outdir}/${build.name}/LICENSE`)

// Add README
if (fs.existsSync(path.resolve('../README.md'))) {
  fs.writeFileSync(`${outdir}/${build.name}/README.md`, fs.readFileSync('../README.md'))
} else {
  fs.writeFileSync(`${outdir}/${build.name}/README.md`, `# ${prodpkg.name} ${prodpkg.version}\n\nPlease see [${build.homepage}](${build.homepage}).\n\nGenerated on ${new Date()}.`)
}

