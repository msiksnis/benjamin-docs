---
title: Agent Continuation View
scope: project
scope_id: project
audience: [agent]
status: draft
visibility: private
updated: 2026-06-11
source: manual
---

# Agent Continuation View

Derived from continuation-proof, read-first, current-state, check, risk, and next-action sections for future agents.

## [Agent-Ready Project Memory Handoff](../features/agent-ready-project-memory/handoff.md)

Source: `benjamin-docs/features/agent-ready-project-memory/handoff.md`

### Immediate Next Actions

1. Decide whether to tackle the higher-risk agent guidance requested-but-preserved state.
2. Run a fresh-agent continuation test that only exposes `README.md`, `AGENTS.md`, `.benjamin-docs/`, and `benjamin-docs/`.
3. Run:
   ```bash
   pnpm check
   bd ready
   ```
4. Update this handoff with dogfooding results before publishing 0.4.0.

## [Changed Work Review Handoff](../features/changed-work-review/handoff.md)

Source: `benjamin-docs/features/changed-work-review/handoff.md`

### Risks / Open Questions

- The changed-work mapping is intentionally coarse. It may over-warn when a source edit is too small to affect durable project memory.
- The stale-claim detector only catches obvious wording patterns such as admin routes or schema/content models still being described as not implemented.
- The default comparison is `HEAD`; teams may prefer `--since main` or `--since origin/main` in PR workflows.
- Future dogfooding should decide whether `bd ready --changed` or `bd ready --since <ref>` is worth adding.

## [Changed Work Review Handoff](../features/changed-work-review/handoff.md)

Source: `benjamin-docs/features/changed-work-review/handoff.md`

### Next Actions

- Run the full project verification gate.
- Run `node dist/src/cli.js review --changed --since HEAD` in this repo after docs are updated and confirm warnings are useful.
- Dogfood the command on Atelier or another project with real feature work after BD initialization.
- Tune file classification and stale-claim patterns based on actual false positives and missed stale docs.

## [Changed Work Review Handoff](../features/changed-work-review/handoff.md)

Source: `benjamin-docs/features/changed-work-review/handoff.md`

### Continuation Proof

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

## [Memory Views Handoff](../features/memory-views/handoff.md)

Source: `benjamin-docs/features/memory-views/handoff.md`

### Risks / Open Questions

- The section extraction is intentionally heading-based and simple. It should be dogfooded on real projects before adding deeper parsing.
- Generated views can include weak content if the underlying docs are weak. `bd review` and `bd ready` remain the quality gates.
- The generated docs currently use existing allowed frontmatter values rather than adding a new `source: generated` value.
- Publishing still needs the normal release gate and a version check against npm before `npm publish`.

## [Memory Views Handoff](../features/memory-views/handoff.md)

Source: `benjamin-docs/features/memory-views/handoff.md`

### Next Actions

- Memory Views shipped in 0.5.1; keep future work focused on dogfooding view usefulness instead of republishing that milestone.
- Dogfood `bd views` on more existing Benjamin Docs projects.
- Watch whether users expect a feature-board view; add it only if it proves useful.
- Consider whether generated docs should eventually use a dedicated source value such as `generated`.

## [Memory Views Handoff](../features/memory-views/handoff.md)

Source: `benjamin-docs/features/memory-views/handoff.md`

### Continuation Proof

Read first:

- `src/views.ts`
- `src/cli.ts`
- `src/commands.ts`
- `test/views.test.ts`
- `test/commands.test.ts`
- `README.md`

Checks to run:

- `pnpm check`
- `node dist/src/cli.js views`
- `node dist/src/cli.js validate`
- `node dist/src/cli.js ready`
- `pnpm run release:check`

Do not promote `views` into `mainCommands` unless there is a clear product decision to make Memory Views part of the simple path.

## [Agent Brief](../handoff/agent-brief.md)

Source: `benjamin-docs/handoff/agent-brief.md`

### Current State

`benjamin-docs` is a published npm CLI and bundled agent skill for repo-local project memory. It turns planning/build conversations into structured Markdown docs in `benjamin-docs/` plus deterministic metadata in `.benjamin-docs/`.

The source repo is:

- Local path: `/Users/marty/Important/benjamin-docs`
- GitHub repo: `msiksnis/benjamin-docs`
- Main branch: `main`
- Package/CLI name: `benjamin-docs`
- Package status: `0.5.1` published on npm.
- Working package version: `0.6.0` for changed-work freshness review.

The project has been renamed fully from the earlier working name `agent-docs`; do not reintroduce that name.

## [Agent Brief](../handoff/agent-brief.md)

Source: `benjamin-docs/handoff/agent-brief.md`

### Continuation Proof

Read first:

- `README.md`
- `benjamin-docs/project/brief.md`
- `benjamin-docs/project/roadmap.md`
- `benjamin-docs/project/open-questions.md`
- `benjamin-docs/handoff/human-brief.md`
- `docs/superpowers/plans/2026-06-10-continuation-proof.md`

Current state: 0.5.1 is published. The active 0.6.0 work adds `bd review --changed` as an advanced warning-only freshness check for source changes that probably need project-memory updates.

Commands/checks to run before handoff:

```bash
pnpm build
node --test dist/test/review.test.js dist/test/agent-contracts.test.js dist/test/commands.test.js
node dist/src/cli.js review --changed --since HEAD
pnpm run release:check
node dist/src/cli.js ready
```

Risks/hazards: do not add more primary commands for this milestone, keep `review --changed` warning-only until dogfooding proves the heuristics, do not overwrite user-owned `AGENTS.md`, do not require exact headings when equivalent continuation evidence exists, and avoid making planning-only projects invent code paths.

Next actions: run the full verification gates, publish 0.6.0, smoke-test a fresh npm install, then tag the release.
