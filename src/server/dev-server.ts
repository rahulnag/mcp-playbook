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
import { loadConfig } from './load-config.js'
import type { PlaybookConfig } from '../config.js'

interface DevServerOptions {
  port?:      number   // --port flag; falls back to config.port, then 4242
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
  <title>MCP Playbook</title>
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
  <h2 style="margin:0">MCP Playbook API is running</h2>
  <p>The React UI bundle was not found at <code>dist/client/</code></p>
  <p>Run <code>npm run build:client</code> inside the mcp-playbook library to build it.</p>
  <p>API available at <code>http://localhost:${port}/api/servers</code></p>
</body>
</html>`
}

export async function startDevServer(options: DevServerOptions) {
  const app    = express()
  const server = createServer(app)
  const wss    = new WebSocketServer({ server })

  // ws re-emits the http server's errors (e.g. EADDRINUSE) on the WebSocketServer.
  // Without a listener that crashes the process — listenOnFreePort() handles them.
  wss.on('error', () => {})

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

  // ── Discover servers ────────────────────────────────────────────
  let cachedServers: Awaited<ReturnType<typeof discoverAllServers>> = []
  let cachedConfig:  PlaybookConfig | null = null

  // Only one discovery runs at a time. Requests that arrive mid-refresh are
  // folded into a single follow-up run instead of stacking up.
  let refreshing: Promise<void> | null = null
  let refreshQueued = false

  async function refreshServers(): Promise<void> {
    if (refreshing) {
      refreshQueued = true
      return refreshing
    }
    refreshing = doRefresh().finally(() => { refreshing = null })
    await refreshing
    if (refreshQueued) {
      refreshQueued = false
      await refreshServers()
    }
  }

  async function doRefresh() {
    try {
      const config   = await loadConfig(options.configPath)
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
        title:       cachedConfig?.title       || 'MCP Playbook',
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
    const { serverId, toolName, input } = req.body || {}
    if (!cachedConfig) return res.status(503).json({ error: 'Config not loaded' })
    if (typeof serverId !== 'string' || typeof toolName !== 'string') {
      return res.status(400).json({ error: 'serverId and toolName must be strings' })
    }

    const idx          = parseInt(serverId.replace('server-', ''))
    const serverConfig = cachedConfig.servers[idx]
    if (!serverConfig) return res.status(404).json({ error: `Server not found: ${serverId}` })

    try {
      res.json(await executeTool(serverConfig, toolName, input || {}))
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  // Fallback — serve index.html for SPA routing
  app.get('*', (_req, res) => {
    const indexPath = path.join(clientDist, 'index.html')
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath)
    } else {
      res.send(fallbackHTML(port))
    }
  })

  // ── WebSocket ───────────────────────────────────────────────────
  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'connected' }))
  })

  // ── Config watcher ──────────────────────────────────────────────
  // Editors often fire several change events per save — debounce them
  const watcher = chokidar.watch(options.configPath, { ignoreInitial: true })
  let changeTimer: ReturnType<typeof setTimeout> | undefined
  watcher.on('change', () => {
    clearTimeout(changeTimer)
    changeTimer = setTimeout(() => {
      console.log(chalk.dim('\n  Config changed — refreshing...'))
      refreshServers()
    }, 150)
  })

  // ── Start ───────────────────────────────────────────────────────
  // If the port is taken (often an older `mcp-playbook dev` still running),
  // try the next few ports instead of failing — same behaviour as Vite.
  async function listenOnFreePort(start: number, attempts = 10): Promise<number> {
    for (let p = start; p < start + attempts; p++) {
      try {
        await new Promise<void>((resolve, reject) => {
          const onError = (err: Error) => { server.off('listening', onListening); reject(err) }
          const onListening = () => { server.off('error', onError); resolve() }
          server.once('error', onError)
          server.once('listening', onListening)
          server.listen(p)
        })
        return p
      } catch (err: any) {
        if (err.code !== 'EADDRINUSE') throw err
        console.log(chalk.yellow(`  Port ${p} is in use, trying ${p + 1}...`))
      }
    }
    throw new Error(
      `Ports ${start}-${start + attempts - 1} are all in use. Try: --port <number>`
    )
  }

  // Load the config before listening: a broken config should stop startup
  // with a clear error, not print a "Local:" URL for an empty playbook.
  const initialConfig = await loadConfig(options.configPath)
  const port = await listenOnFreePort(options.port ?? initialConfig.port ?? 4242)

  await refreshServers()

  const url = `http://localhost:${port}`
  console.log(chalk.dim(`\n  Local:   `) + chalk.cyan(url))
  console.log(chalk.dim(`  Config:  ${options.configPath}\n`))

  if (options.open && hasClient) {
    try { await open(url) } catch {}
  }

  return server
}
