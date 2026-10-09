/**
 * src/server/load-config.ts
 *
 * Loads the user's playbook.config.(ts|js|mjs|cjs).
 *
 * Uses jiti so that:
 *   - TypeScript configs work on every supported Node version (no ts-node needed)
 *   - every call re-reads the file, so hot reload picks up edits
 *   - `import { defineConfig } from 'mcp-playbook'` works even when the package
 *     is not installed in the user's project (e.g. run via `npx mcp-playbook`)
 */

import path from 'path'
import { createJiti } from 'jiti'
import type { PlaybookConfig } from '../config.js'

// Compiled layout: dist/cli/index.js or dist/server/*.js → dist/index.js
const selfEntry = path.resolve(__dirname, '../index.js')

const jiti = createJiti(__filename, {
  moduleCache: false,
  alias:       { 'mcp-playbook': selfEntry }
})

export async function loadConfig(configPath: string): Promise<PlaybookConfig> {
  let config: PlaybookConfig | undefined
  try {
    config = await jiti.import<PlaybookConfig>(configPath, { default: true })
  } catch (err: any) {
    throw new Error(`Cannot load config: ${configPath}\n    ${err.message}`)
  }

  if (!config || !Array.isArray(config.servers)) {
    throw new Error(
      `Invalid config: ${configPath}\n` +
      `    It must default-export an object with a "servers" array`
    )
  }
  return config
}
