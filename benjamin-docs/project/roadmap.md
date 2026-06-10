---
title: Roadmap
scope: project
scope_id: project
audience: [developer, business, agent]
status: review
visibility: private
updated: 2026-06-10
source: session-capture
---

# Roadmap

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
- Current published release: `0.4.2`.
- Working package version: `0.5.0` for Continuation Proof readiness.
- The global CLI is installed from npm with npm and pnpm.
- The bundled skill is installed in shared, Codex, Claude Code, and Cursor skill folders.
- The Claude Desktop upload zip is generated at `~/Downloads/benjamin-docs-skill.zip`.
- The public GitHub repo is `msiksnis/benjamin-docs`.
- Owner direct push to `main` is allowed via admin bypass; regular contributors should use PRs.
- `v0.4.2` is tagged and released on GitHub.
- The 0.4.x npm artifacts were verified in fresh temp projects and dogfooded on `/Users/marty/Important/atelier-beaute` and `/Users/marty/Important/pet-software/pup-base`.

## Immediate Next Work

- Keep the CLI command surface stable. Do not add more top-level commands unless a repeated real workflow proves the need.
- Polish the 0.4.x simple path so `bd init` is enough in normal codebase use.
- Dogfood 0.4.x on more real projects and record where the skill produces weak, vague, or overconfident docs.
- Implement 0.5.0 as a continuation-quality milestone: prove that a future human or agent can continue from the docs without the original chat.
- Keep the public README short, direct, and non-enterprise.
- Treat the interactive `commands` drawer as the place for advanced workflows, not as a reason to promote more commands.

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
- `benjamin-docs ready` exists and should remain the high-level handoff gate that combines setup, validation, and docs quality.
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
