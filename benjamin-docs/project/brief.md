---
title: Project Brief
scope: project
scope_id: project
audience: [developer, designer, business, agent]
status: review
visibility: private
updated: 2026-06-20
source: session-capture
freshness: status
---

# Project Brief

`benjamin-docs` is a repo-local project memory system for humans and AI agents. It turns planning and build conversations into structured Markdown docs that live close to the work.

V1 is an open-source npm CLI plus Codex/Claude skill. The CLI owns structure, validation, scopes, anchors, guided local exports, and approachable commands. The skill owns synthesis from chat context and should challenge weak plans instead of acting as a passive note taker.

The human-facing command surface is intentionally small: `bd init`, `bd ready`, `bd export`, and `bd help`. Advanced flags and diagnostics remain available through `bd commands` and agent guidance.

The core product model is asymmetric: humans should see a calm, tiny surface and feel safe that project memory is being maintained, while agents carry the richer operating contract. After `bd init`, users should not need to remember refresh, freshness, verification, scope lifecycle, or export-preparation details; agents should know and use those workflows through repo-local guidance, deterministic checks, and advanced commands.
