---
title: Code Map
scope: project
scope_id: project
audience: [developer, agent]
status: review
visibility: private
updated: 2026-07-10
source: session-capture
---

# Code Map

Use this map when changing CLI behavior, generated docs, validation, or agent-skill instructions.

## CLI Entry

- `src/cli.ts` routes all commands and parses command-specific flags.
- `src/info.ts` prints `help`, `introduce`, `chat-project` guidance, and package version text. Keep its first-contact language aligned with `README.md`, `package.json`, and the bundled skill, including the living-project-knowledge wording.
- `package.json` owns the npm version, package description, keywords, published files, bin alias, and release scripts. Version `0.11.1` is published and is the current release.
- `src/chat-project.ts` formats the confirmation prompt for creating a project from an existing chat.
- `src/next.ts` formats the next prompt after init/status workflows.

## Project Creation

- `src/init.ts` creates `.benjamin-docs/`, `benjamin-docs/`, starter docs, manifest, scopes, and anchors. It also seeds default `watch` rules into config and preserves custom rules on re-init.
- `src/templates.ts` contains starter Markdown docs and frontmatter defaults.
- `src/scopes.ts` creates feature scopes and updates scope lifecycle status. Scope creation writes the four feature docs, adds them to the manifest, and appends a feature-specific watch rule. `setScopeStatus` cascades a new status and updated date into the scope's managed docs.
- `src/export.ts` exports audience-specific bundles and task-based feature documentation. It owns feature matching, customer/developer profile rendering, customer export readiness checks, implementation-verification prompts, the agent-facing export verification writer, and generated Markdown under `exports/`.
- `src/status.ts` summarizes the current initialized project.

## Validation And Review

- `src/validate.ts` validates config (including `watch` rules), manifest, scopes, anchors, managed Markdown, links, and symlink/root safety.
- `src/review.ts` adds a higher-level docs-quality pass. It warns on starter-template text, thin baseline docs, missing expected docs, empty open-question docs, weak continuation proof, freshness blind spots for status-bearing docs, git churn since engineering docs last changed, missing inline-code path references, stale Memory Views, and changed source work that likely needs project-memory updates. Archived and stale docs are skipped for quality checks and changed-work watch warnings.
- `src/git.ts` holds shared git helpers (`getChangedFiles`, `getCommittedChanges`, scalar and batched last-commit lookup, `gitCommitCountTouching`, `isReviewableSourceChange`) used by review, drift, and session commands.
- `src/drift.ts` implements `bd drift`: per-doc committed-history comparison against watch rules, with advisory formatting, `--json`, and `--strict` handled in the CLI. It skips archived/stale docs, uncommitted-doc updates, and never-committed docs. Last-doc commits are fetched in one Git process; identical committed-change and commit-count queries are cached while retaining each doc's own last-update boundary.
- `src/session.ts` implements budgeted `bd session-start` context, typed hook-payload parsing, per-tool output, the always-silent legacy `formatSessionStop()` adapter, and `getSessionStopNudge()` for an explicit diagnostic path.
- `src/session-state.ts` owns local per-session working-tree fingerprints, new-content comparison, pending-nudge acknowledgement, fail-open recovery, and seven-day state pruning.
- `src/hooks.ts` installs/reports/uninstalls session-start-only hooks in the target project's Claude Code settings file plus the Codex and Cursor `hooks.json` files (under the project's `.claude`, `.codex`, and `.cursor` folders). Ownership marker: hook command contains `benjamin-docs session-`. Install removes legacy Benjamin stop entries, and uninstall removes only Benjamin commands inside mixed groups while retaining user hooks and custom fields; unparseable files are skipped, never rewritten.
- `src/memory-tools.ts` holds protocol-free MCP tool logic: manifest-scoped doc access, section search with term scoring, transactional updates (validate then roll back on regression), decision appends, and status with drift.
- `src/mcp-server.ts` wires those tools into an `McpServer` over `StdioServerTransport` with zod input schemas; `bd mcp` serves until stdin closes. Tool failures return readable text with `isError` instead of protocol faults.
- `src/mcp-install.ts` registers/reports/removes the `benjamin-docs` MCP server entry in the project's Claude Code, Cursor, and Codex client configs (JSON key ownership; marker-comment block in Codex TOML).
- `src/watch.ts` holds the `WatchRule` defaults, including broad baseline coverage for project, handoff, feature-index, engineering, and release docs, plus the zero-dependency glob matcher and `resolveWatchRules` for config-or-default resolution.
- `src/views.ts` renders Memory Views: it filters out archived/stale docs and scopes, orders sources by updated date, groups sections per source doc, and only rewrites view files whose body changed. `renderMemoryViews` is also used by review for the freshness check.
- `src/doctor.ts` checks CLI version, installed skills, Claude Desktop upload zip, project initialization, and validation. `--strict` turns setup gaps and validation warnings into failures.
- `src/environment.ts` scans Benjamin-managed source docs for recorded local environment/tooling blockers such as missing commands or unavailable services.
- `src/ready.ts` is the handoff gate. It combines validation, docs review, `doctor --strict`, and agent guidance checks, and fails when any of those checks is not clean. It also surfaces recorded environment/tooling blockers and advisory drift as non-failing handoff categories.

## Filesystem And Metadata

- `src/fsx.ts` is the main safety layer for generated paths. Use it instead of ad hoc path joins when reading or writing generated project files.
- `src/project-config.ts` normalizes config and docs-root behavior.
- `src/frontmatter.ts` parses and serializes Benjamin-managed Markdown frontmatter, including optional `freshness: status`.
- `src/types.ts` defines config, manifest, scopes, anchors, and frontmatter shapes.
- `src/constants.ts` holds shared filenames, known values, freshness values, and defaults.

## Skills And Packaging

- `skills/benjamin-docs/SKILL.md` is the bundled agent skill. It is the source of truth for agent behavior across Codex, Cursor, Claude Code, and Claude Desktop upload.
- `src/install-skill.ts` installs the skill into shared and app-specific local skill folders.
- `src/package-skill.ts` creates `~/Downloads/benjamin-docs-skill.zip` for Claude Desktop / Claude.ai upload.
- `scripts/release-github.mjs` owns the post-publish GitHub release guard: it verifies npm, creates or reuses the version tag, creates the GitHub Release, and checks the latest-release pointer.
- `.github/workflows/release.yml` is the tag-push backup path that creates a GitHub Release when a version tag is pushed manually after npm publish.

## Tests

- `test/init.test.ts` covers starter project creation, mode flags, default watch coverage, and status freshness frontmatter.
- `test/validate-export.test.ts` covers validation, export, export verification, and promote behavior.
- `test/scopes-anchors.test.ts` covers feature scopes and anchors.
- `test/info.test.ts` covers public help, introduce, chat-project text, and the persistent-project-memory positioning in CLI output.
- `test/install-skill.test.ts` and `test/package-skill.test.ts` cover skill installation and Claude zip packaging.
- `test/doctor.test.ts` covers setup diagnostics and strict mode.
- `test/review.test.ts` covers docs-quality review behavior, including freshness blind-spot warnings.
- Changed-work review tests in `test/review.test.ts` create git fixture repos and verify `review --changed --since HEAD` warns for source changes without source-doc updates, custom watch rules, missing watch-rule docs, generic stale not-implemented claims, doc churn, path liveness, Memory View freshness, and archived feature docs that should not trigger update warnings.
- `test/views.test.ts` covers view generation, stable rewrites, archived-scope exclusion, and per-doc section grouping.
- `test/scopes-anchors.test.ts` covers feature-scope watch registration, `scope status` cascade, and rejection of unknown scopes and statuses.
- `test/ready.test.ts` covers the combined handoff gate, including failure when status docs have no freshness coverage and non-failing surfacing of recorded environment/tooling blockers.
- `test/drift-hooks.test.ts` covers committed-history drift semantics, session-start-only install/migration/uninstall behavior, silent stop compatibility, and the explicit stop diagnostic. `test/context-budget.test.ts` locks public context limits; `scripts/benchmark-agent-overhead.mjs` asserts session-boundary p95 and output budgets.
- `test/fsx.test.ts` and `test/frontmatter.test.ts` cover low-level path and Markdown parsing behavior.

## Change Guide

When adding a CLI command, update `src/cli.ts`, `src/commands.ts`, help text in `src/info.ts` when relevant, tests, README command lists, and release smoke tests. When changing generated docs, update `src/templates.ts`, validation expectations, and the `benjamin-docs` skill if agent behavior also changes. When changing agent completion behavior, update both `src/agent-contracts.ts` and `skills/benjamin-docs/SKILL.md`.
