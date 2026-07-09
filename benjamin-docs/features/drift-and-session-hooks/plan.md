---
title: Drift And Session Hooks Plan
scope: feature
scope_id: drift-and-session-hooks
audience: [developer, agent]
status: approved
visibility: private
updated: 2026-07-09
source: session-capture
freshness: status
---

# Drift And Session Hooks Plan

Shipped in 0.10.0. Full design: `docs/superpowers/specs/2026-07-09-drift-and-session-hooks-design.md`; step plan: `docs/superpowers/plans/2026-07-09-drift-and-session-hooks.md`.

## Steps

- `src/git.ts`: shared git helpers extracted from `src/review.ts` (`getChangedFiles`, `getCommittedChanges`, `gitLastCommit`, `gitCommitCountTouching`, `isReviewableSourceChange`).
- `src/drift.ts`: `detectDrift` over resolved watch rules and committed history only; `formatDrift`/`summarizeDrift` for output.
- `src/session.ts`: session-start context and session-stop nudge with `stop_hook_active` guard and agent-config-path exclusion.
- `src/hooks.ts`: marker-based (`benjamin-docs session-`) install/status/uninstall for `.claude/settings.json`, `.codex/hooks.json`, `.cursor/hooks.json`.
- CLI wiring in `src/cli.ts` and `src/commands.ts`; advisory drift section in `src/ready.ts`; init consent prompt plus `--hooks` / `--no-hooks` flags.
- `src/upgrade.ts`: `bd upgrade` orchestrating the `bdVersion` config stamp, marked `AGENTS.md` refresh, skill refresh, view regeneration, hooks offer, and live update check.
- `src/update-check.ts`: cached (24h) npm registry check with 3s timeout, `BENJAMIN_DOCS_NO_UPDATE_CHECK=1` opt-out, `BENJAMIN_DOCS_HOME`-aware cache path, detached background refresh spawned from `session-start`, and skew/update hints in `session-start` and `ready`.
- Docs: skill drift/hooks section, README sections, `src/info.ts` help, AGENTS.md contract line.

## Validation

- `test/drift-hooks.test.ts` (17 tests): drift lifecycle in temp git repos, hook file preservation and round-trip, unparseable-file safety, init flag integration, session command formats, stop-guard behavior.
- `test/upgrade.test.ts` (10 tests): upgrade idempotency and `bdVersion` stamping, marked-section refresh, unmarked `AGENTS.md` preservation, hooks flags, ready/session-start skew hints, cached update surfacing, opt-out behavior, semver and cache-staleness helpers. Tests never touch the network (helpers set `BENJAMIN_DOCS_NO_UPDATE_CHECK=1`; cache tests pre-seed files).
- `pnpm check` passes across the suite.
- Manual smoke in a temp repo: committed source change flags docs; doc update plus commit clears it; hooks install/uninstall round-trips over user-authored settings.
