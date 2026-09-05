#!/usr/bin/env node
'use strict'

// Runs automatically after npm install
// Prints next steps so the developer knows what to do

const isInsideNodeModules = __dirname.includes('node_modules')
if (isInsideNodeModules) process.exit(0)

console.log('\n  ⚡ mcp-playbook installed successfully')
console.log('\n  Get started:')
console.log('    npx mcp-playbook init   — create playbook.config.ts')
console.log('    npx mcp-playbook dev    — start the dev server')
console.log('    npx mcp-playbook build  — build static docs site\n')
