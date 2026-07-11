---
title: Changelog
scope: release
scope_id: release
audience: [developer, business, public]
status: review
visibility: private
updated: 2026-07-11
source: manual
---

# Changelog

## Unreleased (0.12.0)

- Added a structured readiness report with stable dimensions for structure, content heuristics, committed freshness, working-tree impact, and agent guidance. `bd ready --json` emits the versioned report for agents and CI.
- `bd ready` now blocks known committed drift and unresolved changed-work findings in their own dimensions. Changed-work warnings no longer masquerade as baseline content warnings, and non-Git planning folders remain usable with non-blocking unavailable freshness dimensions.
- Removed global `doctor --strict` setup from repository readiness. Recorded environment/tooling blockers remain visible but non-blocking, and passing output now states that deterministic checks do not prove semantic truth.
- Readiness no longer duplicates validation errors or warnings under content heuristics. Unexpected drift-analysis exceptions now fail committed freshness closed with actionable evidence; only a verified unavailable Git result can remain non-blocking in planning mode.
- Working-tree availability now comes directly from changed-work review, so unresolved untracked or modified source warnings remain blocking even when committed drift analysis throws.
- Repository readiness is independent from optional machine-wide integrations. `bd doctor --target` checks only the selected integration, and changed-work review now accounts for deletions and repositories without a recognized stack.
- Customer and public exports now share a fail-closed publication preflight. Verified customer feature exports remain available while unsafe app, handoff, summary, and public/user audience paths are disabled.
- Public README, npm metadata, CLI help/introduction, command descriptions, contributor guidance, and security boundaries now describe the exact readiness, response-safe hook, visibility, external-write, and network guarantees.
- Removed the stale tracked Claude skill ZIP. GitHub release automation now generates a temporary skill bundle and verifies `SKILL.md` plus all three references against package sources before creating a release; it does not publish npm.

## 0.11.1

- Session hooks now fingerprint the dirty working tree at session start and nudge only for source content introduced afterward. Pre-existing dirty files no longer retrigger on read-only turns, while further edits to an already-dirty file are still detected.
- Hook state is isolated by project, agent format, and session ID under the local Benjamin Docs home cache. Missing or unreadable baselines fail open, and state older than seven days is pruned.
- Stop-hook feedback now requires the continuation to return a complete answer to the user's original request and forbids hook-only bookkeeping responses.

## 0.11.0

- Added `bd mcp`: an MCP server over stdio exposing project memory as native agent tools — `memory_context`, `memory_search`, `memory_read`, `memory_update`, `memory_record_decision`, `memory_status`. Reads return scored doc sections; writes preserve frontmatter, stamp the updated date, validate transactionally with rollback, and regenerate Memory Views.
- Added `bd mcp install|status|uninstall`: per-project registration for Claude Code (`.mcp.json`), Cursor (`.cursor/mcp.json`), and Codex (`.codex/config.toml` marker block). User config is preserved exactly; uninstall removes only the Benjamin-owned entry.
- Only manifest-managed memory docs are reachable through the server; generated Memory Views are read-only.
- First runtime dependencies: `@modelcontextprotocol/sdk` and `zod`.
- `bd upgrade` now reports MCP registration status.

## 0.10.0

- Added `bd drift`: flags docs whose watched code changed in commits after the doc last changed, using the `watch` rules in `.benjamin-docs/config.json`. Advisory by default, `--strict` for CI gates, `--json` for automation. `bd ready` shows a non-blocking "Drift (advisory)" section.
- Added `bd hooks install|status|uninstall`: agent session hooks for Claude Code (`.claude/settings.json`), Codex (`.codex/hooks.json`), and Cursor (`.cursor/hooks.json`). Existing user hook entries and settings are preserved exactly; uninstall removes only Benjamin-owned entries.
- Added `bd session-start` and `bd session-stop`: compact memory context injected at session start (read-first docs plus drift summary) and a once-per-turn-chain nudge at stop when source changed without a memory update. Per-tool output formats via `--format claude|codex|cursor`.
- Interactive `bd init` now offers session hooks as a consent prompt; automation uses `--hooks` / `--no-hooks`.
- Added `bd upgrade` as a main command: stamps the CLI version into `.benjamin-docs/config.json` (`bdVersion`), refreshes the Benjamin-owned `AGENTS.md` section, refreshes local skill installs, regenerates existing Memory Views, and offers session hooks with consent. `bd ready` and session-start context show an advisory hint when a repo's setup is older than the installed CLI.
- Added a cached, opt-out npm update check: session-start context tells agents when a newer `benjamin-docs` is available so they suggest `pnpm update -g benjamin-docs` plus `bd upgrade`; cache lives under `~/.benjamin-docs/`, refreshes at most daily in a detached background process, and is disabled with `BENJAMIN_DOCS_NO_UPDATE_CHECK=1`.
- Extracted shared git helpers into `src/git.ts`; `review.ts` now reuses them.
- Updated `SECURITY.md` supported-version wording now that versioned GitHub/npm releases exist.

## 0.9.3

- Rewrote the public README around the core value proposition: persistent project memory for AI coding agents and humans.
- Updated npm package metadata, CLI introduction/help text, and bundled skill wording so GitHub, npm, and agent-facing surfaces all emphasize living project knowledge, agent-maintained memory, and focused export packages.
- Added release guardrails so future npm publishes also create and verify the matching version tag and GitHub Release.

## 0.9.2

- Added `bd export --verify <feature> --evidence "<what was checked>"` so agents can record implementation verification before customer-facing feature export.
- Changed-work review now skips archived and stale docs when watch rules match source changes, avoiding update warnings for inactive feature memory.
- Added the Agent Reliability feature scope to track the next product arc: simple human UX, richer agent-led upkeep, verification, repair, and lifecycle workflows.
- `bd ready` now surfaces recorded environment/tooling blockers from Benjamin source docs under a dedicated non-failing category, so agents can report missing local prerequisites such as `cargo` or PostgreSQL separately from BD setup/doc failures.
- Backfilled GitHub Releases from `v0.5.1` through `v0.9.2` so the public release history matches the published npm package versions.

## 0.9.0

- Added `bd export` to the main command surface as the guided local export entrypoint.
- Added guided Markdown exports for full app documentation, feature documentation, customer handoff, developer handoff, and project summary.
- Added direct export flags for agents and scripts: `--list`, `--feature`, `--profile customer|developer`, `--detail brief|standard|detailed`, `--type app|handoff|summary`, and `--include-archived`.
- Added customer and developer feature Markdown exports under `exports/features/`.
- Preserved existing `export --audience <audience>` behavior for audience-filtered bundles.
- Added slug/title feature matching with typo suggestions and missing-feature agent prompts.
- Added feature readiness labels before export: ready, blocked, or archived.
- Added deterministic customer export readiness blocks for private, thin, unverified, path-like, archived, or leak-risky feature docs.
- Added generated snapshot metadata: source docs, latest source-doc update, source commit, dirty state, detail level, and export time.
- Added configurable customer leak phrases through `.benjamin-docs/config.json` `export.blockedPhrases`.
- Documented that generated files under `exports/` are snapshots and should be regenerated with `bd export` after source docs or implementation changes.
- Updated skill guidance so agents verify implementation against docs before customer-facing exports.

## 0.8.0

- Added freshness coverage review: `review` and therefore `ready` now warn when status-bearing docs or active feature docs are not matched by any `watch` rule, because those docs can never be flagged stale by changed work.
- Added optional `freshness: status` frontmatter for docs that carry volatile project state.
- Expanded default `watch` coverage so `init` seeds project brief, roadmap, handoff, feature index, engineering, and changelog docs into the freshness graph instead of covering only engineering docs.
- Updated feature-scope creation so `scope create feature <slug>` appends a feature-specific watch rule for the four feature docs it creates.
- Revised starter handoff templates to discourage repeated volatile counts or phase names; prefer one canonical status source and pointers from durable handoff docs.

## 0.7.0

- Made changed-work review stack-agnostic: changed-file-to-doc mapping now comes from configurable `watch` rules in `.benjamin-docs/config.json`, seeded by `init` with generic defaults for database/schema files, application code, tests, and configuration/workflow files. The previous Supabase- and Next.js-specific hardcoded paths are gone.
- Added a git churn staleness check: `review` (and therefore `ready`) warns when ten or more source files changed since `engineering/architecture.md` or `engineering/code-map.md` last changed in git, unless the doc has uncommitted edits.
- Added a path liveness check: `review` warns when `architecture.md`, `code-map.md`, or `agent-brief.md` reference an inline-code path that no longer exists in the repo.
- Added a Memory View freshness check: `review` warns when generated views no longer match the current source docs, so stale views can no longer pass `ready` silently.
- Replaced project-specific stale-claim patterns with generic ones ("not implemented yet", "does not exist yet") scoped to engineering docs, quoting the full sentence.
- Added `bd scope status <id> <status>` to update a scope's lifecycle status; the status and updated date cascade into the scope's docs.
- Memory Views now exclude archived and stale docs and scopes, group sections under one heading per source doc, order sources by updated date, and only rewrite files whose content changed.
- Upgrade note: the first `review` after upgrading reports existing Memory Views as stale because the renderer changed; run `bd views` once to refresh them.

## 0.6.0

- Added `bd review --changed` / `benjamin-docs review --changed` as an advanced warning-only freshness check for git-changed work that likely needs Benjamin Docs source updates.
- Changed-work review includes untracked files, supports `--since <git-ref>`, warns when source files changed without source-doc updates, warns when git history cannot be inspected, and detects simple stale implementation claims in project-level docs.
- Strengthened generated `AGENTS.md` and the bundled skill so agents review docs impact after code, config, schema, test, workflow, or product behavior changes.

## 0.5.1

- Added `bd views` / `benjamin-docs views` to generate local Memory Views for decisions, open questions, next actions, risks, and agent continuation.
- Kept `views` in the advanced command drawer instead of promoting it into the main command list.
- Made the refresh flow explicit in CLI help, introduction copy, generated `next` prompts, chat-to-project guidance, README, and the bundled skill: `bd init`, `bd views`, then `bd ready`.
- Fixed view extraction so Markdown headings inside fenced Markdown examples are not treated as source sections.

## 0.5.0

- Added Continuation Proof review checks for `handoff/agent-brief.md`.
- `bd ready` now fails when the agent handoff lacks read-first docs, current state, commands/checks, risks/hazards, or next actions.
- Updated starter templates and generated `next` prompts so fresh and older projects are asked for continuation-ready handoff evidence.
- Updated the bundled skill and public README to explain the new readiness bar without adding new primary commands.

## 0.4.2

- Fixed the older-project upgrade path when `benjamin-docs/` already exists but root `AGENTS.md` has no Benjamin-owned section.
- `bd init` now preserves existing unmarked `AGENTS.md` content and appends a clearly marked Benjamin Docs section instead of only suggesting manual cleanup.
- Child guidance is created and indexed when codebase init requests agent guidance with children.
- Broken or duplicate Benjamin markers remain conservative: BD preserves the file and asks for manual cleanup instead of guessing.

## 0.4.1

- Made plain non-interactive `bd init` auto-detect obvious codebases and initialize codebase memory instead of planning mode.
- Made codebase init install repo-local agent guidance by default, including the docs-local child `benjamin-docs/AGENTS.md`.
- Added `bd init --no-agent-contract` for automation that explicitly wants codebase memory without agent guidance.
- Added `bd anchor list` so users and agents can inspect code anchors without opening `.benjamin-docs/anchors.json` directly.
- Added subcommand help for `init`, `anchor`, and `scope`, including support for help flags anywhere in the subcommand args.
- Updated `bd introduce`, public README, and bundled skill guidance so the recommended human path remains `bd init`.

## 0.4.0

- Started the agent-ready project memory milestone.
- Added a dedicated `agent-ready-project-memory` feature scope with brief, plan, decisions, and handoff docs.
- Upgraded the bundled skill with feature/change planning and handoff/update workflows.
- Added a doc-specific Agent-Ready Memory Checklist to the bundled skill.
- Improved generated templates with continuation-oriented headings.
- Added deterministic review checks for weak continuation context, including agent handoff commands, code-map paths, architecture signals, roadmap signals, and feature plan/decision/handoff gaps.
- Strengthened generated `next` prompts to tell agents to read repo-local guidance and `.benjamin-docs/config.json` first.
- Strengthened generated `AGENTS.md` guidance with concise scope and evidence rules.
- Dogfooded the new review behavior on `benjamin-docs` and `/Users/marty/Important/atelier-beaute`.

## 0.3.1

- Tightened the bundled agent skill around existing-project baseline capture, safe updates to existing Benjamin docs, and `AGENTS.md` improvement guidance.
- Saved the 0.4.0 direction as a quality milestone focused on reliable high-quality capture instead of more CLI commands.

## 0.3.0

- Published `benjamin-docs@0.3.0` to npm.
- Added `benjamin-docs ready` as the high-level handoff gate for setup, validation, docs quality, and agent guidance health.
- Simplified the public command surface around `init`, `ready`, and `help`, with `commands` as the advanced command drawer.
- Added the short `bd` binary alias.
- Added root `AGENTS.md` support with Benjamin-owned sections that preserve existing user-owned agent instructions.
- Added child agent guidance support for the Benjamin docs workspace.
- Added safety checks for broken, missing, orphaned, and stale root/child agent guidance.
- Added an interactive numbered `benjamin-docs commands` drawer for real terminals.
- Fixed audience export so only manifest-managed docs are exported, avoiding child `AGENTS.md` parsing failures.
- Verified the release through full package checks, npm publish, GitHub release, and a fresh npm install smoke test.

## 0.1.4

- Added `benjamin-docs package-skill` to create a Claude Desktop / Claude.ai upload ZIP.
- Updated `benjamin-docs doctor` to report whether the default Claude Desktop skill ZIP exists.

## 0.1.3

- Shortened `benjamin-docs introduce` to match the public README and clarify which commands run in terminal.
- Added `benjamin-docs doctor` to check CLI version, installed skill targets, project initialization, docs root, and validation status.

## 0.1.2

- Shortened the public README for GitHub and npm so humans can understand install, usage, and purpose quickly.

## 0.1.1

- Clarified first-chat prompts to say "Use the benjamin-docs skill..." so agents route directly to the chat-to-project workflow.
- Updated `benjamin-docs introduce` and help text to show the skill-based prompt for chat-only project creation.
- Added `benjamin-docs install-skill` to install or update the bundled skill for shared Agent Skills, Codex, Claude Code, and Cursor local skill folders.

## 0.1.0

Initial public package release candidate.

Highlights:

- Repo-local `benjamin-docs/` workspace and `.benjamin-docs/` metadata.
- Planning, codebase, and feature initialization modes.
- `next` prompts for agent-led capture.
- Validation for managed docs, metadata, anchors, links, symlink safety, and root containment.
- Audience exports.
- Agent skill for session capture and chat-to-project workflows.
- Public README focused on chat-to-project, non-code users, and pnpm-first install.
