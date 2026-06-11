---
title: Agent-Ready Project Memory Brief
scope: feature
scope_id: agent-ready-project-memory
audience: [developer, designer, agent, business]
status: archived
visibility: private
updated: 2026-06-11
source: manual
---

# Agent-Ready Project Memory Brief

## Goal

Benjamin Docs 0.4.0 should make a project handoff-ready for humans and agents by turning messy chat, repo, or feature context into durable project memory, an agent operating contract, and a practical continuation map.

The user-facing workflow must stay simple:

```bash
bd init
bd ready
bd help
```

Advanced behavior should live in the skill, templates, review rules, generated guidance, and `bd commands`, not in a larger primary command surface.

## Problem

Benjamin Docs 0.3.x has the right structural pieces: repo-local docs, metadata, readiness checks, agent guidance, exports, and a bundled skill. The next gap is output quality. A future agent can still receive docs that are valid but too thin, too generic, or missing the practical context needed to continue work without asking the user to re-explain the project.

## Target User Outcomes

- A user can start from a messy chat, a fresh repo, an existing codebase, or a single feature plan.
- The agent captures the useful project memory without requiring the user to understand the docs structure.
- Existing Benjamin docs are improved safely instead of overwritten.
- Existing `AGENTS.md` files are preserved and enhanced only with user approval.
- A future agent can answer what the project is, where to look, what changed, what is risky, what is unresolved, and what to do next.
- `bd ready` remains the completion signal.

## Product Pillars

### Capture Quality

Messy context becomes structured project memory. The agent should capture decisions, rejected options, risks, assumptions, open questions, next actions, and code references where relevant.

### Agent Operating Contract

`AGENTS.md` and Benjamin docs should tell future agents how to use project memory, when to update it, what checks to run, and how to avoid overwriting user-owned instructions.

### Context Map

For codebases, the capture should include a practical map of architecture, important files, commands, external services, data flows, and known hazards.

### Continuation Quality

The next human or agent should be able to continue from the docs with minimal re-explanation.

## Non-Goals

- More primary commands.
- Hosted docs publishing.
- Web UI.
- Background transcript capture.
- AI-generated claims without evidence.
- Rewriting user-owned `AGENTS.md` content without explicit approval.
- Turning deterministic `review` into a full LLM reviewer.

## Acceptance Criteria

0.4.0 is successful when:

- `bd init` plus the skill can produce useful project memory for planning, codebase, and feature scenarios.
- `bd ready` fails when required docs are still starter-thin or miss the obvious continuation context.
- Generated templates nudge agents toward operating contracts, context maps, and continuation quality.
- The skill has explicit workflows for chat-to-project, current-project baseline capture, feature planning, and safe doc updates.
- Dogfooding on this repo and at least one external project produces docs that a fresh agent can use without reading the original chat.
