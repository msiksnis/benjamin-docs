---
title: Open Questions View
scope: project
scope_id: project
audience: [developer, designer, business, agent]
status: draft
visibility: private
updated: 2026-06-11
source: manual
---

# Open Questions View

What unresolved questions and open risks are captured across managed Benjamin docs?

## [Changed Work Review Handoff](../features/changed-work-review/handoff.md)

Source: `benjamin-docs/features/changed-work-review/handoff.md`

### Risks / Open Questions

- The changed-work mapping is intentionally coarse. It may over-warn when a source edit is too small to affect durable project memory.
- The stale-claim detector only catches obvious wording patterns such as admin routes or schema/content models still being described as not implemented.
- The default comparison is `HEAD`; teams may prefer `--since main` or `--since origin/main` in PR workflows.
- Future dogfooding should decide whether `bd ready --changed` or `bd ready --since <ref>` is worth adding.

## [Memory Views Handoff](../features/memory-views/handoff.md)

Source: `benjamin-docs/features/memory-views/handoff.md`

### Risks / Open Questions

- The section extraction is intentionally heading-based and simple. It should be dogfooded on real projects before adding deeper parsing.
- Generated views can include weak content if the underlying docs are weak. `bd review` and `bd ready` remain the quality gates.
- The generated docs currently use existing allowed frontmatter values rather than adding a new `source: generated` value.
- Publishing still needs the normal release gate and a version check against npm before `npm publish`.
