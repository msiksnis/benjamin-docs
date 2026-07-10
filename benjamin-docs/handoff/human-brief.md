---
title: Human Brief
scope: handoff
scope_id: human-brief
audience: [developer, designer, business, advisor]
status: review
visibility: private
updated: 2026-07-10
source: session-capture
freshness: status
---

# Human Brief

The maintainer accepted a trust-first program on 2026-07-10. Benjamin Docs 0.11.1 has a strong project-memory core but should not yet be described as a dependable standard. The first implementation plan is `docs/superpowers/plans/2026-07-10-dependable-standard-trust-foundation.md`, targeting 0.12.0.

The program adds an explicit experience guarantee: BD should remain lightweight while agents use it in the background. Session context, task retrieval, skill size, and hook latency receive numerical release budgets. BD must never replace or materially change the answer an agent gives the user. Reading memory needs no mention; after a meaningful update, the agent may add one very short sentence saying what BD memory changed.

The first four trust-foundation tasks are implemented on the release branch. Readiness is now a structured repository-local report: validation, content heuristics, committed freshness, working-tree impact, and agent guidance are separate checks. Known drift and unresolved changed work block readiness; optional machine setup does not. Planning folders without Git still work, but unexpected drift-analysis failures block rather than masquerading as unavailable Git. Working-tree findings remain visible even if committed-freshness analysis fails. Validation findings appear only under structure. The CLI explicitly says these deterministic checks do not prove that the docs are semantically true.

`benjamin-docs` is a published local-first CLI and agent skill for persistent project memory. The package is public as `benjamin-docs`; `0.11.1` (session-hook turn safety) is currently published on npm. The product focuses on local files rather than SaaS.

0.10.0 added drift checks and session hooks. `bd drift` compares watched docs with committed Git history. Session-start hooks provide compact orientation and point agents to project memory; they do not load or verify every fact automatically. The 0.12.0 plan removes stop-hook continuations so BD maintenance cannot replace or distort the final user response. For humans, the surface stays small: `init`, `status`, and `export`, with advanced checks handled by agents.

The product promise is simple: every new AI coding session should start with usable context instead of a cold read. BD preserves the project purpose, decisions, progress, conventions, risks, open questions, next actions, and handoff notes in Markdown. The docs live in the project under `benjamin-docs/`; metadata lives under `.benjamin-docs/`.

2026-07-01 positioning update: the public README, npm package description, package keywords, CLI introduction, and bundled skill were tightened after an outside agent misread BD as a documentation package or Markdown helper. The public first impression must now lead with persistent project memory for AI coding agents and living project knowledge that agents read, follow, and update while they work. Markdown remains the storage format, not the core value.

Recent work made the first-run story stronger: `ready` is the primary handoff gate, `export` is the guided local deliverable path, `commands` is an interactive advanced drawer, `bd` is the short alias, agent guidance can be installed into `AGENTS.md` without overwriting existing user-owned instructions, and `install-skill` / `package-skill` distribute the bundled skill.

Version 0.11.0 introduced the MCP server that turns memory into native agent tools; 0.11.1 is the current published release. Agents can search and read selected sections and write through structurally validated, rollback-safe updates. Register per project with `bd mcp install`. The trust program will bound retrieval size, distinguish structural checks from semantic evidence, and fail unsafe customer/public exports closed.

The published 0.11.1 hotfix makes the hook behavior match that safety promise: old dirty files no longer trigger repeated warnings on read-only turns, real new changes still get one maintenance pass, and the maintenance continuation must return the complete answer the user asked for.

Main product constraint: the user workflow must stay simple. The main command surface should remain `bd init`, `bd ready`, `bd export`, and `bd help`; advanced refresh/freshness guidance can point to `bd views`, `bd review --changed`, and direct export flags without making the product feel like a full workspace app.

Important product direction: BD should feel like a safety system for agent-led work. Human users should not have to manage many commands or inspect every diff to trust it; agents should be responsible for maintaining memory, checking freshness, repairing docs, verifying exports against implementation, and using advanced workflows in the background.

Public repo guardrail: private commercial strategy, pricing, and future paid SaaS planning should stay out of tracked Benjamin docs unless the user explicitly says the content is public-safe. Use ignored local folders for private notes.

Main open product question: how strict should deterministic freshness review become before it feels like documentation busywork? The tool should catch stale project memory without requiring docs churn for tiny implementation edits.
