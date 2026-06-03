---
name: agent-docs
description: Capture planning and build conversations into repo-local project memory for humans and AI agents.
---

# agent-docs

Use this skill when the user asks to capture, document, summarize, hand off, export, or preserve a planning or development conversation with `agent-docs`.

## Purpose

`agent-docs` turns long-running project conversations into durable Markdown docs inside the project repo. It is useful before code exists, inside existing codebases, and for individual feature scopes.

## Workflow

1. Check whether `.agent-docs/config.json` exists.
2. If it does not exist, run `npx agent-docs init`.
3. Decide the capture scope:
   - project: whole project, product, app, or business
   - feature: one feature, module, redesign, experiment, or v2 plan
   - handoff: context for another person or future agent
   - release: shipped change notes
4. Write durable docs under `docs/`.
5. Update existing docs instead of dumping a transcript.
6. Run `npx agent-docs validate`.
7. Report changed files, key decisions captured, and unresolved questions.

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

## Constructive Challenge

Do not act as a passive note taker. Preserve the user's intent, but speak up when the plan has weak assumptions, missing decisions, contradictory goals, overbuilt V1 scope, unclear audiences, or risks that future humans and agents need to know.

Pushback should be direct, specific, and useful. Offer a better alternative when possible.
