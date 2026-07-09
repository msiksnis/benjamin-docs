---
title: MCP Memory Server Plan
scope: feature
scope_id: mcp-memory-server
audience: [developer, agent]
status: archived
visibility: private
updated: 2026-07-09
source: session-capture
freshness: status
---

# MCP Memory Server Plan

Shipping in 0.11.0. Design: `docs/superpowers/specs/2026-07-09-mcp-memory-server-design.md`; step plan: `docs/superpowers/plans/2026-07-09-mcp-memory-server.md`.

## Steps

- `src/memory-tools.ts`: protocol-free tool logic — manifest-scoped doc listing, section search with term scoring, reads, transactional updates (validate, roll back on regression), decision appends, status with drift.
- `src/mcp-server.ts`: `McpServer` + `StdioServerTransport` wiring with zod input schemas; tool errors return as readable text with `isError`.
- `src/mcp-install.ts`: JSON key ownership for `.mcp.json` and `.cursor/mcp.json`; marker-comment block ownership for `.codex/config.toml`.
- CLI: bare `bd mcp` serves; `bd mcp install|status|uninstall [--target ...]`; `bd upgrade` reports registration status.
- Runtime dependencies added: `@modelcontextprotocol/sdk` ^1.29, `zod` ^4 (verified compatible with the v1 SDK).

## Validation

- `test/mcp.test.ts` (7 tests): real SDK client over stdio against the built CLI — tool listing, context, status, search, read, validated update, rollback on broken links, view-write refusal, decision append, uninitialized-project errors; registration merge/preserve/uninstall and unparseable-file safety.
- `pnpm check` green across the suite.
