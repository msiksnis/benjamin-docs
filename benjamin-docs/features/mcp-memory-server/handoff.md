---
title: MCP Memory Server Handoff
scope: feature
scope_id: mcp-memory-server
audience: [developer, agent]
status: archived
visibility: private
updated: 2026-07-09
source: session-capture
freshness: status
---

# MCP Memory Server Handoff

## Status

Shipped: 0.11.0 published to npm on 2026-07-09 with git tag and GitHub Release verified in sync. Live dogfood from a Claude Code session passed before publish. Scope archived.

## Risks / Open Questions

- First runtime dependencies: watch install size and audit surface (`@modelcontextprotocol/sdk`, `zod`).
- Registration assumes a global `benjamin-docs` on PATH when clients spawn the server (same constraint as hooks).
- Codex project `.codex/config.toml` loads only when the project layer is trusted in Codex.
- Search is lexical; if retrieval quality disappoints on large memories, consider smarter scoring before reaching for embeddings.

## Next Actions

- Done: live dogfood passed (all six tools, validated update, verified rollback); 0.11.0 published; scope archived.
- Consider folding session-start context into an MCP resource once tool-based consumption dominates.

## Continuation Proof

- Read first: `docs/superpowers/specs/2026-07-09-mcp-memory-server-design.md`, `src/memory-tools.ts`, `src/mcp-server.ts`, `src/mcp-install.ts`.
- Current status: feature-complete in the working tree, unpublished.
- Checks: `pnpm check`; manual smoke via an SDK client over stdio (see `test/mcp.test.ts` for the pattern).
- Risks: keep tool access manifest-scoped; never widen to arbitrary repo files.
- Next: dogfood, publish 0.11.0, archive scope.
