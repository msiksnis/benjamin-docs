---
title: Changed Work Review Brief
scope: feature
scope_id: changed-work-review
audience: [developer, designer, agent]
status: review
visibility: private
updated: 2026-06-11
source: manual
---

# Changed Work Review Brief

Changed Work Review adds a deterministic freshness check for projects where agents keep implementing features after Benjamin Docs has already been initialized.

## Outcome

Agents and humans can run `bd review --changed` or `benjamin-docs review --changed` before handoff to catch likely stale project memory. The command reviews git-changed tracked and untracked source files, warns when source work probably needs Benjamin Docs source updates, and points at project-level docs that may need consolidation.

The main product outcome is not perfect automated documentation. It is forcing a conscious docs-impact decision: update Benjamin Docs when durable project memory changed, or explicitly state why no docs update was needed.

## Scope

In scope:

- `review --changed` and `review --changed --since <git-ref>` CLI support.
- Warning-only changed-work heuristics in `src/review.ts`.
- Detection of tracked and untracked changed files.
- Coarse mapping from changed source areas to likely docs: architecture, code map, changelog, and agent handoff.
- Simple stale-claim checks for project-level docs that still say implemented admin routes or schema/content models do not exist.
- Generated `AGENTS.md` and bundled skill guidance telling agents to run a docs-impact pass after code, config, schema, test, workflow, or product behavior changes.

Out of scope for the first version:

- AI-based semantic docs review.
- Making changed-work warnings fail `bd ready`.
- Enforcing docs updates for every small refactor.
- Requiring exact document edits when an agent can justify that no durable memory changed.
