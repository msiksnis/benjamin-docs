---
title: MCP Memory Server Brief
scope: feature
scope_id: mcp-memory-server
audience: [developer, agent]
status: approved
visibility: private
updated: 2026-07-09
source: session-capture
freshness: status
---

# MCP Memory Server Brief

Turn project memory into a native agent interface. With 0.10.0, agents get memory pushed into sessions (hooks) and rot measured (drift); with 0.11.0, any MCP-capable agent pulls exactly the memory it needs and writes back through validated tools.

## Outcome

- `bd mcp` serves project memory over stdio via the official MCP SDK: `memory_context`, `memory_search`, `memory_read`, `memory_update`, `memory_record_decision`, `memory_status`.
- Reads become retrieval (scored doc sections) instead of directory ingestion; writes are validated transactionally with rollback and automatic Memory View regeneration.
- `bd mcp install|status|uninstall` manages per-project registration for Claude Code (`.mcp.json`), Cursor (`.cursor/mcp.json`), and Codex (`.codex/config.toml`), preserving user config exactly.
- Only manifest-managed docs are reachable through the server; the rest of the repo is not exposed.

## Scope

In scope: stdio serving, six memory tools, three client registrations, transactional write validation.

Out of scope: HTTP transport, auth, multi-project serving, semantic/embedding search, replacing session hooks (hooks push context; MCP pulls and writes).
