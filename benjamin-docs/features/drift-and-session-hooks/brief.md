---
title: Drift And Session Hooks Brief
scope: feature
scope_id: drift-and-session-hooks
audience: [developer, agent]
status: archived
visibility: private
updated: 2026-07-09
source: session-capture
freshness: status
---

# Drift And Session Hooks Brief

Make project memory self-maintaining: measure when docs fall behind the code they describe, and load memory into agent sessions automatically instead of relying on the human to prompt for it.

## Outcome

- `bd drift` reports docs whose watched code changed in commits after the doc last changed, using the existing `watch` rules as the doc-to-code linkage. Advisory in `bd ready`, `--strict` for CI, `--json` for automation.
- `bd hooks install` wires session hooks for Claude Code, Codex, and Cursor. Session start injects compact memory context and records the dirty-tree baseline; stop nudges once via `bd session-stop` only when new source content appears without a memory update.
- Interactive `bd init` offers hooks as a consent prompt; `--hooks` / `--no-hooks` for automation.
- `bd upgrade` catches previously initialized repos up after a CLI update: `bdVersion` stamp, Benjamin-owned `AGENTS.md` section, skill installs, existing views, and a consent-gated hooks offer. A cached, opt-out npm update check tells agents when a newer version exists so the human never has to check manually.
- The human's command surface stays `init`, `ready`, `export`, plus `upgrade` when Benjamin Docs asks for it.

## Scope

In scope: committed-history drift detection, hook install/status/uninstall with strict preservation of user-owned hook file content, session start/stop commands with per-tool output formats, and local per-session working-tree fingerprints that prevent repeated false-positive stops.

Out of scope: MCP server (shipped separately in 0.11.0), hooks for tools without a session-start mechanism, and semantic determination of whether a code change is durable enough to document.
