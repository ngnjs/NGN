// Used to configure deployment of the static documentation API.
const fs = require('fs')
const path = require('path')

// Returns a Set that can be iterated over
const walk = directory => {
	let paths = new Set()

	fs.readdirSync(directory, { withFileTypes: true }).forEach(dir => {
		if (dir.isDirectory()) {
			let relativePath = path.join('./', dir.name)
			let absolutePath = path.join(directory, relativePath)

			paths.add(relativePath)

			walk(absolutePath).forEach(value => paths.add(path.join(relativePath, value)))
		}
	})

	return paths
}

// Walk through the output directory and generate redirect file for netlify
// walk(process.argv)
let output = path.resolve(process.argv.pop())

try {
	fs.accessSync(output, fs.constants.W_OK)

	let redirects = ['/ /index.json']
	walk(output).forEach(dir => {
		dir = dir.replace(path.sep, '/')
		redirects.push(`/${dir}/ /${dir}/index.json`)
	})

	if (redirects.length > 0) {
		fs.writeFileSync(path.join(output, '_redirects'), redirects.join('\n'))
	}

	console.log(`Wrote the following redirects:\n\n${redirects.join('\n')}`);
} catch (e) {
	console.log(e);
	throw new Error(`Cannot write to ${output}`)
}
