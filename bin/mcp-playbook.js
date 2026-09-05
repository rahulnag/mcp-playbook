#!/usr/bin/env node
'use strict'

// CommonJS entry point — works without type:module
// Delegates to the compiled CLI

const path = require('path')
const fs   = require('fs')

const distCli = path.join(__dirname, '../dist/cli/index.js')

if (!fs.existsSync(distCli)) {
  console.error('\n  mcp-playbook: dist/ not found.')
  console.error('  The package was not built before publishing.')
  console.error('  If you are developing locally, run: npm run build\n')
  process.exit(1)
}

// Use require for CJS build output from tsup
require(distCli).run().catch(err => {
  console.error('Failed to start mcp-playbook:', err.message)
  process.exit(1)
})
