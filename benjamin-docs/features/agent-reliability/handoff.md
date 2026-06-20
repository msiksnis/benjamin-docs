---
title: Agent Reliability Handoff
scope: feature
scope_id: agent-reliability
audience: [developer, agent]
status: review
visibility: private
updated: 2026-06-20
source: manual
freshness: status
---

# Agent Reliability Handoff

## Status

In progress. The first slice is implemented: agents can record customer-export implementation verification with evidence via `bd export --verify <feature> --evidence "<what was checked>"`. The command updates the feature handoff, and customer feature export still blocks until verification evidence is present. Changed-work review also now skips archived/stale docs when watch rules match source changes, so agents are not asked to refresh inactive feature memory.

## Risks / Open Questions

- Verification quality still depends on the agent actually checking the implementation before running the command.
- The command records a single evidence line for now. Future work may need richer structured verification history.
- This should remain an advanced/agent workflow; humans should usually just run `bd export` or ask the agent for an export.
- The daycare export scenario worktree is useful as a test fixture but should not become the normal artifact location pattern.

## Next Actions

- Improve `bd ready` output so failed checks include grouped repair hints.
- Add a guided freshness repair path for agents.
- Add lifecycle closeout polish for shipped or abandoned scopes.
- Run the fresh-agent continuation dogfood exercise.

## Continuation Proof

Read first:

- `benjamin-docs/project/brief.md`
- `benjamin-docs/project/roadmap.md`
- `benjamin-docs/project/open-questions.md`
- `benjamin-docs/handoff/agent-brief.md`
- `benjamin-docs/features/agent-reliability/plan.md`
- `src/export.ts`
- `src/cli.ts`
- `test/validate-export.test.ts`

Current status: first agent reliability slice is implemented and focused tests passed. The slice covers export verification recording plus one freshness-noise fix for inactive docs.

Checks:

```bash
pnpm build
node --test dist/test/validate-export.test.js
node --test dist/test/commands.test.js
node dist/src/cli.js review --changed --since HEAD
node dist/src/cli.js ready
```
