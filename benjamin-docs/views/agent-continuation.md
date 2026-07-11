---
title: Agent Continuation View
scope: project
scope_id: project
audience: [agent]
status: draft
visibility: private
updated: 2026-07-11
source: manual
---

# Agent Continuation View

Derived from continuation-proof, read-first, current-state, check, risk, and next-action sections for future agents.

## [launch-readiness-audit Handoff](../features/launch-readiness-audit/handoff.md)

Source: `benjamin-docs/features/launch-readiness-audit/handoff.md` (updated 2026-07-12)

### Risks / Open Questions

- The vendor-neutral protocol name remains open; Project Memory Protocol is the working description, not a final brand decision.
- Release Train B must solve false positives before strict readiness is considered low-friction at scale.
- Target-specific hook capabilities differ. The safe common denominator is session-start context plus no blocking/follow-up at stop.
- Customer app/handoff/summary and public/user audience exports remain intentionally disabled until the publication schema exists.
- Semantic contradiction detection remains limited until canonical state is implemented; public wording must stay exact meanwhile.

### Continuation Proof

Read first:

- benjamin-docs/features/launch-readiness-audit/brief.md
- benjamin-docs/features/launch-readiness-audit/plan.md
- benjamin-docs/features/launch-readiness-audit/decisions.md
- docs/superpowers/plans/2026-07-10-dependable-standard-trust-foundation.md
- benjamin-docs/features/launch-readiness-audit/handoff.md

Before follow-on implementation:

- git status --short --branch
- pnpm check
- pnpm benchmark:agent-overhead -- --assert
- node dist/src/cli.js ready

Before every implementation handoff:

- run the focused tests named by the task;
- run pnpm check;
- run the benchmark after agent-context/hook changes;
- update the smallest durable Benjamin source docs;
- run views, review --changed, drift, and ready;
- preserve the substantive user-facing response and keep any BD note to one short sentence.

## [Agent Brief](../handoff/agent-brief.md)

Source: `benjamin-docs/handoff/agent-brief.md` (updated 2026-07-12)

### Current State

`benjamin-docs` is a published npm CLI and bundled agent skill for persistent repo-local project memory. It turns a repo into living project knowledge that agents read, follow, and update while they work, so future AI coding sessions start with context instead of a cold read. Markdown in `benjamin-docs/` is the storage format; `.benjamin-docs/` holds deterministic metadata.

The source repo is:

- Local path: `/Users/marty/Important/benjamin-docs`
- GitHub repo: `msiksnis/benjamin-docs`
- Main branch: `main`
- Package/CLI name: `benjamin-docs`
- Package status: `0.11.1` (session-hook turn safety) published on npm, released 2026-07-09.
- Working package version: `0.12.0` release candidate; unpublished.

The project has been renamed fully from the earlier working name `agent-docs`; do not reintroduce that name.

### Continuation Proof

Read first:

- `README.md`
- `benjamin-docs/project/brief.md`
- `benjamin-docs/project/roadmap.md`
- `benjamin-docs/project/open-questions.md`
- `benjamin-docs/handoff/human-brief.md`
- `docs/superpowers/plans/2026-06-10-continuation-proof.md`

Current state: 0.11.1 is published (2026-07-09; npm, git tag, and GitHub Release verified in sync). 0.10.0 shipped committed-history drift detection via `bd drift`, session hooks for Claude Code/Codex/Cursor, `bd session-start`/`bd session-stop`, `bd upgrade`, and the cached opt-out npm update check (spec: `docs/superpowers/specs/2026-07-09-drift-and-session-hooks-design.md`; feature memory: `benjamin-docs/features/drift-and-session-hooks/`, archived). 0.11.0 added the MCP memory server (`bd mcp` serving memory_context/search/read/update/record_decision/status over stdio via the official SDK, with manifest-scoped access and transactional validated writes) plus `bd mcp install|status|uninstall` registration for Claude Code, Cursor, and Codex — design spec: `docs/superpowers/specs/2026-07-09-mcp-memory-server-design.md`; feature memory: `benjamin-docs/features/mcp-memory-server/`, archived after publish. The MCP tools were dogfooded live from a Claude Code session in this repo before publish, including a verified rollback of an invalid write. Earlier 0.9.x work (guided exports, export verification recording, readiness blockers as a non-failing category) remains included.

0.11.1 fixes session-hook turn safety after a real Codex failure in Atelier. `src/session-state.ts` stores content-fingerprinted start baselines in the local BD home cache, keyed by project/tool/session; stop only reacts to new content, acknowledges identical pending state, and fails open without a baseline. The nudge now requires a complete answer to the original request and forbids hook-only bookkeeping. The focused 23-test hook suite passes, and the built CLI stayed silent against Atelier's existing dirty `package.json` after session start.

Release update: 0.11.1 is now published, tagged as `v0.11.1`, and verified as the latest GitHub Release. The registry package is installed globally and a second Atelier smoke using that registry build passed with no false stop output.

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

Next action: write the Impact Evidence Plan. It must add durable doc-updated/no-doc-impact/deferred/blocker acknowledgements keyed to commit and content identity without weakening strict readiness or exceeding the response, latency, token, and human-surface budgets. Only after that interface is proven should work proceed to canonical state, typed views, bounded continuation, and mode-specific minimal schemas; then agent/MCP interfaces; then protocol/conformance.
