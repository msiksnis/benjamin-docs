---
title: Changed Work Review Decisions
scope: feature
scope_id: changed-work-review
audience: [developer, agent]
status: review
visibility: private
updated: 2026-06-11
source: manual
---

# Changed Work Review Decisions

This feature exists because real dogfooding showed a subtle stale-memory failure: agents may update feature-level docs while leaving architecture, code map, roadmap, handoff, and changelog stale.

## Decisions

- Keep changed-work review under the existing `review` command as `review --changed`. Reason: this is an advanced diagnostic, not a new primary command.
- Keep the first version warning-only. Reason: the heuristics need dogfooding before they can become a readiness failure.
- Include untracked files. Reason: agents often create new routes, migrations, and tests before committing, and those are exactly the changes that can make docs stale.
- Treat generated Memory Views as derived output, not proof that source docs were updated. Reason: stale source docs can produce fresh-but-wrong views.
- Update both generated `AGENTS.md` and the bundled skill. Reason: existing and future agents need the docs-impact rule at task completion time.
- Warn on likely project-level docs, not only feature docs. Reason: the Atelier audit showed feature handoffs can be fresh while project-level memory still says implemented areas do not exist.

## Rejected Options

- Rejected adding a new primary command. That would make the product feel heavier and conflicts with the current `init`, `ready`, `help` main surface.
- Rejected making `bd ready` fail on changed-work warnings immediately. That would be premature without false-positive data from real projects.
- Rejected AI-based semantic review in V1. Deterministic checks are cheaper, local, testable, and good enough to catch the first class of stale docs.
- Rejected requiring docs churn for every code diff. The intended behavior is a conscious docs-impact decision, not mandatory documentation busywork.
