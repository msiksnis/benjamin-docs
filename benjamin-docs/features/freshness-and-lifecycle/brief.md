---
title: Freshness And Lifecycle Brief
scope: feature
scope_id: freshness-and-lifecycle
audience: [developer, designer, agent]
status: review
visibility: private
updated: 2026-06-14
source: session-capture
freshness: status
---

# Freshness And Lifecycle Brief

## Outcome

`benjamin-docs@0.8.0` closes the staleness blind spot found after 0.7.0 dogfooding. The readiness gate now surfaces status-bearing docs and active feature docs that are outside the watch graph, because those docs can never be flagged stale by changed work.

## Why

The 0.6.0 review hardcoded one user's stack (Supabase migrations, Next.js `src/app` layout) and Atelier-specific stale-claim regexes, so other projects got no signal from changed-work review. Views accumulated noise forever because nothing used doc or scope statuses. Stale views passed `ready` silently. These gaps undermined the core promise that passing `ready` means the memory is trustworthy.

## Scope

- Configurable `watch` rules in `.benjamin-docs/config.json` mapping changed-file globs to docs, with generic stack-agnostic defaults.
- Freshness coverage warnings for status-bearing docs and active feature docs matched by zero watch rules.
- Optional `freshness: status` frontmatter for docs that carry volatile current-state claims.
- Feature scope creation appends a feature-specific watch rule for the docs it creates.
- Git churn staleness warnings for `engineering/architecture.md` and `engineering/code-map.md`.
- Path liveness warnings for missing inline-code path references in engineering docs and the agent brief.
- Memory View freshness checking inside plain `review`, so `ready` fails on stale views.
- Views lifecycle: archived and stale docs and scopes drop out of views; sections grouped per source doc; sources ordered by updated date; unchanged views are not rewritten.
- `bd scope status <id> <status>` with frontmatter cascade.

## Non-Goals

- No new primary commands; `scope status` lives in the advanced drawer.
- No AI-driven review; every new check is deterministic.
- No automatic doc rewriting; the gate warns, the agent or human updates.
