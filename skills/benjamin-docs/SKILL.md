---
name: benjamin-docs
description: Capture planning and build conversations into repo-local project memory for humans and AI agents.
---

# benjamin-docs

Use this skill when the user asks to capture, document, summarize, hand off, export, or preserve a planning or development conversation with `benjamin-docs`.

## Purpose

`benjamin-docs` turns long-running project conversations into durable Markdown docs inside the project repo. It is useful before code exists, inside existing codebases, and for individual feature scopes.

## Workflow

1. Choose the local CLI command:
   - In this repo, run `pnpm build` when needed and use `node dist/src/cli.js`.
   - In another repo, use `pnpm exec benjamin-docs` only when this repo's package has been installed or linked locally.
2. Check whether `.benjamin-docs/config.json` exists.
3. If it does not exist, run the local CLI command with `init`.
4. Decide the capture scope:
   - project: whole project, product, app, or business
   - feature: one feature, module, redesign, experiment, or v2 plan
   - handoff: context for another person or future agent
   - release: shipped change notes
5. Use CLI-created templates when possible. Use `scope create feature <slug>` for feature scopes only; V1 does not create release or handoff scopes through `scope create`.
6. For release and handoff docs, update existing docs created by `init` or `promote --to codebase` when they fit. If no suitable starter doc exists, create manual docs with valid frontmatter until CLI support exists.
7. Write durable docs under `docs/`.
8. Update existing docs instead of dumping a transcript.
9. Run the local CLI command with `validate`.
10. Report changed files, key decisions captured, and unresolved questions.

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

Every Markdown file under `docs/` must validate. Preserve existing frontmatter when updating docs, including fields you are not changing.

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
