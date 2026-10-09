# Deploying the MCP Playbook Demo to GitHub Pages

This publishes the docs generated from `example/` as a live demo site:

```
https://rahulnag.github.io/mcp-playbook/
```

> The site is **static**: it shows the Docs, Examples and Schema tabs. **Run tool** is disabled because there's no live MCP server behind a static site.

GitHub Pages is free for public repos. Nothing is committed back to the repo: a GitHub Action builds the site and deploys it on every push to `main`.

---

## Step 1: Try the build locally (optional)

```bash
npm install
npm run build
npx mcp-playbook build --config example/playbook.config.ts --output playbook-dist
ls playbook-dist      # index.html  assets/  data.json
```

`playbook-dist/` is already in `.gitignore`.

---

## Step 2: Set Pages to deploy from Actions

```
GitHub repo → Settings → Pages
Build and deployment → Source → "GitHub Actions"
```

---

## Step 3: Add the workflow

Create `.github/workflows/pages.yml`:

```yaml
name: Deploy demo docs

on:
  push:
    branches: [main]
  workflow_dispatch:          # lets you run it manually from the Actions tab

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npx mcp-playbook build --config example/playbook.config.ts --output playbook-dist
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: playbook-dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

```bash
git add .github/workflows/pages.yml
git commit -m "ci: deploy demo docs to GitHub Pages"
git push origin main
```

---

## Step 4: Check it's live

```
Repo → Actions → "Deploy demo docs" → green ✓ → the URL is shown in the run
Repo → Settings → Pages → shows the live URL
```

Then add it near the top of `README.md`:

```markdown
📖 **Live demo:** https://rahulnag.github.io/mcp-playbook/
```

---

## Updating the demo

Nothing to do: every push to `main` rebuilds and redeploys. To redeploy without a code change, go to **Actions → Deploy demo docs → Run workflow**.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Workflow fails at `deploy-pages` | Step 2 isn't done: Pages source must be **GitHub Actions** |
| Site shows 404 | Wait 1–2 minutes after the first deploy; check Settings → Pages |
| Page loads but shows no tools | Check the build step log; the example server must connect (`✓ 1/1 servers`) |
| `npm ci` fails | `package-lock.json` is out of sync: run `npm install` locally and commit the lock file |
