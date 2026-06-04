---
title: npm Publish Checklist
scope: release
scope_id: release
audience: [developer, agent]
status: draft
visibility: private
updated: 2026-06-04
source: session-capture
---

# npm Publish Checklist

## First Public Package

Package name:

```text
benjamin-docs
```

Initial version:

```text
0.1.0
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
pnpm publish
```

After publishing:

- Confirm `pnpm add -g benjamin-docs` works in a clean environment.
- Confirm `benjamin-docs introduce` works from outside the repo.
- Create and push a git tag for `v0.1.0`.
- Update release notes if anything changed after this checklist.

## Boundary

Do not add hosted publishing, auth, dashboards, or SaaS behavior for the first package release.
