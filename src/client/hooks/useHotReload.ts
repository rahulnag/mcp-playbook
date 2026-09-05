// src/client/hooks/useHotReload.ts
// Connects to the dev server WebSocket
// When config changes, server broadcasts a reload event
// and this hook triggers a data refresh

import { useEffect } from 'react'

export function useHotReload(onReload: () => void) {
  useEffect(() => {
    // Only connect in dev mode (not in static build)
    if (typeof window === 'undefined') return

    let ws: WebSocket
    let reconnectTimer: ReturnType<typeof setTimeout>

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      ws = new WebSocket(`${protocol}//${window.location.host}`)

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'reload') {
            console.log('[mcp-storybook] Config changed — refreshing...')
            onReload()
          }
        } catch {}
      }

      ws.onclose = () => {
        // Reconnect after 2 seconds if connection drops
        reconnectTimer = setTimeout(connect, 2000)
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    connect()

    return () => {
      clearTimeout(reconnectTimer)
      ws?.close()
    }
  }, [onReload])
}
