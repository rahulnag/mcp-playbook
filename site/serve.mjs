/**
 * site/serve.mjs
 *
 * Tiny static server to preview site-dist/ locally — no extra dependencies.
 * Run:  npm run site:preview
 */

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir  = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../site-dist')
const port = Number(process.env.PORT) || 4300

const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
}

if (!fs.existsSync(dir)) {
  console.error('\n  site-dist/ not found. Run: npm run site:build\n')
  process.exit(1)
}

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  let file = path.join(dir, urlPath)
  if (!file.startsWith(dir)) { res.writeHead(403).end(); return }

  // /playground → /playground/ so relative asset URLs resolve correctly
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!urlPath.endsWith('/')) { res.writeHead(301, { Location: urlPath + '/' }).end(); return }
    file = path.join(file, 'index.html')
  }
  if (!fs.existsSync(file)) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found'); return }

  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
}).listen(port, () => {
  console.log(`\n  Docs:        http://localhost:${port}/`)
  console.log(`  Playground:  http://localhost:${port}/playground/\n`)
})
