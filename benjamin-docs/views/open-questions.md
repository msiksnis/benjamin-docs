---
title: Open Questions View
scope: project
scope_id: project
audience: [developer, designer, business, agent]
status: draft
visibility: private
updated: 2026-06-14
source: manual
---

# Open Questions View

What unresolved questions and open risks are captured across managed Benjamin docs?

## [Freshness And Lifecycle Handoff](../features/freshness-and-lifecycle/handoff.md)

Source: `benjamin-docs/features/freshness-and-lifecycle/handoff.md` (updated 2026-06-14)

### Risks / Open Questions

- The churn threshold (10 source files) is a first guess; dogfooding on active projects should tune it.
- The generic default watch globs may over-warn in monorepos where `src/**` is huge; per-project `watch` customization is the escape hatch.
- Existing projects will see a one-time "Memory View is stale" warning after upgrading because the renderer changed; `bd views` resolves it.
- Path liveness skips references whose first segment does not exist in the repo, so fully deleted top-level directories silently stop being checked.
- Older projects with custom `watch` rules will not be silently migrated; `review` / `ready` surface blind spots so humans or agents can update config deliberately.
