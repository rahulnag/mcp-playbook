import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'index':             'src/index.ts',
    'cli/index':         'src/cli/index.ts',
    'server/dev-server': 'src/server/dev-server.ts',
    'server/build':      'src/server/build.ts',
    'server/connector':  'src/server/connector.ts',
  },

  // Output BOTH formats
  // bin uses CJS (require), library users can use ESM
  format:    ['cjs', 'esm'],
  dts:       true,
  sourcemap: true,
  clean:     true,
  target:    'node18',
  platform:  'node',
  splitting: false,
  outDir:    'dist',

  external: [
    '@modelcontextprotocol/sdk',
    'chalk', 'chokidar', 'commander',
    'express', 'open', 'ora', 'ws',
    'react', 'react-dom'
  ]
})
