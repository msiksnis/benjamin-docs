---
title: Changed Work Review Handoff
scope: feature
scope_id: changed-work-review
audience: [developer, agent]
status: review
visibility: private
updated: 2026-06-11
source: manual
---

# Changed Work Review Handoff

This handoff covers the first `bd review --changed` implementation.

## Status

Implemented:

- `src/review.ts` accepts `ReviewOptions` and adds changed-work review when `changed` is true.
- `src/cli.ts` parses `review --changed` and `review --changed --since <git-ref>`.
- `src/commands.ts` lists `benjamin-docs review --changed` in the advanced command drawer.
- `src/agent-contracts.ts` generated guidance now tells agents to review docs impact after code/config/schema/test/workflow/product behavior changes.
- `skills/benjamin-docs/SKILL.md` now has a Changed Work Freshness workflow and tells agents that feature docs are not enough when project-level memory became stale.
- `test/review.test.ts`, `test/agent-contracts.test.ts`, and `test/commands.test.ts` cover the new behavior.

## Risks / Open Questions

- The changed-work mapping is intentionally coarse. It may over-warn when a source edit is too small to affect durable project memory.
- The stale-claim detector only catches obvious wording patterns such as admin routes or schema/content models still being described as not implemented.
- The default comparison is `HEAD`; teams may prefer `--since main` or `--since origin/main` in PR workflows.
- Future dogfooding should decide whether `bd ready --changed` or `bd ready --since <ref>` is worth adding.

## Next Actions

- Run the full project verification gate.
- Run `node dist/src/cli.js review --changed --since HEAD` in this repo after docs are updated and confirm warnings are useful.
- Dogfood the command on Atelier or another project with real feature work after BD initialization.
- Tune file classification and stale-claim patterns based on actual false positives and missed stale docs.

## Continuation Proof

Read first:

- `src/review.ts`
- `src/cli.ts`
- `src/agent-contracts.ts`
- `skills/benjamin-docs/SKILL.md`
- `test/review.test.ts`
- `benjamin-docs/engineering/architecture.md`
- `benjamin-docs/engineering/code-map.md`

Current status: first implementation is complete. Full verification passed locally. Publish target is `benjamin-docs@0.6.0`.

Checks to run:

```bash
pnpm check
node dist/src/cli.js review --changed --since HEAD
node dist/src/cli.js views
node dist/src/cli.js ready
```

Avoid: promoting changed-work review to a main command or hard readiness failure until dogfooding proves the warnings are accurate enough.
