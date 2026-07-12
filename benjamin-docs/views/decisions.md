---
title: Decision Log
scope: project
scope_id: project
audience: [developer, agent]
status: draft
visibility: private
updated: 2026-07-12
source: manual
---

# Decision Log

Derived from decision and rejected-option sections across managed Benjamin docs.

## [Baseline Capture Guide](../project/baseline-capture.md)

Source: `benjamin-docs/project/baseline-capture.md` (updated 2026-06-06)

### Current Decision

The baseline guide belongs in the README for public discoverability, with this repo-local note preserving the project rationale. V1 should keep the workflow prompt-based instead of adding a new CLI command until dogfooding proves which prompts are stable enough to automate.

## [Non-Code Stranger Test](../project/non-code-stranger-test.md)

Source: `benjamin-docs/project/non-code-stranger-test.md` (updated 2026-06-04)

### Decisions

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
