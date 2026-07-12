---
title: Agent Brief
scope: handoff
scope_id: agent-brief
audience: [agent]
status: review
visibility: private
updated: 2026-07-12
source: session-capture
freshness: status
---

# Agent Brief

## Current State

Benjamin Docs 0.12.0 is published. The lightweight-memory redesign is implemented locally and must be validated before its next release. It replaces mandatory multi-document startup with `project/agent-context.md`, narrows new default watch rules to one or two likely documents, and makes views optional.

## Read First

- Product constraints: `project/brief.md`
- Lightweight redesign code and tests: `src/session-context.ts`, `src/agent-contracts.ts`, `src/watch.ts`, `src/upgrade.ts`, and their focused tests
- Current release history: `releases/changelog.md`

## Guardrails

- Do not restore recursive startup reading or stop-hook nudges.
- Routine localized changes require no Benjamin maintenance.
- Archive completed feature scopes; active memory keeps only current constraints and unfinished work.

## Commands And Checks

- `pnpm check`
- `pnpm benchmark:agent -- --assert`
- `node dist/src/cli.js views && node dist/src/cli.js ready`

## Next Action

Run the full check suite and an independent burden review before publishing a new version.
