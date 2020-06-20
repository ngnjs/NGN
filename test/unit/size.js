import fs from 'fs'
import path from 'path'
import gzip from 'gzip-size'
import brotli from 'brotli-size'

const args = process.argv.slice(2).map(i => path.resolve(i)).filter(i => fs.existsSync(i))

args.forEach(arg => {
  fs.readFile(arg, (err, data) => {
    gzip(data)
      .then(compressed => {
        const uncompressed = fs.statSync(arg).size
        console.log('\n  ' + path.basename(arg) + ':')
        console.log('    - Uncompressed: ' + (uncompressed / 1024).toFixed(2) + 'KB')
        console.log('    - Gzipped     : ' + (compressed / 1024).toFixed(2) + `KB (${((1 - (compressed / uncompressed)) * 100).toFixed(2)}% reduction)`)

        compressed = brotli.sync(data)
        console.log('    - Brotli      : ' + (compressed / 1024).toFixed(2) + `KB (${((1 - (compressed / uncompressed)) * 100).toFixed(2)}% reduction)`)
      })
      .catch(e => console.log(e))
  })
})
