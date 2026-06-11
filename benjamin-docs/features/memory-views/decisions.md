---
title: Memory Views Decisions
scope: feature
scope_id: memory-views
audience: [developer, agent]
status: archived
visibility: private
updated: 2026-06-11
source: manual
---

# Memory Views Decisions

This feature borrows the useful part of Notion databases/views without copying Notion's hosted workspace model.

## Decisions

- Add `bd views` as a direct command so agents, scripts, and CI can run it deterministically.
- Keep `bd views` in the advanced command drawer instead of promoting it to the main command list.
- Generate Markdown files under `benjamin-docs/views/` so humans can read them and Git can diff them.
- Treat generated views as derived lenses. The source of truth remains the project, handoff, engineering, feature, and release docs.
- Register generated view files in the manifest so validation catches broken frontmatter and links.
- Make the normal refresh sequence explicit as `bd init`, `bd views`, then `bd ready`.
- Keep that sequence as guidance, not automatic `init` behavior. `init` creates source-of-truth docs and agent guidance; `views` generates derived docs only when the user or agent asks for them.

## Rejected Options

- Do not make Memory Views drawer-only; automation should not depend on an interactive selector.
- Do not add a hosted dashboard or database backend for this feature.
- Do not promote `views` next to `init`, `ready`, and `help` until repeated real use proves it belongs there.
- Do not make `bd init` generate views automatically. Fresh starter docs do not yet have enough signal, and generated views should remain an explicit refresh step.
