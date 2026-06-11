---
title: Memory Views Handoff
scope: feature
scope_id: memory-views
audience: [developer, agent]
status: draft
visibility: private
updated: 2026-06-11
source: manual
---

# Memory Views Handoff

Memory Views is implemented and tested.

## Status

- `src/views.ts` generates decision, open-question, next-action, risk, and agent-continuation views.
- `src/cli.ts` exposes `bd views`.
- `src/commands.ts` lists `bd views` as an advanced command.
- `README.md`, `help`, `introduce`, `next`, and chat-to-project guidance document the `bd init -> bd views -> bd ready` flow without changing the main command path.
- Atelier Beaute dogfooding found and fixed a parser bug where headings inside fenced Markdown examples were treated as source sections.
- The full test suite passed with `pnpm check` on 2026-06-11.

## Risks / Open Questions

- The section extraction is intentionally heading-based and simple. It should be dogfooded on real projects before adding deeper parsing.
- Generated views can include weak content if the underlying docs are weak. `bd review` and `bd ready` remain the quality gates.
- The generated docs currently use existing allowed frontmatter values rather than adding a new `source: generated` value.
- Publishing still needs the normal release gate and a version check against npm before `npm publish`.

## Next Actions

- Memory Views shipped in 0.5.1; keep future work focused on dogfooding view usefulness instead of republishing that milestone.
- Dogfood `bd views` on more existing Benjamin Docs projects.
- Watch whether users expect a feature-board view; add it only if it proves useful.
- Consider whether generated docs should eventually use a dedicated source value such as `generated`.

## Continuation Proof

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
