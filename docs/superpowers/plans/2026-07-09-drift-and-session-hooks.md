---
title: Drift Detection And Agent Session Hooks Plan
scope: project
scope_id: drift-and-session-hooks
audience: [developer, agent]
status: approved
visibility: private
updated: 2026-07-09
source: manual
---

# Drift Detection And Agent Session Hooks Plan

Release: 0.10.0. Staged shipping decision: drift + hooks first, MCP server in
the following release. See the design spec:
`docs/superpowers/specs/2026-07-09-drift-and-session-hooks-design.md`.

## Steps

1. Extract shared git helpers from `src/review.ts` into `src/git.ts`
   (`getChangedFiles`, `getCommittedChanges`, `gitLastCommit`,
   `gitCommitCountTouching`, `isReviewableSourceChange`). Done.
2. Implement `src/drift.ts` (`detectDrift`, `formatDrift`, `summarizeDrift`)
   over resolved watch rules and committed history only. Done.
3. Wire `bd drift [--json] [--strict]` into `src/cli.ts` and `src/commands.ts`;
   add the advisory drift section to `src/ready.ts`. Done.
4. Implement `src/session.ts` (`session-start` context with drift summary,
   `session-stop` nudge with `stop_hook_active` guard and agent-config-path
   exclusion) and `src/hooks.ts` (marker-based install/status/uninstall for
   `.claude/settings.json`, `.codex/hooks.json`, `.cursor/hooks.json`). Done.
5. Wire `bd hooks <install|status|uninstall> [--target ...]`,
   `bd session-start`, `bd session-stop` into the CLI; add `--hooks` /
   `--no-hooks` to `bd init` plus the interactive consent prompt. Done.
6. Tests in `test/drift-hooks.test.ts` covering drift lifecycle, hook file
   preservation, init integration, and session command formats. Done.
7. Update `src/info.ts` help, `README.md`, `skills/benjamin-docs/SKILL.md`,
   project memory (`benjamin-docs/`), and bump to 0.10.0. Done.
8. Add `bd upgrade` (`src/upgrade.ts`) with a `bdVersion` config stamp, plus
   cached opt-out npm update checks (`src/update-check.ts`) surfaced through
   `session-start`, `ready`, and `upgrade`. Tests in `test/upgrade.test.ts`.
   Done.

## Acceptance

- `pnpm check` passes.
- In a temp repo: committed source change flags watched docs; updating and
  committing the doc clears it; `bd drift --strict` exits 1 on drift.
- `bd hooks install` then `bd hooks uninstall` round-trips without touching
  user-authored settings content.
- `bd session-start` output stays under ~6 lines and is empty outside
  initialized projects.
