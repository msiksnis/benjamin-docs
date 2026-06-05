---
title: Chat-To-Project Workflow
scope: project
scope_id: project
audience: [business, public, agent]
status: draft
visibility: private
updated: 2026-06-04
source: session-capture
---

# Chat-To-Project Workflow

## Core Idea

One core `benjamin-docs` workflow is turning a useful chat into a local project. The user may not have a repo, codebase, or project folder yet. They should be able to ask an agent:

```text
Use the benjamin-docs skill to create a project from this chat.
```

The agent should ask where to create the project, create the folder, run `benjamin-docs init --mode planning`, and synthesize the current chat into durable docs.

Default location should be human-friendly and agent-agnostic:

```text
~/Documents/Benjamin Docs/<Project Name>
```

For example:

```text
~/Documents/Benjamin Docs/Atelier Edits
```

Avoid agent-specific or dated session folders such as Codex, Claude, Cursor, or `YYYY-MM-DD` paths unless the user explicitly asks for them.

## Product Boundary

The CLI should not pretend it can read chat context by itself. V1 keeps the split clear:

- The globally available CLI creates and validates the local docs workspace.
- The globally available skill tells the agent how to turn chat context into project memory.
- The `install-skill` command installs or updates the bundled skill in common local agent locations, while keeping setup explicit instead of relying on package postinstall scripts.

This keeps V1 local, dependency-light, and honest.

## New Project Shape

For chat-created projects, the agent should create:

- a top-level `README.md`
- `benjamin-docs/`
- `.benjamin-docs/`

The top-level README should be plain-language and should point the user to the Benjamin docs workspace. Existing projects should not get a new or overwritten README unless the user asks.

## Capture Targets

The initial capture should update:

- `benjamin-docs/project/brief.md`
- `benjamin-docs/project/roadmap.md`
- `benjamin-docs/project/open-questions.md`
- `benjamin-docs/handoff/human-brief.md`
- `benjamin-docs/handoff/agent-brief.md`

The capture should include decisions, rejected options, risks, assumptions, open questions, and next actions. It should not dump the raw chat.

## Confirmation Copy

The confirmation message should be easy to scan on mobile:

- use short sections
- list created files as bullets
- list what will be captured as bullets
- say `Reply "yes" to create it, or send a different path/name.`

Avoid dense paragraphs for the capture summary.

## Follow-Up

- Dogfood this with a fresh chat that has no existing project folder.
- Consider a future `benjamin-docs new` command only if the agent-led workflow needs more deterministic folder scaffolding.
- Keep the workflow separate from SaaS publishing until local project creation is proven.
