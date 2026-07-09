---
title: MCP Memory Server Plan
scope: project
scope_id: mcp-memory-server
audience: [developer, agent]
status: approved
visibility: private
updated: 2026-07-09
source: manual
---

# MCP Memory Server Plan

Release: 0.11.0. Design:
`docs/superpowers/specs/2026-07-09-mcp-memory-server-design.md`.

## Steps

1. Add `@modelcontextprotocol/sdk` + `zod` runtime dependencies; bump to
   0.11.0; archive the shipped drift-and-session-hooks scope. Done.
2. `src/memory-tools.ts`: pure tool logic (context, search, read, validated
   update with rollback, record decision, status) so it is testable without
   the protocol.
3. `src/mcp-server.ts`: McpServer wiring tool logic over
   `StdioServerTransport`.
4. `src/mcp-install.ts`: registration for `.mcp.json`, `.cursor/mcp.json`,
   and a marked block in `.codex/config.toml`; install/status/uninstall.
5. CLI wiring: `bd mcp` serves; `bd mcp install|status|uninstall`; command
   drawer entries; upgrade/init messaging mentions MCP registration.
6. Tests: SDK client integration over stdio; registration file preservation;
   tool-logic unit tests.
7. Docs and memory: README section, skill section, changelog, feature scope
   docs, roadmap/briefs; `pnpm check` and `bd ready` green.

## Acceptance

- An MCP client connecting over stdio lists the six tools and can search,
  read, and update memory; invalid writes roll back with a readable error.
- `bd mcp install` then `uninstall` round-trips all three client configs
  without touching user content.
- `pnpm check` passes; packaged tarball still installs and runs `bd mcp`.
