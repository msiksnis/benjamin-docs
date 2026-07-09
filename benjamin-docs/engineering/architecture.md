---
title: Architecture
scope: project
scope_id: project
audience: [developer, agent]
status: review
visibility: private
updated: 2026-07-09
source: session-capture
---

# Architecture

`benjamin-docs` is a dependency-light Node CLI plus an installable agent skill. The CLI owns deterministic file creation, metadata, validation, packaging, and status checks. The skill owns agent behavior: reading chat/project context, asking before chat-to-project writes, synthesizing docs, and challenging weak plans.

## Runtime Shape

The published package exposes one executable:

```text
benjamin-docs -> dist/src/cli.js
```

The TypeScript source lives in `src/` and is compiled to `dist/src/` before publishing. The package intentionally ships no runtime dependencies. It uses Node built-ins for filesystem work, path safety, process execution, and test fixtures.

Public first-contact surfaces are part of the architecture because this package is discovered through GitHub, npm, and CLI help before any agent workflow runs. `README.md`, `package.json` description/keywords, `src/info.ts`, and `skills/benjamin-docs/SKILL.md` must all describe the same product: persistent project memory for AI coding agents, living project knowledge, and agent-maintained docs. Avoid implying a background daemon; the update loop comes from repo-local agent guidance and the installed skill.

The 0.9.3 publish is a public-surface patch, not a runtime architecture change. It packages the README/npm positioning work so npmjs and GitHub both present the same agent-memory model.

0.10.0 kept the zero-runtime-dependency posture. 0.11.0 introduces the first runtime dependencies — the official `@modelcontextprotocol/sdk` (stable v1 line) plus its `zod` peer — an owner-approved exception because hand-rolling the evolving MCP protocol is a worse maintenance trade. `bd mcp` serves project memory over stdio; access is manifest-scoped, generated views are read-only through the server, and writes validate transactionally with rollback.

## Project Layout

Initialized projects have two roots:

```text
benjamin-docs/      human-readable Markdown docs
.benjamin-docs/     machine metadata: config, manifest, scopes, anchors
```

The default docs root is `benjamin-docs/` so existing project docs under `docs/` are left alone. A config can point elsewhere, but new public guidance should keep the default unless there is a strong reason.

## Main Boundaries

- CLI command routing lives in `src/cli.ts`.
- Project creation and starter docs live in `src/init.ts` and `src/templates.ts`.
- Metadata and path-safety helpers live in `src/fsx.ts`, `src/project-config.ts`, and `src/types.ts`.
- Validation lives in `src/validate.ts`.
- Docs quality and changed-work freshness review live in `src/review.ts`.
- Shared git history helpers live in `src/git.ts`; committed-history drift detection lives in `src/drift.ts`.
- Agent session hook installation lives in `src/hooks.ts`; session-start context and stop nudges live in `src/session.ts`.
- MCP memory tools live in `src/memory-tools.ts` (logic) and `src/mcp-server.ts` (stdio protocol); client registration lives in `src/mcp-install.ts`.
- Watch-rule globs and stack-agnostic changed-file mapping live in `src/watch.ts`.
- Memory Views rendering and lifecycle filtering live in `src/views.ts`.
- Setup diagnostics live in `src/doctor.ts`.
- Recorded local prerequisite detection lives in `src/environment.ts`.
- Skill installation and Claude zip packaging live in `src/install-skill.ts` and `src/package-skill.ts`.
- Agent-facing behavior lives in `skills/benjamin-docs/SKILL.md`.

## Changed-Work Freshness

`bd review --changed` is an advanced, deterministic git-diff pass layered onto the existing review command. It compares changed tracked and untracked files against `HEAD` by default, or a caller-provided `--since <git-ref>`.

Since 0.7.0 the changed-file-to-doc mapping is stack-agnostic and configurable. `.benjamin-docs/config.json` holds `watch` rules, each with glob `paths` and target `docs`; `init` seeds generic defaults covering database/schema files, application code, tests, configuration/workflow files, and project memory/status docs. Projects without `watch` in config fall back to the same generic defaults at runtime. The old Supabase- and Next.js-specific hardcoded paths are gone.

Since 0.8.0, `review` also checks watch-rule coverage for status-bearing docs. A doc with `freshness: status`, a top-level project/handoff status doc, or an active feature doc must be matched by at least one watch rule. Otherwise `review` warns that changed work can never flag the doc stale, and `ready` fails through the normal review gate. Feature scope creation appends a feature-specific watch rule for the scope's four docs so new active feature memory starts covered.

Plain `bd review` (and therefore `bd ready`) also runs deterministic staleness checks:

- Freshness coverage: warns when a status-bearing or active feature doc is not matched by any watch rule.
- Doc churn: warns when ten or more source files changed in git since `engineering/architecture.md` or `engineering/code-map.md` last changed, unless the doc has uncommitted edits.
- Path liveness: warns when `architecture.md`, `code-map.md`, or `agent-brief.md` reference an inline-code path whose first segment exists in the repo but whose full path does not.
- Memory View freshness: warns when generated views under `views/` no longer match what the current source docs would render.

`review --changed` additionally scans `architecture.md` and `code-map.md` for generic stale claims such as "not implemented yet" or "does not exist yet" while source files changed, quoting the full sentence.

Since 0.10.0, `bd drift` covers the committed-history half of freshness: for every doc referenced by a watch rule, it diffs the commits since the doc last changed and flags docs whose watched code moved on without them. Drift is deliberately advisory (a non-blocking section in `ready`, `--strict` for CI) because the broad default watch rules would make a blocking check flap on every code commit. `review --changed` owns working-tree hygiene; `drift` owns cross-session rot.

Also since 0.10.0, the update loop no longer depends on the human prompting it. `bd hooks install` writes Benjamin-owned entries into Claude Code, Codex, and Cursor project hook files; sessions then start with `bd session-start` context (memory location, read-first docs, drift summary) and end with a `bd session-stop` nudge when source changed without a memory update. Hook files are user-owned: the CLI merges conservatively, marks its entries by the `benjamin-docs session-` command string, preserves unparseable files untouched, and uninstall removes only marked entries. Hooks are installed only with consent (interactive `init` prompt, `init --hooks`, or explicit `hooks install`).

All of this stays warning-only inside `review`, but `ready` fails on review warnings, so the gate enforces freshness. This is intentionally heuristic, not an AI reviewer. The product rule is unchanged: agents should either update Benjamin Docs or explicitly state why a change has no durable project-memory impact.

## Safety Rules

The CLI treats generated paths as project-relative paths. It rejects absolute paths, traversal, unsafe path segments, symlinked generated targets, and metadata or docs that resolve outside the project root. Validation repeats those checks for existing metadata, managed Markdown docs, markdown links, anchors, and scope paths.

Chat-to-project is intentionally gated by the skill rather than by magic background behavior. The agent must ask before creating files and must suggest `~/Documents/Benjamin Docs/<Project Name>` for chat-only projects unless the user gives an explicit path.

Guided export keeps the same local-first boundary. `bd export` is the human-facing UX, while direct export flags are treated as an agent/script API. The CLI can deterministically assemble Markdown feature exports, record agent-provided implementation evidence with `bd export --verify <feature> --evidence "<what was checked>"`, and block customer-facing output when source docs are private, thin, or not implementation-verified. It does not perform deep semantic code verification. Agents own the implementation-vs-docs comparison before customer exports.

Ready output now has a small environment/tooling lens. `src/environment.ts` scans Benjamin-managed source docs for concrete recorded blockers such as command-not-found, not-installed tools, connection-refused services, or not-listening databases. `src/ready.ts` prints those findings as "Recorded Environment / Tooling Blockers" without failing readiness when validation, review, doctor, and agent guidance are otherwise clean. This keeps local prerequisite problems visible while preserving the distinction between project-memory readiness and unavailable local services.

## Release Shape

Publishing is manual for now:

```bash
pnpm run release:check
pnpm pack --pack-destination "$tmpdir"
npm publish "$tmpdir"/benjamin-docs-*.tgz --access public
pnpm run release:github
pnpm run release:verify-public
```

`release:check` builds, tests, validates the BD repo, and dry-runs npm packing. After npm publish, `release:github` verifies that npm reports the package version, creates or reuses the matching `vX.Y.Z` tag, pushes it, and creates a GitHub Release marked latest. `.github/workflows/release.yml` is a backup path: if a maintainer pushes a version tag manually, GitHub Actions verifies the tag against `package.json` and npm before creating the GitHub Release.

## Current Architectural Bias

Keep BD boring and local. The next architecture work should deepen validation, review, and install reliability before adding hosted services, sync, dashboards, or plugin infrastructure.
