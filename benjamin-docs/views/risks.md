---
title: Risk Register
scope: project
scope_id: project
audience: [developer, business, agent]
status: draft
visibility: private
updated: 2026-07-11
source: manual
---

# Risk Register

Derived from risk, hazard, assumption, and open-question sections across managed Benjamin docs.

## [launch-readiness-audit Handoff](../features/launch-readiness-audit/handoff.md)

Source: `benjamin-docs/features/launch-readiness-audit/handoff.md` (updated 2026-07-11)

### Risks / Open Questions

- The vendor-neutral protocol name remains open; Project Memory Protocol is the working description, not a final brand decision.
- Release Train B must solve false positives before strict readiness is considered low-friction at scale.
- The current 4,264-word skill is a material token cost when activated; the first release train must split it.
- Current task-scoped memory_context measured about 776 estimated tokens in this repo, above the accepted 600-token target.
- Target-specific hook capabilities differ. The safe common denominator is session-start context plus no blocking/follow-up at stop.
- Customer app/handoff/summary and public/user audience exports will be temporarily disabled rather than left unsafe.
- Semantic contradiction detection remains limited until canonical state is implemented; public wording must stay exact meanwhile.
