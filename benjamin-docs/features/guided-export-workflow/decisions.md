---
title: Guided Export Workflow Decisions
scope: feature
scope_id: guided-export-workflow
audience: [developer, agent]
status: archived
visibility: private
updated: 2026-06-20
source: manual
freshness: status
---

# Guided Export Workflow Decisions

## Decisions

- `bd export` is the human-facing UX. Users should not need to learn many customer-facing commands.
- Export flags are an API for agents and scripts. Direct commands such as `bd export --feature <slug> --profile customer` remain available, but they belong in advanced help and skill guidance.
- Generated exports are disposable artifacts under `exports/`; source docs under `benjamin-docs/` remain the maintained truth.
- Exported Markdown is a snapshot, not a live view. Rerunning `bd export` regenerates the file from current Benjamin Docs sources and writes fresh metadata.
- Customer feature exports require concise user-facing content and implementation-verification evidence before writing output.
- Agents record implementation-verification evidence with `bd export --verify <feature> --evidence "<what was checked>"`; the command updates the feature handoff instead of making agents hand-edit a magic phrase.
- The CLI performs deterministic readiness checks and prompt generation, while agents perform semantic implementation verification.
- Customer exports use customer-relevant source docs (`brief.md` and `handoff.md`) rather than private implementation docs such as `plan.md` and `decisions.md`.
- Direct feature queries accept slugs or titles, but not path-like strings. Inputs containing path separators are rejected before typo/title matching.
- The guided menu exposes detail levels, but agents/scripts can use `--detail brief|standard|detailed`.
- App, handoff, and summary exports are assembled summaries from maintained docs, not raw doc dumps.
- Customer export leak checks use default blocked phrases plus optional `.benjamin-docs/config.json` `export.blockedPhrases`.

## Rejected Options

- Do not make PDF the first-class output yet. Markdown must be good before PDF is useful.
- Do not create or plan a missing feature during export. Export should explain the missing feature and give the agent prompt to create/update docs.
- Do not auto-export the closest feature match after a typo. Suggest the match and require user/agent confirmation.
- Do not promote every export flag in the README. The simple path stays `bd export`.
- Do not silently normalize path-like feature input such as `../feature-name` into a real feature slug.
