---
title: Agent Brief
scope: handoff
scope_id: agent-brief
audience: [agent]
status: draft
visibility: private
updated: 2026-06-04
source: session-capture
---

# Agent Brief

## Current State

`benjamin-docs` is an early MVP for repo-local project memory. It turns planning/build conversations into structured Markdown docs in `benjamin-docs/` plus deterministic metadata in `.benjamin-docs/`.

The source repo is:

- Local path: `/Users/marty/Important/benjamin-docs`
- GitHub repo: `msiksnis/benjamin-docs`
- Main branch: `main`
- Package/CLI name: `benjamin-docs`
- Package status: prepared for first public `0.1.0` package release

The project has been renamed fully from the earlier working name `agent-docs`; do not reintroduce that name.

## Implemented So Far

- TypeScript CLI with no runtime dependencies.
- Commands: `init`, `status`, `validate`, `scope create feature <slug>`, `anchor add <id> <file>`, `export --audience <audience>`, `promote --to codebase`, `introduce`, `help`, `--version`, `-v`.
- Planning-mode docs created by `init`.
- Codebase-mode docs created by `promote --to codebase`.
- Feature-scope templates under `benjamin-docs/features/<slug>/`.
- JSON metadata in `.benjamin-docs/`.
- Validation for frontmatter, metadata, anchors, links, symlink safety, and project-root containment.
- Export bundles for audience-specific handoff.
- A `skills/benjamin-docs/SKILL.md` file for agent session capture and constructive challenge.

## Recent Decisions

- V1 should be a small CLI plus an agent skill.
- Repo-local docs are the source of truth; hosted publishing is future SaaS, not V1.
- The free/open-source part should help adoption; the SaaS can monetize publishing, sharing, auth, comments, and non-technical editing.
- The tool must work before code exists, after code exists, and for a single feature scope.
- Agents should not only agree with user plans. The skill should preserve intent while naming weak assumptions, unclear decisions, overbuilt V1 scope, and better alternatives.
- Public README baseline capture guidance now covers a new idea, an existing codebase, and one feature scope.
- Public README setup guidance now leads with pnpm global install and keeps source checkout details under local development.
- The second stranger test focused on a non-code person; README and CLI copy now explain `benjamin-docs` as a local project notebook an AI agent keeps in the project folder.
- Generated `next` prompts now ask for plain language or non-technical readability where appropriate.
- The chat-to-project workflow is a core V1 scenario: when the user only has a chat, the agent should ask for a project location, create the folder, run `benjamin-docs init --mode planning`, write a top-level README, and capture the chat into Benjamin docs.
- Chat-created projects should default to `~/Documents/Benjamin Docs/<Project Name>` with human-readable names, e.g. `~/Documents/Benjamin Docs/Atelier Edits`; avoid agent-specific or dated session folders unless requested.
- Chat-to-project confirmation copy should stay mobile-friendly: short sections, bullets for created files and captured content, and `Reply "yes" to create it`.
- Package is now prepared for public `benjamin-docs@0.1.0`; README uses pnpm install commands only.
- Use pnpm for this project.

## Public Repo Setup

The GitHub repo is public. Branch protection exists on `main` with:

- required CI status named `CI`
- one required PR approval
- stale reviews dismissed
- code-owner review required
- conversations must be resolved
- linear history required
- force pushes and branch deletion disabled
- admin enforcement disabled so the owner can push directly to `main`

`.github/CODEOWNERS` currently assigns all paths to `@msiksnis`.

## Global Local Setup

The global Codex skill was installed at:

- `/Users/marty/.codex/skills/benjamin-docs/SKILL.md`

The global CLI command was made available as:

- `/Users/marty/Library/pnpm/benjamin-docs`

That shim runs:

```bash
node /Users/marty/Important/benjamin-docs/dist/src/cli.js "$@"
```

This was a temporary local setup while the package was unpublished. Once published, normal pnpm global install should replace this local shim.

## Important Product Finding From `pup-base`

Testing in `/Users/marty/Important/pet-software/pup-base` exposed an important V1 behavior:

- Existing repos may already have Markdown files under `docs/`.
- `benjamin-docs validate` should validate Benjamin-managed docs listed in `.benjamin-docs/manifest.json`.
- Legacy unmanaged Markdown docs should not fail validation just because they lack Benjamin frontmatter.
- Public V1 now uses `benjamin-docs/` as the default docs root so existing project `docs/` directories stay separate.

This was fixed in commit:

- `ebae0be fix: ignore unmanaged legacy docs during validation`

`pup-base` now validates with the global command and is in codebase mode.

## Next Agent Instructions

When continuing this project:

1. Start in `/Users/marty/Important/benjamin-docs`.
2. Run:
   ```bash
   git status --short
   benjamin-docs status
   benjamin-docs validate
   pnpm check
   ```
3. Read these docs first:
   - `benjamin-docs/project/brief.md`
   - `benjamin-docs/project/roadmap.md`
   - `benjamin-docs/project/open-questions.md`
   - `benjamin-docs/handoff/agent-brief.md`
   - `docs/superpowers/specs/2026-06-03-benjamin-docs-design.md`
   - `docs/superpowers/plans/2026-06-03-benjamin-docs-mvp.md`
4. Keep changes small and practical. This project should remain useful before it becomes clever.
5. If capturing a conversation, update existing docs instead of dumping a transcript.
6. Run `benjamin-docs validate` and `pnpm check` before reporting completion.

## Likely Next Work

- Decide how to distribute the skill cleanly for Codex/Claude users.
- Add docs scripts or shell guidance for common workflows.
- Dogfood the baseline capture workflow in real projects, starting with `pup-base`.
- Test whether a non-code person can succeed with only the README and an agent.
- Dogfood chat-to-project with a fresh conversation and no existing project folder.
- Publish `benjamin-docs@0.1.0`, then verify global pnpm install in a clean environment.
- Consider a command that prints recommended next capture prompts.
- Later: publish package only after package contents, security posture, and install story are tightened.
