---
title: Agent Reliability Handoff
scope: feature
scope_id: agent-reliability
audience: [developer, agent]
status: archived
visibility: private
updated: 2026-07-10
source: manual
freshness: status
---

# Agent Reliability Handoff

## Status

In progress. The first slice is implemented: agents can record customer-export implementation verification with evidence via `bd export --verify <feature> --evidence "<what was checked>"`. The command updates the feature handoff, and customer feature export still blocks until verification evidence is present. Changed-work review also now skips archived/stale docs when watch rules match source changes, so agents are not asked to refresh inactive feature memory.

The next slice is also implemented: `bd ready` scans Benjamin-managed source docs for recorded local environment/tooling blockers such as missing `cargo`, unavailable `uv`/Bun, or PostgreSQL connection-refused/not-listening notes. It prints those under "Recorded Environment / Tooling Blockers" without failing readiness when validation, review, doctor, and agent guidance are otherwise clean.

The release-hygiene guardrail is implemented for this repo: `pnpm run release:github` verifies the npm version, creates or reuses the matching `vX.Y.Z` tag, pushes it, and creates the GitHub Release; `pnpm run release:verify-public` checks npm, local tag, origin tag, the GitHub Release, and the latest-release pointer. `.github/workflows/release.yml` creates the GitHub Release automatically when a version tag is pushed manually after npm publish.

The public-positioning slice is implemented: README, npm package description/keywords, CLI help/introduce text, tests, and the bundled skill now lead with persistent project memory for AI coding agents, living project knowledge, agent-maintained docs, and focused export packages. This was prompted by an outside agent misreading BD as a generic documentation package or Markdown helper.

The 0.11.1 hook-safety hotfix is published after a Codex screenshot exposed two failures: a pre-existing dirty `package.json` retriggered the stop hook on read-only turns, and the hook continuation replaced the actual answer with memory bookkeeping. Session-start baselines, content fingerprints, per-session cache isolation, fail-open behavior, answer-preserving feedback, regression tests, and Atelier smokes with both the source build and installed registry build passed.

## Risks / Open Questions

- Verification quality still depends on the agent actually checking the implementation before running the command.
- The command records a single evidence line for now. Future work may need richer structured verification history.
- This should remain an advanced/agent workflow; humans should usually just run `bd export` or ask the agent for an export.
- The daycare export scenario worktree is useful as a test fixture but should not become the normal artifact location pattern.
- The environment/tooling detector is pattern-based and depends on agents recording blockers plainly in source docs.
- Release automation depends on npm and GitHub CLI credentials in local maintainer flows; the tag-push GitHub Action is the backup path.
- Public copy can drift back toward "docs helper" language if future edits over-focus on Markdown structure or chat-to-project mechanics. Keep the first screen anchored on project memory, living knowledge, continuity, and the agent-updated workflow.
- Hook integrations that omit a session/conversation ID fall back to project-and-format state, so only ID-bearing integrations have full concurrent-session isolation.

2026-07-09 (later): the memory-interface slice also moved out: the MCP Memory Server scope (`benjamin-docs/features/mcp-memory-server/`) gives agents validated write tools, which advances this arc's reliability goal — agents can no longer corrupt frontmatter or structure through hand edits when they write via MCP.

2026-07-09: the automation slice of this arc shipped separately as the Drift And Session Hooks scope (`benjamin-docs/features/drift-and-session-hooks/`). Drift detection and session hooks now enforce the read-and-update loop mechanically, which removes the biggest reliability dependency on agent discipline.

## Next Actions

- Continue grouped `bd ready` repair hints beyond environment/tooling blockers, especially stale views, watch coverage, missing paths, and setup repair prompts.
- Add a guided freshness repair path for agents.
- Add lifecycle closeout polish for shipped or abandoned scopes.
- Run the fresh-agent continuation dogfood exercise.
- After the next publish, run a fresh first-contact dogfood read of GitHub and npm; passing means the reader describes BD as persistent project memory or living project knowledge for AI coding agents, not a generic docs generator.
- Continue real-session dogfooding of the 0.11.1 hooks across Claude Code, Codex, and Cursor.

## Continuation Proof

Read first:

- `benjamin-docs/project/brief.md`
- `benjamin-docs/project/roadmap.md`
- `benjamin-docs/project/open-questions.md`
- `benjamin-docs/handoff/agent-brief.md`
- `benjamin-docs/features/agent-reliability/plan.md`
- `README.md`
- `package.json`
- `src/info.ts`
- `skills/benjamin-docs/SKILL.md`
- `src/export.ts`
- `src/environment.ts`
- `src/ready.ts`
- `scripts/release-github.mjs`
- `.github/workflows/release.yml`
- `src/cli.ts`
- `test/ready.test.ts`
- `test/validate-export.test.ts`
- `test/info.test.ts`

Current status: first agent reliability slices are implemented and focused tests passed. The slices cover export verification recording, one freshness-noise fix for inactive docs, recorded environment/tooling blocker surfacing in `ready`, release hygiene, and public first-contact positioning. The latest README/npm pass emphasizes that agents read, follow, and update BD memory while they work, while avoiding the false claim that BD is an autonomous background daemon.

Release guard status: implemented and verified against the current public `0.9.2` release. For the prepared `0.9.3` publish, run `pnpm run release:github` after npm publish, then `pnpm run release:verify-public`.

Checks:

```bash
pnpm build
node --test dist/test/ready.test.js
node --test dist/test/validate-export.test.js
node --test dist/test/commands.test.js
node --test dist/test/info.test.js
pnpm run release:verify-public
node dist/src/cli.js review --changed --since HEAD
node dist/src/cli.js ready
```
