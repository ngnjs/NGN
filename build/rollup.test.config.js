import { terser } from 'rollup-plugin-terser'
import replace from 'rollup-plugin-replace'
import stripCode from  'rollup-plugin-strip-code'
import pkg from '../package.json'
import path from 'path'
import { install } from 'source-map-support'
install()

const input = path.resolve('../src/main.js')
const outdir = path.resolve('../test/lib')
const mode = process.env.MODE
const env = process.env.ENVIRONMENT

const NODEONLY = {
	start_comment: 'browser-only',
	end_comment: 'end-browser-only'
}
const BROWSERONLY = {
	start_comment: 'node-only',
	end_comment: 'end-node-only'
}

let configuration = []

// Development: Standard (Unminified ES6+)
configuration.push({
	input,
	plugins: [
		stripCode(env === 'node' ? NODEONLY : BROWSERONLY),
		replace({
			delimiters: ['[#', '#]'],
			REPLACE_VERSION: pkg.version
		}),
	],
	output: {
		file: `${outdir}/ngn.js`,
		format: 'cjs',
		sourcemap: true
	}
})

// Compressed (Minified ES6+) if a release should be created.
switch (mode.trim().toLowerCase()) {
	case 'release':
		configuration.push({
			input,
			plugins: [
				stripCode(env === 'node' ? NODEONLY : BROWSERONLY),
				replace({
					delimiters: ['[#', '#]'],
					REPLACE_VERSION: pkg.version
				}),
				terser({
					mangle: {
						properties: true
					},
					compress: {
						drop_console: true,
						passes: 2,
						warnings: true,
						ecma: 6
					}
				})
			],
			output: {
				file: `${outdir}/ngn.min.js`,
				format: 'iife',
				sourcemap: true,
				name: 'NGN'
			}
		})
		break
}

export default configuration