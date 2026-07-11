# Integration Workflows

Read this reference only for session hooks, MCP registration or use, upgrades, skill installation/packaging, or `AGENTS.md` setup.

## Drift And Session Hooks

`benjamin-docs drift` compares watched docs with committed git history. A doc is drifted when files matching its `watch` rules changed in later commits. Drift is advisory: re-verify listed docs against the code, then update them or state why they still hold. Use `drift --json` for machine output and `drift --strict` only for CI-style gates.

`benjamin-docs hooks install` wires session-start hooks for Claude Code (`.claude/settings.json`), Codex (`.codex/hooks.json`), and Cursor (`.cursor/hooks.json`). Session start injects compact read-first and drift context through `benjamin-docs session-start`.

Installed Benjamin hooks are session-start only. Legacy `benjamin-docs session-stop` commands are removed during installation/upgrade, and the compatibility command is silent. Never add a blocking stop decision, an automatic follow-up message, or another model turn.

Interactive `init` asks before installing hooks; automation can use `init --hooks` or `init --no-hooks`. After a package update, plain `upgrade` installs or repairs hooks by default; use `upgrade --no-hooks` only when the environment must opt out. Preserve every user-owned hook and setting; `hooks uninstall` removes only Benjamin-owned entries. Codex also needs `features.hooks = true` in `~/.codex/config.toml` and hook trust through `/hooks`; tell the user when that applies.

When session-start already injected context, do not reread the whole memory tree. Follow its pointers and load only what the task needs.

## MCP Memory Tools

When the MCP server is registered with `benjamin-docs mcp install`, prefer its bounded tools over raw file access:

- Start with `memory_context` and pass the task.
- Use `memory_search` before `memory_read`; read a whole doc only when snippets are insufficient.
- Write through `memory_update` and `memory_record_decision`: frontmatter is preserved, the date is stamped, validation runs with rollback, and existing Memory Views regenerate.
- Use `memory_status` for status plus drift before suggesting separate drift output.

Direct file editing remains correct when MCP is unavailable or a doc is outside the manifest. If a project has memory but no MCP registration, suggest `benjamin-docs mcp install`; do not run it silently. MCP access remains limited to manifest-managed docs.

## Upgrades And Update Notices

After updating the package, run `bd upgrade` once in each initialized repository. It refreshes Benjamin-owned project metadata, agent guidance, the current skill bundle, existing Memory Views, and session-start hooks for Claude Code, Codex, and Cursor. It removes legacy Benjamin stop hooks while preserving user-owned configuration. No separate hook command is required. Use `bd upgrade --no-hooks` only when the environment must opt out of hooks.

When a newer npm version is available, suggest `pnpm update -g benjamin-docs` (or `npm update -g benjamin-docs`) followed by `bd upgrade` in every initialized repo. Do not silently update a global package. Respect `BENJAMIN_DOCS_NO_UPDATE_CHECK=1`.

## Skill Install And Package

- `benjamin-docs install-skill` installs the complete skill bundle—router plus `references/`—to the shared agent, Codex, Claude Code, and Cursor skill folders.
- Use `install-skill --target <agents|codex|claude-code|cursor>` to limit the target and `--dry-run` to inspect the plan without writing.
- `benjamin-docs package-skill` creates `~/Downloads/benjamin-docs-skill.zip` for Claude Desktop/Claude.ai upload. Use `--out <directory-or-zip>` when another location is required.
- The installed folders and upload ZIP must include `SKILL.md` plus `references/capture.md`, `references/export.md`, and `references/integrations.md`.
- After changing the bundled skill, verify both installation and ZIP packaging before handoff.

## Agent Guidance / AGENTS.md

For a codebase, app, feature, or change whose future agents should use project memory, prefer:

```bash
benjamin-docs init
```

In an obvious codebase, plain non-interactive `init` defaults to codebase memory with agent guidance. Use `init --no-agent-contract` only when the user explicitly does not want repo-local guidance.

Never overwrite an existing `AGENTS.md`. Treat existing instructions as user-owned. The CLI may append a clearly marked Benjamin-owned section, but must preserve all existing content.

If guidance is long, contradictory, outdated, or mixes global and project rules, report it and propose the smallest improvement:

- add a short Benjamin section pointing to the docs root;
- move docs-specific guidance into `benjamin-docs/AGENTS.md`;
- split area-specific rules into child `AGENTS.md` files;
- rewrite user-owned guidance only with explicit approval.

After changing or installing agent guidance, run `ready` or `doctor --strict` so broken root/child guidance is caught before handoff.
