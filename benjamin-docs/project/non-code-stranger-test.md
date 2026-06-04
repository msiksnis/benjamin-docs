---
title: Non-Code Stranger Test
scope: project
scope_id: project
audience: [business, public, agent]
status: draft
visibility: private
updated: 2026-06-04
source: session-capture
---

# Non-Code Stranger Test

## Scenario

A non-code person discovers `benjamin-docs` and wants to understand what it is, why it matters, and how to use it with an AI agent. They may be planning an app, product, service, or creative project before code exists.

## Finding

The product idea is understandable, but the public surface was too developer-first. The README reached source checkout, pnpm, built CLI paths, and command references before giving a non-code reader a plain-language model of the tool.

The CLI `introduce` and `help` text were accurate, but they assumed the user already understood repo-local docs and command workflows. The generated `next` prompts were useful for agents, but they did not explicitly ask for plain-language capture.

## Decisions

- Add a README section for non-programmers before package mechanics.
- Explain `benjamin-docs` as a local project notebook that an AI agent keeps inside the project folder.
- Make clear that the CLI does not upload or publish anything.
- Add first prompts a non-code user can ask an agent.
- Update CLI `introduce` and `help` text to explain the workflow before listing commands.
- Update generated `next` prompts to ask for plain language and non-technical readability where appropriate.
- Promote chat-to-project as the first non-code workflow: the user may have only a chat, not an existing project folder.
- Include a simple top-level `README.md` in projects created from chat.
- Use `~/Documents/Benjamin Docs/<Project Name>` as the default chat-created project location, preserving human-readable folder names such as `Atelier Edits`.
- Avoid agent-specific or dated folders unless the user asks for them.

## Boundary

Do not turn this into SaaS planning yet. The V1 public-readiness goal is local comprehension: a non-code person should understand what the tool does and be able to ask an agent to use it.

## Follow-Up

- Test whether a non-code person can succeed with only the README and an agent.
- Consider a short `benjamin-docs introduce --plain` or `benjamin-docs guide` only if the default introduction becomes too long.
- Keep README examples honest around the first public package release.
