---
name: benjamin-docs
description: Capture planning and build conversations into repo-local project memory for humans and AI agents.
---

# benjamin-docs

Use this skill when the user asks to capture, document, summarize, hand off, export, preserve a planning or development conversation, or create a project from a chat with `benjamin-docs`.

If the user says "Use the benjamin-docs skill to create a project from this chat" or similar, start the Chat-To-Project Workflow directly.

## Purpose

`benjamin-docs` turns long-running project conversations into durable Markdown docs inside a project folder. It is useful when the user only has a chat, before code exists, inside existing codebases, and for individual feature scopes.

## Chat-To-Project Workflow

Use this workflow when the user asks to create a project from the current chat, turn this chat into a project, start a new project with `benjamin-docs`, or similar.

Critical rules:

- Always ask before creating files. Do not create the project until the user confirms.
- Always suggest `~/Documents/Benjamin Docs/<Project Name>` as the default location unless the user already gave an explicit path.
- Never silently use the current working directory for a chat-only project.
- Never use agent-specific, app-specific, or dated session folders such as `~/Documents/Codex/<date>/...`, `Codex`, `Claude`, `Cursor`, or `YYYY-MM-DD` paths unless the user explicitly asks for that exact location.
- If the current folder is under `~/Documents/Codex/`, treat it as a temporary Codex chat workspace, not as the user's chosen project folder.
- Do not write a loose Markdown summary as a fallback. If the CLI cannot be run, stop and explain what is missing.

1. Infer a human-readable project name from the chat when one is obvious. Preserve normal title casing and spaces for the folder name, for example `Atelier Edits`.
2. When the CLI is available, run `benjamin-docs chat-project --name "<Project Name>"` to get the exact confirmation and completion guidance.
3. Suggest `~/Documents/Benjamin Docs/<Project Name>` as the default location unless the user gave a different explicit location.
4. Confirm the target project name and local folder before creating files. Ask in plain language and avoid mentioning skill internals.
   Example:
   ```text
   I can create a new local project from this chat.

   Project name: Atelier Edits
   Suggested folder: ~/Documents/Benjamin Docs/Atelier Edits

   I will create:
   - README.md
   - benjamin-docs/
   - .benjamin-docs/

   I will capture:
   - the main project idea
   - important references and constraints
   - decisions and open questions
   - roadmap and next actions
   - human and agent handoff notes

   Reply "yes" to create it, or send a different path/name.
   ```
5. Wait for the user's confirmation. Only create files after the user replies with approval or a different explicit path/name.
6. Create the project folder.
7. Run the local CLI command inside that folder with `init --mode planning`.
8. Read `.benjamin-docs/config.json` and use its `docsRoot` value, usually `benjamin-docs`.
9. Create a simple top-level `README.md` for the new project unless one already exists. Keep it plain-language and include:
   - project name
   - one-paragraph summary
   - where to start in `benjamin-docs/`
   - current status
   - next actions
10. Populate the starter Benjamin docs from the current chat context:
   - `project/brief.md`
   - `project/roadmap.md`
   - `project/open-questions.md`
   - `handoff/human-brief.md`
   - `handoff/agent-brief.md`
11. Do not invent certainty. Mark assumptions and unresolved questions clearly.
12. Run the local CLI command with `ready` as the completion gate for the created project.
13. If `ready` fails, use lower-level checks such as `validate`, `review`, or `doctor --strict` only to diagnose the failed result, then fix weak docs or setup gaps before claiming the project is ready.
14. Report the created project path, project structure, main docs updated, key decisions captured, unresolved questions, and whether `ready` passed. Mention lower-level checks only if you ran them.

When reporting completion, do not imply the project is only a few files. Say the project structure was created:

- `README.md`
- `benjamin-docs/` with project, handoff, engineering, features, and releases docs
- `.benjamin-docs/` with config, manifest, scopes, and anchors metadata

Then list the main docs updated, usually:

- `benjamin-docs/project/brief.md`
- `benjamin-docs/project/roadmap.md`
- `benjamin-docs/project/open-questions.md`
- `benjamin-docs/handoff/human-brief.md`
- `benjamin-docs/handoff/agent-brief.md`

Do not overwrite an existing top-level `README.md` unless the user explicitly asks. If the target folder already contains a project, switch to the normal capture workflow instead of treating it as a brand-new chat-created project.

When confirming a chat-created project, keep the message mobile-friendly. Prefer short sections and bullets over dense paragraphs, especially for what will be captured.

## Workflow

1. Choose the local CLI command:
   - Prefer `benjamin-docs` when it is available on `PATH`.
   - In this repo, run `pnpm build` when needed and use `node dist/src/cli.js`.
   - In another repo, use `pnpm exec benjamin-docs` only when this repo's package has been installed or linked locally.
   - If neither command is available, ask the user whether to install/link the CLI or use the source repo directly.
   - If setup is unclear, run `benjamin-docs doctor` before changing project docs.
2. Check whether `.benjamin-docs/config.json` exists.
3. If it does not exist, run the local CLI command with `init`, then run `next` to get the recommended capture prompt.
4. Read `.benjamin-docs/config.json` and use its `docsRoot` value as the Benjamin docs workspace. The default is `benjamin-docs`.
5. Decide the capture scope:
   - project: whole project, product, app, or business
   - feature: one feature, module, redesign, experiment, or v2 plan
   - handoff: context for another person or future agent
   - release: shipped change notes
6. Use CLI-created templates when possible. Use `scope create feature <slug>` for feature scopes only; V1 does not create release or handoff scopes through `scope create`.
7. For release and handoff docs, update existing docs created by `init` or `promote --to codebase` when they fit. If no suitable starter doc exists, create manual docs with valid frontmatter until CLI support exists.
8. Write durable Benjamin-managed docs only under the configured docs root, usually `benjamin-docs/`.
9. Existing `docs/` directories may be read as project context, but do not create or update Benjamin-managed docs there unless `.benjamin-docs/config.json` explicitly sets `docsRoot` to `docs`.
10. Update existing docs instead of dumping a transcript.
11. For a baseline capture, handoff, or any request asking whether the project is ready, run the local CLI command with `ready` as the primary gate.
12. Use lower-level checks such as `validate`, `review`, or `doctor --strict` when debugging a failed `ready` result or when the user asks for that specific check.
13. Report changed files, key decisions captured, unresolved questions, and whether `ready` passed when readiness was relevant. Mention lower-level checks only if you ran them.

## Existing Project Baseline Workflow

Use this workflow when the user asks to document an existing app, capture the current project baseline, initialize Benjamin Docs in a codebase, or prepare a repo for future agents.

1. Run the local CLI command with `status`. If the project is not initialized, run `init`. In an obvious codebase, current CLI versions default plain non-interactive `init` to codebase memory with repo-local agent guidance. Use explicit flags only when automation needs to override the default, such as `init --mode planning`, `init --mode codebase`, or `init --no-agent-contract`.
2. Read `.benjamin-docs/config.json`, `.benjamin-docs/manifest.json`, root `AGENTS.md` when present, package/config files, README files, and the main source tree map. Prefer `rg --files` for discovery.
3. Identify what kind of project this is, the main runtime/framework, data sources, external services, build/test commands, and known operational risks.
4. Update the existing baseline docs instead of creating parallel summaries:
   - `project/brief.md`
   - `project/roadmap.md`
   - `project/open-questions.md`
   - `handoff/human-brief.md`
   - `handoff/agent-brief.md`
   - `engineering/architecture.md`
   - `engineering/code-map.md`
   - `features/index.md`
   - `releases/changelog.md`
5. Keep generated starter text only when it is still true. Replace placeholder content with concrete project context.
6. If code references matter, add anchors with `anchor add <id> <file>` instead of only mentioning paths in prose. Use `anchor list` when you need to inspect existing anchors.
7. Run the local CLI command with `ready`. If it fails, fix the docs or setup gap before claiming the baseline is ready.
8. Summarize the baseline in terms a future maintainer can act on: what the project is, how to run it, where the important code lives, what is risky, and what should happen next.

Do not describe this as "documenting an existing codebase" when that would be misleading. A project may be new, half-built, or freshly generated. Prefer "capture the current project baseline" in user-facing summaries.

## Feature Or Change Plan Workflow

Use this workflow when the user asks to plan, document, hand off, or continue one feature, change, redesign, experiment, migration, bug fix, or release slice.

1. Check whether the project is initialized. If not, run `init --mode feature --feature <slug>` when a clear feature slug exists, otherwise run `init` and ask the user for the feature name only if it is needed.
2. If the project is already initialized, use `scope create feature <slug>` when the feature does not already have a scope.
3. Read the project brief, roadmap, open questions, agent brief, and any existing feature docs before editing.
4. Update the feature docs:
   - `features/<slug>/brief.md`: outcome, user/project value, scope, non-goals
   - `features/<slug>/plan.md`: implementation steps, validation, rollout/checks
   - `features/<slug>/decisions.md`: decisions, rejected options, reasoning
   - `features/<slug>/handoff.md`: status, risks/open questions, next actions
5. Update project-level docs only when the feature changes overall roadmap, architecture, risks, or handoff context.
6. Use anchors for important code files when code exists.
7. Run `ready` when the feature docs are intended for handoff. Use lower-level checks only to diagnose failures.

Keep the user-facing summary short: feature scope created or updated, main decisions captured, risks/open questions, next action, and readiness result.

## Handoff Or Existing-Doc Update Workflow

Use this workflow when the user asks to update project memory, prepare a handoff, summarize recent work, or preserve decisions from the current conversation.

1. Read existing Benjamin docs first. Do not create a parallel summary if an existing doc fits.
2. Identify the smallest durable update:
   - project state belongs in `project/brief.md`
   - sequencing belongs in `project/roadmap.md`
   - unresolved decisions belong in `project/open-questions.md`
   - human-facing context belongs in `handoff/human-brief.md`
   - agent-facing continuation context belongs in `handoff/agent-brief.md`
   - implementation details belong in feature docs or engineering docs
3. Preserve useful historical decisions. Replace only stale starter text, duplicated summaries, or outdated claims.
4. Mark assumptions and uncertainties explicitly.
5. Run `ready` if the user is relying on the handoff. If `ready` fails, fix the docs before claiming handoff readiness.

## Updating Existing Benjamin Docs

When Benjamin docs already exist, treat them as project memory, not disposable generated output.

- Read the current doc before editing it.
- Preserve frontmatter fields unless there is a concrete reason to change them.
- Preserve useful historical decisions, shipped notes, and open questions.
- Replace stale starter text, duplicated summaries, and outdated assumptions.
- Merge new information into the most specific existing doc.
- Create a new feature scope only when the work is actually a distinct feature, change, experiment, or plan.
- Do not make the docs look more certain than the evidence supports. Mark assumptions and unknowns clearly.
- If a doc is long or mixed-purpose, suggest a split before rewriting it wholesale.

When updating docs from a chat, capture the durable decisions and state transitions. Do not preserve conversational order unless the timeline itself is important.

## Agent Guidance / AGENTS.md

When initializing or updating a codebase, app, feature, or change project and the user wants future agents to work from project memory, prefer:

```bash
benjamin-docs init
```

In an obvious codebase, current CLI versions default `init` to codebase memory with agent guidance. Use `benjamin-docs init --no-agent-contract` only when the user explicitly does not want repo-local agent guidance.

Never overwrite an existing `AGENTS.md`.

Treat existing agent instructions as user-owned source material. Current CLI versions may append a clearly marked Benjamin-owned section, but all existing content must be preserved.

If `AGENTS.md` is long or complex, still consider and suggest one of these paths:

- add a Benjamin Docs section
- split long guidance into child `AGENTS.md` files
- rewrite existing guidance only with explicit user approval

If `AGENTS.md` is already long, contradictory, outdated, or mixes global rules with project-specific details, do not silently rewrite it. Report the issue and propose the smallest useful improvement:

- add a short Benjamin-owned section that points to `benjamin-docs/`
- move docs-specific guidance into `benjamin-docs/AGENTS.md`
- split area-specific guidance into child `AGENTS.md` files near the relevant subtree
- rewrite the file only after the user explicitly approves the rewrite

After changing or installing agent guidance, run `ready` or `doctor --strict` so broken root/child guidance is caught before handoff.

## Capture Quality

Capture:

- agreed decisions
- rejected options
- open questions
- current plan
- audience-specific summaries
- relevant code references when code exists
- recommended next actions
- evidence behind risky claims

Do not capture raw transcript unless the user explicitly asks for an archive.

Before calling a capture done, check that a future person or agent can answer:

- What is this project or feature?
- What changed or was decided?
- What should happen next?
- What is still unknown?
- Where should I look in the repo?
- What should I avoid breaking?

If those answers are missing, keep editing the docs before running the final readiness gate.

## Continuation Proof

Before claiming that project memory is ready, make `handoff/agent-brief.md` prove that a future agent can continue without the original chat.

Include:

- read-first docs or files
- current state or status
- commands, tests, validation steps, or manual checks to run
- risks, hazards, assumptions, or things to avoid
- exact next actions

Equivalent wording is fine, but the evidence must be concrete. If one of these pieces is missing, update the handoff before running `ready`.

## Agent-Ready Memory Checklist

Use this checklist before claiming that a capture is complete.

- `project/brief.md`: purpose, audience, current state, non-goals, and why the project matters.
- `project/roadmap.md`: now, next, later/deferred work, risks, and explicit non-goals when relevant.
- `project/open-questions.md`: unresolved decisions as questions, with context and likely options.
- `handoff/human-brief.md`: plain-language status, important decisions, risks, and next actions.
- `handoff/agent-brief.md`: read-first docs, commands/checks to run, hazards to avoid, current status, and next actions.
- `engineering/architecture.md`: runtime, boundaries, services/data, constraints, and important architectural decisions when code exists.
- `engineering/code-map.md`: concrete file paths, modules, routes, schemas, tests, and why each matters when code exists.
- feature `brief.md`: outcome, value, scope, and non-goals.
- feature `plan.md`: implementation steps, validation/checks, and rollout or handoff criteria.
- feature `decisions.md`: decisions, rejected options, and reasoning.
- feature `handoff.md`: status, risks/open questions, and next actions.

For planning-only projects with no code yet, do not invent architecture or code paths. State that code does not exist yet and describe the intended shape only when the user has provided it.

## Doc Format

Every Benjamin-managed Markdown file under the configured docs root must validate. Preserve existing frontmatter when updating docs, including fields you are not changing.

For new feature docs, prefer files created by `scope create feature <slug>`. For project, release, and handoff docs, prefer existing files created by `init` or `promote --to codebase`. If you must create a Markdown file manually, include all required frontmatter fields:

```yaml
---
title: Booking Capacity Plan
scope: feature
scope_id: booking-capacity
audience: [developer, agent]
status: draft
visibility: private
updated: 2026-06-03
source: session-capture
---
```

Allowed `scope` values are `project`, `feature`, `release`, and `handoff`. Allowed `audience` values are `developer`, `designer`, `agent`, `business`, `public`, `user`, and `advisor`. Allowed `status` values are `draft`, `review`, `approved`, `stale`, and `archived`. Allowed `visibility` values are `private`, `unlisted`, and `public`. Allowed `source` values are `session-capture`, `manual`, `codebase-scan`, and `release-sync`.

Use `source: session-capture` for docs synthesized from the current conversation. Keep `updated` as an ISO date in `YYYY-MM-DD` format.

## Constructive Challenge

Do not act as a passive note taker. Preserve the user's intent, but speak up when the plan has weak assumptions, missing decisions, contradictory goals, overbuilt V1 scope, unclear audiences, or risks that future humans and agents need to know.

Pushback should be direct, specific, and useful. Offer a better alternative when possible.
