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

1. Infer a human-readable project name from the chat when one is obvious. Preserve normal title casing and spaces for the folder name, for example `Atelier Edits`.
2. Suggest `~/Documents/Benjamin Docs/<Project Name>` as the default location unless the user gave a different location. Do not suggest agent-specific or dated session folders such as Codex, Claude, Cursor, or `YYYY-MM-DD` paths unless the user explicitly asks for them.
3. Confirm the target project name and local folder before creating files. Ask in plain language and avoid mentioning skill internals.
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
4. Create the project folder.
5. Run the local CLI command inside that folder with `init --mode planning`.
6. Read `.benjamin-docs/config.json` and use its `docsRoot` value, usually `benjamin-docs`.
7. Create a simple top-level `README.md` for the new project unless one already exists. Keep it plain-language and include:
   - project name
   - one-paragraph summary
   - where to start in `benjamin-docs/`
   - current status
   - next actions
8. Populate the starter Benjamin docs from the current chat context:
   - `project/brief.md`
   - `project/roadmap.md`
   - `project/open-questions.md`
   - `handoff/human-brief.md`
   - `handoff/agent-brief.md`
9. Do not invent certainty. Mark assumptions and unresolved questions clearly.
10. Run the local CLI command with `validate`.
11. Report the created project path, changed files, key decisions captured, and unresolved questions.

Do not overwrite an existing top-level `README.md` unless the user explicitly asks. If the target folder already contains a project, switch to the normal capture workflow instead of treating it as a brand-new chat-created project.

When confirming a chat-created project, keep the message mobile-friendly. Prefer short sections and bullets over dense paragraphs, especially for what will be captured.

## Workflow

1. Choose the local CLI command:
   - Prefer `benjamin-docs` when it is available on `PATH`.
   - In this repo, run `pnpm build` when needed and use `node dist/src/cli.js`.
   - In another repo, use `pnpm exec benjamin-docs` only when this repo's package has been installed or linked locally.
   - If neither command is available, ask the user whether to install/link the CLI or use the source repo directly.
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
11. Run the local CLI command with `validate`.
12. Report changed files, key decisions captured, and unresolved questions.

## Capture Quality

Capture:

- agreed decisions
- rejected options
- open questions
- current plan
- audience-specific summaries
- relevant code references when code exists
- recommended next actions

Do not capture raw transcript unless the user explicitly asks for an archive.

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
