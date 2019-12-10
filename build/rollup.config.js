import buble from 'rollup-plugin-buble'
import {uglify} from 'rollup-plugin-uglify'
import {terser} from 'rollup-plugin-terser'
import ngn from './rollup-plugin-ngn'
// import replace from 'rollup-plugin-replace'
// import stripCode from  'rollup-plugin-strip-code'
import pkg from '../package.json'
import path from 'path'
import fs from 'fs-extra'

const input = path.resolve('../src/main.js')
const outdir = path.resolve('../dist')
const mode = (process.env.MODE || 'test').trim().toLowerCase()
const env = (process.env.ENVIRONMENT || 'node').trim().toLowerCase()

const output = (file, browser = true, sourcemap = true) => {
	return {
		file: mode === 'test' ? '../test/lib' : path.join(outdir, browser ? '/browser' : '/node', file),
		format: browser ? 'iife' : 'cjs',
		name: 'NGN',
		sourcemap
	}
}

// Remove any prior builds
fs.removeSync(outdir)

let configuration = []

// Standard (Minified ES6)
configuration.push({
	input,
	plugins: [ngn({ browserOnly: env === 'browser', package: `${outdir}/${env === 'node' ? 'node' : 'browser'}` }), terser()],
	output: output(env === 'node' ? 'index.js' : 'ngn.min.js')
})

// Legacy (Transpiled & Minified ES5)
// This is only relevant to browsers.
if (env === 'browser') {
	configuration.push({
		input,
		plugins: [ngn({ browserOnly: true }), buble(), uglify()],
		output: output('ngn.es5.min.js')
	})

	// Development: Standard (Unminified ES6)
	configuration.push({
		input,
		plugins: [ngn({ browserOnly: true })],
		output: output('ngn.js')
	})

	// Development: Legacy (Transpiled & Unminified ES5)
	configuration.push({
		input,
		plugins: [ngn({ browserOnly: true }), buble()],
		output: output('ngn.es5.js')
	})
}

export default configuration