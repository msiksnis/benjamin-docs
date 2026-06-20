---
title: Guided Export Workflow Plan
scope: feature
scope_id: guided-export-workflow
audience: [developer, agent]
status: archived
visibility: private
updated: 2026-06-20
source: manual
freshness: status
---

# Guided Export Workflow Plan

Implementation follows `docs/superpowers/plans/2026-06-19-guided-export-workflow.md`.

## Steps

- Add tests for direct customer feature export, typo suggestions, missing feature prompts, readiness blocks, and legacy audience export behavior.
- Extend `src/export.ts` with feature discovery, slug/title matching, profile rendering, customer readiness checks, implementation-verification prompts, and Markdown writing under `exports/features/`.
- Extend `src/export.ts` with agent-facing implementation verification recording through `bd export --verify <feature> --evidence "<what was checked>"`.
- Extend `src/export.ts` with readiness labels, app documentation, customer/developer handoffs, project summary exports, snapshot metadata, detail levels, and configurable customer leak phrases.
- Wire `src/cli.ts` so `bd export` opens a guided menu in TTYs and direct flags work for agents/scripts.
- Promote `export` into the main command drawer without exposing every flag in the main README flow.
- Update the bundled skill with the export workflow and implementation-verification rule.
- Update project memory and public docs.

## Validation

- `pnpm build`
- `node --test dist/test/validate-export.test.js`
- `node --test dist/test/commands.test.js dist/test/info.test.js`
- `pnpm check`
- `node dist/src/cli.js review --changed --since HEAD`
- `node dist/src/cli.js ready`
