---
title: npm Publish Checklist
scope: release
scope_id: release
audience: [developer, agent]
status: draft
visibility: private
updated: 2026-06-25
source: session-capture
---

# npm Publish Checklist

## Package

Package name:

```text
benjamin-docs
```

The package is distributed through the npm registry but public install docs should lead with pnpm:

```bash
pnpm add -g benjamin-docs
```

## Pre-Publish Checks

Run:

```bash
pnpm run release:check
```

This runs:

- TypeScript typecheck.
- Build.
- Tests.
- Benjamin docs validation.
- Package tarball dry run.

## Publish Command

Run:

```bash
tmpdir=$(mktemp -d)
pnpm pack --pack-destination "$tmpdir"
npm publish "$tmpdir"/benjamin-docs-*.tgz --access public
pnpm run release:github
pnpm run release:verify-public
```

After publishing:

- Confirm `pnpm add -g benjamin-docs` works in a clean environment.
- Confirm `benjamin-docs introduce` works from outside the repo.
- Confirm GitHub shows the published version as the latest Release.
- Update release notes if anything changed after this checklist.

## Boundary

Do not add hosted publishing, auth, dashboards, or SaaS behavior for the first package release.
