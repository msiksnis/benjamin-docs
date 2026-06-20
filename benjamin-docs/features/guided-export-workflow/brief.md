---
title: Guided Export Workflow Brief
scope: feature
scope_id: guided-export-workflow
audience: [developer, designer, agent]
status: archived
visibility: private
updated: 2026-06-20
source: manual
freshness: status
---

# Guided Export Workflow Brief

Guided export turns Benjamin Docs from internal project memory into concise local deliverables. The human-facing command is `bd export`; detailed flags are reserved for agents and scripts.

## Outcome

Users can open a guided export menu and choose what they want to produce without remembering slugs or command flags. The first shipped path focuses on feature documentation, especially customer-facing Markdown under `exports/features/`.

## Scope

In scope for the first implementation:

- Promote `bd export` as the simple human export entrypoint.
- Preserve `export --audience` for existing agent/script workflows.
- Add direct feature export flags for agents: `--feature`, `--profile`, and `--include-archived`.
- Add an agent-facing verification flag: `--verify <feature> --evidence "<what was checked>"`.
- Support `customer` and `developer` feature export profiles.
- Match feature queries by slug or title and suggest close matches for typos.
- Reject path-like feature queries before matching so `--feature` cannot normalize traversal-looking input into a valid feature slug.
- Block customer feature exports when source docs are not export-ready.
- Print precise next agent prompts for missing features, typos, and readiness failures.
- Write Markdown exports under `exports/features/`.
- Show feature readiness in the guided feature picker and through the agent-facing `export --list` path.
- Generate concise app documentation, customer handoff, developer handoff, and project summary Markdown from existing Benjamin Docs sources.
- Stamp generated Markdown with source docs, latest source-doc update date, source commit, dirty-state metadata, export detail level, and `exported_at`.
- Support brief, standard, and detailed export detail levels.
- Treat generated files under `exports/` as disposable snapshots that are overwritten by rerunning `bd export`.

Out of scope for this milestone:

- PDF rendering.
- Hosted publishing.
- Screenshot capture.
- Deep automatic code understanding inside the CLI.
