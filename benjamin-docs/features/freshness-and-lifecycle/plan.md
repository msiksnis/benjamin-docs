---
title: Freshness And Lifecycle Plan
scope: feature
scope_id: freshness-and-lifecycle
audience: [developer, agent]
status: review
visibility: private
updated: 2026-06-14
source: session-capture
freshness: status
---

# Freshness And Lifecycle Plan

## Steps

1. Add `src/watch.ts`: `WatchRule` defaults, zero-dependency glob matcher, `resolveWatchRules`.
2. Plumb `watch` through `src/types.ts`, `src/project-config.ts`, `src/validate.ts`, and `src/init.ts` (seed defaults, preserve custom rules on re-init).
3. Rewrite the changed-work section of `src/review.ts` around watch rules; replace stack-specific stale-claim regexes with generic patterns scoped to `architecture.md` and `code-map.md`, quoting the full sentence.
4. Add doc-churn and path-liveness checks to plain `review`.
5. Refactor `src/views.ts` to expose `renderMemoryViews`, filter archived and stale docs and scopes, group sections per doc, order by updated date, and skip unchanged writes; add the freshness check to `review`.
6. Add `setScopeStatus` to `src/scopes.ts` with frontmatter cascade; wire CLI, drawer, and scope help.
7. Update and extend tests; update README and SKILL.md; bump to 0.7.0; dogfood on this repo.
8. 0.8.0 follow-up: add freshness coverage warnings, `freshness: status`, broader default watch coverage, feature-scope watch registration, and template guidance to avoid duplicated volatile status facts.

## Validation

- `pnpm check` (typecheck, build, full test suite) passes; the suite grew from 132 to 146 tests.
- `bd review --changed --since HEAD` on this repo flags the milestone's own doc gaps before the docs are updated, then passes after.
- `bd views` then `bd ready` pass on this repo before release.
- `pnpm run release:check` before publishing.

## Rollout

Upgrade note for existing projects: the first `review` after upgrading warns that existing Memory Views are stale because the renderer changed; running `bd views` once resolves it. Projects without `watch` in config silently use the new generic defaults.
