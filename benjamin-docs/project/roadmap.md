---
title: Roadmap
scope: project
scope_id: project
audience: [developer, business, agent]
status: draft
visibility: private
updated: 2026-06-04
source: session-capture
---

# Roadmap

## Done In MVP

- Initialize repo-local `benjamin-docs/` and `.benjamin-docs/`.
- Support planning-only projects with `init`.
- Support existing-codebase projects with `promote --to codebase`.
- Support feature scopes with `scope create feature <slug>`.
- Support code anchors with `anchor add <id> <file>`.
- Validate managed docs, metadata, anchors, links, and symlink/root safety.
- Export audience bundles with `export --audience <audience>`.
- Provide human-readable help, version output, and a plain-language `introduce` command.
- Provide a `benjamin-docs` skill for Codex/Claude-style session capture.
- Prepare the public GitHub repo with README, license, contribution/security docs, CI, issue templates, CODEOWNERS, and branch protection.
- Move the default managed docs root to `benjamin-docs/` so legacy project docs under `docs/` stay separate.
- Fix existing-repo validation so legacy unmanaged Markdown does not block validation.
- Add a concise baseline capture guide for new ideas, existing codebases, and single feature scopes.
- Clarify unpublished setup paths for agent-skill-only use, per-project local package installs, direct source CLI use, and temporary global CLI use.
- Improve the non-code stranger path with a plain-language README section, gentler CLI introduction/help copy, and generated prompts that ask for non-technical readability.
- Restore chat-to-project as a core V1 workflow: a user can ask an agent to create a new local project from the current chat, including a top-level README and initialized Benjamin docs.

## Current Local Setup

- The source package is still private and unpublished.
- A global Codex skill is installed at `/Users/marty/.codex/skills/benjamin-docs/SKILL.md`.
- A temporary global CLI shim is installed at `/Users/marty/Library/pnpm/benjamin-docs`.
- The public GitHub repo is `msiksnis/benjamin-docs`.
- Owner direct push to `main` is allowed via admin bypass; regular contributors should use PRs.

## Immediate Next Work

- Keep improving skill instructions so agents know how to choose between global `benjamin-docs`, `pnpm exec benjamin-docs`, and direct source CLI usage.
- Decide whether `validate` should report skipped unmanaged docs as an optional warning or stay quiet.
- Add tests/docs for the current global-shim workaround or replace it with a cleaner local install path.
- Capture a full baseline for `pup-base` as the first real dogfood project.
- Test whether a non-code person can succeed with only the README and an agent.
- Dogfood chat-to-project with a fresh conversation and no existing project folder.

## V1 Quality Bar

- Keep the CLI deterministic and dependency-light.
- Keep Markdown readable without special tooling.
- Preserve repo-local docs as the source of truth.
- Avoid hosted publishing features in V1 unless they directly improve local docs quality.
- Make agent behavior useful but not passive: it should record decisions, open questions, risks, rejected options, and better alternatives.

## V1 Candidate Polish

- Add command examples for common flows:
  - `benjamin-docs init`
  - `benjamin-docs init --mode codebase`
  - `benjamin-docs init --mode feature --feature <slug>`
  - `benjamin-docs next`
  - `benjamin-docs promote --to codebase`
  - `benjamin-docs scope create feature <slug>`
  - `benjamin-docs anchor add <id> <file>`
  - `benjamin-docs export --audience developer`
- Consider `benjamin-docs doctor` for setup checks.
- Consider `benjamin-docs next` or `benjamin-docs prompts` for suggested capture prompts.
- Consider a safer distribution path for global CLI usage before npm publishing.
- Add a concise release checklist before first npm publish.

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
