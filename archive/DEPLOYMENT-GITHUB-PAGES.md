# Deploying the MCP Playbook Website to GitHub Pages

The repo's website = **README rendered as docs** + **the example playground**:

```
https://rahulnag.github.io/mcp-playbook/              docs
https://rahulnag.github.io/mcp-playbook/playground/   playground (static: Run tool disabled)
```

It lives only in this repo (`site/`). It is **not** in the npm package.

---

## Run it locally

```bash
npm install
npm run site:preview      # builds everything, serves at http://localhost:4300
```

Only build (output in `site-dist/`, git-ignored):

```bash
npm run site:build
```

---

## Deploy (already set up)

The workflow `.github/workflows/pages.yml` runs `npm run site:build` and deploys `site-dist/` on every push to `main`.

**One-time setup:** GitHub repo → **Settings → Pages → Build and deployment → Source → GitHub Actions**.

**Manual redeploy:** **Actions → Deploy website → Run workflow**.

**Check it's live:** Actions tab shows a green ✓ and the URL; Settings → Pages shows the live URL.

---

## What to edit

| Change | Edit |
|---|---|
| Docs text | `README.md` |
| Site look (hero, nav, colours) | `site/template.html` |
| Playground tools / title | `example/playbook.config.ts`, `example/mock-server.mjs` |
| Preview image / icon | `public/og-image.png`, `public/favicon.svg` |

If the URL changes, update `SITE_URL` in `site/build.mjs` **and** `siteUrl` in `example/playbook.config.ts` (used for link-preview images).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Workflow fails at `deploy-pages` | Pages source isn't set to **GitHub Actions** (one-time setup above) |
| Site shows 404 | Wait 1–2 min after the first deploy; check Settings → Pages |
| Playground shows no tools | Check the build log; the example server must connect (`✓ 1/1 servers`) |
| `npm ci` fails | `package-lock.json` out of sync: run `npm install` locally and commit the lock file |
| Link preview has no image | `SITE_URL` / `siteUrl` don't match the real URL; refresh with LinkedIn Post Inspector |
