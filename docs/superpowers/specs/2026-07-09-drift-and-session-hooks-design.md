---
title: Drift Detection And Agent Session Hooks Design
scope: project
scope_id: drift-and-session-hooks
audience: [developer, agent]
status: approved
visibility: private
updated: 2026-07-09
source: manual
---

# Drift Detection And Agent Session Hooks Design

## Problem

Benjamin Docs works because agents follow the workflow: read project memory at
session start, keep it updated while working. Both halves depended on voluntary
compliance:

- Nothing measured whether docs actually fell behind the code they describe.
  `bd review --changed` checks the current working tree, and a hidden churn
  check covered only `architecture.md` and `code-map.md` with a fixed
  threshold. Committed history that skipped the docs was invisible.
- Nothing loaded the memory into an agent session automatically. The human had
  to prompt "read the Benjamin Docs memory" every session and police whether
  the agent updated it before stopping.

The goal for 0.10.0: make the memory harder to ignore and harder to let rot,
with the human's surface staying `init`, `export`, and optionally `ready`.

## Goals

- Detect committed drift: docs whose watched code changed in commits after the
  doc last changed. Reuse the existing `watch` rules in
  `.benjamin-docs/config.json` as the doc-to-code linkage.
- Keep drift advisory. It informs agents and `bd ready`; it does not block
  readiness. `--strict` exists for CI gates that want a hard failure.
- Install session hooks for Claude Code, Codex CLI, and Cursor that inject
  compact project-memory context at session start and nudge memory updates at
  stop when source changed without doc updates.
- Fold hook installation into `bd init` as a consent prompt. Zero new required
  human commands.
- Preserve user-owned hook files exactly. Only add or remove entries that are
  identifiably ours.

## Non-Goals

- No MCP server yet. That is the next release (see roadmap).
- No per-session state tracking. The stop nudge derives everything from the
  git working tree.
- No hooks for tools without a session-start mechanism.

## Design

### Drift detection (`bd drift`)

`src/drift.ts` generalizes the previous `reviewDocChurn` idea:

- For every doc referenced by any watch rule, find the doc's last commit
  (`git log -1 -- <doc>`), then the committed changes since it
  (`git diff --name-only <commit>..HEAD`).
- A doc is drifted when at least one changed file matches the doc's watch-rule
  globs and passes the reviewable-source filter. Output includes rule labels,
  changed-file samples, and the number of commits touching those files.
- Uncommitted source changes are deliberately excluded: drift measures memory
  rot across sessions; `bd review --changed` owns current-session hygiene.
- Skipped and reported: docs with uncommitted updates (being fixed right now),
  docs never committed, unsafe watch-rule paths, missing docs.
- Skipped silently: archived and stale docs.
- Exit codes: 0 when the check ran (drift is advisory), 1 when uninitialized,
  `--strict` returns 1 when drift exists. `--json` emits the full result.
- `bd ready` shows a "Drift (advisory)" section that never flips readiness.

Shared git helpers moved from `review.ts` to `src/git.ts`.

### Session hooks (`bd hooks`, `bd session-start`, `bd session-stop`)

Hook mechanisms confirmed against July 2026 docs:

| Tool | Project file | Session start | Stop nudge |
| --- | --- | --- | --- |
| Claude Code | `.claude/settings.json` | `SessionStart`, plain stdout injected | `Stop`, `{"decision":"block","reason":...}` |
| Codex CLI | `.codex/hooks.json` (Claude-compatible schema) | `SessionStart`, `hookSpecificOutput.additionalContext` | `Stop`, same block convention |
| Cursor | `.cursor/hooks.json` | `sessionStart`, `additional_context` JSON | `stop`, `followup_message` with `loop_limit: 1` |

`bd session-start [--format claude|codex|cursor]` prints compact context
(~5 lines): memory location, read-first docs, drift summary when present, and
the update contract. Uninitialized repos produce empty output so the hooks are
safe anywhere.

`bd session-stop [--format ...]` nudges only when reviewable source files
changed in the working tree and no memory doc changed. Guards against nudge
loops: `stop_hook_active` on stdin (Claude Code and Codex) and `loop_limit: 1`
(Cursor). Agent-config paths (`.claude/`, `.codex/`, `.cursor/`, `AGENTS.md`)
do not count as source changes.

`bd hooks install|status|uninstall [--target <id>]` merges entries into the
three project hook files. Ownership marker: the command string contains
`benjamin-docs session-`. Unparseable existing files are preserved untouched
and reported as skipped. Uninstall removes only marked entries and deletes the
file (and empty parent directory) only when nothing else remains.

`bd init` prompts for hooks in interactive codebase/feature setups (consent
moment) and accepts `--hooks` / `--no-hooks` for automation. Non-interactive
init without flags does not install hooks.

### Known limitations

- The stop nudge repeats on later turns while the working tree still has
  source changes and no doc updates; it stops as soon as any memory doc is
  touched. Acceptable: the agent absorbs the nudge, not the human.
- Codex requires one-time user action: `features.hooks = true` in
  `~/.codex/config.toml` plus trusting the hooks via `/hooks`. The install
  output says so.
- Hook commands assume `benjamin-docs` is on PATH (global install).

### Upgrade path (`bd upgrade`) and update notifications

Added in the same release after the owner asked how old repos catch up and who
notices new versions.

- `.benjamin-docs/config.json` gains an optional `bdVersion` stamp, written by
  `init` and `upgrade`. It keys the skew hints and gives future releases a
  migration hook.
- `bd upgrade` (new main command, `src/upgrade.ts`) refreshes Benjamin-owned
  surfaces only: version stamp, the marked `AGENTS.md` section (skipped when
  no balanced markers exist), home skill installs, existing Memory Views, and
  a consent-gated hooks offer (`--hooks` / `--no-hooks`, interactive prompt
  when a TTY and hooks absent). It also runs a live npm update check.
- Update checks (`src/update-check.ts`): one GET of
  `registry.npmjs.org/benjamin-docs/latest`, 3s timeout, cached 24h at
  `~/.benjamin-docs/update-check.json` (honors `BENJAMIN_DOCS_HOME`), opt-out
  via `BENJAMIN_DOCS_NO_UPDATE_CHECK=1`, registry override via
  `BENJAMIN_DOCS_REGISTRY_URL` for tests. `session-start` only reads the
  cache and spawns a detached `benjamin-docs update-cache` refresh when the
  cache is stale, so hooks never wait on the network. `ready` shows an
  advisory upgrade hint on version skew; the agent relays "newer version
  available" to the human, who runs the global package update.

## Validation

- `test/drift-hooks.test.ts`: drift lifecycle against real temp git repos
  (no git, no drift, committed drift, uncommitted-change exclusion, doc-update
  clearing, ready advisory), hook install/status/uninstall with user-content
  preservation and unparseable-file safety, init flag integration, session
  start/stop output per format, stop_hook_active guard.
- Full suite: `pnpm check`.
