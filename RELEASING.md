# Releasing MCP Playbook

**For maintainers** with publish rights on npm. Contributors don't need this. See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## One-time setup

```bash
npm login
npm whoami          # should print your npm username
```

Turn on [two-factor auth](https://docs.npmjs.com/configuring-two-factor-authentication) for your npm account. `npm publish` will then ask for a one-time code.

---

## Releasing a new version

### 1. Make sure `main` is green

- CI passes on GitHub (the **Actions** tab)
- Your working tree is clean: `git status` shows nothing to commit
- You're up to date: `git pull origin main`

### 2. Check the package contents

```bash
npm pack --dry-run
```

The list should contain `dist/` (including `dist/client/index.html`), `bin/`, `README.md`, `LICENSE` and `package.json`, and **nothing else**: no `src/`, `.env`, or `node_modules/`.

For bigger releases, also do the [real-user test](CONTRIBUTING.md#test-like-a-real-user-npm-pack) with the `.tgz`.

### 3. Bump the version

`npm version` updates `package.json`, commits, and creates a git tag in one step:

```bash
npm version patch   # bug fixes, docs                 0.1.9 → 0.1.10
npm version minor   # new features                    0.1.9 → 0.2.0
npm version major   # breaking changes                0.1.9 → 1.0.0
```

> **While we're below 1.0**, breaking changes (e.g. renaming a config field) bump the **minor** version (`0.1.x → 0.2.0`), and everything else is a patch.

### 4. Publish

```bash
npm publish
```

`prepublishOnly` automatically runs `typecheck`, a clean `build`, and the smoke test first. If any of them fails, nothing is published.

### 5. Push the commit and tag

```bash
git push origin main --follow-tags
```

### 6. Create a GitHub release

On GitHub: **Releases → Draft a new release**, pick the new tag (e.g. `v0.1.10`), and click **Generate release notes**. Edit the notes into a short list of what changed for users.

### 7. Verify

```bash
npm view mcp-playbook version      # shows the new version
```

---

## If a release is broken

**Preferred: deprecate it and publish a fix.**

```bash
npm deprecate mcp-playbook@0.1.10 "Broken config loading, please upgrade to 0.1.11"
# fix the bug, then release again (steps 1–7)
```

Users installing the bad version see the warning.

**Emergency only: unpublish.** Only within 72 hours of publishing, and only for things like accidentally published secrets. A version number can never be reused afterwards.

```bash
npm unpublish mcp-playbook@0.1.10
```

---

## Project website (GitHub Pages)

The repo has its own website. It isn't part of the npm package, so library users never get it:

```
https://rahulnag.github.io/mcp-playbook/              ← README rendered as docs
https://rahulnag.github.io/mcp-playbook/playground/   ← live demo built from example/
```

| What | Where |
|---|---|
| Page template + styling | `site/template.html` |
| Build script (README → HTML, then builds the playground) | `site/build.mjs` |
| Local preview server | `site/serve.mjs` |
| Docs content | `README.md` (edit it, and the site follows) |
| Playground content | `example/playbook.config.ts` + `example/mock-server.mjs` |
| Output (generated, git-ignored) | `site-dist/` |
| Deploy workflow | `.github/workflows/pages.yml` |

**Run it locally:**

```bash
npm run site:preview
# → http://localhost:4300/              docs
# → http://localhost:4300/playground/   playground
```

Use `npm run site:build` to only build it into `site-dist/`. The playground on the website is static (**Run tool** is disabled). For a playground where Run works, use `npx mcp-playbook dev --config example/playbook.config.ts`.

**Deploying:** every push to `main` rebuilds and deploys automatically. One-time setup: **Settings → Pages → Build and deployment → Source → GitHub Actions**. To redeploy by hand: **Actions → Deploy website → Run workflow**.

If the site URL ever changes, update `SITE_URL` in `site/build.mjs` and `siteUrl` in `example/playbook.config.ts`, so link previews show the image.

---

## Common publish errors

| Error | Fix |
|---|---|
| `403 Forbidden — you must be logged in` | `npm login` |
| `403 — cannot publish over previously published version` | You forgot to bump: `npm version patch` |
| `npm version` fails with "working directory not clean" | Commit or stash your changes first |
| `prepublishOnly` fails | Fix the failing step (typecheck, build or smoke test). Nothing was published |
| `EOTP` / one-time password required | Enter the code from your authenticator app |
