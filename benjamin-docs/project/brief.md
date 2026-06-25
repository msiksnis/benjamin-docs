---
title: Project Brief
scope: project
scope_id: project
audience: [developer, designer, business, agent]
status: review
visibility: private
updated: 2026-06-25
source: session-capture
freshness: status
---

# Project Brief

`benjamin-docs` is a repo-local project memory system for humans and AI agents. It turns planning and build conversations into structured Markdown docs that live close to the work.

V1 is an open-source npm CLI plus Codex/Claude skill. The CLI owns structure, validation, scopes, anchors, guided local exports, and approachable commands. The skill owns synthesis from chat context and should challenge weak plans instead of acting as a passive note taker.

The human-facing command surface is intentionally small: `bd init`, `bd ready`, `bd export`, and `bd help`. Advanced flags and diagnostics remain available through `bd commands` and agent guidance.

The core product model is asymmetric: humans should see a calm, tiny surface and feel safe that project memory is being maintained, while agents carry the richer operating contract. After `bd init`, users should not need to remember refresh, freshness, verification, scope lifecycle, or export-preparation details; agents should know and use those workflows through repo-local guidance, deterministic checks, and advanced commands.

Agent Reliability now includes clearer handling for local prerequisites. When agents record that project checks are blocked by missing tools or services, such as a command that is not installed or a database that is not listening, `bd ready` surfaces those notes under a dedicated environment/tooling category instead of blending them into generic project failure language.

Release hygiene is now part of that agent-owned operating contract. After npm publish, maintainers/agents should run `pnpm run release:github` and `pnpm run release:verify-public` so the public npm version, git tag, and GitHub Release stay aligned.

Because this repo is public, private commercial strategy, pricing, and future paid SaaS planning should not be captured in tracked Benjamin docs unless the user explicitly marks the content public-safe. Keep that material outside the repo or in ignored local folders.
