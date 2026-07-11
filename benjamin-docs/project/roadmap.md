---
title: Roadmap
scope: project
scope_id: project
audience: [developer, business, agent]
status: review
visibility: private
updated: 2026-07-11
source: session-capture
freshness: status
---

# Roadmap

## Dependable Standard Program — Approved

The maintainer accepted the 2026-07-10 launch-audit verdict and trust-first direction. Version 0.11.1 should not be positioned as a dependable standard. The 0.12.0 trust foundation is implemented and reproduced, but the product still must not be called a dependable standard until later evidence, canonical-state, agent-interface, and protocol/conformance gates pass.

The first executable release train is `docs/superpowers/plans/2026-07-10-dependable-standard-trust-foundation.md`, targeting 0.12.0. It makes agent integrations response-safe, locks latency/token budgets, makes readiness truthful, separates repository health from optional global setup, covers every changed file type and deletion, fails public/customer exports closed, corrects public claims, and adds cross-platform/package gates.

Later release trains are strictly sequenced: B, impact evidence; C, canonical structured state, typed views, bounded continuation, and mode-specific minimal schemas; D, agent/MCP interfaces; E, a vendor-neutral protocol and conformance suite. The program sequence and numerical budgets live in `benjamin-docs/features/launch-readiness-audit/plan.md`.

## Done In MVP

- Initialize repo-local `benjamin-docs/` and `.benjamin-docs/`.
- Support planning-only projects with `init`.
- Support existing-codebase projects with `promote --to codebase`.
- Support feature scopes with `scope create feature <slug>`.
- Support code anchors with `anchor add <id> <file>`.
- Support anchor inspection with `anchor list`.
- Validate managed docs, metadata, anchors, links, and symlink/root safety.
- Export audience bundles with `export --audience <audience>`.
- Provide human-readable help, version output, and a plain-language `introduce` command.
- Provide a `benjamin-docs` skill for Codex/Claude-style session capture.
- Prepare the public GitHub repo with README, license, contribution/security docs, CI, issue templates, CODEOWNERS, and branch protection.
- Move the default managed docs root to `benjamin-docs/` so legacy project docs under `docs/` stay separate.
- Fix existing-repo validation so legacy unmanaged Markdown does not block validation.
- Add a concise baseline capture guide for new ideas, existing codebases, and single feature scopes.
- Clarify pnpm-first install paths for global CLI use, project-local installs, and source checkout development.
- Improve the non-code stranger path with a plain-language README section, gentler CLI introduction/help copy, and generated prompts that ask for non-technical readability.
- Restore chat-to-project as a core V1 workflow: a user can ask an agent to create a new local project from the current chat, including a top-level README and initialized Benjamin docs.
- Prepare `benjamin-docs@0.1.0` for public package publishing with pnpm-first install docs and release checks.

## Current Package State

- `benjamin-docs` is published on npm.
- Current published release: `0.11.1` (session-hook turn safety), published 2026-07-09 with npm, git tag, and GitHub Release verified in sync.
- Working package version: `0.12.0` release candidate; not published, tagged, or released.
- The global CLI is installed from npm with npm and pnpm.
- The bundled skill is installed in shared, Codex, Claude Code, and Cursor skill folders.
- The Claude Desktop upload zip is generated at `~/Downloads/benjamin-docs-skill.zip`.
- The public GitHub repo is `msiksnis/benjamin-docs`.
- Owner direct push to `main` is allowed via admin bypass; regular contributors should use PRs.
- GitHub Releases exist for every published version through `v0.11.1`, which is the latest release.
- Release guardrails now include `pnpm run release:github`, `pnpm run release:verify-public`, and a tag-push GitHub Action that creates GitHub Releases from version tags after verifying npm.
- The 0.4.x npm artifacts were verified in fresh temp projects and dogfooded on `/Users/marty/Important/atelier-beaute` and `/Users/marty/Important/pet-software/pup-base`.
- Local Memory Views are implemented behind the advanced `bd views` command, not promoted into the primary command path.
- `bd review --changed` is implemented as an advanced, warning-only freshness check for source changes that probably need Benjamin Docs updates.
- `bd review` / `bd ready` now flag status-bearing docs and active feature docs that have no watch-rule coverage.
- Guided `bd export` is implemented as the human-facing export path, with advanced direct flags reserved for agents and scripts.
- Public GitHub and npm positioning now leads with "persistent project memory for AI coding agents" and explains living project knowledge that agents update while they work, so BD is not mistaken for a generic documentation package or Markdown helper.

## Immediate Next Work

- Release Train A, the 0.12.0 trust foundation, and all ten audit reproductions are complete on the dependable-standard branch; the release candidate remains unpublished.
- The final whole-branch review fix set is complete: large-diff and execution-failure fail-closed freshness, explicit non-Git/unborn-HEAD planning availability, case-insensitive Windows publication paths, lazy repository doctor, exact target hook repair, accurate session-context copy, current repo metadata, and the four-command human surface have focused regressions.
- Next, write the Impact Evidence Plan for durable doc-updated/no-impact/deferred/blocker acknowledgements keyed to commit and content identity.
- After impact evidence is proven, write the Canonical State Plan covering typed views, bounded continuation, and mode-specific minimal schemas; then write the Agent Interface Plan; then the Protocol and Conformance Plan.
- Keep the human command surface stable and preserve the public-repo privacy guardrail.

## 0.11.0 Goal

Turn project memory into a native agent interface:

- `bd mcp` serves memory over stdio via the official MCP SDK: context, search, read, validated writes, decisions, status. Manifest-scoped; views read-only; writes roll back on validation regressions.
- `bd mcp install` registers the server for Claude Code, Cursor, and Codex without touching user config.
- Hooks remain the push path (context in); MCP is the pull-and-write path.

## 0.10.0 Goal (historical; superseded by 0.12.0 where noted)

Make project memory self-maintaining instead of voluntary:

- `bd drift` measures docs against committed git history through watch rules; advisory in `bd ready`, `--strict` for CI, `--json` for agents.
- `bd hooks install` originally wired start and stop behavior. The 0.12.0 candidate installs compact session-start context only and removes legacy Benjamin stop entries.
- Interactive `bd init` asks for hook consent. The current primary human command surface is exactly `init`, `ready`, `export`, and `help`; `upgrade` is an advanced repair surfaced on version skew.
- `bd upgrade` catches previously initialized repos up (version stamp, agent guidance, skills, views, hooks offer); a cached opt-out npm update check makes agents the ones who notice new versions.

## Guided Export Goal

The 0.9.0 export milestone turns existing project and feature memory into concise local deliverables without making people learn many commands.

Target state:

- `bd export` opens a guided menu for human users.
- Feature documentation, app documentation, customer handoff, developer handoff, and project summary can be exported as concise Markdown under `exports/`.
- Agents and scripts can use direct flags such as `bd export --feature <slug> --profile customer` and `bd export --type handoff --profile customer`.
- Customer-facing feature exports run deterministic readiness checks before writing output.
- If a feature does not exist, is misspelled, or is not export-ready, BD gives a precise next agent prompt instead of inventing content.
- Customer-facing exports require implementation-verification evidence in the source docs before they are treated as ready.
- Generated exports are snapshots with source-doc, source-commit, dirty-state, detail-level, and export-time metadata.

Deferred from this milestone:

- PDF rendering.
- Hosted publishing.
- Screenshot capture.

## Agent Reliability Follow-Ups

These should all be considered part of the next direction, but they should remain agent-led or advanced workflows rather than new primary user commands.

- Export verification workflow: make customer-facing exports depend on recorded implementation verification, with agents responsible for checking docs against the app/code before exporting.
- Fresh-agent dogfood test: prove continuation quality by asking a new agent to continue from only `README.md`, `AGENTS.md`, `.benjamin-docs/`, and `benjamin-docs/`.
- Public-positioning dogfood test: ask a fresh human or agent to inspect only the GitHub README or npm package page and summarize what BD is. Passing means they identify persistent project memory or living project knowledge for AI coding agents, not a generic docs helper.
- Better `bd ready` explanations: group failures into repair categories such as update docs, run views, archive stale scope, add watch coverage, verify implementation, or fix setup.
- Recorded environment/tooling blockers: done for the first slice. `bd ready` now surfaces clearly documented local prerequisites as their own non-failing category when the project memory captured them.
- Guided freshness repair: give agents an advanced repair path for stale views, uncovered status docs, missing paths, and shipped/abandoned feature scopes.
- Feature lifecycle polish: when features ship or are abandoned, help agents archive scopes, refresh views, update changelog/handoff context, and keep generated exports from treating old work as active.

Dogfood finding from `/Users/marty/Important/daycare-platform-cloudflare-bd-export-scenarios`: export outputs correctly live under `exports/` relative to the active project root, but the daycare export scenario was created as a sibling Git worktree. That is acceptable for an isolated test fixture, but it is confusing as a normal user-facing artifact because it looks like a second real project. Future dogfood fixtures should live in a clearly temporary/worktrees area or be removed after validation; normal `bd export` usage should happen inside the actual project and write to that project's `exports/` directory.

## 0.8.0 Goal

`benjamin-docs@0.8.0` closes the staleness blind spot found during real audit-remediation work: detailed feature docs stayed current, but top-level handoff and roadmap docs drifted while `ready` stayed green.

Target state:

- `review` and `ready` warn when status-bearing docs or active feature docs are not matched by any `watch` rule.
- New starter status docs carry `freshness: status` frontmatter.
- Default watch rules cover every starter doc created by `init`.
- `scope create feature <slug>` appends watch coverage for the feature docs it creates.
- Starter handoff templates separate durable context from volatile status facts and nudge agents toward one canonical status source.

Deferred from 0.8.0:

- Duplicate volatile-fact detection for repeated counts or exact next-item claims.
- Cross-repo/sibling-repo freshness expectations.
- Automatic migration of old project configs beyond surfacing blind spots through `review`/`ready`.

## 0.7.0 Goal

`benjamin-docs@0.7.0` makes the readiness gate harder to fool and works for any stack, not just this user's stack.

Target state:

- Changed-work review maps changed files to docs through configurable `watch` rules in `.benjamin-docs/config.json`, with generic defaults seeded by `init`.
- `review` warns on git churn (many source files changed since engineering docs last changed), missing inline-code path references, and stale Memory Views; `ready` fails on those warnings.
- `bd scope status <id> <status>` archives shipped or abandoned scopes, and views exclude archived/stale docs and scopes.
- Views group sections per source doc, order by updated date, and only rewrite changed files.
- All new checks stay deterministic and warning-only inside `review`; no new primary commands.

Deferred from 0.7.0:

- `--json` output for `ready`/`review`/`validate` and a GitHub Action for PR-time freshness checks.
- Enforcement hooks (agent-stop or pre-commit recipes) so freshness does not depend on skill obedience.
- Skill modularization through `bd guide <workflow>` so SKILL.md stays thin.
- Churn-threshold tuning from dogfooding on non-Node projects.

## 0.6.0 Goal

`benjamin-docs@0.6.0` should make local project memory harder to accidentally leave stale after implementation work.

Target state:

- `bd review --changed` checks git-changed source files and warns when likely project-memory source docs were not updated.
- Changed-work review stays in the advanced drawer and remains warning-only until dogfooding proves the heuristics are useful.
- Generated `AGENTS.md` and the bundled skill tell agents to update project-level docs when feature work changes roadmap, architecture, code map, release notes, risks, or handoff context.

## 0.5.1 Goal

`benjamin-docs@0.5.1` made local project memory easier to refresh.

Target state:

- `bd views` generates local Memory Views for decisions, open questions, next actions, risks, and agent continuation.
- Public guidance describes the refresh flow as `bd init`, `bd views`, then `bd ready`.

## 0.5.0 Goal

`benjamin-docs@0.5.0` should make "ready" mean continuation-ready.

Target state:

- No new primary commands.
- `bd init` still creates the simple project memory path.
- `handoff/agent-brief.md` becomes the required continuation proof for future agents.
- `bd review` warns when the agent brief is missing read-first docs, current state, commands/checks, risks/hazards, or next actions.
- `bd ready` fails when those proof pieces are missing.
- Starter templates and generated `next` prompts teach both fresh and older projects to add the proof.
- The bundled skill tells agents to fix weak handoffs before calling a capture complete.

## 0.4.1 Goal

`benjamin-docs@0.4.1` should make the 0.4.0 behavior feel simpler in practice.

Target state:

- Plain `bd init` in an obvious codebase creates codebase memory and agent guidance by default.
- Users do not need to learn `--mode codebase --agent-contract --children` for the normal path.
- Automation can still opt out with `bd init --no-agent-contract`.
- `bd anchor list` completes the anchor workflow.
- `bd init --help`, `bd anchor --help`, and `bd scope --help` explain advanced usage without errors.
- `bd introduce`, README, and the bundled skill all point to the same simple first step.

## 0.4.2 Goal

`benjamin-docs@0.4.2` should make older initialized projects upgrade cleanly.

Target state:

- If a project already has Benjamin docs but `AGENTS.md` has no Benjamin markers, `bd init` preserves the existing guide and appends a marked Benjamin section.
- If child guidance is expected, `bd init` creates `benjamin-docs/AGENTS.md` and indexes it from the appended root section.
- If `AGENTS.md` has broken or duplicate Benjamin markers, BD remains conservative and asks for manual cleanup.

## 0.4.0 Goal

`benjamin-docs@0.4.0` should be the high-quality capture milestone.

Target state:

- A user can start with a messy chat, a new repo, an existing codebase, or a single feature plan.
- The agent can turn that context into useful Benjamin docs without the user understanding the docs structure.
- Existing Benjamin docs and existing `AGENTS.md` files are improved safely, not overwritten.
- The baseline capture names project purpose, architecture, code map, risks, open questions, next actions, and handoff context.
- The agent challenges weak assumptions, missing decisions, contradictory goals, and overbuilt plans.
- `bd ready` is the normal completion gate, and passing it means the project memory is usable by the next human or agent.

Non-goals for 0.4.0:

- More primary commands.
- Hosted publishing.
- A web UI.
- Automatic transcript dumps.
- Rewriting user-owned agent guidance without approval.

## V1 Quality Bar

- Keep the CLI deterministic and dependency-light.
- Keep Markdown readable without special tooling.
- Preserve repo-local docs as the source of truth.
- Avoid hosted publishing features in V1 unless they directly improve local docs quality.
- Make agent behavior useful but not passive: it should record decisions, open questions, risks, rejected options, and better alternatives.

## V1 Candidate Polish

- `benjamin-docs doctor --strict` exists and should remain the setup readiness gate.
- `benjamin-docs review` exists and should remain a docs-quality gate, not a full AI reviewer.
- `benjamin-docs chat-project` exists and should remain confirmation-first.
- `benjamin-docs ready` is now a repository-local structured gate over validation, content heuristics, committed freshness, working-tree impact, and configured agent guidance. Optional machine setup remains outside repository readiness. Validation-only findings stay in structure, analysis errors fail freshness closed, and working-tree availability comes from changed review rather than drift.
- Future polish should make these commands clearer before adding new surfaces.

## Deferred SaaS

- Hosted docs portals.
- Public, private, and unlisted access.
- Comments and suggestions.
- Non-technical editing.
- GitHub sync.
- Cross-project dashboards.

## Deferred Non-V1 Ideas

- Authenticated/private shared doc portals.
- Direct-link unlisted project handoffs.
- Web editor for non-technical users.
- Review/comment workflow for designers, developers, advisors, and funders.
- Agent-readable API for hosted project memory.
- GitHub App or action to publish docs from repo state.
- SaaS dashboard for multiple projects.
