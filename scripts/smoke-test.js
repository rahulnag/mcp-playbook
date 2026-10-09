#!/usr/bin/env node
'use strict'

// End-to-end smoke test: builds the static site for the bundled example and
// checks the example MCP server was reached and its tools were discovered.
// Run after `npm run build`:  npm test

const { execFileSync } = require('child_process')
const fs   = require('fs')
const os   = require('os')
const path = require('path')

const root   = path.join(__dirname, '..')
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-playbook-smoke-'))

try {
  execFileSync(process.execPath, [
    path.join(root, 'bin/mcp-playbook.js'), 'build',
    '--config', 'example/playbook.config.ts',
    '--output', outDir
  ], { cwd: root, stdio: 'inherit' })

  for (const file of ['index.html', 'data.json']) {
    if (!fs.existsSync(path.join(outDir, file))) throw new Error(`build output is missing ${file}`)
  }

  const data   = JSON.parse(fs.readFileSync(path.join(outDir, 'data.json'), 'utf8'))
  const server = data.servers[0]
  if (server.status !== 'connected') throw new Error(`example server did not connect: ${server.error}`)
  if (server.tools.length === 0)     throw new Error('no tools discovered from the example server')

  console.log(`\n  ✓ Smoke test passed — ${server.tools.length} tools discovered\n`)
} catch (err) {
  console.error(`\n  ✗ Smoke test failed: ${err.message}\n`)
  process.exitCode = 1
} finally {
  fs.rmSync(outDir, { recursive: true, force: true })
}
