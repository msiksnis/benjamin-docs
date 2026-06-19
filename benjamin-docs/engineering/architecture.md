---
title: Architecture
scope: project
scope_id: project
audience: [developer, agent]
status: review
visibility: private
updated: 2026-06-19
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
- Watch-rule globs and stack-agnostic changed-file mapping live in `src/watch.ts`.
- Memory Views rendering and lifecycle filtering live in `src/views.ts`.
- Setup diagnostics live in `src/doctor.ts`.
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

All of this stays warning-only inside `review`, but `ready` fails on review warnings, so the gate enforces freshness. This is intentionally heuristic, not an AI reviewer. The product rule is unchanged: agents should either update Benjamin Docs or explicitly state why a change has no durable project-memory impact.

## Safety Rules

The CLI treats generated paths as project-relative paths. It rejects absolute paths, traversal, unsafe path segments, symlinked generated targets, and metadata or docs that resolve outside the project root. Validation repeats those checks for existing metadata, managed Markdown docs, markdown links, anchors, and scope paths.

Chat-to-project is intentionally gated by the skill rather than by magic background behavior. The agent must ask before creating files and must suggest `~/Documents/Benjamin Docs/<Project Name>` for chat-only projects unless the user gives an explicit path.

Guided export keeps the same local-first boundary. `bd export` is the human-facing UX, while direct export flags are treated as an agent/script API. The CLI can deterministically assemble Markdown feature exports and block customer-facing output when source docs are private, thin, or not implementation-verified, but it does not perform deep semantic code verification. Agents own the implementation-vs-docs comparison before customer exports.

## Release Shape

Publishing is manual for now:

```bash
pnpm run release:check
pnpm pack --pack-destination "$tmpdir"
npm publish "$tmpdir"/benjamin-docs-*.tgz --access public
```

`release:check` builds, tests, validates the BD repo, and dry-runs npm packing. Tags are pushed manually after publish. This is acceptable while the project is early and releases are frequent.

## Current Architectural Bias

Keep BD boring and local. The next architecture work should deepen validation, review, and install reliability before adding hosted services, sync, dashboards, or plugin infrastructure.
