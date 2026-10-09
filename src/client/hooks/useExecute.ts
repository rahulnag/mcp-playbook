// src/client/hooks/useExecute.ts
// Calls POST /api/execute to run a real tool call against the MCP server
// Returns the result, timing, and any error

import { useState, useCallback } from 'react'

export interface ExecuteResult {
  result:      unknown
  duration_ms: number
  error?:      string
}

export function useExecute() {
  const [running, setRunning]   = useState(false)
  const [result, setResult]     = useState<ExecuteResult | null>(null)

  const execute = useCallback(async (
    serverId: string,
    toolName: string,
    input:    Record<string, unknown>
  ) => {
    setRunning(true)
    setResult(null)

    try {
      const res = await fetch('api/execute', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ serverId, toolName, input })
      })

      const data: ExecuteResult = await res.json()
      setResult(data)
    } catch (err: any) {
      setResult({ result: null, duration_ms: 0, error: err.message })
    } finally {
      setRunning(false)
    }
  }, [])

  const clear = useCallback(() => setResult(null), [])

  return { execute, running, result, clear }
}
