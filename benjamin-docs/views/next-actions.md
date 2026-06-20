---
title: Next Actions View
scope: project
scope_id: project
audience: [developer, business, agent]
status: draft
visibility: private
updated: 2026-06-20
source: manual
---

# Next Actions View

Derived from next-action and near-term work sections across managed Benjamin docs.

## [Agent Reliability Handoff](../features/agent-reliability/handoff.md)

Source: `benjamin-docs/features/agent-reliability/handoff.md` (updated 2026-06-20)

### Next Actions

- Improve `bd ready` output so failed checks include grouped repair hints.
- Add a guided freshness repair path for agents.
- Add lifecycle closeout polish for shipped or abandoned scopes.
- Run the fresh-agent continuation dogfood exercise.

## [Guided Export Workflow Handoff](../features/guided-export-workflow/handoff.md)

Source: `benjamin-docs/features/guided-export-workflow/handoff.md` (updated 2026-06-20)

### Next Actions

- Finish broad command/help/skill/docs review after the verification command.
- Run focused tests, full `pnpm check`, `review --changed`, and `ready`.
- If checks pass, consider whether to archive or keep this feature scope active for the next export milestones.

## [Roadmap](../project/roadmap.md)

Source: `benjamin-docs/project/roadmap.md` (updated 2026-06-20)

### Immediate Next Work

- Keep the CLI command surface stable. `bd export` is the only new human-facing command promoted for the customer-handoff workflow; keep detailed export flags in advanced/agent guidance.
- Treat the next product arc as agent reliability, not more user workflow. Humans should know only a few obvious commands while agents handle refresh, changed-work review, readiness repair, export verification, scope lifecycle, and customer-safe export preparation.
- Polish the 0.4.x simple path so `bd init` is enough in normal codebase use.
- Dogfood 0.4.x on more real projects and record where the skill produces weak, vague, or overconfident docs.
- Implement 0.5.0 as a continuation-quality milestone: prove that a future human or agent can continue from the docs without the original chat.
- Keep the public README short, direct, and non-enterprise.
- Treat the interactive `commands` drawer as the place for advanced workflows, not as a reason to promote more commands.
- Make the visible project-memory refresh flow `bd init`, `bd views`, then `bd ready`, while keeping `views` out of the primary command list until dogfooding proves it should graduate.
- Publish `0.9.1`, smoke-test a fresh install, update the bundled skill install/zip, tag the release, then dogfood guided exports and Agent Reliability on real projects.
