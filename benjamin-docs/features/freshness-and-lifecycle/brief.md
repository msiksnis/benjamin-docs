---
title: Freshness And Lifecycle Brief
scope: feature
scope_id: freshness-and-lifecycle
audience: [developer, designer, agent]
status: review
visibility: private
updated: 2026-06-11
source: session-capture
---

# Freshness And Lifecycle Brief

## Outcome

`benjamin-docs@0.7.0` makes the readiness gate harder to fool and the project memory harder to rot. The changed-work review works for any stack, staleness is detected from git facts instead of phrasing, and shipped or abandoned work can be archived so derived views stay current.

## Why

The 0.6.0 review hardcoded one user's stack (Supabase migrations, Next.js `src/app` layout) and Atelier-specific stale-claim regexes, so other projects got no signal from changed-work review. Views accumulated noise forever because nothing used doc or scope statuses. Stale views passed `ready` silently. These gaps undermined the core promise that passing `ready` means the memory is trustworthy.

## Scope

- Configurable `watch` rules in `.benjamin-docs/config.json` mapping changed-file globs to docs, with generic stack-agnostic defaults.
- Git churn staleness warnings for `engineering/architecture.md` and `engineering/code-map.md`.
- Path liveness warnings for missing inline-code path references in engineering docs and the agent brief.
- Memory View freshness checking inside plain `review`, so `ready` fails on stale views.
- Views lifecycle: archived and stale docs and scopes drop out of views; sections grouped per source doc; sources ordered by updated date; unchanged views are not rewritten.
- `bd scope status <id> <status>` with frontmatter cascade.

## Non-Goals

- No new primary commands; `scope status` lives in the advanced drawer.
- No AI-driven review; every new check is deterministic.
- No automatic doc rewriting; the gate warns, the agent or human updates.
