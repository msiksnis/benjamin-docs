---
title: Roadmap
scope: project
scope_id: project
audience: [developer, business, agent]
status: draft
visibility: private
updated: 2026-06-06
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
- Clarify pnpm-first install paths for global CLI use, project-local installs, and source checkout development.
- Improve the non-code stranger path with a plain-language README section, gentler CLI introduction/help copy, and generated prompts that ask for non-technical readability.
- Restore chat-to-project as a core V1 workflow: a user can ask an agent to create a new local project from the current chat, including a top-level README and initialized Benjamin docs.
- Prepare `benjamin-docs@0.1.0` for public package publishing with pnpm-first install docs and release checks.

## Current Package State

- `benjamin-docs` is published on npm.
- Current release candidate: `0.2.0`.
- The global CLI is installed from npm with pnpm.
- The bundled skill is installed in shared, Codex, Claude Code, and Cursor skill folders.
- The Claude Desktop upload zip is generated at `~/Downloads/benjamin-docs-skill.zip`.
- The public GitHub repo is `msiksnis/benjamin-docs`.
- Owner direct push to `main` is allowed via admin bypass; regular contributors should use PRs.

## Immediate Next Work

- Dogfood BD on itself until `benjamin-docs review` passes without warnings.
- Test first-run behavior on an uninitialized real codebase using a temp copy before writing to the original project.
- Improve the existing-codebase baseline prompt if agents skip `human-brief.md` or leave starter docs behind.
- Keep the public README short, direct, and non-enterprise.
- Watch whether npm/search discovery is delayed or noisy, but do not optimize around fake download counts.
- Define the `0.2.0` milestone around making the first ten minutes excellent.

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
