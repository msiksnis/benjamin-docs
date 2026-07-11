---
title: Project Brief
scope: project
scope_id: project
audience: [developer, designer, business, agent]
status: review
visibility: private
updated: 2026-07-11
source: session-capture
freshness: status
---

# Project Brief

## Dependable Standard Direction

The maintainer accepted the 2026-07-10 launch-audit verdict and trust-first program. Version 0.11.1 is not yet a dependable standard. The immediate target is 0.12.0, implemented through `docs/superpowers/plans/2026-07-10-dependable-standard-trust-foundation.md`.

The agent workflow now has explicit product budgets. Session-start context stays under 400 characters / 100 estimated tokens; task-scoped memory context stays under 2,400 characters / 600 estimated tokens; the core skill stays under 1,200 words; and session-boundary commands have p95 latency gates. BD maintenance must never suppress, replace, delay, or materially rewrite the substantive answer to the user. Reading memory needs no mention; after a durable update, an agent may append one sentence of at most 120 characters.

The program ships in stages: trust foundation; impact evidence; canonical state, typed views, bounded continuation, and mode-specific minimal schemas; agent/MCP interfaces; then a vendor-neutral protocol and conformance suite. Unrelated feature expansion, hosted publishing, dashboards, and additional export types remain deferred until the trust gates pass.

Trust-foundation Tasks 1-10 and Release Train A are complete on the dependable-standard branch. The working package is the unpublished 0.12.0 release candidate. The repository has explicit context and latency budgets, session-start-only integrations, bounded retrieval, truthful structured readiness, target-specific doctor checks, complete Git change accounting, fail-closed customer/public export policy, cross-platform CI, installed-package smoke, and enforced benchmark gates. Public copy states those exact limits, and release automation generates and verifies the complete temporary skill bundle instead of tracking a stale ZIP. Release Train B, Impact Evidence, is next.

Final whole-branch review hardening preserves those boundaries under large and hostile inputs: committed filename enumeration is explicitly bounded and fails closed, publication path scanning is Markdown- and platform-aware, repository-only strict checks never inspect integration state, and target health requires the exact session-start command. `upgrade` remains advanced so the primary human surface is still exactly four commands.

`benjamin-docs` is a persistent repo-local project memory system for AI coding agents and humans. It turns a repo into living project knowledge that agents read, follow, and update while they work, so a new coding session starts with context: what the project is, where work stopped, what decisions and conventions matter, what is risky, and what should happen next.

The public positioning must make that clear in the first few sentences. BD is not a generic documentation package or Markdown helper. Markdown is the storage format; the product is continuity across agent sessions, human handoffs, and implementation work.

V1 is an open-source npm CLI plus Codex/Claude skill. The CLI owns structure, validation, scopes, anchors, guided local exports, and approachable commands. The skill owns synthesis from chat context and should challenge weak plans instead of acting as a passive note taker.

The human-facing command surface is intentionally small: `bd init`, `bd ready`, `bd export`, and `bd help`. Advanced flags and diagnostics remain available through `bd commands` and agent guidance.

The core product model is asymmetric: humans should see a calm, tiny surface and feel safe that project memory is being maintained, while agents carry the richer operating contract. After `bd init`, users should not need to remember refresh, freshness, verification, scope lifecycle, or export-preparation details; agents should know and use those workflows through repo-local guidance, deterministic checks, and advanced commands.

Public entry points now work for both humans and agents. The GitHub README, npm description, CLI `introduce` and help text, command drawer, and bundled skill use the same project-memory framing without claiming that hooks load the whole memory or deterministic checks prove semantic truth. Preserve that exact boundary.

The 0.9.3 release packaged that public positioning for npmjs. Version 0.10.0 added `bd drift` and consent-based session hooks. Drift measures watched docs against committed Git history. Session-start hooks provide compact orientation and pointers; they do not semantically verify or fully load every project fact. Version 0.12.0 will remove blocking/follow-up stop behavior so memory maintenance happens during normal agent work and cannot distort the final answer.

The 0.11.0 release candidate adds the MCP memory server: `bd mcp` exposes the memory as native tools (context, search, read, validated writes, decisions, status) over stdio, registered per project with `bd mcp install` for Claude Code, Cursor, and Codex. Hooks push context into sessions; MCP lets agents pull exactly the sections they need and write back safely. This introduces bd's first runtime dependencies (the official MCP SDK plus zod), an accepted exception to the dependency-light posture.

The 0.11.1 hotfix reduced stop-hook failures by fingerprinting the dirty tree at session start and preserving the user's requested answer during a continuation. The audit found that any blocking stop continuation still cannot guarantee an unchanged final answer. The approved 0.12.0 direction therefore removes blocking and auto-follow-up behavior instead of trying to make it less intrusive.

Agent Reliability now includes clearer handling for local prerequisites. When agents record that project checks are blocked by missing tools or services, such as a command that is not installed or a database that is not listening, `bd ready` surfaces those notes under a dedicated environment/tooling category instead of blending them into generic project failure language.

Release hygiene is now part of that agent-owned operating contract. After npm publish, maintainers/agents should run `pnpm run release:github` and `pnpm run release:verify-public` so the public npm version, git tag, and GitHub Release stay aligned.

Because this repo is public, private commercial strategy, pricing, and future paid SaaS planning should not be captured in tracked Benjamin docs unless the user explicitly marks the content public-safe. Keep that material outside the repo or in ignored local folders.
