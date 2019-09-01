import { terser } from 'rollup-plugin-terser'
import replace from 'rollup-plugin-replace'
import stripCode from  'rollup-plugin-strip-code'
import pkg from './package.json'
import { install } from 'source-map-support'
install()

const input = 'src/main.js'
const outdir = './test/lib'
const createReleaseOutput = process.argv.indexOf('--integration') >= 0

const NODEONLY = {
	start_comment: 'browser-only',
	end_comment: 'end-browser-only'
}
const BROWSERONLY = {
	start_comment: 'node-only',
	end_comment: 'end-node-only'
}

// Development: Standard (Unminified ES6)
export default [{
		input,
		plugins: [
			stripCode({
				start_comment: 'browser-only',
				end_comment: 'end-browser-only'
			}),
			replace({
				delimiters: ['[#', '#]'],
				REPLACE_VERSION: require('./package.json').version
			}),
		],
		output: { file: `${outdir}/ngn.js`, format: 'cjs', sourcemap: true },
	}, {
		input,
		plugins: [
			stripCode(BROWSERONLY),
			replace({
				delimiters: ['[#', '#]'],
				REPLACE_VERSION: require('./package.json').version
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
		output: { file: `${outdir}/ngn.min.js`, format: 'iife', sourcemap: true, name: 'NGN' }
	}
]
