/**
 * example/mock-server.mjs
 *
 * A minimal MCP server used by the example config.
 * Shows exactly what mcp-playbook auto-discovers.
 *
 * Run directly: node example/mock-server.mjs
 * Or via mcp-playbook: mcp-playbook dev --config example/playbook.config.ts
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const server = new McpServer({
  name:    'User API',
  version: '1.0.0'
})

// ── get_user ─────────────────────────────────────────────────────

server.tool(
  'get_user',
  'Retrieve a user by their unique ID. Returns full profile including roles and metadata.',
  {
    userId:       z.string().describe('The unique user identifier (UUID format)'),
    include_meta: z.boolean().optional().default(false)
                  .describe('Include extended metadata in response')
  },
  async ({ userId, include_meta }) => {
    const user = {
      id:        userId,
      name:      'Arjun Sharma',
      email:     'arjun@acme.com',
      role:      'developer',
      createdAt: '2024-01-15T10:30:00Z',
      ...(include_meta ? { meta: { loginCount: 142, lastIp: '192.168.1.1' } } : {})
    }
    return { content: [{ type: 'text', text: JSON.stringify(user, null, 2) }] }
  }
)

// ── create_user ───────────────────────────────────────────────────

server.tool(
  'create_user',
  'Create a new user account. Sends a welcome email automatically.',
  {
    name:  z.string().describe('Full display name'),
    email: z.string().email().describe('Valid email address (must be unique)'),
    role:  z.enum(['admin', 'developer', 'viewer']).describe('Access role')
  },
  async ({ name, email, role }) => {
    const user = {
      id:        `usr_${Math.random().toString(36).substr(2, 8)}`,
      name,
      email,
      role,
      createdAt: new Date().toISOString()
    }
    return { content: [{ type: 'text', text: JSON.stringify(user, null, 2) }] }
  }
)

// ── list_users ────────────────────────────────────────────────────

server.tool(
  'list_users',
  'List all users with optional filtering and pagination.',
  {
    role:  z.enum(['admin', 'developer', 'viewer']).optional()
           .describe('Filter by role'),
    page:  z.number().min(1).default(1).describe('Page number (starts at 1)'),
    limit: z.number().min(1).max(100).default(20).describe('Results per page (max 100)')
  },
  async ({ role, page, limit }) => {
    const users = [
      { id: 'usr_001', name: 'Alice', role: 'admin' },
      { id: 'usr_002', name: 'Bob',   role: 'developer' },
      { id: 'usr_003', name: 'Carol', role: 'viewer' }
    ].filter(u => !role || u.role === role)

    const result = { users, total: users.length, page, pages: 1 }
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] }
  }
)

// ── Start ─────────────────────────────────────────────────────────

const transport = new StdioServerTransport()
await server.connect(transport)
