---
title: Features Index
scope: project
scope_id: project
audience: [developer, designer, agent, business]
status: review
visibility: private
updated: 2026-06-14
source: session-capture
---

# Features Index

This index points to active and historical Benjamin Docs feature scopes. Use it to decide whether new work belongs in an existing scope or needs a focused feature scope.

## Active

- [Freshness And Lifecycle](./freshness-and-lifecycle/brief.md): 0.7.0 and 0.8.0 scope for stack-agnostic changed-work review, watch-rule coverage warnings for status docs and active feature docs, git churn and path liveness staleness checks, Memory View freshness in the readiness gate, and scope lifecycle status with archived views exclusion.

## Shipped (archived)

- [Agent-Ready Project Memory](./agent-ready-project-memory/brief.md): shipped in 0.4.x. Capture quality, agent operating contracts, context maps, and continuation quality.
- [Session Capture](./session-capture/brief.md): early scope for turning chats into project memory; superseded by the bundled skill workflows.
- [Memory Views](./memory-views/brief.md): shipped in 0.5.1. Advanced `bd views` command for derived project-memory lenses.
- [Changed Work Review](./changed-work-review/brief.md): shipped in 0.6.0. Advanced `bd review --changed` freshness check.

Archived scopes keep their docs in place, but they are excluded from generated Memory Views. Reactivate one with `bd scope status <id> review` if work resumes.
