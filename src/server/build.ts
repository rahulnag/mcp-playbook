/**
 * src/server/build.ts
 *
 * Builds a static documentation site from the MCP servers.
 *
 * Output:
 *   playbook-dist/
 *     index.html
 *     assets/
 *     data.json    ← all server/tool data baked in at build time
 *
 * This lets teams deploy their MCP docs to:
 *   - GitHub Pages
 *   - Vercel
 *   - Netlify
 *   - Any static host
 *
 * Users run: mcp-playbook build
 */

import fs from 'fs'
import path from 'path'
import { discoverAllServers } from './connector.js'
import type { PlaybookConfig } from '../config.js'

interface BuildOptions {
  outputDir:  string
  configPath: string
}

export async function buildStaticSite(options: BuildOptions) {
  // Load config
  const configModule = await import(options.configPath)
  const config: PlaybookConfig = configModule.default

  // Connect to all servers and discover tools
  const servers = await discoverAllServers(
    config.servers,
    config.examples || {},
    config.tags     || {}
  )

  // Create output directory
  fs.mkdirSync(options.outputDir, { recursive: true })

  // Write the data file — the static site reads this instead of hitting the API
  const data = {
    title:       config.title       || 'MCP Playbook',
    description: config.description || '',
    theme:       config.theme       || {},
    builtAt:     new Date().toISOString(),
    servers
  }

  fs.writeFileSync(
    path.join(options.outputDir, 'data.json'),
    JSON.stringify(data, null, 2)
  )

  // Copy the static UI bundle
  const clientDist = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    '../../dist/client'
  )

  if (fs.existsSync(clientDist)) {
    copyDir(clientDist, options.outputDir)
  }

  const toolCount = servers.reduce((acc, s) => acc + s.tools.length, 0)
  console.log(`  ${servers.length} servers, ${toolCount} tools documented`)
}

function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath  = path.join(src,  entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}
