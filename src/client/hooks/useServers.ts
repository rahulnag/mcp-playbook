// src/client/hooks/useServers.ts
// Fetches server + tool data from the mcp-playbook dev server
// GET /api/servers — returns all discovered MCP servers and their tools

import { useState, useEffect, useCallback } from 'react'

export interface ToolExample {
  label:          string
  description?:  string
  input:          Record<string, unknown>
  expectedOutput?: unknown
}

export interface DiscoveredTool {
  name:        string
  description: string
  inputSchema: {
    type:       string
    properties: Record<string, {
      type:        string
      description: string
      enum?:       string[]
      default?:    unknown
    }>
    required:   string[]
  }
  examples: ToolExample[]
  tags:     string[]
}

export interface DiscoveredServer {
  id:      string
  name:    string
  url:     string
  status:  'connected' | 'disconnected' | 'error'
  version: string
  tools:   DiscoveredTool[]
  error?:  string
}

export interface PlaybookData {
  title:       string
  description: string
  theme:       { primary?: string }
  servers:     DiscoveredServer[]
  /** true when served as a static site from `mcp-playbook build` (no live server) */
  static?:     boolean
}

// Dev server answers /api/servers; a static build ships data.json instead.
// Static hosts often rewrite unknown paths to index.html, so check it's JSON.
async function fetchJSON(url: string): Promise<any | null> {
  const res = await fetch(url)
  const isJSON = res.headers.get('content-type')?.includes('application/json')
  return res.ok && isJSON ? res.json() : null
}

export function useServers() {
  const [data, setData]       = useState<PlaybookData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // silent = refetch in the background without flipping the UI into "Connecting..."
  const fetchServers = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      setError(null)
      const live = await fetchJSON('api/servers').catch(() => null)
      if (live) return setData(live)

      const built = await fetchJSON('data.json').catch(() => null)
      if (built) return setData({ ...built, static: true })

      throw new Error('Could not load /api/servers or data.json')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServers()
  }, [fetchServers])

  // Manual refresh — asks the server to reconnect to every MCP server
  const refresh = useCallback(async () => {
    try {
      await fetch('api/refresh', { method: 'POST' })
      await fetchServers()
    } catch {}
  }, [fetchServers])

  // Hot reload — the server has already re-discovered, so just re-read the data.
  // Must NOT call /api/refresh: that broadcasts another reload and loops forever.
  const reload = useCallback(() => fetchServers(true), [fetchServers])

  return { data, loading, error, refresh, reload }
}
