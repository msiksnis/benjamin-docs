---
title: Agent-Ready Project Memory Plan
scope: feature
scope_id: agent-ready-project-memory
audience: [developer, agent]
status: review
visibility: private
updated: 2026-06-10
source: manual
---

# Agent-Ready Project Memory Plan

## Implementation Strategy

Keep the product simple at the surface and deepen the quality underneath.

Primary commands stay:

- `bd init`
- `bd ready`
- `bd help`

Advanced tools remain discoverable through `bd commands`. 0.4.0 should improve what the agent captures, what templates ask for, and what `ready` can reject.

## Phase 1 - Scope And Audit

1. Create this feature scope.
2. Audit current skill, templates, review checks, ready gate, generated AGENTS guidance, and docs.
3. Identify gaps where valid docs can still be poor project memory.
4. Keep a short decision log so the work does not drift into extra commands.

Deliverable: accepted implementation plan and first slice list.

## Phase 2 - Skill Workflow Upgrade

Files:

- `skills/benjamin-docs/SKILL.md`

Work:

- Split workflows clearly into chat-to-project, current-project baseline, feature planning, and handoff update.
- Add a compact "agent-ready memory checklist" the agent must satisfy before `ready`.
- Add explicit rules for evidence, assumptions, risks, and code references.
- Add stronger behavior for improving existing docs safely.
- Keep confirmation-first behavior for chat-created projects.

Acceptance:

- The skill tells an agent exactly what to do without exposing complexity to the user.
- No new command is required for the user.

## Phase 3 - Template Upgrade

Files:

- `src/templates.ts`
- related tests

Work:

- Update starter docs so they ask for continuation-critical content.
- Add stronger placeholders for project brief, roadmap, human handoff, agent handoff, architecture, code map, and feature docs.
- Ensure templates remain readable by non-programmers.

Acceptance:

- Freshly initialized docs guide agents toward concrete memory rather than generic summaries.
- Existing tests pass or are updated to assert the new content.

## Phase 4 - Review And Ready Quality Gates

Files:

- `src/review.ts`
- `src/ready.ts` only if output copy needs adjustment
- tests

Work:

- Add deterministic checks for missing continuation sections in codebase mode.
- Warn when architecture/code-map/handoff docs remain too generic.
- Avoid brittle content policing that blocks valid concise docs.
- Keep `ready` as the single high-level gate.

Acceptance:

- `bd ready` catches docs that are structurally valid but still not useful enough for handoff.
- False positives stay low for short but concrete docs.

## Phase 5 - Agent Guidance Contract Polish

Files:

- `src/agent-contracts.ts`
- tests

Work:

- Make generated root and child `AGENTS.md` guidance more clearly point to project memory, readiness, and safe update behavior.
- Preserve existing `AGENTS.md` behavior. Do not overwrite user-owned guidance.

Acceptance:

- Generated guidance remains short.
- It tells future agents where memory lives, how to use it, and when to run `bd ready`.

## Phase 6 - Dogfood Fixtures

Work:

- Dogfood on `benjamin-docs`.
- Dogfood on `/Users/marty/Important/atelier-beaute`.
- Run one fresh chat-to-project scenario in a temp folder.
- Record failures as plan updates or follow-up issues.

Acceptance:

- At least one external project reaches `bd ready` with improved memory.
- The resulting docs are specific enough for a new agent to continue.

## Phase 7 - Release

Work:

- Bump to `0.4.0`.
- Run `pnpm run release:check`.
- Publish npm package.
- Refresh local global install and skill copies.
- Create GitHub release.

Acceptance:

- npm latest is `0.4.0`.
- `bd doctor --strict` passes on this machine.

## Parallel Agent Use

Use parallel agents for bounded audits only:

- one audit for CLI/templates/review/readiness
- one audit for skill/docs/AGENTS guidance

Implementation edits should remain local unless a task has a clearly disjoint file ownership set.

## First Implementation Slice

Start with Phase 2 plus a small Phase 3/4 supporting change:

1. Add an "Agent-Ready Memory Checklist" to the skill.
2. Update generated baseline templates to include continuation-critical prompts.
3. Add deterministic review warnings for missing continuation context.
4. Verify with `pnpm check` and `bd ready`.
