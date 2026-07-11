---
title: Human Brief
scope: handoff
scope_id: human-brief
audience: [developer, designer, business, advisor]
status: review
visibility: private
updated: 2026-07-11
source: session-capture
freshness: status
---

# Human Brief

The maintainer accepted a trust-first program on 2026-07-10. Benjamin Docs 0.11.1 is still the published release; the working branch now contains the implemented, audited 0.12.0 trust-foundation release candidate. It should not yet be described as a dependable standard.

The program adds an explicit experience guarantee: BD should remain lightweight while agents use it in the background. Session context, task retrieval, skill size, and hook latency receive numerical release budgets. BD must never replace or materially change the answer an agent gives the user. Reading memory needs no mention; after a meaningful update, the agent may add one very short sentence saying what BD memory changed.

The trust foundation is implemented on the release branch. Readiness reports independent deterministic dimensions; optional setup is target-specific; deletions and every repository stack are covered; customer/public exports fail closed through one preflight; and public claims match the actual guarantees. Session hooks supply bounded pointers and cannot replace the substantive answer. Cross-platform CI, packed-package smoke, and performance gates are enforced. All ten audit reproductions passed; no publish, tag, push, or GitHub Release was performed.

The final branch review also verified the awkward edge cases: very large committed diffs and real Git analysis failures cannot silently look current, Git failure classification is stable across machine locales, legitimate no-history planning remains usable, local home paths are rejected even with mixed Windows case or ordinary Markdown punctuation, repository health does not depend on readable global tool state, and Claude Code/Codex hook repair removes only malformed Benjamin-owned commands while preserving unrelated group settings and nested user hooks exactly. The visible human command set remains `init`, `ready`, `export`, and `help`.

The 0.12.0 update path is now one instruction: after updating the package, run `bd upgrade` once in each initialized repository. It refreshes Benjamin-owned project metadata, agent guidance, the current skill bundle, existing Memory Views, and Claude Code/Codex/Cursor session-start hooks. It removes legacy Benjamin stop hooks while preserving user-owned configuration. No separate hook command is required; use `bd upgrade --no-hooks` only when the environment must opt out.

The repository version stamp changes only after required skill and hook work succeeds. If a parseable user hook file has an incompatible structure, BD preserves it unchanged, reports the target failure, and keeps the older version visible for repair.

When a legacy Benjamin stop command shares a group with user settings or nested hooks, upgrade removes only the Benjamin-owned command and keeps the user data.

Cursor uses a flat hook format, so its stale Benjamin entries are removed whole rather than left as commandless objects.

`benjamin-docs` is a published local-first CLI and agent skill for persistent project memory. The package is public as `benjamin-docs`; `0.11.1` (session-hook turn safety) is currently published on npm. The product focuses on local files rather than SaaS.

0.10.0 added drift checks and session hooks. `bd drift` compares watched docs with committed Git history. Session-start hooks provide compact orientation and point agents to project memory; they do not load or verify every fact automatically. The 0.12.0 candidate removes stop-hook continuations so BD maintenance cannot replace or distort the final user response. For humans, the surface stays small: `init`, `ready`, `export`, and `help`, with advanced checks handled by agents.

The product promise is simple: every new AI coding session should start with usable context instead of a cold read. BD preserves the project purpose, decisions, progress, conventions, risks, open questions, next actions, and handoff notes in Markdown. The docs live in the project under `benjamin-docs/`; metadata lives under `.benjamin-docs/`.

2026-07-01 positioning update: the public README, npm package description, package keywords, CLI introduction, and bundled skill were tightened after an outside agent misread BD as a documentation package or Markdown helper. The public first impression must now lead with persistent project memory for AI coding agents and living project knowledge that agents read, follow, and update while they work. Markdown remains the storage format, not the core value.

Recent work made the first-run story stronger: `ready` is the primary handoff gate, `export` is the guided local deliverable path, `commands` is an interactive advanced drawer, `bd` is the short alias, agent guidance can be installed into `AGENTS.md` without overwriting existing user-owned instructions, and `install-skill` / `package-skill` distribute the bundled skill.

Version 0.11.0 introduced the MCP server that turns memory into native agent tools; 0.11.1 remains the current published release. Agents can search and read selected sections and write through structurally validated, rollback-safe updates. Register per project with `bd mcp install`. The 0.12.0 candidate bounds retrieval size, distinguishes structural checks from semantic evidence, and fails unsafe customer/public exports closed.

The published 0.11.1 hotfix makes the hook behavior match that safety promise: old dirty files no longer trigger repeated warnings on read-only turns, real new changes still get one maintenance pass, and the maintenance continuation must return the complete answer the user asked for.

Main product constraint: the user workflow must stay simple. The main command surface should remain `bd init`, `bd ready`, `bd export`, and `bd help`; advanced refresh/freshness guidance can point to `bd views`, `bd review --changed`, and direct export flags without making the product feel like a full workspace app.

Important product direction: BD should feel like a safety system for agent-led work. Human users should not have to manage many commands or inspect every diff to trust it; agents should be responsible for maintaining memory, checking freshness, repairing docs, verifying exports against implementation, and using advanced workflows in the background.

Public repo guardrail: private commercial strategy, pricing, and future paid SaaS planning should stay out of tracked Benjamin docs unless the user explicitly says the content is public-safe. Use ignored local folders for private notes.

Next work is deliberately sequenced: Impact Evidence to avoid meaningless docs churn; canonical state, typed views, bounded continuation, and mode-specific minimal schemas; agent/MCP interfaces; then the public protocol and conformance suite. The main open product question remains how strict deterministic freshness should become without turning into documentation busywork.
