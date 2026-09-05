/**
 * src/index.ts
 *
 * Public API of the mcp-storybook npm package.
 *
 * What users import:
 *   import { defineConfig } from 'mcp-storybook'
 */

export { defineConfig }             from './config.js'
export type { PlaybookConfig, ServerConfig, ToolExample } from './config.js'
export type { DiscoveredServer, DiscoveredTool }          from './server/connector.js'
