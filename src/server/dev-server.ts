/**
 * src/server/dev-server.ts
 *
 * The development server.
 * Serves the React UI + REST API + WebSocket hot reload.
 */

import express    from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import path       from 'path'
import fs         from 'fs'
import chalk      from 'chalk'
import chokidar   from 'chokidar'
import open       from 'open'
import { discoverAllServers, executeTool } from './connector.js'
import type { PlaybookConfig } from '../config.js'

interface DevServerOptions {
  port:       number
  configPath: string
  open:       boolean
}

// ── Resolve client dist path robustly ───────────────────────────────
// Works both when run from source (via ts-node) and from compiled dist/
function resolveClientDist(): string {
  // __dirname in CJS = directory of the compiled file
  // When compiled: dist/server/dev-server.js → dist/client/
  const fromCompiled = path.join(__dirname, '../client')
  if (fs.existsSync(fromCompiled)) return fromCompiled

  // Fallback: look relative to package root
  const fromRoot = path.join(__dirname, '../../dist/client')
  if (fs.existsSync(fromRoot)) return fromRoot

  return fromCompiled // return anyway — will be checked later
}

// ── Minimal fallback HTML when client is not built ───────────────────
function fallbackHTML(port: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>MCP Storybook</title>
  <style>
    body { font-family: monospace; background: #080808; color: #e2e0d8;
           display: flex; align-items: center; justify-content: center;
           height: 100vh; margin: 0; flex-direction: column; gap: 12px; }
    code { background: #1a1a2e; color: #a39cf0; padding: 4px 10px;
           border-radius: 4px; font-size: 14px; }
    p    { color: #5a5856; font-size: 13px; }
  </style>
</head>
<body>
  <div style="font-size:32px">⚡</div>
  <h2 style="margin:0">MCP Storybook API is running</h2>
  <p>The React UI bundle was not found at <code>dist/client/</code></p>
  <p>Run <code>npm run build:client</code> inside the mcp-storybook library to build it.</p>
  <p>API available at <code>http://localhost:${port}/api/servers</code></p>
</body>
</html>`
}

export async function startDevServer(options: DevServerOptions) {
  const app    = express()
  const server = createServer(app)
  const wss    = new WebSocketServer({ server })

  app.use(express.json())

  // ── Serve static client bundle ──────────────────────────────────
  const clientDist = resolveClientDist()
  const hasClient  = fs.existsSync(path.join(clientDist, 'index.html'))

  if (hasClient) {
    app.use(express.static(clientDist))
    console.log(chalk.dim(`  Client: serving from ${clientDist}`))
  } else {
    console.log(chalk.yellow(`  Warning: client bundle not found at ${clientDist}`))
    console.log(chalk.dim('  API is available but UI will show a placeholder'))
  }

  // ── Config loader ───────────────────────────────────────────────
  async function loadConfig(): Promise<PlaybookConfig> {
    // Clear module cache for hot reload
    const key = require.resolve(options.configPath)
    delete require.cache[key]

    // Try TypeScript config via ts-node/register if available
    try {
      return require(options.configPath).default
    } catch {
      // ts-node not available — try pre-compiled JS version
      const jsPath = options.configPath.replace(/\.ts$/, '.js')
      if (fs.existsSync(jsPath)) {
        delete require.cache[require.resolve(jsPath)]
        return require(jsPath).default
      }
      throw new Error(
        `Cannot load config: ${options.configPath}\n` +
        `  Make sure ts-node is installed: npm install -D ts-node\n` +
        `  Or compile your config to JS first.`
      )
    }
  }

  // ── Discover servers ────────────────────────────────────────────
  let cachedServers: Awaited<ReturnType<typeof discoverAllServers>> = []
  let cachedConfig:  PlaybookConfig | null = null

  async function refreshServers() {
    try {
      const config   = await loadConfig()
      cachedConfig   = config
      cachedServers  = await discoverAllServers(
        config.servers,
        config.examples || {},
        config.tags     || {}
      )
      const connected = cachedServers.filter(s => s.status === 'connected').length
      const tools     = cachedServers.reduce((acc, s) => acc + s.tools.length, 0)
      console.log(chalk.green(`  ✓ ${connected}/${cachedServers.length} servers · ${tools} tools`))
      broadcastToClients({ type: 'reload' })
    } catch (err: any) {
      console.error(chalk.red(`  ✗ ${err.message}`))
    }
  }

  function broadcastToClients(data: unknown) {
    const msg = JSON.stringify(data)
    wss.clients.forEach(c => { if (c.readyState === 1) c.send(msg) })
  }

  // ── REST API ────────────────────────────────────────────────────

  app.get('/api/servers', async (_req, res) => {
    try {
      res.json({
        title:       cachedConfig?.title       || 'MCP Storybook',
        description: cachedConfig?.description || '',
        theme:       cachedConfig?.theme       || {},
        servers:     cachedServers
      })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  app.post('/api/refresh', async (_req, res) => {
    await refreshServers()
    res.json({ ok: true })
  })

  app.post('/api/execute', async (req, res) => {
    const { serverId, toolName, input } = req.body
    if (!cachedConfig) return res.status(503).json({ error: 'Config not loaded' })

    const idx          = parseInt(serverId.replace('server-', ''))
    const serverConfig = cachedConfig.servers[idx]
    if (!serverConfig) return res.status(404).json({ error: `Server not found: ${serverId}` })

    const result = await executeTool(serverConfig, toolName, input || {})
    res.json(result)
  })

  // Fallback — serve index.html for SPA routing
  app.get('*', (_req, res) => {
    const indexPath = path.join(clientDist, 'index.html')
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath)
    } else {
      res.send(fallbackHTML(options.port))
    }
  })

  // ── WebSocket ───────────────────────────────────────────────────
  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'connected' }))
  })

  // ── Config watcher ──────────────────────────────────────────────
  const watcher = chokidar.watch(options.configPath, { ignoreInitial: true })
  watcher.on('change', () => {
    console.log(chalk.dim('\n  Config changed — refreshing...'))
    refreshServers()
  })

  // ── Start ───────────────────────────────────────────────────────
  await new Promise<void>((resolve, reject) => {
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${options.port} is already in use. Try: --port ${options.port + 1}`))
      } else {
        reject(err)
      }
    })
    server.listen(options.port, () => resolve())
  })

  await refreshServers()

  const url = `http://localhost:${options.port}`
  console.log(chalk.dim(`\n  Local:   `) + chalk.cyan(url))
  console.log(chalk.dim(`  Config:  ${options.configPath}\n`))

  if (options.open && hasClient) {
    try { await open(url) } catch {}
  }

  return server
}
