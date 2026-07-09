---
title: Drift And Session Hooks Handoff
scope: feature
scope_id: drift-and-session-hooks
audience: [developer, agent]
status: archived
visibility: private
updated: 2026-07-09
source: session-capture
freshness: status
---

# Drift And Session Hooks Handoff

## Status

Implemented and tested for 0.10.0, including the follow-up `bd upgrade` command and the cached npm update check. Code, tests, skill, README, help text, and project memory are updated. Version bumped to 0.10.0. Not yet published to npm.

## Risks / Open Questions

- The stop nudge repeats on later turns while the working tree has source changes and no doc updates; it goes quiet once any memory doc is touched. Accepted; revisit only if users report nagging.
- Hook commands assume a global `benjamin-docs` install on PATH.
- Codex needs `features.hooks = true` in `~/.codex/config.toml` and hook trust via `/hooks`; the install output explains this.
- Cursor project hooks run automatically for anyone opening the repo; hooks are only written on explicit consent.

## Next Actions

- Publish 0.10.0 following `benjamin-docs/releases/npm-publish-checklist.md` (npm publish, then `pnpm run release:github`, then `pnpm run release:verify-public`).
- Start the MCP server release (`bd mcp`): stdio server exposing memory read/search/write tools via `@modelcontextprotocol/sdk`, with writes validated by the existing `validate.ts` logic.

## Continuation Proof

- Read first: `docs/superpowers/specs/2026-07-09-drift-and-session-hooks-design.md`, `src/drift.ts`, `src/hooks.ts`, `src/session.ts`.
- Current status: feature complete on main working tree, unpublished.
- Checks: `pnpm check`; manual smoke via `bd init --mode codebase --hooks` in a temp git repo, then `bd drift` after a committed source change.
- Risks: see above; do not weaken the user-content preservation guarantees in `src/hooks.ts`.
- Next: publish 0.10.0, then design `bd mcp`.
