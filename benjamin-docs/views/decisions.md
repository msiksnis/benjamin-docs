---
title: Decision Log
scope: project
scope_id: project
audience: [developer, agent]
status: draft
visibility: private
updated: 2026-07-11
source: manual
---

# Decision Log

Derived from decision and rejected-option sections across managed Benjamin docs.

## [launch-readiness-audit Decisions](../features/launch-readiness-audit/decisions.md)

Source: `benjamin-docs/features/launch-readiness-audit/decisions.md` (updated 2026-07-11)

### Implemented Trust Decisions

- Readiness is a versioned structured report, not a semantic proof claim.
- Known committed drift blocks `committed_freshness`; unresolved changed-work warnings block `working_tree_impact` and are excluded from baseline `content_heuristics`.
- Git unavailability is non-blocking only for planning mode.
- Enabled broken Benjamin guidance blocks `agent_guidance`; absent guidance is reported as not configured.
- Optional global setup remains in doctor diagnostics and does not determine repository readiness. Recorded environment blockers are visible but non-blocking.
- Validation findings belong only to `structure`; `content_heuristics` consumes review-specific baseline findings.
- Only a returned Git-unavailable result may be non-blocking for planning. A thrown drift-analysis error fails `committed_freshness` with evidence and a repair command.
- `working_tree_impact` uses changed review's own `changedWorkStatus`, never the committed drift result, so both dimensions can fail with their own evidence in the same report.
- Doctor diagnostics are target-specific and outside repository readiness; changed-work accounting includes deletions and repositories without a recognized stack.
- Every customer/public export uses one fail-closed preflight; temporarily unsupported publication paths write nothing.
- Public surfaces state the exact bounded-context, deterministic-readiness, visibility, and final-answer guarantees. The Claude upload ZIP is generated and verified from package sources rather than tracked.
- Release gates now exercise Linux, macOS, and Windows on Node 22 and 24; a separate trust job runs the packed-CLI smoke, repository readiness, and agent-overhead assertion.
- The 0.12.0 audit reproductions passed against temporary repositories: starter publication is blocked; committed drift, untracked cross-stack work, and deletions fail the correct dimensions; empty-home readiness stays healthy; target doctor output stays isolated; upgraded hooks are start-only; stop is silent; both context paths stay bounded; and verified customer feature export still succeeds.
- Final whole-branch review: committed filename enumeration is explicitly bounded at 64 MiB and propagates typed failure into fail-closed readiness. Git child processes force stable `C` diagnostics without dropping the caller environment. Only non-Git and unborn-HEAD states are legitimate planning-mode unavailability; real Git execution/enumeration failures block both freshness dimensions. Publication scanning covers punctuation-delimited macOS/Linux/Windows homes with case-insensitive Windows matching; repository-only strict doctor never reads integration paths; and shared-schema hook health/reinstall requires the supported matcher plus an exact executable command inside `SessionStart[].hooks[]`. Repair removes a malformed top-level Benjamin command as one property, preserves unrelated group data and nested user hooks exactly, and reuses an existing valid nested entry.
- Final whole-branch review: the primary human catalog is exactly `init`, `ready`, `export`, and `help`; `upgrade` remains advanced. Consent and upgrade copy describe only the compact session-start pointer/context packet and agent-led maintenance during normal work.

### Decisions

- 2026-07-10: Accept the launch audit's trust-first direction. Freeze unrelated feature expansion until readiness truth, export safety, repository-local health, bounded agent context, and response-safe integrations are implemented and verified.
- 2026-07-10: Treat agent overhead as a release contract: session-start stays at or below 400 characters and 100 estimated tokens; task-scoped memory_context stays at or below 2,400 characters and 600 estimated tokens; the core skill stays at or below 1,200 words; session-start and no-op session-stop p95 stay at or below 400 ms on the maintainer reference machine and 750 ms in CI.
- 2026-07-10: Benjamin Docs must never suppress, replace, delay, or materially rewrite the user's substantive final answer. Installed stop hooks will not block or auto-submit follow-ups. Reading memory needs no mention; after a durable update, an agent may append one sentence of at most 120 characters.
- 2026-07-10: Execute the dependable-standard work as staged plans. Start with docs/superpowers/plans/2026-07-10-dependable-standard-trust-foundation.md; follow with separate impact-evidence, canonical-state, agent-interface, and protocol/conformance plans after the preceding interfaces are proven.
- 2026-07-11: Prepare 0.12.0 as the implemented trust foundation, not as proof that Benjamin Docs is already a dependable standard. Sequence follow-on work strictly as B, impact evidence; C, canonical state, typed views, bounded continuation, and mode-specific minimal schemas; D, agent/MCP interfaces; E, public protocol and conformance.

## [Agent Brief](../handoff/agent-brief.md)

Source: `benjamin-docs/handoff/agent-brief.md` (updated 2026-07-11)

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
