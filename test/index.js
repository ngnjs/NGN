import fs from 'fs'
import path from 'path'
import eslint from 'eslint'
import compat from 'eslint-plugin-compat'

const srcFile = '/Users/cbutler/Workspace/Ventures/Author.io/Software/Libraries/NGN/ngn/build/tmp/browser/browser-ngn/ngn-2.0.0.min.js'
const src = fs.readFileSync(srcFile).toString()
const { Linter } = eslint
const linter = new Linter()
const messages = linter.verify(src, compat.config, path.basename(srcFile))

console.log(messages)
