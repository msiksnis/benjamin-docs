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

0.11.1 is published and verified. Session hooks now compare content against a per-session start baseline, suppress identical pre-existing dirty state, detect further edits to already-dirty files, and preserve the user's answer when a real nudge blocks once. The registry build is installed globally and passed the Atelier dirty-tree smoke.

## Risks / Open Questions

- Agents that omit a session/conversation ID use a project-and-format fallback key, so simultaneous sessions for that tool are not fully isolated.
- Hook commands assume a global `benjamin-docs` install on PATH.
- Codex needs `features.hooks = true` in `~/.codex/config.toml` and hook trust via `/hooks`; the install output explains this.
- Cursor project hooks run automatically for anyone opening the repo; hooks are only written on explicit consent.

## Next Actions

- Keep dogfooding the published hook behavior across supported agents and watch for integrations that omit session identity.

## Continuation Proof

- Read first: `docs/superpowers/specs/2026-07-09-drift-and-session-hooks-design.md`, `src/drift.ts`, `src/hooks.ts`, `src/session.ts`, `src/session-state.ts`.
- Current status: 0.11.1 hook-safety hotfix published, globally installed, and verified against the original Atelier failure mode.
- Checks: `pnpm check`; focused `dist/test/drift-hooks.test.js`; live Atelier baseline smoke using the built CLI with its existing dirty `package.json`.
- Risks: see above; do not weaken the user-content preservation guarantees in `src/hooks.ts`.
- Next: keep dogfooding the published 0.11.1 hook state machine across supported agents.
