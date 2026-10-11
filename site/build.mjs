/**
 * site/build.mjs
 *
 * Builds the project website (NOT part of the npm package):
 *
 *   site-dist/
 *     index.html     ← landing page + README rendered as docs
 *     playground/    ← `mcp-playbook build` of example/ (the demo)
 *
 * Run:  npm run site:build      (or npm run site:preview to also serve it)
 */

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { Marked } from 'marked'
import hljs from 'highlight.js'

const root     = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir   = path.join(root, 'site-dist')
const REPO     = 'https://github.com/rahulnag/mcp-playbook'
const SITE_URL = (process.env.SITE_URL || 'https://rahulnag.github.io/mcp-playbook').replace(/\/+$/, '')
const DESCRIPTION = 'Interactive docs and a live playground for your MCP servers, generated automatically.'

const escapeHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const stripTags  = s => s.replace(/<[^>]+>/g, '')

// GitHub-style heading ids, so README anchor links (#quick-start …) keep working
const seenSlugs = new Set()
function slugify(text) {
  let slug = stripTags(text).toLowerCase().trim()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '')
    .replace(/ /g, '-')
  if (seenSlugs.has(slug)) {
    let i = 1
    while (seenSlugs.has(`${slug}-${i}`)) i++
    slug = `${slug}-${i}`
  }
  seenSlugs.add(slug)
  return slug
}

// README links like CONTRIBUTING.md or LICENSE point at files in the repo
function resolveHref(href) {
  if (href.startsWith('#') || /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) return href
  if (href.startsWith('README.md')) return href.slice('README.md'.length) || '#'
  return `${REPO}/blob/main/${href}`
}

const toc = []
const marked = new Marked({ gfm: true })
marked.use({
  renderer: {
    heading({ tokens, depth, text }) {
      const id   = slugify(text)
      const html = this.parser.parseInline(tokens)
      if (depth === 2 || depth === 3) toc.push({ depth, id, label: stripTags(html) })
      return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${html}</h${depth}>\n`
    },
    code({ text, lang }) {
      const language = lang && hljs.getLanguage(lang) ? lang : null
      const html = language ? hljs.highlight(text, { language }).value : escapeHtml(text)
      return `<pre><code class="hljs${language ? ` language-${language}` : ''}">${html}</code></pre>\n`
    },
    link({ href, title, tokens }) {
      const url      = resolveHref(href)
      const external = /^https?:/.test(url)
      return `<a href="${escapeHtml(url)}"${title ? ` title="${escapeHtml(title)}"` : ''}` +
             `${external ? ' target="_blank" rel="noopener"' : ''}>${this.parser.parseInline(tokens)}</a>`
    },
  },
})

// ── 1. Clean output ──────────────────────────────────────────────
fs.rmSync(outDir, { recursive: true, force: true })
fs.mkdirSync(outDir, { recursive: true })

// ── 2. Render README → docs ──────────────────────────────────────
let readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8')
// The README's centered header (logo, badges, nav) is replaced by the site's hero
readme = readme.replace(/^\s*<div align="center">[\s\S]*?<\/div>\s*---\s*/, '')

const content = marked.parse(readme)
  .replace(/<table>/g, '<div class="table-wrap"><table>')
  .replace(/<\/table>/g, '</table></div>')

const tocHtml = '<ul>' + toc.map(t =>
  `<li class="l${t.depth}"><a href="#${t.id}">${escapeHtml(t.label)}</a></li>`
).join('') + '</ul>'

const hljsCss = fs.readFileSync(path.join(root, 'node_modules/highlight.js/styles/github-dark.min.css'), 'utf8')
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version

const fill = (html, values) =>
  Object.entries(values).reduce((acc, [key, value]) => acc.split(`{{${key}}}`).join(value), html)

const page = fill(fs.readFileSync(path.join(root, 'site/template.html'), 'utf8'), {
  CONTENT:     content,
  TOC:         tocHtml,
  HLJS_CSS:    hljsCss,
  VERSION:     version,
  REPO,
  SITE_URL,
  DESCRIPTION: escapeHtml(DESCRIPTION),
})
fs.writeFileSync(path.join(outDir, 'index.html'), page)

for (const file of ['favicon.svg', 'apple-touch-icon.png', 'og-image.png']) {
  fs.copyFileSync(path.join(root, 'public', file), path.join(outDir, file))
}
console.log(`  ✓ Docs page: README rendered (${toc.length} sections)`)

// ── 3. Playground: the static build of example/ ─────────────────
execFileSync(process.execPath, [
  path.join(root, 'bin/mcp-playbook.js'), 'build',
  '--config', 'example/playbook.config.ts',
  '--output', path.join(outDir, 'playground'),
], { cwd: root, stdio: 'inherit' })

console.log(`\n  ✓ Site built to site-dist/  (docs at /, playground at /playground/)\n`)
