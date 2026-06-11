---
title: Memory Views Plan
scope: feature
scope_id: memory-views
audience: [developer, agent]
status: archived
visibility: private
updated: 2026-06-11
source: manual
---

# Memory Views Plan

Implementation is intentionally local and deterministic.

## Steps

- Add `src/views.ts` to read initialized Benjamin Docs metadata, parse managed Markdown, and derive sections by heading.
- Add `views` routing in `src/cli.ts`.
- Add `benjamin-docs views` to `advancedCommands` in `src/commands.ts`.
- Generate five view files under `<docsRoot>/views/`.
- Append generated view files to `.benjamin-docs/manifest.json`.
- Keep generated view docs valid Markdown with Benjamin frontmatter.
- Document the command as an advanced workflow in `README.md`.
- Make the `init -> views -> ready` refresh flow visible in `help`, `introduce`, `next`, chat-to-project guidance, and README without moving `views` into `mainCommands`.

## Validation

- `test/views.test.ts` covers generation, manifest registration, validation, and the uninitialized-project error.
- `test/commands.test.ts` verifies the advanced command drawer includes `views` without changing the main commands.
- `test/views.test.ts` covers custom docs-root links and ignores Markdown headings inside fenced code examples.
- `test/info.test.ts`, `test/init.test.ts`, and `test/validate-export.test.ts` cover the visible `init -> views -> ready` flow.
- `pnpm check` passed on 2026-06-11.
