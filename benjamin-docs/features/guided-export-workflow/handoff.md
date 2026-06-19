---
title: Guided Export Workflow Handoff
scope: feature
scope_id: guided-export-workflow
audience: [developer, agent]
status: review
visibility: private
updated: 2026-06-19
source: manual
freshness: status
---

# Guided Export Workflow Handoff

## Status

In progress. The design and implementation plan are written. The code path has focused tests passing for direct feature exports, typo suggestions, missing feature prompts, readiness blocking, path-like input rejection, feature readiness listing, app documentation export, customer/developer handoff export, project summary export, detail variants, generated snapshot metadata, configurable customer leak phrases, and existing audience exports.

## Risks / Open Questions

- Exported Markdown is regenerated on demand. It does not auto-update while the project changes; source docs stay authoritative and rerunning `bd export` overwrites generated artifacts with fresh metadata.
- Customer readiness checks are deterministic and conservative; agents still need to verify implementation semantics against code.
- The customer profile currently treats private `brief.md` or `handoff.md` as blocking, so agents must make customer-safe source docs unlisted/public before export.
- PDF and hosted publishing remain deferred.

## Next Actions

- Finish command/help/skill/docs updates.
- Run focused tests, full `pnpm check`, `review --changed`, and `ready`.
- If checks pass, consider whether to archive or keep this feature scope active for the next export milestones.

## Continuation Proof

Read first:

- `docs/superpowers/specs/2026-06-19-guided-export-workflow-design.md`
- `docs/superpowers/plans/2026-06-19-guided-export-workflow.md`
- `src/export.ts`
- `src/cli.ts`
- `test/validate-export.test.ts`

Current status: implementation is underway and focused export tests pass. Remaining work is broad verification and any fixes from full checks.

Checks:

```bash
pnpm check
node dist/src/cli.js review --changed --since HEAD
node dist/src/cli.js ready
```
