// src/client/hooks/useServers.ts
// Fetches server + tool data from the mcp-storybook dev server
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
}

export function useServers() {
  const [data, setData]       = useState<PlaybookData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchServers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/servers')
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServers()
  }, [fetchServers])

  const refresh = useCallback(async () => {
    try {
      await fetch('/api/refresh', { method: 'POST' })
      await fetchServers()
    } catch {}
  }, [fetchServers])

  return { data, loading, error, refresh }
}
