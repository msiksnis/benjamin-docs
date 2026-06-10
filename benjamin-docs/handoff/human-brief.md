---
title: Human Brief
scope: handoff
scope_id: human-brief
audience: [developer, designer, business, advisor]
status: review
visibility: private
updated: 2026-06-10
source: session-capture
---

# Human Brief

`benjamin-docs` is a published local-first CLI for turning useful AI chats into durable project docs. The package is public as `benjamin-docs`, currently published at `0.3.1`, and focuses on local files rather than SaaS.

The product promise is simple: a person or agent can start with a chat or an existing codebase, create a small project notebook, and preserve decisions, plans, risks, open questions, and handoff notes in Markdown. The docs live in the project under `benjamin-docs/`; metadata lives under `.benjamin-docs/`.

Recent work made the first-run story stronger: `ready` is the primary handoff gate, `commands` is an interactive advanced drawer, `bd` is the short alias, agent guidance can be installed into `AGENTS.md` without overwriting existing user-owned instructions, and `install-skill` / `package-skill` distribute the bundled skill.

The current quality focus is 0.4.0: agent-ready project memory. BD should turn messy chats, existing repos, and feature plans into docs that a future human or agent can actually continue from.

Main product constraint: the user workflow must stay simple. The visible path should remain `bd init`, `bd ready`, and `bd help`; quality improvements should come from the skill, templates, review checks, generated agent guidance, and dogfooding.

Main open product question: how strict should deterministic review become before it feels like documentation busywork? The tool should catch weak project memory without becoming a heavy documentation system.
