import buble from 'rollup-plugin-buble'
import {uglify} from 'rollup-plugin-uglify'
import {terser} from 'rollup-plugin-terser'
import ngn from '@author.io/rollup-plugin-ngn'
// import replace from 'rollup-plugin-replace'
// import stripCode from  'rollup-plugin-strip-code'
import pkg from './package.json'

const input = 'src/main.js'
const outdir = 'dist'
const path = require('path')
const fs = require('fs-extra')

const output = (file, browser = true, sourcemap = true) => {
	return {
		file: path.join(outdir, browser ? '/browser' : '/node', file),
		format: browser ? 'iife' : 'cjs',
		sourcemap
	}
}

// Remove any prior builds
fs.removeSync(path.resolve(outdir))

export default [
	// Standard (Minified ES6)
	{
		input,
		plugins: [ngn({browserOnly: true, package: `${outdir}/browser`}), terser()],
		output: output('ngn.min.js')
	}, {
		input,
		plugins: [ngn({nodeOnly: true, package: `${outdir}/node`}), terser()],
		// TODO: Add package.json pieces, .npmignore, README, etc. Make sure only newer versions of node are supported
		output: output('index.js', false)
	},

	// Legacy (Transpiled & Minified ES5)
	// This is only relevant to browsers.
	{
		input,
		plugins: [ngn({browserOnly: true}), buble(), uglify()],
		output: output('ngn.es5.min.js')
	},

	// Development: Standard (Unminified ES6)
	{
		input,
		plugins: [ngn({browserOnly: true})],
		output: output('ngn.js')
	},
	// {
	// 	input,
	// 	plugins: [ngn({nodeOnly: true, debugVersion: true})],
	// 	output: output('debug.js', false)
	// },

	// Development: Legacy (Transpiled & Unminified ES5)
	// This is only relevant to browsers.
	{
		input,
		plugins: [ngn({browserOnly: true}), buble()],
		output: output('ngn.es5.js')
	}
]
