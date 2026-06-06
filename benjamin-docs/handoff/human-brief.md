---
title: Human Brief
scope: handoff
scope_id: human-brief
audience: [developer, designer, business, advisor]
status: draft
visibility: private
updated: 2026-06-06
source: session-capture
---

# Human Brief

`benjamin-docs` is now a published local-first CLI for turning useful AI chats into durable project docs. The package is public as `benjamin-docs`, installed with `pnpm add -g benjamin-docs`, and currently focuses on local files rather than SaaS.

The product promise is simple: a person or agent can start with a chat or an existing codebase, create a small project notebook, and preserve decisions, plans, risks, open questions, and handoff notes in Markdown. The docs live in the project under `benjamin-docs/`; metadata lives under `.benjamin-docs/`.

Recent work made the first-run story stronger: `chat-project` asks before creating a project from a chat, `init --mode codebase` gives a better baseline prompt, `install-skill` installs the bundled skill for Codex, Cursor, Claude Code, and shared agent skill folders, and `package-skill` creates a Claude Desktop upload zip.

The current quality focus is dogfooding. BD should be its own canonical example: short public README, clear CLI help, useful `introduce`, strict setup checks with `doctor --strict`, and a `review` command that catches placeholder or thin docs.

Main open product question: how strict should BD become before `0.2.0`? The tool should help users notice weak project memory without feeling like a heavy documentation system.
