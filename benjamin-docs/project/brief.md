---
title: Project Brief
scope: project
scope_id: project
audience: [developer, designer, business, agent]
status: review
visibility: private
updated: 2026-07-09
source: session-capture
freshness: status
---

# Project Brief

`benjamin-docs` is a persistent repo-local project memory system for AI coding agents and humans. It turns a repo into living project knowledge that agents read, follow, and update while they work, so a new coding session starts with context: what the project is, where work stopped, what decisions and conventions matter, what is risky, and what should happen next.

The public positioning must make that clear in the first few sentences. BD is not a generic documentation package or Markdown helper. Markdown is the storage format; the product is continuity across agent sessions, human handoffs, and implementation work.

V1 is an open-source npm CLI plus Codex/Claude skill. The CLI owns structure, validation, scopes, anchors, guided local exports, and approachable commands. The skill owns synthesis from chat context and should challenge weak plans instead of acting as a passive note taker.

The human-facing command surface is intentionally small: `bd init`, `bd ready`, `bd export`, and `bd help`. Advanced flags and diagnostics remain available through `bd commands` and agent guidance.

The core product model is asymmetric: humans should see a calm, tiny surface and feel safe that project memory is being maintained, while agents carry the richer operating contract. After `bd init`, users should not need to remember refresh, freshness, verification, scope lifecycle, or export-preparation details; agents should know and use those workflows through repo-local guidance, deterministic checks, and advanced commands.

Public entry points now need to work for both humans and agents. The GitHub README, npm description, package keywords, CLI `introduce` text, and bundled skill should all use the same framing: persistent project memory for AI coding agents, living project knowledge, and agent-maintained docs. Preserve the caveat that BD is not a background daemon; upkeep happens because the installed skill and repo-local guidance instruct agents to maintain the memory as part of normal work.

The 0.9.3 release packaged that public positioning for npmjs. The 0.10.0 release candidate makes the memory self-maintaining: `bd drift` measures docs against committed git history through watch rules, and consent-based session hooks load memory into Claude Code, Codex, and Cursor sessions automatically while nudging agents to update docs when source changes without them. The "not a background daemon" caveat softens accordingly: with hooks installed, the user's agent environment does invoke BD at session boundaries.

The 0.11.0 release candidate adds the MCP memory server: `bd mcp` exposes the memory as native tools (context, search, read, validated writes, decisions, status) over stdio, registered per project with `bd mcp install` for Claude Code, Cursor, and Codex. Hooks push context into sessions; MCP lets agents pull exactly the sections they need and write back safely. This introduces bd's first runtime dependencies (the official MCP SDK plus zod), an accepted exception to the dependency-light posture.

The 0.11.1 hotfix makes those session hooks safe at turn boundaries. Hook state fingerprints the existing dirty tree at session start and compares later content against that baseline, so old edits do not create repeated false positives while further edits to an already-dirty file still count. Missing state fails open. When a real stop nudge continues the turn, the hook must preserve a complete answer to the user's original request instead of replacing it with memory-maintenance commentary.

Agent Reliability now includes clearer handling for local prerequisites. When agents record that project checks are blocked by missing tools or services, such as a command that is not installed or a database that is not listening, `bd ready` surfaces those notes under a dedicated environment/tooling category instead of blending them into generic project failure language.

Release hygiene is now part of that agent-owned operating contract. After npm publish, maintainers/agents should run `pnpm run release:github` and `pnpm run release:verify-public` so the public npm version, git tag, and GitHub Release stay aligned.

Because this repo is public, private commercial strategy, pricing, and future paid SaaS planning should not be captured in tracked Benjamin docs unless the user explicitly marks the content public-safe. Keep that material outside the repo or in ignored local folders.
