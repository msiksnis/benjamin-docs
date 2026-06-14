---
title: Agent Brief
scope: handoff
scope_id: agent-brief
audience: [agent]
status: review
visibility: private
updated: 2026-06-14
source: session-capture
freshness: status
---

# Agent Brief

## Current State

`benjamin-docs` is a published npm CLI and bundled agent skill for repo-local project memory. It turns planning/build conversations into structured Markdown docs in `benjamin-docs/` plus deterministic metadata in `.benjamin-docs/`.

The source repo is:

- Local path: `/Users/marty/Important/benjamin-docs`
- GitHub repo: `msiksnis/benjamin-docs`
- Main branch: `main`
- Package/CLI name: `benjamin-docs`
- Package status: `0.7.0` published on npm.
- Working package version: `0.8.0` for freshness coverage / staleness blind-spot protection.

The project has been renamed fully from the earlier working name `agent-docs`; do not reintroduce that name.

## Continuation Proof

Read first:

- `README.md`
- `benjamin-docs/project/brief.md`
- `benjamin-docs/project/roadmap.md`
- `benjamin-docs/project/open-questions.md`
- `benjamin-docs/handoff/human-brief.md`
- `docs/superpowers/plans/2026-06-10-continuation-proof.md`

Current state: 0.7.0 is published. The 0.8.0 work is implemented and release checks pass locally: freshness coverage warnings for status-bearing and active feature docs, `freshness: status` frontmatter, broader default watch rules, feature-scope watch registration, and templates that separate durable handoff context from volatile status facts. `npm publish` was attempted on 2026-06-14 but blocked because the local npm session is unauthenticated (`npm whoami` returns E401); `npm view benjamin-docs version` still reports 0.7.0.

Commands/checks to run before handoff:

```bash
pnpm check
node dist/src/cli.js review --changed --since HEAD
pnpm run release:check
node dist/src/cli.js ready
```

Risks/hazards: do not add more primary commands, keep all review checks deterministic and warning-only inside `review` (only `ready` escalates), keep `review` read-only (checks must not mutate the project), do not overwrite user-owned `AGENTS.md`, do not require exact headings when equivalent continuation evidence exists, and avoid making planning-only projects invent code paths. Freshness coverage warnings should reveal blind spots, not force every tiny code edit to rewrite every doc.

Next actions: authenticate npm, publish 0.8.0 from a freshly packed tarball, smoke-test a fresh npm install, tag the release, then dogfood the blind-spot warnings on older initialized projects.

## Implemented So Far

- TypeScript CLI with no runtime dependencies.
- Main commands: `init`, `ready`, `help`.
- Advanced drawer: `commands`, with numbered interactive selection in real terminals.
- Advanced commands include `status`, `next`, `validate`, `review`, `review --changed`, `doctor`, `export --audience <audience>`, `scope create feature <slug>`, `scope status <id> <status>`, `anchor add <id> <file>`, `anchor list`, `install-skill`, `package-skill`, and `chat-project`.
- Short binary alias: `bd`.
- Planning-mode docs created by `init`.
- Codebase-mode docs created by `promote --to codebase`.
- Feature-scope templates under `benjamin-docs/features/<slug>/`.
- JSON metadata in `.benjamin-docs/`.
- Validation for frontmatter, metadata, anchors, links, symlink safety, and project-root containment.
- `ready` gate that combines validation, docs review, setup checks, and agent guidance health.
- Root and child `AGENTS.md` support that preserves existing user-owned instructions.
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
- `benjamin-docs@0.4.2` is published on npm and verified from fresh temp-project installs.
- `v0.4.2` is pushed to GitHub with release notes.
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

## 0.4.x Direction

0.4.x should make Benjamin Docs reliably turn messy chats, new repos, existing codebases, and single feature plans into useful project memory without the user needing to understand the docs structure.

The priority is agent behavior:

- stronger baseline capture
- safer updates to existing Benjamin docs
- better handling of existing or complex `AGENTS.md`
- clearer handoff docs
- direct challenge of weak assumptions and missing decisions

Do not expand the primary command surface unless dogfooding proves a repeated workflow cannot fit under `init`, `ready`, `help`, or the advanced `commands` drawer.

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

This was a temporary local setup while the package was unpublished. The current machine now has `benjamin-docs@0.4.2` installed globally from npm through npm and pnpm.

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
   bd status
   bd ready
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
6. Run `bd ready` and `pnpm check` before reporting completion.

## Likely Next Work

- Dogfood the 0.5.0 Continuation Proof workflow on a fresh project and an older initialized project.
- Improve `skills/benjamin-docs/SKILL.md` whenever dogfooding shows vague, thin, or unsafe capture behavior.
- Keep `README.md` short and point advanced users to `bd commands`.
- Dogfood `bd review --changed` on real projects before deciding whether changed-work warnings should become part of `ready`.
