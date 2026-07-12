---
title: Agent Continuation View
scope: project
scope_id: project
audience: [agent]
status: draft
visibility: private
updated: 2026-07-12
source: manual
---

# Agent Continuation View

Derived from continuation-proof, read-first, current-state, check, risk, and next-action sections for future agents.

## [Agent Brief](../handoff/agent-brief.md)

Source: `benjamin-docs/handoff/agent-brief.md` (updated 2026-07-12)

### Current State

Benjamin Docs 0.12.0 is published. The lightweight-memory redesign is implemented locally and must be validated before its next release. It replaces mandatory multi-document startup with `project/agent-context.md`, narrows new default watch rules to one or two likely documents, and makes views optional.

### Read First

- Product constraints: `project/brief.md`
- Lightweight redesign code and tests: `src/session-context.ts`, `src/agent-contracts.ts`, `src/watch.ts`, `src/upgrade.ts`, and their focused tests
- Current release history: `releases/changelog.md`

### Commands And Checks

- `pnpm check`
- `pnpm benchmark:agent -- --assert`
- `node dist/src/cli.js views && node dist/src/cli.js ready`

### Next Action

Run the full check suite and an independent burden review before publishing a new version.
