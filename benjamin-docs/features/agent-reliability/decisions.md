---
title: Agent Reliability Decisions
scope: feature
scope_id: agent-reliability
audience: [developer, agent]
status: review
visibility: private
updated: 2026-06-20
source: manual
freshness: status
---

# Agent Reliability Decisions

## Decisions

- Keep the user-facing BD surface very small. New reliability work should be agent-facing, advanced, or automatic through repo-local guidance.
- Customer-facing feature export verification should require explicit evidence recorded by an agent, not just a hidden phrase.
- `bd export --verify <feature> --evidence "<what the agent checked>"` is an advanced command for agents and scripts. It updates the feature handoff's Implementation Verification section so later customer exports can pass readiness.
- The CLI records verification evidence but does not claim to semantically inspect the product. Agents still own the actual implementation-vs-docs comparison.
- Changed-work review should not warn on archived or stale docs, even when an old watch rule still matches changed source files.
- Keep generated exports under `exports/` as disposable snapshots inside the active project root.

## Rejected Options

- Do not make export verification another primary human command.
- Do not let customer-facing export silently pass because the docs look polished; implementation evidence is required.
- Do not build a background daemon in this slice. BD can strengthen the agent contract and deterministic checks without pretending it runs autonomously.
