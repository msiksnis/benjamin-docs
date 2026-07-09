---
title: Agent Continuation View
scope: project
scope_id: project
audience: [agent]
status: draft
visibility: private
updated: 2026-07-09
source: manual
---

# Agent Continuation View

Derived from continuation-proof, read-first, current-state, check, risk, and next-action sections for future agents.

## [Agent Reliability Handoff](../features/agent-reliability/handoff.md)

Source: `benjamin-docs/features/agent-reliability/handoff.md` (updated 2026-07-09)

### Risks / Open Questions

- Verification quality still depends on the agent actually checking the implementation before running the command.
- The command records a single evidence line for now. Future work may need richer structured verification history.
- This should remain an advanced/agent workflow; humans should usually just run `bd export` or ask the agent for an export.
- The daycare export scenario worktree is useful as a test fixture but should not become the normal artifact location pattern.
- The environment/tooling detector is pattern-based and depends on agents recording blockers plainly in source docs.
- Release automation depends on npm and GitHub CLI credentials in local maintainer flows; the tag-push GitHub Action is the backup path.
- Public copy can drift back toward "docs helper" language if future edits over-focus on Markdown structure or chat-to-project mechanics. Keep the first screen anchored on project memory, living knowledge, continuity, and the agent-updated workflow.

2026-07-09: the automation slice of this arc shipped separately as the Drift And Session Hooks scope (`benjamin-docs/features/drift-and-session-hooks/`). Drift detection and session hooks now enforce the read-and-update loop mechanically, which removes the biggest reliability dependency on agent discipline.

### Next Actions

- Continue grouped `bd ready` repair hints beyond environment/tooling blockers, especially stale views, watch coverage, missing paths, and setup repair prompts.
- Add a guided freshness repair path for agents.
- Add lifecycle closeout polish for shipped or abandoned scopes.
- Run the fresh-agent continuation dogfood exercise.
- After the next publish, run a fresh first-contact dogfood read of GitHub and npm; passing means the reader describes BD as persistent project memory or living project knowledge for AI coding agents, not a generic docs generator.

### Continuation Proof

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

## [Drift And Session Hooks Handoff](../features/drift-and-session-hooks/handoff.md)

Source: `benjamin-docs/features/drift-and-session-hooks/handoff.md` (updated 2026-07-09)

### Risks / Open Questions

- The stop nudge repeats on later turns while the working tree has source changes and no doc updates; it goes quiet once any memory doc is touched. Accepted; revisit only if users report nagging.
- Hook commands assume a global `benjamin-docs` install on PATH.
- Codex needs `features.hooks = true` in `~/.codex/config.toml` and hook trust via `/hooks`; the install output explains this.
- Cursor project hooks run automatically for anyone opening the repo; hooks are only written on explicit consent.

### Next Actions

- Publish 0.10.0 following `benjamin-docs/releases/npm-publish-checklist.md` (npm publish, then `pnpm run release:github`, then `pnpm run release:verify-public`).
- Start the MCP server release (`bd mcp`): stdio server exposing memory read/search/write tools via `@modelcontextprotocol/sdk`, with writes validated by the existing `validate.ts` logic.

### Continuation Proof

- Read first: `docs/superpowers/specs/2026-07-09-drift-and-session-hooks-design.md`, `src/drift.ts`, `src/hooks.ts`, `src/session.ts`.
- Current status: feature complete on main working tree, unpublished.
- Checks: `pnpm check`; manual smoke via `bd init --mode codebase --hooks` in a temp git repo, then `bd drift` after a committed source change.
- Risks: see above; do not weaken the user-content preservation guarantees in `src/hooks.ts`.
- Next: publish 0.10.0, then design `bd mcp`.

## [Agent Brief](../handoff/agent-brief.md)

Source: `benjamin-docs/handoff/agent-brief.md` (updated 2026-07-09)

### Current State

`benjamin-docs` is a published npm CLI and bundled agent skill for persistent repo-local project memory. It turns a repo into living project knowledge that agents read, follow, and update while they work, so future AI coding sessions start with context instead of a cold read. Markdown in `benjamin-docs/` is the storage format; `.benjamin-docs/` holds deterministic metadata.

The source repo is:

- Local path: `/Users/marty/Important/benjamin-docs`
- GitHub repo: `msiksnis/benjamin-docs`
- Main branch: `main`
- Package/CLI name: `benjamin-docs`
- Package status: `0.9.3` published on npm; `0.10.0` implemented and prepared for the next npm publish.
- Working package version: `0.10.0` (drift detection plus agent session hooks).

The project has been renamed fully from the earlier working name `agent-docs`; do not reintroduce that name.

### Continuation Proof

Read first:

- `README.md`
- `benjamin-docs/project/brief.md`
- `benjamin-docs/project/roadmap.md`
- `benjamin-docs/project/open-questions.md`
- `benjamin-docs/handoff/human-brief.md`
- `docs/superpowers/plans/2026-06-10-continuation-proof.md`

Current state: 0.9.3 is published. The working tree carries `0.10.0`: `bd drift` (committed-history drift detection over watch rules, advisory in `bd ready`, `--json`/`--strict`), `bd hooks install|status|uninstall` (session hooks for Claude Code, Codex, Cursor with strict user-content preservation), `bd session-start`/`bd session-stop` (compact context injection and once-per-turn-chain update nudge), and init hook consent (`--hooks`/`--no-hooks`, interactive prompt). Design spec: `docs/superpowers/specs/2026-07-09-drift-and-session-hooks-design.md`; feature memory: `benjamin-docs/features/drift-and-session-hooks/`. 0.10.0 also includes `bd upgrade` (main command; catches old repos up by stamping `bdVersion` into config and refreshing Benjamin-owned surfaces) and a cached opt-out npm update check surfaced through session-start context and `ready`. The approved next arc after publishing is an MCP server (`bd mcp`) using the official `@modelcontextprotocol/sdk`. The 0.9.2 work includes agent export verification recording, guided export menu, feature readiness labels, app/feature/handoff/summary Markdown snapshots, customer/developer profiles, detail levels, snapshot metadata, customer leak checks, regenerated export behavior, changed-work review skipping inactive docs, and `bd ready` surfacing recorded environment/tooling blockers as a non-failing category.

2026-07-01 public-positioning update: the README was rewritten, `package.json` description/keywords were adjusted, CLI `introduce`/help copy was aligned, and the bundled skill purpose was tightened because an outside agent misread BD as a documentation package or Markdown helper. Preserve the first-impression framing: persistent project memory for AI coding agents, living project knowledge, and agent-maintained docs. Do not let public copy drift back to "turn chats into docs" as the headline value.

Recent change: public-facing copy was sharpened again so GitHub and npm show the self-updating workflow above the fold: agents read the memory, work from it, and update it after meaningful changes. The copy also keeps the accuracy caveat that BD is not a background daemon. The guided export product remains implemented: `bd export` is the human-facing UX, while direct flags such as `bd export --feature <slug> --profile customer`, `bd export --type app --profile customer`, and `bd export --type handoff --profile customer` are for agents and scripts. Exported Markdown files under `exports/` are regenerated snapshots, not maintained source docs. Customer feature exports should be concise Markdown, show readiness before selection, block when docs are not export-ready, and prompt the agent to verify implementation against the docs before exporting.

Product direction: keep humans out of the operational weeds. The user-facing surface should stay very simple and easy to trust; agents should carry the 10x larger command/workflow burden in the background. Future work should make agents reliably update memory after implementation, run freshness and readiness checks, repair stale docs/views/scopes, verify exports against implementation, and use advanced commands without asking the user to manage those details.

Public repo guardrail: do not capture private commercial strategy, pricing, or future paid SaaS planning in tracked Benjamin docs unless the user explicitly says the content is public-safe. Keep private planning outside the repo or under ignored local folders such as `.private/`, `private-notes/`, `commercial-strategy/`, or `saas-strategy/`.

Commands/checks to run before handoff:

```bash
pnpm check
node --test dist/test/validate-export.test.js dist/test/commands.test.js dist/test/info.test.js
node dist/src/cli.js review --changed --since HEAD
pnpm run release:check
pnpm run release:verify-public
node dist/src/cli.js ready
```

Risks/hazards: do not add more primary commands beyond the approved `bd export` human path, keep detailed export flags in advanced/agent guidance, keep all review checks deterministic and warning-only inside `review` (only `ready` escalates), keep `review` read-only (checks must not mutate the project), do not overwrite user-owned `AGENTS.md`, do not require exact headings when equivalent continuation evidence exists, and avoid making planning-only projects invent code paths. Freshness coverage warnings should reveal blind spots, not force every tiny code edit to rewrite every doc. Do not imply BD has an autonomous background daemon unless the user's agent environment actually invokes one; instead, make the agent contract and repair commands strong enough that agents do the work when they operate in the repo.

Next actions: publish `0.10.0`, then run `pnpm run release:github` and `pnpm run release:verify-public`. Dogfood drift and session hooks on real projects (watch for stop-nudge nagging and `benjamin-docs`-not-on-PATH hook failures). Then design the MCP server release: stdio server exposing memory read/search/write tools, writes validated by the existing `validate.ts` logic.
