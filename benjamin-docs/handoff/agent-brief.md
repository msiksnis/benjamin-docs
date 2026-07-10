---
title: Agent Brief
scope: handoff
scope_id: agent-brief
audience: [agent]
status: review
visibility: private
updated: 2026-07-10
source: session-capture
freshness: status
---

# Agent Brief

## 2026-07-10 Dependable Standard Program

An exhaustive pre-public-launch product, architecture, documentation, AI-agent, developer-experience, open-source, and competitive audit is complete. Read `benjamin-docs/features/launch-readiness-audit/brief.md` before new product work.

Audit verdict: version 0.11.1 has a strong project-memory concept and a safety-conscious CLI foundation, but it is not ready to be presented as a dependable developer standard. Reproduced blockers include false-ready behavior when watched docs are behind committed code, working-tree freshness gaps, unsafe customer export paths, optional global artifacts blocking repository readiness, confidentiality ambiguity around `visibility: private`, pointer-only session loading, and contradictory self-documentation passing current checks.

The maintainer accepted the trust-first direction. The program plan is `benjamin-docs/features/launch-readiness-audit/plan.md`; the first executable plan is `docs/superpowers/plans/2026-07-10-dependable-standard-trust-foundation.md`. Tasks 1-3 established budgets, response-safe session integrations, bounded context retrieval, and drift batching. Task 4 adds structured truthful readiness: committed drift and changed-work impact block independently, `ready --json` exposes stable dimensions, non-Git planning remains usable, and global doctor setup is no longer part of repository readiness. Continue with Task 5 after Task 4 verification lands.

Hard constraints: BD must not suppress, replace, delay, or materially rewrite the substantive user-facing answer; installed stop hooks must not block or auto-submit follow-ups; session-start stays at or below 400 characters / 100 estimated tokens; task memory context stays at or below 2,400 characters / 600 estimated tokens; and the core skill stays at or below 1,200 words. Reading memory needs no mention. After a durable update, an optional BD note is one sentence and at most 120 characters.

## Current State

`benjamin-docs` is a published npm CLI and bundled agent skill for persistent repo-local project memory. It turns a repo into living project knowledge that agents read, follow, and update while they work, so future AI coding sessions start with context instead of a cold read. Markdown in `benjamin-docs/` is the storage format; `.benjamin-docs/` holds deterministic metadata.

The source repo is:

- Local path: `/Users/marty/Important/benjamin-docs`
- GitHub repo: `msiksnis/benjamin-docs`
- Main branch: `main`
- Package/CLI name: `benjamin-docs`
- Package status: `0.11.1` (session-hook turn safety) published on npm, released 2026-07-09.
- Working package version: `0.11.1`; no unreleased runtime work in the tree.

The project has been renamed fully from the earlier working name `agent-docs`; do not reintroduce that name.

## Continuation Proof

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

Next action: execute Task 1 of `docs/superpowers/plans/2026-07-10-dependable-standard-trust-foundation.md` in an isolated worktree, using test-first steps and the benchmark baseline recorded in the plan.

## Implemented So Far

- TypeScript CLI, dependency-light: two runtime dependencies as of 0.11.0 (`@modelcontextprotocol/sdk` and `zod` for the MCP memory server); zero before that.
- Main commands: `init`, `ready`, `export`, `upgrade`, `help`.
- Advanced drawer: `commands`, with numbered interactive selection in real terminals.
- Advanced commands include `status`, `next`, `validate`, `review`, `review --changed`, `drift`, `hooks install|status|uninstall`, `mcp` (serve), `mcp install|status|uninstall`, `session-start`, `session-stop`, `doctor`, `views`, `export --audience <audience>`, `export --list`, `export --feature <slug> --profile <profile>`, `export --type <app|handoff|summary> --profile <profile>`, `scope create feature <slug>`, `scope status <id> <status>`, `anchor add <id> <file>`, `anchor list`, `install-skill`, `package-skill`, and `chat-project`.
- Short binary alias: `bd`.
- Planning-mode docs created by `init`.
- Codebase-mode docs created by `promote --to codebase`.
- Feature-scope templates under `benjamin-docs/features/<slug>/`.
- JSON metadata in `.benjamin-docs/`.
- Validation for frontmatter, metadata, anchors, links, symlink safety, and project-root containment.
- `ready` gate that combines validation, docs review, setup checks, and agent guidance health.
- Root and child `AGENTS.md` support that preserves existing user-owned instructions.
- Export bundles for audience-specific handoff plus guided generated snapshots for feature docs, app docs, customer/developer handoffs, and project summaries.
- Recorded environment/tooling blockers are surfaced in `bd ready` when source docs mention local prerequisites such as missing commands, unavailable tools, or services that are not listening.
- A `skills/benjamin-docs/SKILL.md` file for agent session capture and constructive challenge.

## Recent Decisions

- V1 should be a small CLI plus an agent skill.
- Repo-local docs are the source of truth; hosted publishing is future SaaS, not V1.
- The free/open-source part should help adoption; the SaaS can monetize publishing, sharing, auth, comments, and non-technical editing.
- The tool must work before code exists, after code exists, and for a single feature scope.
- Agents should not only agree with user plans. The skill should preserve intent while naming weak assumptions, unclear decisions, overbuilt V1 scope, and better alternatives.
- Public README now leads with persistent project memory for AI coding agents, living project knowledge, self-updating agent workflow, and focused export packages before deeper setup details.
- Public README setup guidance now leads with pnpm global install and keeps source checkout details under local development.
- The second stranger test focused on a non-code person; README and CLI copy now explain `benjamin-docs` as a local project notebook an AI agent keeps in the project folder.
- Generated `next` prompts now ask for plain language or non-technical readability where appropriate.
- The chat-to-project workflow is a core V1 scenario: when the user only has a chat, the agent should ask for a project location, create the folder, run `benjamin-docs init --mode planning`, write a top-level README, and capture the chat into Benjamin docs.
- Chat-created projects should default to `~/Documents/Benjamin Docs/<Project Name>` with human-readable names, e.g. `~/Documents/Benjamin Docs/Atelier Edits`; avoid agent-specific or dated session folders unless requested.
- Chat-to-project confirmation copy should stay mobile-friendly: short sections, bullets for created files and captured content, and `Reply "yes" to create it`.
- `benjamin-docs@0.4.2` is published on npm and verified from fresh temp-project installs.
- GitHub Releases are backfilled from `v0.5.1` through `v0.9.2`; `v0.9.2` is marked latest and points at the `release: prepare 0.9.2` commit.
- Future package releases should run `pnpm run release:github` immediately after npm publish, then `pnpm run release:verify-public`; a tag-push GitHub Action creates the release if a maintainer pushes the version tag manually.
- The next milestone should focus on high-quality capture behavior, not more primary CLI commands.
- Use pnpm for this project.
- 0.4.1 polish should make `bd init` smart enough for normal codebase use: plain non-interactive init in an obvious codebase defaults to codebase memory with root and child agent guidance. Use `bd init --no-agent-contract` only when automation explicitly wants no repo-local guidance.
- `bd anchor list` was added after dogfooding showed that anchors could be created but not inspected through the CLI.
- 0.4.2 fixed older initialized projects that already have Benjamin docs but have an unmarked root `AGENTS.md`: append a Benjamin-owned section without overwriting the existing guide.
- 0.5.0 should make continuation readiness explicit: `agent-brief.md` must include read-first docs, current state, commands/checks, risks/hazards, and next actions.
- 0.5.1 added Memory Views as an advanced generated lens and documents the refresh flow as `bd init`, `bd views`, then `bd ready`.
- 0.6.0 adds `bd review --changed` after the Atelier audit showed agents may update feature docs while leaving project-level docs stale. The first implementation is deterministic and warning-only.
- 0.7.0 makes the gate trustworthy for any stack: watch rules move the changed-file-to-doc mapping into config, staleness is measured from git facts (churn since engineering docs last changed) and filesystem facts (path liveness), stale Memory Views fail `ready`, and `scope status` archives finished work out of views. All checks stay deterministic; `review` stays read-only.
- 0.8.0 closes the watch-coverage blind spot: status-bearing docs and active feature docs now warn when no watch rule can ever flag them stale, new starter docs carry `freshness: status`, and feature scope creation appends feature-specific watch coverage.
- 2026-06-20 direction: users expect BD to make agent-led development safer as they write and review less code themselves. The CLI should stay simple for humans, while agents use richer commands and repo guidance to maintain, verify, repair, and export project memory.
- 2026-06-20 daycare export dogfood: `/Users/marty/Important/daycare-platform-cloudflare-bd-export-scenarios` is a sibling Git worktree for export scenarios. It is acceptable as an isolated fixture, but not a good normal artifact location because it looks like a duplicate real project. `bd export` itself writes under `exports/` inside the current project root; future scenario worktrees should be clearly temporary or removed after use.
- 2026-06-25 public-repo guardrail: future private commercial strategy, pricing, and paid SaaS planning belongs outside tracked public docs unless the user explicitly marks it public-safe.

## 0.4.x Direction

0.4.x should make Benjamin Docs reliably turn messy chats, new repos, existing codebases, and single feature plans into useful project memory without the user needing to understand the docs structure.

The priority is agent behavior:

- stronger baseline capture
- safer updates to existing Benjamin docs
- better handling of existing or complex `AGENTS.md`
- clearer handoff docs
- direct challenge of weak assumptions and missing decisions

Do not expand the primary command surface unless dogfooding proves a repeated workflow cannot fit under `init`, `ready`, `help`, or the advanced `commands` drawer.

## Public Repo Setup

The GitHub repo is public. Branch protection exists on `main` with:

- required CI status named `CI`
- one required PR approval
- stale reviews dismissed
- code-owner review required
- conversations must be resolved
- linear history required
- force pushes and branch deletion disabled
- admin enforcement disabled so the owner can push directly to `main`

`.github/CODEOWNERS` currently assigns all paths to `@msiksnis`.

## Global Local Setup

The global Codex skill was installed at:

- `/Users/marty/.codex/skills/benjamin-docs/SKILL.md`

The global CLI command was made available as:

- `/Users/marty/Library/pnpm/benjamin-docs`

That shim runs:

```bash
node /Users/marty/Important/benjamin-docs/dist/src/cli.js "$@"
```

This was a temporary local setup while the package was unpublished. The temporary pnpm link used for MCP dogfooding was removed; the global `benjamin-docs` is now registry 0.11.1.

## Important Product Finding From `pup-base`

Testing in `/Users/marty/Important/pet-software/pup-base` exposed an important V1 behavior:

- Existing repos may already have Markdown files under `docs/`.
- `benjamin-docs validate` should validate Benjamin-managed docs listed in `.benjamin-docs/manifest.json`.
- Legacy unmanaged Markdown docs should not fail validation just because they lack Benjamin frontmatter.
- Public V1 now uses `benjamin-docs/` as the default docs root so existing project `docs/` directories stay separate.

This was fixed in commit:

- `ebae0be fix: ignore unmanaged legacy docs during validation`

`pup-base` now validates with the global command and is in codebase mode.

## Next Agent Instructions

When continuing this project:

1. Start in `/Users/marty/Important/benjamin-docs`.
2. Run:
   ```bash
   git status --short
   bd status
   bd ready
   pnpm check
   ```
3. Read these docs first:
   - `benjamin-docs/project/brief.md`
   - `benjamin-docs/project/roadmap.md`
   - `benjamin-docs/project/open-questions.md`
   - `benjamin-docs/handoff/agent-brief.md`
   - `docs/superpowers/specs/2026-06-03-benjamin-docs-design.md`
   - `docs/superpowers/plans/2026-06-03-benjamin-docs-mvp.md`
4. Prefer the `benjamin-docs` MCP tools (memory_context, memory_search, memory_read, memory_update, memory_record_decision, memory_status) over raw file edits when they are available in the session.
5. Keep changes small and practical. This project should remain useful before it becomes clever.
6. If capturing a conversation, update existing docs instead of dumping a transcript.
7. Run `bd ready` and `pnpm check` before reporting completion.

## Likely Next Work

- Complete the 0.12.0 trust-foundation plan task by task.
- Write the impact-evidence plan only after structured readiness and complete Git change accounting are proven.
- Write the canonical-state and agent-interface plans after impact evidence is stable.
- Write the protocol/conformance plan only after canonical-state behavior is stable.
