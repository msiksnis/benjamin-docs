---
title: Memory Views Brief
scope: feature
scope_id: memory-views
audience: [developer, designer, agent]
status: archived
visibility: private
updated: 2026-06-11
source: manual
---

# Memory Views Brief

Memory Views give Benjamin Docs a Notion-inspired "same source, multiple views" capability without becoming a workspace clone. The CLI derives useful Markdown lenses from managed project memory.

## Outcome

Users and agents can run `bd views` to generate:

- `benjamin-docs/views/decisions.md`
- `benjamin-docs/views/open-questions.md`
- `benjamin-docs/views/next-actions.md`
- `benjamin-docs/views/risks.md`
- `benjamin-docs/views/agent-continuation.md`

The generated files make decisions, unresolved questions, risks, and continuation context easier to scan while keeping the original Benjamin docs as the source of truth.

## Scope

In scope:

- Add a direct `bd views` CLI command.
- List `bd views` in the advanced `bd commands` drawer.
- Generate ordinary Markdown files under the configured docs root.
- Register generated views in `.benjamin-docs/manifest.json` so `bd validate` checks them.
- Keep the README main command path focused on `init`, `ready`, and `help`.

Out of scope:

- Hosted dashboards.
- A block editor.
- Comments or collaboration workflow.
- Promoting `views` into the main command list before dogfooding proves it belongs there.
