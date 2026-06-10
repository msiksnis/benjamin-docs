---
title: Agent-Ready Project Memory Decisions
scope: feature
scope_id: agent-ready-project-memory
audience: [developer, agent]
status: review
visibility: private
updated: 2026-06-10
source: manual
---

# Agent-Ready Project Memory Decisions

## Decisions

- 0.4.0 will focus on agent-ready project memory, not on adding more primary CLI commands.
- The primary user-facing command set remains `init`, `ready`, and `help`.
- `bd commands` remains the advanced command drawer.
- The skill owns messy-context synthesis. The CLI owns deterministic scaffolding, validation, review, readiness, packaging, and exports.
- `bd ready` remains the completion gate.
- Generated docs should optimize for continuation quality: a future agent should know what this is, where to look, what matters, what is risky, and what to do next.
- Existing `AGENTS.md` files remain user-owned. Benjamin Docs may add or update Benjamin-owned sections only, unless the user explicitly approves broader rewrites.
- Deterministic review should catch obvious weak docs, not attempt full semantic judgment.

## Rejected Options

- Add more top-level commands for 0.4.0.
  - Reason: the user explicitly wants Benjamin Docs to stay simple.
- Make `review` depend on an LLM.
  - Reason: V1/V0.x should stay local, deterministic, and dependency-light.
- Treat raw chat transcript as project memory.
  - Reason: transcripts are too noisy for future agents and humans.
- Automatically rewrite complex `AGENTS.md`.
  - Reason: agent instructions are user-owned operational policy.

## Open Decisions

- How strict should deterministic continuation checks be before they become annoying?
- Should template changes alone be enough for 0.4.0, or should `review` also enforce required continuation sections?
- Should a fixture-based dogfood harness live under `test/fixtures`, `docs/`, or `benjamin-docs/features/agent-ready-project-memory/`?
