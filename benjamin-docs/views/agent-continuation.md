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

2026-07-09 (later): the memory-interface slice also moved out: the MCP Memory Server scope (`benjamin-docs/features/mcp-memory-server/`) gives agents validated write tools, which advances this arc's reliability goal — agents can no longer corrupt frontmatter or structure through hand edits when they write via MCP.

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

## [Agent Brief](../handoff/agent-brief.md)

Source: `benjamin-docs/handoff/agent-brief.md` (updated 2026-07-09)

### Current State

`benjamin-docs` is a published npm CLI and bundled agent skill for persistent repo-local project memory. It turns a repo into living project knowledge that agents read, follow, and update while they work, so future AI coding sessions start with context instead of a cold read. Markdown in `benjamin-docs/` is the storage format; `.benjamin-docs/` holds deterministic metadata.

The source repo is:

- Local path: `/Users/marty/Important/benjamin-docs`
- GitHub repo: `msiksnis/benjamin-docs`
- Main branch: `main`
- Package/CLI name: `benjamin-docs`
- Package status: `0.11.0` (MCP memory server) published on npm, released 2026-07-09.
- Working package version: `0.11.0`; no unreleased work in the tree.

The project has been renamed fully from the earlier working name `agent-docs`; do not reintroduce that name.

### Continuation Proof

Read first:

- `README.md`
- `benjamin-docs/project/brief.md`
- `benjamin-docs/project/roadmap.md`
- `benjamin-docs/project/open-questions.md`
- `benjamin-docs/handoff/human-brief.md`
- `docs/superpowers/plans/2026-06-10-continuation-proof.md`

Current state: 0.11.0 is published (2026-07-09; npm, git tag, and GitHub Release verified in sync). 0.10.0 shipped committed-history drift detection via `bd drift`, session hooks for Claude Code/Codex/Cursor, `bd session-start`/`bd session-stop`, `bd upgrade`, and the cached opt-out npm update check (spec: `docs/superpowers/specs/2026-07-09-drift-and-session-hooks-design.md`; feature memory: `benjamin-docs/features/drift-and-session-hooks/`, archived). 0.11.0 added the MCP memory server (`bd mcp` serving memory_context/search/read/update/record_decision/status over stdio via the official SDK, with manifest-scoped access and transactional validated writes) plus `bd mcp install|status|uninstall` registration for Claude Code, Cursor, and Codex — design spec: `docs/superpowers/specs/2026-07-09-mcp-memory-server-design.md`; feature memory: `benjamin-docs/features/mcp-memory-server/`, archived after publish. The MCP tools were dogfooded live from a Claude Code session in this repo before publish, including a verified rollback of an invalid write. Earlier 0.9.x work (guided exports, export verification recording, readiness blockers as a non-failing category) remains included.

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

Risks/hazards: do not add more primary commands beyond the approved `bd export` human path, keep detailed export flags in advanced/agent guidance, keep all review checks deterministic and warning-only inside `review` (only `ready` escalates), keep `review` read-only (checks must not mutate the project), do not overwrite user-owned `AGENTS.md`, do not require exact headings when equivalent continuation evidence exists, and avoid making planning-only projects invent code paths. Freshness coverage warnings should reveal blind spots, not force every tiny code edit to rewrite every doc. Do not imply BD has an autonomous background daemon unless the user's agent environment actually invokes one; instead, make the agent contract and repair commands strong enough that agents do the work when they operate in the repo. Keep MCP tool access manifest-scoped; never widen it to arbitrary repo files.

Next actions: dogfood 0.10.0/0.11.0 on other real projects (`bd upgrade`, `bd hooks install`, `bd mcp install`), watch MCP retrieval quality on larger memories, and pick the next arc from the roadmap when feedback accumulates. This repo's global `benjamin-docs` is the registry 0.11.0 again (the temporary pnpm link was removed after publish).
