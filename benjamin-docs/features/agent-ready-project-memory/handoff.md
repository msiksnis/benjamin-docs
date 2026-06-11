---
title: Agent-Ready Project Memory Handoff
scope: feature
scope_id: agent-ready-project-memory
audience: [developer, agent]
status: archived
visibility: private
updated: 2026-06-11
source: manual
---

# Agent-Ready Project Memory Handoff

## Status

The 0.4.0 feature scope is created and the first implementation slice is complete.

Completed in the first slice:

- Added explicit feature/change and handoff/update workflows to the bundled skill.
- Added a doc-specific Agent-Ready Memory Checklist to the bundled skill.
- Improved starter templates with continuation-oriented headings.
- Added deterministic review checks for untouched feature docs and missing continuation signals.
- Strengthened generated `next` prompts to tell agents to read repo-local guidance/config first.
- Added concise evidence/scope guidance to generated `AGENTS.md` sections.
- Refreshed stale project open questions and human handoff docs.

Dogfood results:

- Self dogfood with `node dist/src/cli.js ready` initially failed because `features/index.md` still contained starter-template wording. Removing the starter phrase made local 0.4.0 review pass.
- Local source skill install was required because global npm is still `0.3.1`; published `bd doctor --strict` will see source-installed skills as stale until the next publish or reinstall.
- `/Users/marty/Important/atelier-beaute` failed the new local 0.4.0 review because `handoff/agent-brief.md` had useful caution/test content but lacked explicit next-action/risk/hazard signals. Adding `Risks / Hazards` and `Next Actions` headings made `review` and `ready` pass.
- A fresh temp `init --mode codebase` correctly fails `ready` with starter-template and continuation warnings. This confirms the new review bar blocks untouched generated docs.

Current branch:

- `codex/simple-agent-ready-setup`

Relevant release state:

- npm latest is `benjamin-docs@0.3.1`.
- 0.3.1 includes the latest published skill guidance.
- This scope is for the next milestone.

## Immediate Next Actions

1. Decide whether to tackle the higher-risk agent guidance requested-but-preserved state.
2. Run a fresh-agent continuation test that only exposes `README.md`, `AGENTS.md`, `.benjamin-docs/`, and `benjamin-docs/`.
3. Run:
   ```bash
   pnpm check
   bd ready
   ```
4. Update this handoff with dogfooding results before publishing 0.4.0.

## Key Constraints

- Do not add new primary commands.
- Preserve `init`, `ready`, `help` as the simple path.
- Put complexity in guidance, templates, review, and the advanced drawer.
- Keep docs useful to non-programmers.
- Do not overwrite user-owned `AGENTS.md`.

## Files To Inspect First

- `skills/benjamin-docs/SKILL.md`
- `src/templates.ts`
- `src/review.ts`
- `src/ready.ts`
- `src/agent-contracts.ts`
- `test/review.test.ts`
- `test/ready.test.ts`
- `test/init.test.ts`

## Completion Bar

Do not call 0.4.0 done until fresh or updated project memory can answer:

- What is this project or feature?
- What changed or was decided?
- Where should the next agent look?
- What commands should it run?
- What risks or constraints should it respect?
- What remains unresolved?
- What should happen next?
