---
title: Agent Reliability Handoff
scope: feature
scope_id: agent-reliability
audience: [developer, agent]
status: review
visibility: private
updated: 2026-06-25
source: manual
freshness: status
---

# Agent Reliability Handoff

## Status

In progress. The first slice is implemented: agents can record customer-export implementation verification with evidence via `bd export --verify <feature> --evidence "<what was checked>"`. The command updates the feature handoff, and customer feature export still blocks until verification evidence is present. Changed-work review also now skips archived/stale docs when watch rules match source changes, so agents are not asked to refresh inactive feature memory.

The next slice is also implemented: `bd ready` scans Benjamin-managed source docs for recorded local environment/tooling blockers such as missing `cargo`, unavailable `uv`/Bun, or PostgreSQL connection-refused/not-listening notes. It prints those under "Recorded Environment / Tooling Blockers" without failing readiness when validation, review, doctor, and agent guidance are otherwise clean.

The release-hygiene guardrail is implemented for this repo: `pnpm run release:github` verifies the npm version, creates or reuses the matching `vX.Y.Z` tag, pushes it, and creates the GitHub Release; `pnpm run release:verify-public` checks npm, local tag, origin tag, the GitHub Release, and the latest-release pointer. `.github/workflows/release.yml` creates the GitHub Release automatically when a version tag is pushed manually after npm publish.

## Risks / Open Questions

- Verification quality still depends on the agent actually checking the implementation before running the command.
- The command records a single evidence line for now. Future work may need richer structured verification history.
- This should remain an advanced/agent workflow; humans should usually just run `bd export` or ask the agent for an export.
- The daycare export scenario worktree is useful as a test fixture but should not become the normal artifact location pattern.
- The environment/tooling detector is pattern-based and depends on agents recording blockers plainly in source docs.
- Release automation depends on npm and GitHub CLI credentials in local maintainer flows; the tag-push GitHub Action is the backup path.

## Next Actions

- Continue grouped `bd ready` repair hints beyond environment/tooling blockers, especially stale views, watch coverage, missing paths, and setup repair prompts.
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
- `src/environment.ts`
- `src/ready.ts`
- `scripts/release-github.mjs`
- `.github/workflows/release.yml`
- `src/cli.ts`
- `test/ready.test.ts`
- `test/validate-export.test.ts`

Current status: first agent reliability slices are implemented and focused tests passed. The slices cover export verification recording, one freshness-noise fix for inactive docs, and recorded environment/tooling blocker surfacing in `ready`.

Release guard status: implemented and verified against the current public `0.9.2` release.

Checks:

```bash
pnpm build
node --test dist/test/ready.test.js
node --test dist/test/validate-export.test.js
node --test dist/test/commands.test.js
pnpm run release:verify-public
node dist/src/cli.js review --changed --since HEAD
node dist/src/cli.js ready
```
