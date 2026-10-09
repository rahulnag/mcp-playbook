/**
 * src/server/connector.ts
 *
 * Connects to MCP servers and discovers their tools.
 * This is the bridge between the user's MCP servers and
 * the Playbook UI.
 *
 * Supports:
 *   - stdio transport (spawn a process, talk over stdin/stdout)
 *   - HTTP / SSE transport (connect to a running server)
 *
 * Returns a unified DiscoveredServer[] with all tool schemas.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { ServerConfig, ToolExample } from '../config.js'

export interface DiscoveredTool {
  name:        string
  description: string
  inputSchema: Record<string, unknown>
  examples:    ToolExample[]
  tags:        string[]
}

export interface DiscoveredServer {
  id:       string
  name:     string
  url:      string
  status:   'connected' | 'disconnected' | 'error'
  version:  string
  tools:    DiscoveredTool[]
  error?:   string
}

/**
 * Connect to all configured servers and discover their tools.
 * Runs all connections in parallel — slow servers don't block fast ones.
 */
export async function discoverAllServers(
  servers: ServerConfig[],
  extraExamples: Record<string, ToolExample[]> = {},
  tags: Record<string, string[]> = {}
): Promise<DiscoveredServer[]> {

  // Build a reverse lookup: tool name → tag names
  const toolTagMap: Record<string, string[]> = {}
  for (const [tag, tools] of Object.entries(tags)) {
    for (const tool of tools) {
      if (!toolTagMap[tool]) toolTagMap[tool] = []
      toolTagMap[tool].push(tag)
    }
  }

  // Connect to all servers in parallel
  const results = await Promise.allSettled(
    servers.map((server, i) =>
      connectToServer(server, i, extraExamples, toolTagMap)
    )
  )

  return results.map((result, i) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      return {
        id:      `server-${i}`,
        name:    servers[i].name,
        url:     servers[i].url || `${servers[i].command} ${(servers[i].args || []).join(' ')}`,
        status:  'error' as const,
        version: 'unknown',
        tools:   [],
        error:   result.reason?.message || 'Connection failed'
      }
    }
  })
}

async function connectToServer(
  config: ServerConfig,
  index: number,
  extraExamples: Record<string, ToolExample[]>,
  toolTagMap: Record<string, string[]>
): Promise<DiscoveredServer> {

  const client = new Client(
    { name: 'mcp-playbook', version: '0.1.0' },
    { capabilities: {} }
  )

  await client.connect(createTransport(config))

  try {
    // Fetch tools from the server
    const { tools } = await client.listTools()

    // Fetch server info if available
    const serverInfo = client.getServerVersion()

    // Map tools to our format
    const discoveredTools: DiscoveredTool[] = tools.map(tool => ({
      name:        tool.name,
      description: tool.description || '',
      inputSchema: tool.inputSchema as Record<string, unknown>,
      examples:    extraExamples[tool.name] || [],
      tags:        toolTagMap[tool.name]    || []
    }))

    return {
      id:      `server-${index}`,
      name:    config.name,
      url:     config.url || `${config.command} ${(config.args || []).join(' ')}`,
      status:  'connected',
      version: serverInfo?.version || '1.0.0',
      tools:   discoveredTools
    }
  } finally {
    // Discovery is one-shot — close the connection so stdio child processes
    // don't pile up on every config reload
    await client.close().catch(() => {})
  }
}

/**
 * Build the transport for a server config.
 * Shared by discovery and execution so both honour env / cwd / headers.
 */
function createTransport(config: ServerConfig) {
  if (config.transport === 'stdio') {
    if (!config.command) throw new Error(`Server "${config.name}" needs a command for stdio transport`)
    return new StdioClientTransport({
      command: config.command,
      args:    config.args    || [],
      env:     config.env     || {},
      cwd:     config.cwd     || process.cwd()
    })
  }
  if (config.transport === 'http') {
    if (!config.url) throw new Error(`Server "${config.name}" needs a url for http transport`)
    return new StreamableHTTPClientTransport(new URL(config.url), {
      requestInit: { headers: config.headers || {} }
    })
  }
  if (config.transport === 'sse') {
    if (!config.url) throw new Error(`Server "${config.name}" needs a url for sse transport`)
    return new SSEClientTransport(new URL(config.url), {
      requestInit: { headers: config.headers || {} }
    })
  }
  throw new Error(`Unknown transport: ${(config as any).transport}`)
}
/**
 * Execute a tool call against a specific server.
 * Used by the Try tab in the UI.
 */
export async function executeTool(
  serverConfig: ServerConfig,
  toolName: string,
  input: Record<string, unknown>
): Promise<{ result: unknown; duration_ms: number; error?: string }> {

  const start  = Date.now()
  const client = new Client(
    { name: 'mcp-playbook', version: '0.1.0' },
    { capabilities: {} }
  )

  try {
    await client.connect(createTransport(serverConfig))

    const result = await client.callTool({ name: toolName, arguments: input })

    return {
      result,
      duration_ms: Date.now() - start
    }
  } catch (err: any) {
    return {
      result:      null,
      duration_ms: Date.now() - start,
      error:       err.message
    }
  } finally {
    await client.close().catch(() => {})
  }
}
