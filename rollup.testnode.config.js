import stripCode from  'rollup-plugin-strip-code'
import replace from 'rollup-plugin-replace'
import pkg from './package.json'
import { install } from 'source-map-support'
install()

const input = 'src/main.js'
const outdir = './test/lib'

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
	output: [
		{ file: `${outdir}/ngn.js`, format: 'cjs', sourcemap: true },
	]
}]
