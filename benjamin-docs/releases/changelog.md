---
title: Changelog
scope: release
scope_id: release
audience: [developer, business, public]
status: review
visibility: private
updated: 2026-07-01
source: manual
---

# Changelog

## Unreleased

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
