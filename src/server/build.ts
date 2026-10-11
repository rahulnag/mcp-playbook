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
import { loadConfig } from './load-config.js'
import type { PlaybookConfig } from '../config.js'

interface BuildOptions {
  outputDir:  string
  configPath: string
}

export async function buildStaticSite(options: BuildOptions) {
  const config = await loadConfig(options.configPath)

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
  // Compiled layout: dist/cli/index.js or dist/server/build.js → dist/client
  const clientDist = path.join(__dirname, '../client')

  if (!fs.existsSync(path.join(clientDist, 'index.html'))) {
    throw new Error(`UI bundle not found at ${clientDist} — the package was published without dist/client`)
  }
  copyDir(clientDist, options.outputDir)

  // Fill the page title and link-preview tags from the config
  const indexPath = path.join(options.outputDir, 'index.html')
  fs.writeFileSync(indexPath, applyPageMeta(fs.readFileSync(indexPath, 'utf8'), config))

  const toolCount = servers.reduce((acc, s) => acc + s.tools.length, 0)
  console.log(`  ${servers.length} servers, ${toolCount} tools documented`)
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function applyPageMeta(html: string, config: PlaybookConfig): string {
  const title       = escapeHtml(config.title || 'MCP Playbook')
  const description = config.description ? escapeHtml(config.description) : null
  const siteUrl     = config.siteUrl?.replace(/\/+$/, '')
  // Social crawlers need an absolute image URL; fall back to relative without siteUrl
  const image       = siteUrl ? `${siteUrl}/og-image.png` : 'og-image.png'

  const setMeta = (attr: string, key: string, value: string) => {
    html = html.replace(
      new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`),
      (_m, start, end) => start + value + end
    )
  }

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
  setMeta('property', 'og:title',  title)
  setMeta('name', 'twitter:title', title)
  if (description) {
    setMeta('name', 'description',         description)
    setMeta('property', 'og:description',  description)
    setMeta('name', 'twitter:description', description)
  }
  setMeta('property', 'og:image',  image)
  setMeta('name', 'twitter:image', image)
  if (siteUrl) {
    html = html.replace('<meta property="og:type"', `<meta property="og:url" content="${escapeHtml(siteUrl)}/" />\n    <meta property="og:type"`)
  }
  return html
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
