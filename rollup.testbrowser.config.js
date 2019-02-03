import buble from 'rollup-plugin-buble'
import {uglify} from 'rollup-plugin-uglify'
import {terser} from 'rollup-plugin-terser'
import replace from 'rollup-plugin-replace'
import stripCode from  'rollup-plugin-strip-code'
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
			start_comment: 'node-only',
			end_comment: 'end-node-only'
		}),
		replace({
			delimiters: ['[#', '#]'],
			REPLACE_VERSION: require('./package.json').version
		}),
		buble(),
		uglify()
	],
	output: [
		{ file: `${outdir}/ngn.js`, format: 'iife', sourcemap: true }
	]
}]
