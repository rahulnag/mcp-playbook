# npm Publish Guide

Quick reference for publishing mcp-playbook to npm.

`npm publish` automatically runs **typecheck → clean build → smoke test** first (`prepublishOnly`). If any step fails, nothing is published, so there's no manual `rm -rf dist && npm run build` step.

---

## First-time setup

```bash
npm login
npm whoami          # prints your username
```

Turn on 2FA on npm. `npm publish` will then ask for a one-time code.

---

## Every release

```bash
# 1. Start from a clean, up-to-date main (npm version refuses a dirty tree)
git status
git pull origin main

# 2. Check what will be uploaded: dist/, bin/, README.md, LICENSE, package.json only
npm pack --dry-run

# 3. Bump the version (updates package.json, commits, creates a git tag)
npm version patch    # bug fix / docs     0.1.9 → 0.1.10
npm version minor    # new feature        0.1.9 → 0.2.0
npm version major    # breaking change    0.1.9 → 1.0.0

# 4. Publish (runs typecheck + build + test first)
npm publish

# 5. Push the commit and tag
git push origin main --follow-tags

# 6. Verify
npm view mcp-playbook version
```

Then on GitHub: **Releases → Draft a new release →** pick the tag → **Generate release notes**.

---

## Which version to bump

```
Bug fix, docs, README, typo        → patch
New feature, nothing breaks        → minor
Breaking change (config renamed…)  → major
```

While below 1.0, breaking changes bump **minor** (0.1.x → 0.2.0).

---

## If a release is broken

```bash
npm deprecate mcp-playbook@0.1.10 "Broken, please upgrade to 0.1.11"   # preferred
# fix → npm version patch → npm publish

npm unpublish mcp-playbook@0.1.10   # emergency only (e.g. leaked secret), within 72h
```

---

## Useful commands

```bash
npm whoami                        # logged in?
npm view mcp-playbook             # live package info
npm view mcp-playbook versions    # all published versions
npm pack --dry-run                # what would be published
```

## Common errors

```
403 – must be logged in               → npm login
403 – cannot publish over version     → forgot to bump: npm version patch
npm version: working dir not clean    → commit or stash first
EOTP                                  → enter your 2FA code
prepublishOnly failed                 → fix the failing check; nothing was published
```
