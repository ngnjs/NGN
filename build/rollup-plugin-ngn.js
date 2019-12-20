import fs from 'fs'
import path from 'path'
import stripCode from 'rollup-plugin-strip-code'
import replace from 'rollup-plugin-replace'
// import utils from '@rollup/pluginutils'

const NODEONLY = {
  start_comment: 'browser-only',
  end_comment: 'end-browser-only'
}
const BROWSERONLY = {
  start_comment: 'node-only',
  end_comment: 'end-node-only'
}

export default class ngn {
  constructor(opts = {}) {
    this.name = 'ngn'
    this.manifest = null
  }

  get pkg () {
    if (this.manifest === null) {
      this.pkg = '../package.json'
    }

    return this.manifest
  }

  set pkg (pkgpath) {
    let file = path.resolve(pkgpath)
    let content = fs.readFileSync(file).toString()
    this.manifest = JSON.parse(content)
  }

  get version () {
    return this.pkg.version
  }

  get NODEONLY () {
    return NODEONLY
  }

  get BROWSERONLY() {
    return BROWSERONLY
  }

  only (env) {
    return stripCode(env === 'node' ? NODEONLY : BROWSERONLY)
  }

  applyVersion (version) {
    return replace({
      delimiters: ['<#', '#>'],
      REPLACE_VERSION: version
    })
  }
}

    // this.worker = new utils.Worker(require.resolve("./transform.js"), {
    //   numWorkers: userOptions.numWorkers
    // })
  // renderChunk (code, chunk, outputOptions) {
  //   if (!filter(chunk.fileName)) {
  //     return null;
  //   }

  //   if (!this.worker) {
  //     ;

  //     this.numOfBundles = 0;
  //   }

  //   this.numOfBundles++;

  //   // TODO rewrite with object spread after node6 drop
  //   const normalizedOptions = Object.assign({}, userOptions, {
  //     sourceMap: userOptions.sourcemap !== false,
  //     module: outputOptions.format === "es" || outputOptions.format === "esm"
  //   });

  //   for (let key of ["include", "exclude", "sourcemap", "numWorkers"]) {
  //     if (normalizedOptions.hasOwnProperty(key)) {
  //       delete normalizedOptions[key];
  //     }
  //   }

  //   const serializedOptions = serialize(normalizedOptions);

  //   const result = this.worker
  //     .transform(code, serializedOptions)
  //     .catch(error => {
  //       const { message, line, col: column } = error;
  //       console.error(
  //         codeFrameColumns(code, { start: { line, column } }, { message })
  //       );
  //       throw error;
  //     });

  //   const handler = () => {
  //     this.numOfBundles--;

  //     if (this.numOfBundles === 0) {
  //       this.worker.end();
  //       this.worker = 0;
  //     }
  //   };

  //   result.then(handler, handler);

  //   return result;
  // }