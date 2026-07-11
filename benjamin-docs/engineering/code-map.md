---
title: Code Map
scope: project
scope_id: project
audience: [developer, agent]
status: review
visibility: private
updated: 2026-07-11
source: session-capture
---

# Code Map

Use this map when changing CLI behavior, generated docs, validation, or agent-skill instructions.

## CLI Entry

- `src/cli.ts` routes all commands and parses command-specific flags.
- `src/info.ts` prints `help`, `introduce`, `chat-project` guidance, and package version text. `src/commands.ts` owns command-drawer descriptions. Keep both aligned with `README.md`, `package.json`, and the bundled skill's exact project-memory guarantees.
- `package.json` owns the npm version, package description, keywords, published files, bin alias, and release scripts. Version `0.11.1` remains published; the working package is the unpublished `0.12.0` release candidate.
- `src/chat-project.ts` formats the confirmation prompt for creating a project from an existing chat.
- `src/next.ts` formats the next prompt after init/status workflows.

## Project Creation

- `src/init.ts` creates `.benjamin-docs/`, `benjamin-docs/`, starter docs, manifest, scopes, and anchors. It also seeds default `watch` rules into config and preserves custom rules on re-init.
- `src/templates.ts` contains starter Markdown docs and frontmatter defaults.
- `src/scopes.ts` creates feature scopes and updates scope lifecycle status. Scope creation writes the four feature docs, adds them to the manifest, and appends a feature-specific watch rule. `setScopeStatus` cascades a new status and updated date into the scope's managed docs.
- `src/export.ts` owns feature matching, customer/developer rendering, implementation-verification recording, and generated Markdown under `exports/`. `src/export-policy.ts` is the only publication boundary and runs before any directory preparation or write.
- `src/status.ts` summarizes the current initialized project.

## Validation And Review

- `src/validate.ts` validates config (including `watch` rules), manifest, scopes, anchors, managed Markdown, links, and symlink/root safety.
- `src/review.ts` adds a higher-level docs-quality pass. It warns on starter-template text, thin baseline docs, missing expected docs, empty open-question docs, weak continuation proof, freshness blind spots for status-bearing docs, git churn since engineering docs last changed, missing inline-code path references, stale Memory Views, and changed source work that likely needs project-memory updates. Archived and stale docs are skipped for quality checks and changed-work watch warnings.
- `src/git.ts` holds shared git helpers (`getChangedFiles`, `getCommittedChanges`, scalar and batched last-commit lookup, `gitCommitCountTouching`, `isReviewableSourceChange`) used by review, drift, and session commands. Filename-producing Git calls have an explicit 64 MiB buffer and return typed analysis failures; all Git child processes force `LC_ALL=C` and `LANG=C` while preserving the rest of the caller environment.
- `src/context-budget.ts` owns the public character, token-estimate, search-result, and completion-note limits shared by session and MCP retrieval paths.
- `src/drift.ts` implements `bd drift`: per-doc committed-history comparison against watch rules, with advisory formatting, `--json`, and `--strict` handled in the CLI. It skips archived/stale docs, uncommitted-doc updates, and never-committed docs. Last-doc commits are fetched in one Git process; identical committed-change and commit-count queries are cached while retaining each doc's own last-update boundary. A committed-change enumeration failure is returned explicitly instead of being treated as zero drift.
- `src/session.ts` implements budgeted `bd session-start` context, typed hook-payload parsing, per-tool output, the always-silent legacy `formatSessionStop()` adapter, and `getSessionStopNudge()` for an explicit diagnostic path.
- `src/session-state.ts` owns local per-session working-tree fingerprints, new-content comparison, pending-nudge acknowledgement, fail-open recovery, and seven-day state pruning.
- `src/hooks.ts` installs/reports/uninstalls session-start-only hooks in the target project's Claude Code settings file plus the Codex and Cursor `hooks.json` files (under the project's `.claude`, `.codex`, and `.cursor` folders). Shared-schema health requires `SessionStart[].hooks[]`, matcher `startup|resume|clear`, `type: command`, and the target's exact format command; malformed or stale Benjamin entries keep diagnosis unhealthy. Install repairs at entry/property granularity: it removes a malformed top-level Benjamin command without deleting unrelated group properties or nested user hooks, reuses a valid nested Benjamin entry, and removes legacy Benjamin stop entries. Ownership is anchored to an actual Benjamin start/stop command at command start and to the target's direct schema locations: group/group-hook entries in Claude/Codex `SessionStart` or `Stop`, and flat Cursor entries in `sessionStart` or `stop`. Nested custom command metadata and custom events remain user-owned, so health, repair, upgrade, and uninstall ignore them. Unparseable files are skipped, never rewritten.
- `src/upgrade.ts` owns the complete post-package-update migration for initialized repositories: metadata, Benjamin-owned agent guidance, the current skill bundle, existing Memory Views, default install/repair of all three session-start hook targets, legacy Benjamin stop-hook removal, user-configuration preservation, and the explicit `--no-hooks` opt-out. A required skill or hook failure makes upgrade fail truthfully and leaves the previous `bdVersion` stamp intact so readiness/session-start keep surfacing version skew until migration succeeds.
- `src/memory-tools.ts` holds protocol-free MCP tool logic: manifest-scoped doc access, section search with term scoring, transactional updates (validate then roll back on regression), decision appends, and status with drift.
- `src/mcp-server.ts` wires those tools into an `McpServer` over `StdioServerTransport` with zod input schemas; `bd mcp` serves until stdin closes. Tool failures return readable text with `isError` instead of protocol faults.
- `src/mcp-install.ts` registers/reports/removes the `benjamin-docs` MCP server entry in the project's Claude Code, Cursor, and Codex client configs (JSON key ownership; marker-comment block in Codex TOML).
- `src/watch.ts` holds the `WatchRule` defaults, including broad baseline coverage for project, handoff, feature-index, engineering, and release docs, plus the zero-dependency glob matcher and `resolveWatchRules` for config-or-default resolution.
- `src/views.ts` renders Memory Views: it filters out archived/stale docs and scopes, orders sources by updated date, groups sections per source doc, and only rewrites view files whose body changed. `renderMemoryViews` is also used by review for the freshness check.
- `src/doctor.ts` separates project health from optional integrations. Plain `--strict` checks repository setup/validation without reading integration paths; `--strict --target <target>` lazily reports and fails only the selected integration plus its remediation.
- `src/environment.ts` scans Benjamin-managed source docs for recorded local environment/tooling blockers such as missing commands or unavailable services.
- `src/readiness.ts` owns the structured readiness report used by `bd ready` and future preflight consumers. It separates structure, review-only baseline content heuristics, committed freshness, working-tree impact, and agent guidance. `src/review.ts` exposes `changedWorkStatus` plus typed `changedWorkFailure` from its own Git diff. `src/git.ts` marks only non-Git and unborn-HEAD repositories as legitimately unavailable; other Git execution/enumeration failures block both freshness dimensions even in planning mode. The readiness dependency seam allows deterministic Git-failure tests without monkeypatching.
- `src/ready.ts` formats that report for humans or emits it unchanged through `bd ready --json`. Repository readiness no longer runs `doctor --strict`; recorded environment/tooling blockers remain visible but non-blocking, and the human closeout explicitly limits the result to deterministic checks rather than semantic truth.

## Filesystem And Metadata

- `src/fsx.ts` is the main safety layer for generated paths. Use it instead of ad hoc path joins when reading or writing generated project files.
- `src/project-config.ts` normalizes config and docs-root behavior.
- `src/frontmatter.ts` parses and serializes Benjamin-managed Markdown frontmatter, including optional `freshness: status`.
- `src/types.ts` defines config, manifest, scopes, anchors, and frontmatter shapes.
- `src/constants.ts` holds shared filenames, known values, freshness values, and defaults.

## Skills And Packaging

- `skills/benjamin-docs/SKILL.md` is the bundled agent skill. It is the source of truth for agent behavior across Codex, Cursor, Claude Code, and Claude Desktop upload.
- `src/install-skill.ts` installs the skill into shared and app-specific local skill folders. It preflights every selected bundle destination with the shared filesystem safety layer before bundle reads or writes, rejecting symlinked/escaping paths and non-directory ancestors; all-target upgrade therefore cannot partially write earlier targets before discovering an unsafe later one.
- `src/package-skill.ts` creates `~/Downloads/benjamin-docs-skill.zip` for Claude Desktop / Claude.ai upload.
- `scripts/release-github.mjs` owns the post-publish GitHub release guard: it verifies npm, generates a temporary skill ZIP through the built CLI, byte-checks the four archived source files, creates or reuses the version tag and GitHub Release, and checks the latest-release pointer. It does not publish npm.
- `.github/workflows/release.yml` is the tag-push backup path that creates a GitHub Release when a version tag is pushed manually after npm publish.

## Tests

- `test/init.test.ts` covers starter project creation, mode flags, default watch coverage, and status freshness frontmatter.
- `test/validate-export.test.ts` covers validation, export, export verification, and promote behavior.
- `test/scopes-anchors.test.ts` covers feature scopes and anchors.
- `test/info.test.ts` covers public help, introduce, chat-project text, and parity between README, npm description, and CLI project-memory claims. `test/commands.test.ts` checks readiness and session-start drawer wording.
- `test/install-skill.test.ts` and `test/package-skill.test.ts` cover skill installation, external-victim symlink rejection, and Claude zip packaging.
- `test/doctor.test.ts` covers setup diagnostics and strict mode.
- `test/review.test.ts` covers docs-quality review behavior, including freshness blind-spot warnings.
- Changed-work review tests in `test/review.test.ts` create git fixture repos and verify `review --changed --since HEAD` warns for source changes without source-doc updates, custom watch rules, missing watch-rule docs, generic stale not-implemented claims, doc churn, path liveness, Memory View freshness, and archived feature docs that should not trigger update warnings.
- `test/views.test.ts` covers view generation, stable rewrites, archived-scope exclusion, and per-doc section grouping.
- `test/scopes-anchors.test.ts` covers feature-scope watch registration, `scope status` cascade, and rejection of unknown scopes and statuses.
- `test/ready.test.ts` covers the combined handoff gate, including failure when status docs have no freshness coverage and non-failing surfacing of recorded environment/tooling blockers.
- `test/drift-hooks.test.ts` covers committed-history drift semantics, session-start-only install/migration/uninstall behavior, silent stop compatibility, and the explicit stop diagnostic. `test/context-budget.test.ts` locks public context limits; `scripts/benchmark-agent-overhead.mjs` asserts session-boundary p95 and output budgets.
- `test/upgrade.test.ts` covers plain-upgrade hook installation, legacy and cross-event repair with exact shared-group user-data preservation, complete flat Cursor array repair without commandless entries, anchored ownership across every target, all-target skill preflight, skill refresh, idempotency, `--hooks` compatibility, `--no-hooks`, truthful partial failure without a false current-version stamp, and unchanged parseable-but-incompatible user hook structures. Cross-event fixtures prove unhealthy status/doctor before repair, exact nested and prefixed content preservation, one correct start entry after repair, and a current second upgrade across Claude Code, Codex, and Cursor. `scripts/smoke-packed-cli.mjs` repeats the plain-upgrade contract against the installed tarball with an isolated `BENJAMIN_DOCS_HOME`.
- `test/readiness-report.test.ts` reproduces false-ready, cross-stack, deletion, planning-mode, non-Git/unborn-HEAD availability, fail-closed Git analysis, guidance, and an 8,200-file oversized committed diff. `test/export-policy.test.ts` and `test/validate-export.test.ts` cover the shared preflight, Markdown-delimited cross-platform home paths including mixed-case Windows forms, and verified customer success path. `test/doctor.test.ts` covers target isolation, unreadable global state, exact target hook commands, stop-only legacy hooks, and diagnose-install-healthy repair for every hook target, including mixed direct-command groups, exact user-data preservation, duplicate avoidance, and idempotent reinstall for Claude Code and Codex; `test/mcp.test.ts` enforces task-context bounds.
- `scripts/smoke-packed-cli.mjs` packs and installs the actual tarball before exercising the binary, plain upgrade, hook files, validation, and session-context budgets. `.github/workflows/ci.yml` runs `pnpm check` on Linux, macOS, and Windows with Node 22 and 24, plus a Linux trust-gates job for packed smoke, JSON readiness, and overhead budgets.
- `test/fsx.test.ts` and `test/frontmatter.test.ts` cover low-level path and Markdown parsing behavior.

## Change Guide

When adding a CLI command, update `src/cli.ts`, `src/commands.ts`, help text in `src/info.ts` when relevant, tests, README command lists, and release smoke tests. When changing generated docs, update `src/templates.ts`, validation expectations, and the `benjamin-docs` skill if agent behavior also changes. When changing agent completion behavior, update both `src/agent-contracts.ts` and `skills/benjamin-docs/SKILL.md`.
