---
title: Architecture
scope: project
scope_id: project
audience: [developer, agent]
status: review
visibility: private
updated: 2026-07-11
source: session-capture
---

# Architecture

`benjamin-docs` is a dependency-light Node CLI plus an installable agent skill. The CLI owns deterministic file creation, metadata, validation, packaging, and status checks. The skill owns agent behavior: reading chat/project context, asking before chat-to-project writes, synthesizing docs, and challenging weak plans.

## Runtime Shape

The published package exposes one executable:

```text
benjamin-docs -> dist/src/cli.js
```

The TypeScript source lives in `src/` and is compiled to `dist/src/` before publishing. Most filesystem, path-safety, process, and test-fixture work uses Node built-ins. Since 0.11.0, the MCP server adds the official `@modelcontextprotocol/sdk` and `zod` as the package's two runtime dependencies.

Public first-contact surfaces are part of the architecture because this package is discovered through GitHub, npm, and CLI help before any agent workflow runs. `README.md`, `package.json`, `src/info.ts`, `src/commands.ts`, and `skills/benjamin-docs/` describe the same product and exact limits: start hooks supply bounded pointers, readiness is deterministic rather than semantic proof, publication metadata is not Git confidentiality, and BD never needs to alter the substantive final answer.

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
- Shared git history helpers live in `src/git.ts`; committed-history drift detection lives in `src/drift.ts`. Session-start drift reads last-doc commits in one batched Git query and caches identical diff/count queries so the hook stays within its latency budget without changing per-doc drift semantics.
- Agent session hook installation lives in `src/hooks.ts`; bounded session-start context, the silent legacy stop adapter, and explicit stop-diagnostic wording live in `src/session.ts`; local per-session dirty-tree baselines live in `src/session-state.ts`.
- MCP memory tools live in `src/memory-tools.ts` (logic) and `src/mcp-server.ts` (stdio protocol); client registration lives in `src/mcp-install.ts`.
- Watch-rule globs and stack-agnostic changed-file mapping live in `src/watch.ts`.
- Memory Views rendering and lifecycle filtering live in `src/views.ts`.
- Setup diagnostics live in `src/doctor.ts`.
- Recorded local prerequisite detection lives in `src/environment.ts`.
- Structured repository readiness lives in `src/readiness.ts`; `src/ready.ts` formats the same versioned report for human output or `bd ready --json`. Validation runs once and `reviewProject(..., { includeValidation: false })` supplies only review-specific findings. `ReviewResult.changedWorkStatus` records whether `getChangedFiles` succeeded, so working-tree impact is independent from the injectable drift detector used by committed freshness. Optional doctor setup is outside this boundary.
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

Since 0.10.0, `bd drift` covers the committed-history half of freshness: for every doc referenced by a watch rule, it diffs the commits since the doc last changed and flags docs whose watched code moved on without them. Task 4 of the 0.12.0 trust foundation makes known drift block the `committed_freshness` readiness dimension. `review --changed` owns working-tree hygiene and exposes those warnings separately for `working_tree_impact`; baseline content warnings remain in `content_heuristics`.

Version 0.10.0 introduced consent-based hooks for Claude Code, Codex, and Cursor. The 0.12.0 trust-foundation behavior installs only `bd session-start`, which injects bounded context containing the memory location, read-first docs, and drift summary. Existing `bd session-stop` commands remain accepted but produce no output, so they cannot block completion or auto-submit follow-up work. Hook files are user-owned: install migrates only legacy Benjamin stop entries, uninstall removes only marked Benjamin commands even inside mixed groups, and every user command, custom field, and unparseable file is preserved. Hooks are installed only with consent (interactive `init` prompt, `init --hooks`, or explicit `hooks install`).

The 0.11.1 session-state and nudge logic remains available for a future explicit diagnostic path, including content fingerprints and fail-open recovery. Installed hooks no longer invoke that logic at stop. Final-answer policy now lives in generated root agent guidance: finish BD maintenance before answering, never let bookkeeping replace or materially change the answer, and mention a durable update only through an optional one-sentence note.

All of this stays warning-only inside `review`, while structured readiness escalates baseline and changed-work findings in their own dimensions. This is intentionally heuristic, not an AI reviewer. Passing readiness means the configured deterministic checks passed; semantic verification remains the agent's responsibility.

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

`release:check` builds, tests, validates the BD repo, and dry-runs npm packing. After npm publish, `release:github` verifies npm, generates a temporary skill ZIP, byte-checks `SKILL.md` and all three references against package sources, then creates or reuses the tag and GitHub Release. The script never publishes npm, and the ZIP is not tracked source. `.github/workflows/release.yml` remains the tag-push backup path.

## Current Architectural Bias

Keep BD boring and local. The next architecture work should deepen validation, review, and install reliability before adding hosted services, sync, dashboards, or plugin infrastructure.
