---
title: Code Map
scope: project
scope_id: project
audience: [developer, agent]
status: draft
visibility: private
updated: 2026-06-11
source: session-capture
---

# Code Map

Use this map when changing CLI behavior, generated docs, validation, or agent-skill instructions.

## CLI Entry

- `src/cli.ts` routes all commands and parses command-specific flags.
- `src/info.ts` prints `help`, `introduce`, `chat-project` guidance, and package version text.
- `src/chat-project.ts` formats the confirmation prompt for creating a project from an existing chat.
- `src/next.ts` formats the next prompt after init/status workflows.

## Project Creation

- `src/init.ts` creates `.benjamin-docs/`, `benjamin-docs/`, starter docs, manifest, scopes, and anchors.
- `src/templates.ts` contains starter Markdown docs and frontmatter defaults.
- `src/scopes.ts` creates feature scopes and adds anchors.
- `src/export.ts` exports audience-specific bundles.
- `src/status.ts` summarizes the current initialized project.

## Validation And Review

- `src/validate.ts` validates config, manifest, scopes, anchors, managed Markdown, links, and symlink/root safety.
- `src/review.ts` adds a higher-level docs-quality pass. It warns on starter-template text, thin baseline docs, missing expected docs, empty open-question docs, weak continuation proof, and changed source work that likely needs project-memory updates.
- `src/doctor.ts` checks CLI version, installed skills, Claude Desktop upload zip, project initialization, and validation. `--strict` turns setup gaps and validation warnings into failures.
- `src/ready.ts` is the handoff gate. It combines validation, docs review, `doctor --strict`, and agent guidance checks, and fails when any of those checks is not clean.

## Filesystem And Metadata

- `src/fsx.ts` is the main safety layer for generated paths. Use it instead of ad hoc path joins when reading or writing generated project files.
- `src/project-config.ts` normalizes config and docs-root behavior.
- `src/frontmatter.ts` parses and serializes Benjamin-managed Markdown frontmatter.
- `src/types.ts` defines config, manifest, scopes, anchors, and frontmatter shapes.
- `src/constants.ts` holds shared filenames, known values, and defaults.

## Skills And Packaging

- `skills/benjamin-docs/SKILL.md` is the bundled agent skill. It is the source of truth for agent behavior across Codex, Cursor, Claude Code, and Claude Desktop upload.
- `src/install-skill.ts` installs the skill into shared and app-specific local skill folders.
- `src/package-skill.ts` creates `~/Downloads/benjamin-docs-skill.zip` for Claude Desktop / Claude.ai upload.

## Tests

- `test/init.test.ts` covers starter project creation and mode flags.
- `test/validate-export.test.ts` covers validation, export, and promote behavior.
- `test/scopes-anchors.test.ts` covers feature scopes and anchors.
- `test/info.test.ts` covers public help, introduce, and chat-project text.
- `test/install-skill.test.ts` and `test/package-skill.test.ts` cover skill installation and Claude zip packaging.
- `test/doctor.test.ts` covers setup diagnostics and strict mode.
- `test/review.test.ts` covers docs-quality review behavior.
- Changed-work review tests in `test/review.test.ts` create git fixture repos and verify `review --changed --since HEAD` warns for source changes without source-doc updates and for stale not-implemented claims.
- `test/ready.test.ts` covers the combined handoff gate.
- `test/fsx.test.ts` and `test/frontmatter.test.ts` cover low-level path and Markdown parsing behavior.

## Change Guide

When adding a CLI command, update `src/cli.ts`, `src/commands.ts`, help text in `src/info.ts` when relevant, tests, README command lists, and release smoke tests. When changing generated docs, update `src/templates.ts`, validation expectations, and the `benjamin-docs` skill if agent behavior also changes. When changing agent completion behavior, update both `src/agent-contracts.ts` and `skills/benjamin-docs/SKILL.md`.
