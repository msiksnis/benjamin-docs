---
title: Drift And Session Hooks Decisions
scope: feature
scope_id: drift-and-session-hooks
audience: [developer, agent]
status: archived
visibility: private
updated: 2026-07-09
source: session-capture
freshness: status
---

# Drift And Session Hooks Decisions

## Decisions

- Drift measures committed history only (`lastDocCommit..HEAD`) because uncommitted work is the current session's business and already covered by `review --changed`. The first dogfood run flagged 11 docs from uncommitted edits, which confirmed the noise problem.
- Drift is advisory and never blocks `ready`; `--strict` exists for CI gates that want exit 1. Broad default watch rules would make a blocking check flap on every code commit.
- The doc-to-code linkage is the existing `watch` rules in `.benjamin-docs/config.json`, so `review --changed`, freshness coverage, and drift stay consistent.
- Staged shipping (owner decision): drift + hooks in 0.10.0, MCP server next release using the official `@modelcontextprotocol/sdk` (first runtime dependency accepted).
- Hook targets are Claude Code + Codex + Cursor from the start (owner decision). Codex uses the Claude-compatible hooks schema; Cursor uses its camelCase schema with `additional_context` and `loop_limit: 1`.
- Hook ownership marker: the command string contains `benjamin-docs session-`. Install merges, uninstall removes only marked entries, unparseable files are preserved and reported as skipped.
- The stop nudge fires at most once per turn chain (`stop_hook_active` guard / `loop_limit`), and agent-config paths (`.claude/`, `.codex/`, `.cursor/`, `AGENTS.md`) do not count as source changes, so installing hooks does not itself trigger a nudge.
- Consent is explicit: interactive `init` asks; non-interactive `init` without `--hooks` does not install hooks. This is the one-time consent moment for background memory maintenance.
- Upgrades are pull-plus-nudge, not self-update: bd never updates its own global install. Agents relay "newer version available" from cached update checks; the human runs the package manager; `bd upgrade` then refreshes repo-local Benjamin-owned surfaces only.
- The update check is privacy-conservative: one version GET, 24h cache, never in a command's critical path (`session-start` reads cache and spawns a detached refresh), `BENJAMIN_DOCS_NO_UPDATE_CHECK=1` disables it entirely.
- `bd upgrade` refreshes the `AGENTS.md` section only when balanced Benjamin markers already exist; repos that never opted into agent guidance stay untouched.

## Rejected Options

- Counting working-tree changes as drift (noisy while work is in progress).
- A new doc-to-code mapping format separate from watch rules.
- One combined release with the MCP server.
- Hand-rolling the MCP stdio protocol to stay zero-dependency (protocol churn risk outweighs the dependency).
- JSON marker comments for hook ownership (JSON has no comments; command-string marker instead).
- Auto-updating the global package from hooks or upgrade (changes the user's machine without consent).
- Live update fetches inside `session-start` (would add network latency to every session start; cache-read plus detached refresh instead).
