---
title: Architecture
scope: project
scope_id: project
audience: [developer, agent]
status: draft
visibility: private
updated: 2026-06-11
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
- Setup diagnostics live in `src/doctor.ts`.
- Skill installation and Claude zip packaging live in `src/install-skill.ts` and `src/package-skill.ts`.
- Agent-facing behavior lives in `skills/benjamin-docs/SKILL.md`.

## Changed-Work Freshness

`bd review --changed` is an advanced, deterministic git-diff pass layered onto the existing review command. It compares changed tracked and untracked files against `HEAD` by default, or a caller-provided `--since <git-ref>`.

The check is warning-only. It classifies changed source files into coarse areas such as database/schema, application behavior, and configuration/workflow, then warns when likely source docs such as `engineering/architecture.md`, `engineering/code-map.md`, `releases/changelog.md`, or `handoff/agent-brief.md` were not updated. It also scans project-level docs for obvious stale implementation claims such as admin routes or content schema still being described as not implemented after related code changes.

This is intentionally heuristic, not an AI reviewer. The product rule is that agents should either update Benjamin Docs or explicitly state why a change has no durable project-memory impact.

## Safety Rules

The CLI treats generated paths as project-relative paths. It rejects absolute paths, traversal, unsafe path segments, symlinked generated targets, and metadata or docs that resolve outside the project root. Validation repeats those checks for existing metadata, managed Markdown docs, markdown links, anchors, and scope paths.

Chat-to-project is intentionally gated by the skill rather than by magic background behavior. The agent must ask before creating files and must suggest `~/Documents/Benjamin Docs/<Project Name>` for chat-only projects unless the user gives an explicit path.

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
