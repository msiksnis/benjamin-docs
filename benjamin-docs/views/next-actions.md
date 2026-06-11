---
title: Next Actions View
scope: project
scope_id: project
audience: [developer, business, agent]
status: draft
visibility: private
updated: 2026-06-11
source: manual
---

# Next Actions View

Derived from next-action and near-term work sections across managed Benjamin docs.

## [Freshness And Lifecycle Handoff](../features/freshness-and-lifecycle/handoff.md)

Source: `benjamin-docs/features/freshness-and-lifecycle/handoff.md` (updated 2026-06-11)

### Next Actions

- Run `pnpm run release:check`, publish 0.7.0, smoke-test a fresh install, and tag the release.
- Dogfood the churn threshold and default globs on a non-Node project (Python or Go) and tune.
- Consider `--json` output for `ready`/`review` plus a GitHub Action as the next milestone.

## [Roadmap](../project/roadmap.md)

Source: `benjamin-docs/project/roadmap.md` (updated 2026-06-11)

### Immediate Next Work

- Keep the CLI command surface stable. Do not add more top-level commands unless a repeated real workflow proves the need.
- Polish the 0.4.x simple path so `bd init` is enough in normal codebase use.
- Dogfood 0.4.x on more real projects and record where the skill produces weak, vague, or overconfident docs.
- Implement 0.5.0 as a continuation-quality milestone: prove that a future human or agent can continue from the docs without the original chat.
- Keep the public README short, direct, and non-enterprise.
- Treat the interactive `commands` drawer as the place for advanced workflows, not as a reason to promote more commands.
- Make the visible project-memory refresh flow `bd init`, `bd views`, then `bd ready`, while keeping `views` out of the primary command list until dogfooding proves it should graduate.
- Dogfood `bd review --changed` on real projects where agents have added features after BD initialization; tune false positives before making changed-work review stricter or adding it to `ready`.
