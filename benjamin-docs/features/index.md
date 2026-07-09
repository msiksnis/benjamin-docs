---
title: Features Index
scope: project
scope_id: project
audience: [developer, designer, agent, business]
status: review
visibility: private
updated: 2026-07-09
source: session-capture
---

# Features Index

This index points to active and historical Benjamin Docs feature scopes. Use it to decide whether new work belongs in an existing scope or needs a focused feature scope.

Because this repository is public, do not create feature scopes for private commercial strategy, pricing, or future paid SaaS planning unless the user explicitly says the content is public-safe. Use ignored local folders for private planning notes.

## Active

- [Agent Reliability](./agent-reliability/brief.md): next product arc for keeping BD simple for humans while agents handle project-memory upkeep, export verification, release hygiene, readiness repair, freshness repair, lifecycle cleanup, public first-contact clarity, hook turn safety, and fresh-agent dogfooding through advanced workflows. Published 0.11.1 prevents repeated dirty-tree nudges and hook-only final answers.

## Shipped (archived)

- [MCP Memory Server](./mcp-memory-server/brief.md): shipped in 0.11.0 and archived. `bd mcp` serves memory as native MCP tools over stdio (context, search, read, transactional validated writes, decisions, status) with manifest-scoped access; `bd mcp install` registers Claude Code, Cursor, and Codex. Dogfooded live before publish.
- [Drift And Session Hooks](./drift-and-session-hooks/brief.md): shipped in 0.10.0 and archived; turn-safety corrections are prepared for 0.11.1. Covers committed-history drift, consent-based Claude Code/Codex/Cursor hooks, per-session content baselines, answer-preserving stop nudges, `bd upgrade`, and the cached opt-out npm update check.
- [Guided Export Workflow](./guided-export-workflow/brief.md): shipped in 0.9.0 and archived after 0.9.2 release prep. Human-facing `bd export` menu, app/feature/handoff/summary Markdown snapshots, readiness labels, detail levels, customer/developer profiles, feature matching, readiness blocks, snapshot metadata, and implementation-verification prompts.
- [Freshness And Lifecycle](./freshness-and-lifecycle/brief.md): shipped in 0.8.0. Stack-agnostic changed-work review, watch-rule coverage warnings for status docs and active feature docs, git churn and path liveness staleness checks, Memory View freshness in the readiness gate, and scope lifecycle status with archived views exclusion.
- [Agent-Ready Project Memory](./agent-ready-project-memory/brief.md): shipped in 0.4.x. Capture quality, agent operating contracts, context maps, and continuation quality.
- [Session Capture](./session-capture/brief.md): early scope for turning chats into project memory; superseded by the bundled skill workflows.
- [Memory Views](./memory-views/brief.md): shipped in 0.5.1. Advanced `bd views` command for derived project-memory lenses.
- [Changed Work Review](./changed-work-review/brief.md): shipped in 0.6.0. Advanced `bd review --changed` freshness check.

Archived scopes keep their docs in place, but they are excluded from generated Memory Views. Reactivate one with `bd scope status <id> review` if work resumes.
