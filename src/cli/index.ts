/**
 * src/cli/index.ts
 * CLI entry point — dev, build, init commands
 */

import { Command } from 'commander'
import chalk from 'chalk'
import path  from 'path'
import fs    from 'fs'

// Read package.json for version
const pkgPath = path.join(__dirname, '../../package.json')
const pkg     = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

export async function run() {
  const program = new Command()

  program
    .name('mcp-playbook')
    .description('Playbook for MCP tools — interactive docs and playground')
    .version(pkg.version)

  // ── init ─────────────────────────────────────────────────────────

  program
    .command('init')
    .description('Create a playbook.config.ts in the current directory')
    .action(() => {
      const configPath = path.resolve(process.cwd(), 'playbook.config.ts')

      if (fs.existsSync(configPath)) {
        console.log(chalk.yellow('\n  playbook.config.ts already exists\n'))
        return
      }

      const template = `import { defineConfig } from 'mcp-playbook'

export default defineConfig({
  title: 'My MCP Playbook',
  description: 'Interactive docs for our MCP tools',

  servers: [
    {
      name:      'My API',
      transport: 'stdio',
      command:   'node',
      args:      ['./my-mcp-server.js'],
    },

    // HTTP transport example:
    // {
    //   name:      'Remote API',
    //   transport: 'http',
    //   url:       'http://localhost:3001/mcp',
    // },
  ],

  // Optional: hand-written examples per tool
  examples: {
    // get_user: [
    //   {
    //     label: 'Basic lookup',
    //     input: { userId: 'usr_abc123' }
    //   }
    // ]
  },

  // Optional: group tools into sidebar sections
  tags: {
    // 'User management': ['get_user', 'create_user'],
  },

  theme: {
    primary: '#7F77DD'
  },

  port: 4242
})
`
      fs.writeFileSync(configPath, template, 'utf8')

      console.log(chalk.green('\n  ✓ Created playbook.config.ts'))
      console.log(chalk.dim('\n  Next steps:'))
      console.log(chalk.dim('  1. Edit playbook.config.ts — point servers at your MCP server'))
      console.log(chalk.dim('  2. Run: npx mcp-playbook dev'))
      console.log(chalk.dim('  3. Open: http://localhost:4242\n'))
    })

  // ── dev ───────────────────────────────────────────────────────────

  program
    .command('dev')
    .description('Start dev server with hot reload')
    .option('-p, --port <port>', 'Port to run on', '4242')
    .option('-c, --config <path>', 'Path to config file', 'playbook.config.ts')
    .option('--no-open', 'Do not open browser automatically')
    .action(async (options) => {
      console.log('')
      console.log(chalk.bold('  ⚡ MCP Playbook'))
      console.log(chalk.dim(`  v${pkg.version}\n`))

      const configPath = path.resolve(process.cwd(), options.config)

      if (!fs.existsSync(configPath)) {
        console.log(chalk.yellow(`  Config not found: ${options.config}`))
        console.log(chalk.dim('  Run: npx mcp-playbook init\n'))
        process.exit(1)
      }

      try {
        // Lazy import so init command works even if deps not installed
        const { startDevServer } = require('../server/dev-server.js')
        await startDevServer({
          port:       parseInt(options.port),
          configPath,
          open:       options.open !== false
        })
      } catch (err: any) {
        console.error(chalk.red(`\n  Error: ${err.message}\n`))
        process.exit(1)
      }
    })

  // ── build ─────────────────────────────────────────────────────────

  program
    .command('build')
    .description('Build a static documentation site')
    .option('-o, --output <dir>', 'Output directory', 'playbook-dist')
    .option('-c, --config <path>', 'Path to config file', 'playbook.config.ts')
    .action(async (options) => {
      console.log(chalk.bold('\n  ⚡ MCP Playbook — Building static site\n'))

      const configPath = path.resolve(process.cwd(), options.config)

      if (!fs.existsSync(configPath)) {
        console.log(chalk.yellow(`  Config not found: ${options.config}`))
        console.log(chalk.dim('  Run: npx mcp-playbook init\n'))
        process.exit(1)
      }

      try {
        const { buildStaticSite } = require('../server/build.js')
        await buildStaticSite({
          outputDir:  path.resolve(process.cwd(), options.output),
          configPath
        })
        console.log(chalk.green(`\n  ✓ Built to ${options.output}/`))
        console.log(chalk.dim('  Deploy this folder to any static host.\n'))
      } catch (err: any) {
        console.error(chalk.red(`\n  Build failed: ${err.message}\n`))
        process.exit(1)
      }
    })

  // ── parse ─────────────────────────────────────────────────────────

  program.parse(process.argv)

  if (!process.argv.slice(2).length) {
    program.outputHelp()
  }
}
