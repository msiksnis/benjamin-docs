---
title: MCP Memory Server Handoff
scope: feature
scope_id: mcp-memory-server
audience: [developer, agent]
status: approved
visibility: private
updated: 2026-07-09
source: session-capture
freshness: status
---

# MCP Memory Server Handoff

## Status

Implemented and tested for 0.11.0. Not yet published to npm. Version bumped to 0.11.0.

## Risks / Open Questions

- First runtime dependencies: watch install size and audit surface (`@modelcontextprotocol/sdk`, `zod`).
- Registration assumes a global `benjamin-docs` on PATH when clients spawn the server (same constraint as hooks).
- Codex project `.codex/config.toml` loads only when the project layer is trusted in Codex.
- Search is lexical; if retrieval quality disappoints on large memories, consider smarter scoring before reaching for embeddings.

## Next Actions

- Dogfood the MCP tools from a real Claude Code session in this repo (`bd mcp install`, then use memory_search/memory_update).
- Publish 0.11.0 with the standard release flow, then archive this scope.
- Consider folding session-start context into an MCP resource once tool-based consumption dominates.

## Continuation Proof

- Read first: `docs/superpowers/specs/2026-07-09-mcp-memory-server-design.md`, `src/memory-tools.ts`, `src/mcp-server.ts`, `src/mcp-install.ts`.
- Current status: feature-complete in the working tree, unpublished.
- Checks: `pnpm check`; manual smoke via an SDK client over stdio (see `test/mcp.test.ts` for the pattern).
- Risks: keep tool access manifest-scoped; never widen to arbitrary repo files.
- Next: dogfood, publish 0.11.0, archive scope.
