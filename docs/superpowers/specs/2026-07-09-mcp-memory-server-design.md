---
title: MCP Memory Server Design
scope: project
scope_id: mcp-memory-server
audience: [developer, agent]
status: approved
visibility: private
updated: 2026-07-09
source: manual
---

# MCP Memory Server Design

## Problem

With 0.10.0, agents get memory pushed into sessions (hooks) and rot gets
measured (drift). But agents still touch the memory as loose files: they read
whole Markdown docs (token-expensive), and they hand-edit frontmatter and
structure (error-prone; validation only catches mistakes after the fact).

0.11.0 turns the memory into an interface. An MCP server exposes read, search,
and validated write tools, so any MCP-capable agent (Claude Code, Cursor,
Codex, Claude Desktop, and others) uses project memory natively:

- Reads become retrieval: targeted sections instead of directory ingestion.
- Writes go through validation at the tool boundary instead of after the fact.
- The skill remains the "how to think about memory" layer; MCP becomes the
  "how to touch it" layer.

## Decisions

- Stable `@modelcontextprotocol/sdk` v1.x plus its `zod` peer dependency —
  bd's first runtime dependencies, owner-approved. The 2.0 SDK is alpha and
  was rejected for now.
- stdio transport only. Local-first: the client spawns `benjamin-docs mcp` in
  the project directory; no port, no daemon, no remote surface.
- Tools operate only on manifest-managed docs inside the configured docs root.
  Path safety reuses `fsx.ts`; unmanaged files are not readable or writable
  through the server.
- Writes are validated transactionally: capture prior content, write, run
  `validateProject`, and roll back if the write introduced new errors.
- Search is dependency-free: heading-based sections scored by query-term
  overlap. No embeddings, no index files.

## Command Surface

- `bd mcp` — serve MCP over stdio (what registrations invoke).
- `bd mcp install|status|uninstall [--target <claude-code|cursor|codex>]` —
  manage per-project registration:

| Client | File | Format |
| --- | --- | --- |
| Claude Code | `.mcp.json` | JSON `mcpServers["benjamin-docs"]` |
| Cursor | `.cursor/mcp.json` | JSON `mcpServers["benjamin-docs"]` |
| Codex | `.codex/config.toml` | marked TOML block `[mcp_servers.benjamin-docs]` |

JSON ownership is the `benjamin-docs` server key; TOML ownership is a marker
comment pair (`# benjamin-docs:start` / `# benjamin-docs:end`), mirroring the
AGENTS.md pattern. User content is preserved exactly; unparseable JSON is
skipped, never rewritten; uninstall removes only Benjamin-owned entries.

## Tools

| Tool | Input | Behavior |
| --- | --- | --- |
| `memory_context` | `task?` | Session-start-style compact context; with `task`, appends top matching sections. |
| `memory_search` | `query`, `limit?` | Scored doc sections: path, heading, snippet. |
| `memory_read` | `path` | Full content of one manifest-managed doc. |
| `memory_update` | `path`, `body`, `status?` | Replaces the doc body, preserves frontmatter, stamps `updated`, optionally sets `status`; rolls back if validation regresses; regenerates existing views. |
| `memory_record_decision` | `feature`, `decision` | Appends a decision bullet under `## Decisions` in the feature's decisions doc; stamps `updated`; regenerates existing views. |
| `memory_status` | — | `bd status` summary plus drift counts and the upgrade hint. |

All tools return errors as text content with `isError` rather than protocol
faults, so agents can read and react. When the project is not initialized,
every tool explains how to run `benjamin-docs init`.

## Non-Goals (this release)

- No HTTP transport, no auth, no multi-project serving.
- No semantic/embedding search.
- No replacement of hooks: session hooks remain the context-push path;
  MCP is the pull-and-write path. `session-start` context is not yet an MCP
  resource (revisit once agents consume BD primarily through tools).

## Validation

- Integration tests drive the real server over stdio with the SDK client
  against the built CLI: list tools, search, read, validated update,
  rollback on invalid status, decision append, uninitialized-project errors.
- Registration tests mirror the hooks tests: merge, preserve, uninstall,
  unparseable-file safety, TOML marker round-trip.
