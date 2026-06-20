---
title: Agent Continuation View
scope: project
scope_id: project
audience: [agent]
status: draft
visibility: private
updated: 2026-06-20
source: manual
---

# Agent Continuation View

Derived from continuation-proof, read-first, current-state, check, risk, and next-action sections for future agents.

## [Agent Reliability Handoff](../features/agent-reliability/handoff.md)

Source: `benjamin-docs/features/agent-reliability/handoff.md` (updated 2026-06-20)

### Risks / Open Questions

- Verification quality still depends on the agent actually checking the implementation before running the command.
- The command records a single evidence line for now. Future work may need richer structured verification history.
- This should remain an advanced/agent workflow; humans should usually just run `bd export` or ask the agent for an export.
- The daycare export scenario worktree is useful as a test fixture but should not become the normal artifact location pattern.
- The environment/tooling detector is pattern-based and depends on agents recording blockers plainly in source docs.

### Next Actions

- Continue grouped `bd ready` repair hints beyond environment/tooling blockers, especially stale views, watch coverage, missing paths, and setup repair prompts.
- Add a guided freshness repair path for agents.
- Add lifecycle closeout polish for shipped or abandoned scopes.
- Run the fresh-agent continuation dogfood exercise.

### Continuation Proof

Read first:

- `benjamin-docs/project/brief.md`
- `benjamin-docs/project/roadmap.md`
- `benjamin-docs/project/open-questions.md`
- `benjamin-docs/handoff/agent-brief.md`
- `benjamin-docs/features/agent-reliability/plan.md`
- `src/export.ts`
- `src/environment.ts`
- `src/ready.ts`
- `src/cli.ts`
- `test/ready.test.ts`
- `test/validate-export.test.ts`

Current status: first agent reliability slices are implemented and focused tests passed. The slices cover export verification recording, one freshness-noise fix for inactive docs, and recorded environment/tooling blocker surfacing in `ready`.

Checks:

```bash
pnpm build
node --test dist/test/ready.test.js
node --test dist/test/validate-export.test.js
node --test dist/test/commands.test.js
node dist/src/cli.js review --changed --since HEAD
node dist/src/cli.js ready
```

## [Agent Brief](../handoff/agent-brief.md)

Source: `benjamin-docs/handoff/agent-brief.md` (updated 2026-06-20)

### Current State

`benjamin-docs` is a published npm CLI and bundled agent skill for repo-local project memory. It turns planning/build conversations into structured Markdown docs in `benjamin-docs/` plus deterministic metadata in `.benjamin-docs/`.

The source repo is:

- Local path: `/Users/marty/Important/benjamin-docs`
- GitHub repo: `msiksnis/benjamin-docs`
- Main branch: `main`
- Package/CLI name: `benjamin-docs`
- Package status: `0.9.1` published on npm.
- Working package version: `0.9.2` for the Agent Reliability patch on top of guided local exports.

The project has been renamed fully from the earlier working name `agent-docs`; do not reintroduce that name.

### Continuation Proof

Read first:

- `README.md`
- `benjamin-docs/project/brief.md`
- `benjamin-docs/project/roadmap.md`
- `benjamin-docs/project/open-questions.md`
- `benjamin-docs/handoff/human-brief.md`
- `docs/superpowers/plans/2026-06-10-continuation-proof.md`

Current state: 0.9.1 is published. The 0.9.2 work is implemented and release checks pass locally: agent export verification recording, guided export menu, feature readiness labels, app/feature/handoff/summary Markdown snapshots, customer/developer profiles, detail levels, snapshot metadata, customer leak checks, regenerated export behavior, changed-work review skipping inactive docs, and `bd ready` surfacing recorded environment/tooling blockers as a non-failing category.

Active change: guided export is being added as the next product step. `bd export` is the human-facing UX. Direct flags such as `bd export --feature <slug> --profile customer`, `bd export --type app --profile customer`, and `bd export --type handoff --profile customer` are for agents and scripts. Exported Markdown files under `exports/` are regenerated snapshots, not maintained source docs. Customer feature exports should be concise Markdown, show readiness before selection, block when docs are not export-ready, and prompt the agent to verify implementation against the docs before exporting.

Product direction: keep humans out of the operational weeds. The user-facing surface should stay very simple and easy to trust; agents should carry the 10x larger command/workflow burden in the background. Future work should make agents reliably update memory after implementation, run freshness and readiness checks, repair stale docs/views/scopes, verify exports against implementation, and use advanced commands without asking the user to manage those details.

Commands/checks to run before handoff:

```bash
pnpm check
node --test dist/test/validate-export.test.js dist/test/commands.test.js dist/test/info.test.js
node dist/src/cli.js review --changed --since HEAD
pnpm run release:check
node dist/src/cli.js ready
```

Risks/hazards: do not add more primary commands beyond the approved `bd export` human path, keep detailed export flags in advanced/agent guidance, keep all review checks deterministic and warning-only inside `review` (only `ready` escalates), keep `review` read-only (checks must not mutate the project), do not overwrite user-owned `AGENTS.md`, do not require exact headings when equivalent continuation evidence exists, and avoid making planning-only projects invent code paths. Freshness coverage warnings should reveal blind spots, not force every tiny code edit to rewrite every doc. Do not imply BD has an autonomous background daemon unless the user's agent environment actually invokes one; instead, make the agent contract and repair commands strong enough that agents do the work when they operate in the repo.

Next actions: publish 0.9.2 from a freshly packed tarball, smoke-test a fresh npm install, tag the release, then dogfood guided exports and Agent Reliability on real projects. After 0.9.2, prioritize fresh-agent dogfood, broader grouped `ready` repair output, guided freshness repair, and feature lifecycle polish.
