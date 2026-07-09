---
title: Human Brief
scope: handoff
scope_id: human-brief
audience: [developer, designer, business, advisor]
status: review
visibility: private
updated: 2026-07-09
source: session-capture
freshness: status
---

# Human Brief

`benjamin-docs` is a published local-first CLI and agent skill for persistent project memory. The package is public as `benjamin-docs`; `0.11.0` (the MCP memory server) is currently published on npm. The product focuses on local files rather than SaaS.

0.10.0 makes the memory self-maintaining. `bd drift` tells you which docs fell behind the code they describe, measured against real git history instead of guesses. Session hooks (offered during `bd init`, installable with `bd hooks install`) mean Claude Code, Codex, and Cursor sessions start with project memory loaded automatically and agents get nudged to update the docs when they change code without touching them. For the human, almost nothing new to learn: `init`, `ready`, and `export` remain the core surface, hooks can be removed anytime with `bd hooks uninstall`, and when the CLI updates, one command (`bd upgrade`) catches a repo up — bd itself tells you (through the agent) when a newer version exists, so nobody has to remember to check.

The product promise is simple: every new AI coding session should start with usable context instead of a cold read. BD preserves the project purpose, decisions, progress, conventions, risks, open questions, next actions, and handoff notes in Markdown. The docs live in the project under `benjamin-docs/`; metadata lives under `.benjamin-docs/`.

2026-07-01 positioning update: the public README, npm package description, package keywords, CLI introduction, and bundled skill were tightened after an outside agent misread BD as a documentation package or Markdown helper. The public first impression must now lead with persistent project memory for AI coding agents and living project knowledge that agents read, follow, and update while they work. Markdown remains the storage format, not the core value.

Recent work made the first-run story stronger: `ready` is the primary handoff gate, `export` is the guided local deliverable path, `commands` is an interactive advanced drawer, `bd` is the short alias, agent guidance can be installed into `AGENTS.md` without overwriting existing user-owned instructions, and `install-skill` / `package-skill` distribute the bundled skill.

The current release is 0.11.0, published 2026-07-09: an MCP server that turns the memory into native agent tools — agents search and read exactly the sections they need and write back through validated, roll-back-safe updates. Register per project with `bd mcp install`. This sits on top of the 0.10.0 drift/hooks/upgrade work. BD should turn maintained project memory into concise generated snapshots without making humans learn many commands. Agents should record implementation verification before customer-facing exports and clearly separate local environment/tooling blockers from actual project-memory failures.

Main product constraint: the user workflow must stay simple. The main command surface should remain `bd init`, `bd ready`, `bd export`, and `bd help`; advanced refresh/freshness guidance can point to `bd views`, `bd review --changed`, and direct export flags without making the product feel like a full workspace app.

Important product direction: BD should feel like a safety system for agent-led work. Human users should not have to manage many commands or inspect every diff to trust it; agents should be responsible for maintaining memory, checking freshness, repairing docs, verifying exports against implementation, and using advanced workflows in the background.

Public repo guardrail: private commercial strategy, pricing, and future paid SaaS planning should stay out of tracked Benjamin docs unless the user explicitly says the content is public-safe. Use ignored local folders for private notes.

Main open product question: how strict should deterministic freshness review become before it feels like documentation busywork? The tool should catch stale project memory without requiring docs churn for tiny implementation edits.
