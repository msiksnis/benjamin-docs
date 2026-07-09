---
title: MCP Memory Server Decisions
scope: feature
scope_id: mcp-memory-server
audience: [developer, agent]
status: archived
visibility: private
updated: 2026-07-09
source: session-capture
freshness: status
---

# MCP Memory Server Decisions

## Decisions

- Use the stable `@modelcontextprotocol/sdk` v1.x, not the 2.0 alpha (`@modelcontextprotocol/server`). First runtime dependencies for bd (owner-approved), including the SDK's `zod` peer; zod 4 verified working with the v1 `registerTool` API.
- stdio transport only. Local-first: clients spawn `benjamin-docs mcp` in the project; no port, daemon, auth, or remote surface.
- Tools reach only manifest-managed docs inside the docs root. Unmanaged files are neither readable nor writable through the server; generated Memory Views are read-only.
- Writes are transactional: capture prior content, write, run `validateProject`, roll back when the write introduces new errors. This is the "writes go through validation" promise from the original MCP pitch.
- Search is dependency-free: heading-delimited sections scored by query-term overlap (heading hits weighted 3x). No embeddings, no index files.
- Registration ownership: the `benjamin-docs` key in JSON configs; `# benjamin-docs:start/end` marker comments in Codex TOML (no TOML parser needed — same pattern as the AGENTS.md marked section).
- MCP registration is suggested, never auto-installed: `bd upgrade` and the skill point to `bd mcp install`; consent stays explicit like hooks.
- Live dogfood passed on 2026-07-09 from a real Claude Code session in this repo: all six tools worked over stdio, memory_search surfaced a genuinely stale agent-brief claim which memory_update then fixed with frontmatter preserved and views regenerated, and an intentionally invalid write (broken relative link) was rolled back byte-for-byte. Cleared for the 0.11.0 npm publish.

## Rejected Options

- The 2.0 alpha SDK (unstable API for a production CLI).
- HTTP/streamable transport in this release (no remote use case; conflicts with local-first).
- Hand-rolled stdio JSON-RPC (rejected earlier for the whole arc; protocol churn risk).
- Making session-start context an MCP resource this release (hooks remain the push path; revisit when agents consume BD primarily through tools).
- A TOML parser dependency for Codex config (marker block suffices and preserves user formatting).
