---
title: Open Questions View
scope: project
scope_id: project
audience: [developer, designer, business, agent]
status: draft
visibility: private
updated: 2026-06-19
source: manual
---

# Open Questions View

What unresolved questions and open risks are captured across managed Benjamin docs?

## [Guided Export Workflow Handoff](../features/guided-export-workflow/handoff.md)

Source: `benjamin-docs/features/guided-export-workflow/handoff.md` (updated 2026-06-19)

### Risks / Open Questions

- Exported Markdown is regenerated on demand. It does not auto-update while the project changes; source docs stay authoritative and rerunning `bd export` overwrites generated artifacts with fresh metadata.
- Customer readiness checks are deterministic and conservative; agents still need to verify implementation semantics against code.
- The customer profile currently treats private `brief.md` or `handoff.md` as blocking, so agents must make customer-safe source docs unlisted/public before export.
- PDF and hosted publishing remain deferred.
