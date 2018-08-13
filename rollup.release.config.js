import buble from 'rollup-plugin-buble'
import {uglify} from 'rollup-plugin-uglify'
import {terser} from 'rollup-plugin-terser'
import stripCode from  'rollup-plugin-strip-code'
import pkg from './package.json'

const input = 'src/main.js'
const outdir = './dist'
const standard = `${outdir}/standard`
const legacy = `${outdir}/legacy`
const NODEONLY = {
	start_comment: 'browser-only',
	end_comment: 'end-browser-only'
}
const BROWSERONLY = {
	start_comment: 'node-only',
	end_comment: 'end-node-only'
}

export default [
	// Standard (Minified ES6)
	{
		input,
		plugins: [
			stripCode(BROWSERONLY),
			terser()
		],
		output: [
			{ file: `${standard}/browser/ngn.min.js`, format: 'iife', sourcemap: true }
		]
	}, {
		input,
		plugins: [
			stripCode(NODEONLY),
			terser()
		],
		output: [
			// TODO: Add package.json pieces, .npmignore, README, etc. Make sure only newer versions of node are supported.
			{ file: `${standard}/node/index.js`, format: 'cjs', sourcemap: true }
		]
	},

	// Legacy (Transpiled & Minified ES5)
	// This is only relevant to browsers.
	{
		input,
		plugins: [
			stripCode(BROWSERONLY),
			buble(),
			uglify()
		],
		output: [
			{ file: `${legacy}/ngn.min.js`, format: 'iife', sourcemap: true }
		]
	},

	// Development: Standard (Unminified ES6)
	{
		input,
		plugins: [
			stripCode(BROWSERONLY)
		],
		output: [
			{ file: `${standard}/browser/ngn.js`, format: 'iife', sourcemap: true },
		]
	}, {
		input,
		plugins: [
			stripCode(NODEONLY)
		],
		output: [
			{ file: `${standard}/node/debug.js`, format: 'cjs', sourcemap: true }
		]
	},

	// Development: Legacy (Transpiled & Unminified ES5)
	// This is only relevant to browsers.
	{
		input,
		plugins: [
			stripCode(BROWSERONLY)
		],
		output: [
			{ file: `${legacy}/ngn.js`, format: 'iife', sourcemap: true }
		]
	}
]
