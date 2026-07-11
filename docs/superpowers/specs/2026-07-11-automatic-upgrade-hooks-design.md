# Automatic Hook And Skill Upgrade Design

Date: 2026-07-11
Status: Approved for implementation

## Goal

After a user updates the Benjamin Docs package, `bd upgrade` must be the only project command required to bring an initialized repository onto the current agent integration contract.

The normal upgrade path is:

```bash
pnpm update -g benjamin-docs
cd <project>
bd upgrade
```

## Upgrade Contract

Plain `bd upgrade` will:

1. Stamp the current CLI version into project metadata.
2. Refresh the Benjamin-owned `AGENTS.md` section when one exists.
3. Install or update the Benjamin Docs skill for every supported local skill target.
4. Regenerate existing Memory Views.
5. Install or repair session-start hooks for Claude Code, Codex, and Cursor.
6. Remove legacy Benjamin-owned stop hooks and malformed or stale Benjamin-owned start entries.
7. Preserve unrelated user-owned hook commands, matchers, settings, custom fields, and configuration.
8. Report MCP registration state and update availability as it does today.

The command must be idempotent: a second run must not duplicate hooks, rewrite current files unnecessarily, or remove user configuration.

## Hook Flags

- `bd upgrade` installs or repairs all supported hooks by default.
- `bd upgrade --no-hooks` remains an explicit opt-out for constrained automation or security-sensitive environments.
- `bd upgrade --hooks` remains accepted for backward compatibility and behaves the same as the default.

No additional `bd hooks install` or `bd doctor` command is required for a successful normal upgrade.

## Skill Lifecycle

The Benjamin Docs skill remains part of the product. Hooks deliver a bounded session-start pointer/context packet; the skill teaches agents how to read, maintain, verify, export, and hand off project memory.

Upgrade replaces the installed skill bundle in place:

- the previous `SKILL.md` is overwritten with the current compact router;
- `references/capture.md`, `references/export.md`, and `references/integrations.md` are installed or refreshed;
- the skill is refreshed for Shared Agent Skills, Codex, Claude Code, and Cursor.

The 0.11.1 bundle contained only `SKILL.md`, so this migration leaves no known legacy bundle file that needs deletion.

## Failure And Output Behavior

- Failure to update a required hook or skill target must make `bd upgrade` fail rather than claim success.
- Output must distinguish installed, repaired/refreshed, skipped by `--no-hooks`, and already-current states.
- Hook changes remain limited to Benjamin-owned entries.
- Upgrade must not enable Codex's host-level `features.hooks` setting or trust hooks on the user's behalf; output may state that host authorization is still required.

## Testing

Test-first coverage will prove:

1. Plain upgrade installs hooks for all three targets when none exist.
2. Plain upgrade migrates 0.11.1-style start-plus-stop hooks.
3. Plain upgrade repairs malformed and wrong-format Benjamin hooks.
4. User-owned commands and custom fields survive migration exactly.
5. A second upgrade is idempotent and creates no duplicates.
6. `--no-hooks` leaves hook files untouched.
7. `--hooks` remains a compatible alias for default behavior.
8. The installed skill is replaced by the compact router and all three references.
9. The full package, packed-install, readiness, drift, export, and performance gates remain green.

## Non-Goals

- Automatically registering MCP integrations.
- Changing the package-manager update command.
- Removing the Benjamin Docs skill.
- Modifying user-owned hook entries or host security/trust settings.
