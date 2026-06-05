---
title: Changelog
scope: release
scope_id: release
audience: [developer, business, public]
status: draft
visibility: private
updated: 2026-06-04
source: manual
---

# Changelog

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
