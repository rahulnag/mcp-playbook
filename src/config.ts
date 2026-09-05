/**
 * src/config.ts
 *
 * Type definitions and the defineConfig() helper.
 *
 * Users write:
 *   import { defineConfig } from 'mcp-playbook'
 *   export default defineConfig({ ... })
 *
 * Same pattern as Vite, Vitest, etc.
 */

export interface ServerConfig {
  /** Display name shown in the UI */
  name: string

  /** How to connect to this MCP server */
  transport: 'stdio' | 'http' | 'sse'

  // stdio transport — spawn a process
  command?: string
  args?: string[]
  env?: Record<string, string>
  cwd?: string

  // http / sse transport
  url?: string
  headers?: Record<string, string>
}

export interface ToolExample {
  /** Short label shown in the Examples tab */
  label: string
  /** Optional longer description */
  description?: string
  /** Input values to pre-fill */
  input: Record<string, unknown>
  /** Optional expected output to show alongside */
  expectedOutput?: unknown
}

export interface PlaybookConfig {
  /** Title shown in the UI header */
  title?: string

  /** Subtitle / description */
  description?: string

  /** MCP servers to connect to */
  servers: ServerConfig[]

  /**
   * Hand-written examples per tool name.
   * These are merged with any examples found in the server's tool definitions.
   *
   * examples: {
   *   get_user: [{ label: 'Basic', input: { userId: 'usr_123' } }]
   * }
   */
  examples?: Record<string, ToolExample[]>

  /**
   * Group tools under named sections.
   * tags: { 'User management': ['get_user', 'create_user'] }
   */
  tags?: Record<string, string[]>

  /** UI theming */
  theme?: {
    primary?: string
    background?: string
    font?: string
  }

  /** Port for dev server. Default: 4242 */
  port?: number
}

/**
 * defineConfig — gives you TypeScript autocomplete in your config file.
 * This is the primary API users interact with.
 *
 * Usage:
 *   import { defineConfig } from 'mcp-playbook'
 *   export default defineConfig({ servers: [...] })
 */
export function defineConfig(config: PlaybookConfig): PlaybookConfig {
  return config
}
