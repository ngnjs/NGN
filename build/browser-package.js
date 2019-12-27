console.log('TODO: Browser packaging.')
// import fs from 'fs'
// import path from 'path'
// import config from './config.js'
// import NgnPlugin from './rollup-plugin-ngn.js'

// let ngn = new NgnPlugin()
// let outdir = config.browserOutput + '/node-ngn'
// let mapfile = `${outdir}/${ngn.name}-${ngn.version}.min.js.map`

// // Read the package file
// let pkgContent = fs.readFileSync('../package.json').toString()
// let pkg = JSON.parse(pkgContent)

// // Create the debug package
// console.log('Creating debug npm package for browser runtimes.')
// fs.mkdirSync(`${outdir}-debug`)

// fs.renameSync(mapfile, `${outdir}-debug/${ngn.name}-${ngn.version}.min.js.map`)

// // Update the source map URL
// let content = fs.readFileSync(mapfile.replace('.map', ''))
//   .toString()
//   .replace(/\/+#\s+?sourceMappingURL=/, '//# sourceMappingURL=../node-ngn-debug/')

// fs.writeFileSync(mapfile.replace('.map', ''), content)

// // Copy debug package files
// pkg.name = path.join(config.npmPrefix, `node-${ngn.name}-debug`)
// pkg.description = `${pkg.description} (Debug Mappings)`.trim()
// pkg.dependencies = {}
// pkg.devDependencies = {
//   'source-map-support': '^0.5.16'
// }
// pkg.scripts = {}
// pkg.keywords = [ngn.name, 'debug', 'sourcemap']
// fs.writeFileSync(`${outdir}-debug/package.json`, JSON.stringify(pkg, null, 2))

// // Add license
// fs.copyFileSync('../LICENSE', `${outdir}-debug/LICENSE`)

// // Add README
// fs.writeFileSync(`${outdir}-debug/README.md`, `# ${pkg.name} ${pkg.version}\n\nPlease see [${pkg.homepage}](${pkg.homepage}).\n\nGenerated on ${(new Date())}.`)

// // Create production package for node
// console.log('Creating production npm package for Node.js')
// pkg.name = path.join(config.npmPrefix, `node-${ngn.name}`)
// let prodpkg = Object.assign({}, pkg)
// prodpkg.main = 'index.js'
// prodpkg.devDependencies = prodpkg.devDependencies || {}
// prodpkg.devDependencies[`${pkg.name}-debug`] = pkg.version

// fs.writeFileSync(`${outdir}/package.json`, JSON.stringify(prodpkg, null, 2))
// fs.renameSync(mapfile.replace('.map', ''), `${outdir}/index.js`)

// // Add license
// fs.copyFileSync('../LICENSE', `${outdir}/LICENSE`)

// // Add README
// fs.writeFileSync(`${outdir}/README.md`, `# ${prodpkg.name} ${prodpkg.version}\n\nPlease see [${pkg.homepage}](${pkg.homepage}).\n\nGenerated on ${new Date()}.`)
