---
title: Open Questions View
scope: project
scope_id: project
audience: [developer, designer, business, agent]
status: draft
visibility: private
updated: 2026-06-20
source: manual
---

# Open Questions View

What unresolved questions and open risks are captured across managed Benjamin docs?

## [Agent Reliability Handoff](../features/agent-reliability/handoff.md)

Source: `benjamin-docs/features/agent-reliability/handoff.md` (updated 2026-06-20)

### Risks / Open Questions

- Verification quality still depends on the agent actually checking the implementation before running the command.
- The command records a single evidence line for now. Future work may need richer structured verification history.
- This should remain an advanced/agent workflow; humans should usually just run `bd export` or ask the agent for an export.
- The daycare export scenario worktree is useful as a test fixture but should not become the normal artifact location pattern.

## [Guided Export Workflow Handoff](../features/guided-export-workflow/handoff.md)

Source: `benjamin-docs/features/guided-export-workflow/handoff.md` (updated 2026-06-20)

### Risks / Open Questions

- Exported Markdown is regenerated on demand. It does not auto-update while the project changes; source docs stay authoritative and rerunning `bd export` overwrites generated artifacts with fresh metadata.
- Customer readiness checks are deterministic and conservative; agents still need to verify implementation semantics against code before recording evidence with `bd export --verify <feature> --evidence "<what was checked>"`.
- The customer profile currently treats private `brief.md` or `handoff.md` as blocking, so agents must make customer-safe source docs unlisted/public before export.
- PDF and hosted publishing remain deferred.
