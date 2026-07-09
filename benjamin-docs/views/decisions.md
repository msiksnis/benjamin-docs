---
title: Decision Log
scope: project
scope_id: project
audience: [developer, agent]
status: draft
visibility: private
updated: 2026-07-09
source: manual
---

# Decision Log

Derived from decision and rejected-option sections across managed Benjamin docs.

## [Agent Reliability Decisions](../features/agent-reliability/decisions.md)

Source: `benjamin-docs/features/agent-reliability/decisions.md` (updated 2026-07-09)

### Decisions

- Keep the user-facing BD surface very small. New reliability work should be agent-facing, advanced, or automatic through repo-local guidance.
- Customer-facing feature export verification should require explicit evidence recorded by an agent, not just a hidden phrase.
- `bd export --verify <feature> --evidence "<what the agent checked>"` is an advanced command for agents and scripts. It updates the feature handoff's Implementation Verification section so later customer exports can pass readiness.
- The CLI records verification evidence but does not claim to semantically inspect the product. Agents still own the actual implementation-vs-docs comparison.
- Changed-work review should not warn on archived or stale docs, even when an old watch rule still matches changed source files.
- Keep generated exports under `exports/` as disposable snapshots inside the active project root.
- `bd ready` should distinguish recorded local prerequisites from BD setup/doc failures. Missing tools or services such as `cargo` or PostgreSQL should appear under a dedicated environment/tooling category when agents documented them in project memory.
- BD should not run arbitrary project build/test commands by itself in this slice; agents still own executing project checks and recording blockers in handoff docs.
- Package release hygiene should be scripted and verified instead of relying on agent memory. After npm publish, `release:github` owns tag/GitHub Release creation and `release:verify-public` confirms npm, tags, release object, and latest-release state.
- Public first-contact surfaces must lead with persistent project memory for AI coding agents, living project knowledge, and agent-maintained docs. README, npm metadata, CLI intro/help, and the bundled skill should not make people or agents infer the core value from lower-level Markdown/doc mechanics.
- Treat 0.9.3 as a patch release because behavior is unchanged. Its job is to publish the public README/npm metadata clarity already prepared in the repo.

### Rejected Options

- Do not make export verification another primary human command.
- Do not let customer-facing export silently pass because the docs look polished; implementation evidence is required.
- Do not build a background daemon in this slice. BD can strengthen the agent contract and deterministic checks without pretending it runs autonomously.
- Do not treat every documented blocked project check as a readiness failure. A project can be handoff-ready when the blocker is clearly recorded as local environment state.
- Do not leave GitHub Releases as a manual afterthought separate from the npm publish flow.
- Do not headline BD as a documentation package, Markdown helper, or chat-to-docs converter. Those are implementation details or workflows, not the value proposition. Also do not imply BD is an autonomous daemon; the update loop comes from agent guidance and the installed skill.

## [Drift And Session Hooks Decisions](../features/drift-and-session-hooks/decisions.md)

Source: `benjamin-docs/features/drift-and-session-hooks/decisions.md` (updated 2026-07-09)

### Decisions

- Drift measures committed history only (`lastDocCommit..HEAD`) because uncommitted work is the current session's business and already covered by `review --changed`. The first dogfood run flagged 11 docs from uncommitted edits, which confirmed the noise problem.
- Drift is advisory and never blocks `ready`; `--strict` exists for CI gates that want exit 1. Broad default watch rules would make a blocking check flap on every code commit.
- The doc-to-code linkage is the existing `watch` rules in `.benjamin-docs/config.json`, so `review --changed`, freshness coverage, and drift stay consistent.
- Staged shipping (owner decision): drift + hooks in 0.10.0, MCP server next release using the official `@modelcontextprotocol/sdk` (first runtime dependency accepted).
- Hook targets are Claude Code + Codex + Cursor from the start (owner decision). Codex uses the Claude-compatible hooks schema; Cursor uses its camelCase schema with `additional_context` and `loop_limit: 1`.
- Hook ownership marker: the command string contains `benjamin-docs session-`. Install merges, uninstall removes only marked entries, unparseable files are preserved and reported as skipped.
- The stop nudge fires at most once per turn chain (`stop_hook_active` guard / `loop_limit`), and agent-config paths (`.claude/`, `.codex/`, `.cursor/`, `AGENTS.md`) do not count as source changes, so installing hooks does not itself trigger a nudge.
- Consent is explicit: interactive `init` asks; non-interactive `init` without `--hooks` does not install hooks. This is the one-time consent moment for background memory maintenance.
- Upgrades are pull-plus-nudge, not self-update: bd never updates its own global install. Agents relay "newer version available" from cached update checks; the human runs the package manager; `bd upgrade` then refreshes repo-local Benjamin-owned surfaces only.
- The update check is privacy-conservative: one version GET, 24h cache, never in a command's critical path (`session-start` reads cache and spawns a detached refresh), `BENJAMIN_DOCS_NO_UPDATE_CHECK=1` disables it entirely.
- `bd upgrade` refreshes the `AGENTS.md` section only when balanced Benjamin markers already exist; repos that never opted into agent guidance stay untouched.

### Rejected Options

- Counting working-tree changes as drift (noisy while work is in progress).
- A new doc-to-code mapping format separate from watch rules.
- One combined release with the MCP server.
- Hand-rolling the MCP stdio protocol to stay zero-dependency (protocol churn risk outweighs the dependency).
- JSON marker comments for hook ownership (JSON has no comments; command-string marker instead).
- Auto-updating the global package from hooks or upgrade (changes the user's machine without consent).
- Live update fetches inside `session-start` (would add network latency to every session start; cache-read plus detached refresh instead).

## [Agent Brief](../handoff/agent-brief.md)

Source: `benjamin-docs/handoff/agent-brief.md` (updated 2026-07-09)

### Recent Decisions

- V1 should be a small CLI plus an agent skill.
- Repo-local docs are the source of truth; hosted publishing is future SaaS, not V1.
- The free/open-source part should help adoption; the SaaS can monetize publishing, sharing, auth, comments, and non-technical editing.
- The tool must work before code exists, after code exists, and for a single feature scope.
- Agents should not only agree with user plans. The skill should preserve intent while naming weak assumptions, unclear decisions, overbuilt V1 scope, and better alternatives.
- Public README now leads with persistent project memory for AI coding agents, living project knowledge, self-updating agent workflow, and focused export packages before deeper setup details.
- Public README setup guidance now leads with pnpm global install and keeps source checkout details under local development.
- The second stranger test focused on a non-code person; README and CLI copy now explain `benjamin-docs` as a local project notebook an AI agent keeps in the project folder.
- Generated `next` prompts now ask for plain language or non-technical readability where appropriate.
- The chat-to-project workflow is a core V1 scenario: when the user only has a chat, the agent should ask for a project location, create the folder, run `benjamin-docs init --mode planning`, write a top-level README, and capture the chat into Benjamin docs.
- Chat-created projects should default to `~/Documents/Benjamin Docs/<Project Name>` with human-readable names, e.g. `~/Documents/Benjamin Docs/Atelier Edits`; avoid agent-specific or dated session folders unless requested.
- Chat-to-project confirmation copy should stay mobile-friendly: short sections, bullets for created files and captured content, and `Reply "yes" to create it`.
- `benjamin-docs@0.4.2` is published on npm and verified from fresh temp-project installs.
- GitHub Releases are backfilled from `v0.5.1` through `v0.9.2`; `v0.9.2` is marked latest and points at the `release: prepare 0.9.2` commit.
- Future package releases should run `pnpm run release:github` immediately after npm publish, then `pnpm run release:verify-public`; a tag-push GitHub Action creates the release if a maintainer pushes the version tag manually.
- The next milestone should focus on high-quality capture behavior, not more primary CLI commands.
- Use pnpm for this project.
- 0.4.1 polish should make `bd init` smart enough for normal codebase use: plain non-interactive init in an obvious codebase defaults to codebase memory with root and child agent guidance. Use `bd init --no-agent-contract` only when automation explicitly wants no repo-local guidance.
- `bd anchor list` was added after dogfooding showed that anchors could be created but not inspected through the CLI.
- 0.4.2 fixed older initialized projects that already have Benjamin docs but have an unmarked root `AGENTS.md`: append a Benjamin-owned section without overwriting the existing guide.
- 0.5.0 should make continuation readiness explicit: `agent-brief.md` must include read-first docs, current state, commands/checks, risks/hazards, and next actions.
- 0.5.1 added Memory Views as an advanced generated lens and documents the refresh flow as `bd init`, `bd views`, then `bd ready`.
- 0.6.0 adds `bd review --changed` after the Atelier audit showed agents may update feature docs while leaving project-level docs stale. The first implementation is deterministic and warning-only.
- 0.7.0 makes the gate trustworthy for any stack: watch rules move the changed-file-to-doc mapping into config, staleness is measured from git facts (churn since engineering docs last changed) and filesystem facts (path liveness), stale Memory Views fail `ready`, and `scope status` archives finished work out of views. All checks stay deterministic; `review` stays read-only.
- 0.8.0 closes the watch-coverage blind spot: status-bearing docs and active feature docs now warn when no watch rule can ever flag them stale, new starter docs carry `freshness: status`, and feature scope creation appends feature-specific watch coverage.
- 2026-06-20 direction: users expect BD to make agent-led development safer as they write and review less code themselves. The CLI should stay simple for humans, while agents use richer commands and repo guidance to maintain, verify, repair, and export project memory.
- 2026-06-20 daycare export dogfood: `/Users/marty/Important/daycare-platform-cloudflare-bd-export-scenarios` is a sibling Git worktree for export scenarios. It is acceptable as an isolated fixture, but not a good normal artifact location because it looks like a duplicate real project. `bd export` itself writes under `exports/` inside the current project root; future scenario worktrees should be clearly temporary or removed after use.
- 2026-06-25 public-repo guardrail: future private commercial strategy, pricing, and paid SaaS planning belongs outside tracked public docs unless the user explicitly marks it public-safe.

## [Baseline Capture Guide](../project/baseline-capture.md)

Source: `benjamin-docs/project/baseline-capture.md` (updated 2026-06-06)

### Current Decision

The baseline guide belongs in the README for public discoverability, with this repo-local note preserving the project rationale. V1 should keep the workflow prompt-based instead of adding a new CLI command until dogfooding proves which prompts are stable enough to automate.

## [Non-Code Stranger Test](../project/non-code-stranger-test.md)

Source: `benjamin-docs/project/non-code-stranger-test.md` (updated 2026-06-04)

### Decisions

- Add a README section for non-programmers before package mechanics.
- Explain `benjamin-docs` as a local project notebook that an AI agent keeps inside the project folder.
- Make clear that the CLI does not upload or publish anything.
- Add first prompts a non-code user can ask an agent.
- Update CLI `introduce` and `help` text to explain the workflow before listing commands.
- Update generated `next` prompts to ask for plain language and non-technical readability where appropriate.
- Promote chat-to-project as the first non-code workflow: the user may have only a chat, not an existing project folder.
- Include a simple top-level `README.md` in projects created from chat.
- Use `~/Documents/Benjamin Docs/<Project Name>` as the default chat-created project location, preserving human-readable folder names such as `Atelier Edits`.
- Avoid agent-specific or dated folders unless the user asks for them.
