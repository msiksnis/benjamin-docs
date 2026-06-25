---
title: Human Brief
scope: handoff
scope_id: human-brief
audience: [developer, designer, business, advisor]
status: review
visibility: private
updated: 2026-06-25
source: session-capture
freshness: status
---

# Human Brief

`benjamin-docs` is a published local-first CLI for turning useful AI chats into durable project docs. The package is public as `benjamin-docs`, currently published at `0.9.1`, and focuses on local files rather than SaaS.

The product promise is simple: a person or agent can start with a chat or an existing codebase, create a small project notebook, and preserve decisions, plans, risks, open questions, and handoff notes in Markdown. The docs live in the project under `benjamin-docs/`; metadata lives under `.benjamin-docs/`.

Recent work made the first-run story stronger: `ready` is the primary handoff gate, `export` is the guided local deliverable path, `commands` is an interactive advanced drawer, `bd` is the short alias, agent guidance can be installed into `AGENTS.md` without overwriting existing user-owned instructions, and `install-skill` / `package-skill` distribute the bundled skill.

The current publish target is 0.9.2: the Agent Reliability patch on top of guided export. BD should turn maintained project memory into concise generated snapshots without making humans learn many commands. Agents should record implementation verification before customer-facing exports and clearly separate local environment/tooling blockers from actual project-memory failures.

Main product constraint: the user workflow must stay simple. The main command surface should remain `bd init`, `bd ready`, `bd export`, and `bd help`; advanced refresh/freshness guidance can point to `bd views`, `bd review --changed`, and direct export flags without making the product feel like a full workspace app.

Important product direction: BD should feel like a safety system for agent-led work. Human users should not have to manage many commands or inspect every diff to trust it; agents should be responsible for maintaining memory, checking freshness, repairing docs, verifying exports against implementation, and using advanced workflows in the background.

Public repo guardrail: private commercial strategy, pricing, and future paid SaaS planning should stay out of tracked Benjamin docs unless the user explicitly says the content is public-safe. Use ignored local folders for private notes.

Main open product question: how strict should deterministic freshness review become before it feels like documentation busywork? The tool should catch stale project memory without requiring docs churn for tiny implementation edits.
