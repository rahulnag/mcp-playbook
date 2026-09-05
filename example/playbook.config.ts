/**
 * example/playbook.config.ts
 *
 * This is a real example config you can copy into your project.
 * Run: npx mcp-playbook dev --config example/playbook.config.ts
 */

import { defineConfig } from 'mcp-playbook'

export default defineConfig({
  title:       'Acme Corp API Playbook',
  description: 'Interactive docs and playground for all our internal MCP tools',

  servers: [
    // Example 1: stdio transport — spawns a Node.js MCP server process
    {
      name:      'User API',
      transport: 'stdio',
      command:   'node',
      args:      ['./example/mock-server.mjs'],
    },

    // Example 2: HTTP transport — connects to a running MCP server
    // {
    //   name:      'Court Data API',
    //   transport: 'http',
    //   url:       'http://localhost:3002/mcp',
    // },
  ],

  // Hand-written examples for tools
  // These appear in the Examples tab and can be loaded into the Try tab
  examples: {
    get_user: [
      {
        label:       'Fetch admin user',
        description: 'Look up the main admin account',
        input:       { userId: 'usr_admin_001', include_meta: true }
      },
      {
        label: 'Fetch developer',
        input: { userId: 'usr_dev_042' }
      }
    ],
    create_user: [
      {
        label:       'New developer onboarding',
        description: 'Standard setup for a new developer joining the team',
        input:       { name: 'Priya Patel', email: 'priya@acme.com', role: 'developer' }
      }
    ]
  },

  // Group tools into sections in the sidebar
  tags: {
    'User management': ['get_user', 'create_user', 'list_users'],
    'Admin':           ['purge_cache', 'get_metrics']
  },

  theme: {
    primary: '#7F77DD'
  },

  port: 4242
})
