const config = {
  // source: '../src',
  nodeOutput: './tmp/node',
  browserOutput: './tmp/browser',
  testOutput: '../test',
  npmPrefix: '@author.io',
  external: ['os', 'fs', 'http', 'https', 'events']
}

export { config as default }
