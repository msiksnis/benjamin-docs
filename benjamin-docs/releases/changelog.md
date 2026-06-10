---
title: Changelog
scope: release
scope_id: release
audience: [developer, business, public]
status: review
visibility: private
updated: 2026-06-10
source: manual
---

# Changelog

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
