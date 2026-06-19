---
title: Freshness And Lifecycle Handoff
scope: feature
scope_id: freshness-and-lifecycle
audience: [developer, agent]
status: archived
visibility: private
updated: 2026-06-19
source: session-capture
freshness: status
---

# Freshness And Lifecycle Handoff

## Status

0.8.0 is published. The freshness-coverage follow-up shipped: status-bearing docs and active feature docs now warn when no watch rule can ever flag them stale, new starter status docs carry `freshness: status`, and feature scope creation adds feature-specific watch coverage.

## Risks / Open Questions

- The churn threshold (10 source files) is a first guess; dogfooding on active projects should tune it.
- The generic default watch globs may over-warn in monorepos where `src/**` is huge; per-project `watch` customization is the escape hatch.
- Existing projects will see a one-time "Memory View is stale" warning after upgrading because the renderer changed; `bd views` resolves it.
- Path liveness skips references whose first segment does not exist in the repo, so fully deleted top-level directories silently stop being checked.
- Older projects with custom `watch` rules will not be silently migrated; `review` / `ready` surface blind spots so humans or agents can update config deliberately.

## Next Actions

- Keep dogfooding freshness checks on older initialized projects and tune watch rules only when warnings are noisy or misleading.
- Dogfood the freshness blind-spot warnings on older initialized projects and tune the default watch graph.
- Consider `--json` output for `ready`/`review` plus a GitHub Action as the next milestone.

## Continuation Proof

Read first: `benjamin-docs/features/freshness-and-lifecycle/brief.md`, `src/watch.ts`, `src/review.ts`, `src/views.ts`.

Current status: shipped in 0.8.0. Keep this scope as historical context for freshness behavior.

Checks to run:

```bash
pnpm check
node dist/src/cli.js review --changed --since HEAD
node dist/src/cli.js ready
```

Risks: keep all new checks warning-only inside `review`; keep `review` read-only; do not add primary commands.

Exact next action: use this scope only when adjusting freshness coverage behavior.
