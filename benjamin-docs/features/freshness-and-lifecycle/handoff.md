---
title: Freshness And Lifecycle Handoff
scope: feature
scope_id: freshness-and-lifecycle
audience: [developer, agent]
status: review
visibility: private
updated: 2026-06-11
source: session-capture
---

# Freshness And Lifecycle Handoff

## Status

Implementation is complete and all 146 tests pass. The repo's own docs were updated through the new gate: `review --changed` flagged churned engineering docs, stale views, and the empty feature scope, and each warning was resolved by a real docs update. Not yet published to npm.

## Risks / Open Questions

- The churn threshold (10 source files) is a first guess; dogfooding on active projects should tune it.
- The generic default watch globs may over-warn in monorepos where `src/**` is huge; per-project `watch` customization is the escape hatch.
- Existing projects will see a one-time "Memory View is stale" warning after upgrading because the renderer changed; `bd views` resolves it.
- Path liveness skips references whose first segment does not exist in the repo, so fully deleted top-level directories silently stop being checked.

## Next Actions

- Run `pnpm run release:check`, publish 0.7.0, smoke-test a fresh install, and tag the release.
- Dogfood the churn threshold and default globs on a non-Node project (Python or Go) and tune.
- Consider `--json` output for `ready`/`review` plus a GitHub Action as the next milestone.

## Continuation Proof

Read first: `benjamin-docs/features/freshness-and-lifecycle/brief.md`, `src/watch.ts`, `src/review.ts`, `src/views.ts`.

Current status: code and tests done on this machine; npm publish pending.

Checks to run:

```bash
pnpm check
node dist/src/cli.js review --changed --since HEAD
node dist/src/cli.js ready
```

Risks: keep all new checks warning-only inside `review`; keep `review` read-only; do not add primary commands.

Exact next action: publish `benjamin-docs@0.7.0` after `pnpm run release:check` passes.
