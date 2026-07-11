# Task 2 Report: Align Product Memory And Verify The Packed Upgrade

## Outcome

Implemented the packed-upgrade assertion, isolated its global integration writes with a temporary `BENJAMIN_DOCS_HOME`, aligned current public and Benjamin Docs memory surfaces to the complete 0.12.0 migration contract, preserved the historical 0.10.0 record, refreshed Memory Views, and verified the installed tarball and built CLI.

The public migration instruction is now: update the package, then run `bd upgrade` once in each initialized repository. Plain upgrade refreshes Benjamin-owned project metadata, agent guidance, the current skill bundle, existing Memory Views, and session-start hooks for Claude Code, Codex, and Cursor. It removes legacy Benjamin stop hooks while preserving user-owned configuration. No separate hook command is required. `bd upgrade --no-hooks` is the explicit environment opt-out.

No package was published, no tag or release was created, and nothing was pushed.

## Files Changed

Product and integration surfaces:

- `README.md`
- `src/commands.ts`
- `src/hooks.ts`
- `src/upgrade.ts`
- `skills/benjamin-docs/references/integrations.md`
- `scripts/smoke-packed-cli.mjs`
- `test/upgrade.test.ts`

Current Benjamin source memory:

- `benjamin-docs/engineering/architecture.md`
- `benjamin-docs/engineering/code-map.md`
- `benjamin-docs/project/brief.md`
- `benjamin-docs/project/roadmap.md`
- `benjamin-docs/project/open-questions.md`
- `benjamin-docs/handoff/human-brief.md`
- `benjamin-docs/handoff/agent-brief.md`
- `benjamin-docs/features/index.md`
- `benjamin-docs/features/launch-readiness-audit/brief.md`
- `benjamin-docs/features/launch-readiness-audit/plan.md`
- `benjamin-docs/features/launch-readiness-audit/decisions.md`
- `benjamin-docs/features/launch-readiness-audit/handoff.md`
- `benjamin-docs/releases/changelog.md`

Generated Memory Views:

- `benjamin-docs/views/decisions.md`
- `benjamin-docs/views/next-actions.md`

Task evidence:

- `.superpowers/sdd/auto-upgrade-task-2-report.md`
- `.superpowers/sdd/auto-upgrade-final-review-package.md`

The code map, feature index, launch-audit brief/plan, and open questions were added to the original file list after the first `review --changed` and `drift --strict` run identified Task 1's committed upgrade implementation as uncovered there. Each received a narrow current-state statement so the required zero-warning/zero-drift gates could pass; historical audit evidence remains explicitly historical.

## Packed Smoke Implementation

`scripts/smoke-packed-cli.mjs` now:

- creates a third temporary directory for `BENJAMIN_DOCS_HOME`;
- sets that home before the packed CLI is invoked;
- runs the existing shell-free `runBd(["upgrade"])` helper immediately after `init` and before `validate`;
- requires `Hooks: installed` in plain-upgrade output;
- reads `.claude/settings.json`, `.codex/hooks.json`, and `.cursor/hooks.json` from the temporary project;
- requires the exact `benjamin-docs session-start --format <target>` command in each file;
- removes the temporary home alongside the pack and project fixtures in `finally`.

No second process runner was introduced. Real agent skill/config locations are not read or written by this smoke path.

## Documentation Decisions

- Replaced README's separate-hook setup emphasis with the one-command post-package-update contract.
- Kept `bd hooks install|status|uninstall` documented as advanced management, not a required migration follow-up.
- Kept interactive `init` consent behavior distinct from post-package-update `upgrade` behavior.
- Described `upgrade` as an advanced command so the primary human surface remains `init`, `ready`, `export`, and `help`.
- Preserved the shipped 0.10.0 changelog and archived audit observations as historical facts.
- Added explicit superseding 0.12.0 statements rather than rewriting what 0.10.0 shipped.
- Documented truthful partial failure, user-configuration preservation, idempotency, and `--no-hooks` where implementation-facing memory required them.
- Treats `bdVersion` as successful-migration evidence: required skill or hook failure leaves the previous stamp intact.
- Preserves parseable-but-incompatible user-owned hook container/event shapes unchanged and reports the target as failed.

## Verification Evidence

### Initial packed gate

Command:

```bash
pnpm build
pnpm smoke:pack
```

Result: passed. Packed output:

```text
Packed CLI smoke passed for benjamin-docs@0.12.0 (147 characters, 37 estimated tokens).
```

### Benjamin Docs gates

Commands:

```bash
pnpm build
node dist/src/cli.js views
node dist/src/cli.js review --changed
node dist/src/cli.js drift --strict
node dist/src/cli.js ready --json
```

Final results:

- build passed;
- views current after regeneration (the initial alignment updated 2 files; final review-fix regeneration updated the affected views and the confirming gates found them current);
- review passed with `errors: 0`, `warnings: 0`, 58 docs checked, and 3 changed implementation/test files checked on the post-review run;
- drift reported `status: no drift`, `drifted docs: 0`;
- readiness returned `status: ready`;
- all five dimensions passed: `structure`, `content_heuristics`, `committed_freshness`, `working_tree_impact`, and `agent_guidance`;
- no recorded environment blockers.

### Full release and agent-overhead gates

Commands:

```bash
pnpm check
pnpm smoke:pack
pnpm benchmark:agent -- --assert
pnpm audit --prod
pnpm release:check
git diff --check
git status --short
```

Results:

- `pnpm check`: passed; 299 tests passed, 0 failed, 0 skipped;
- packed smoke: passed for `benjamin-docs@0.12.0` and verified all three installed hook files;
- benchmark assertion: passed with no violations;
- session-start: p50 240.958 ms, p95 252.405 ms, 176 characters, 44 estimated tokens;
- session-stop: p50 164.658 ms, p95 172.860 ms, 0 characters;
- production audit: `No known vulnerabilities found`;
- release check: typecheck, build, all 299 tests, repository validation, and npm pack dry-run passed;
- dry-run package: `benjamin-docs@0.12.0`, 127 files, 142.1 kB packed, 717.1 kB unpacked;
- `git diff --check`: passed with no output;
- `git status --short`: only Task 2 implementation, memory, generated view, and report files were present.

### Manual two-run one-command inspection

Setup used a temporary planning repository and a separate temporary `BENJAMIN_DOCS_HOME`, with update checks disabled. It initialized with `--no-hooks`, then ran the exact built CLI upgrade command twice from the temporary repository.

First run output:

```text
benjamin-docs upgrade

Project metadata already records CLI 0.12.0.
Agent guidance: no Benjamin-owned AGENTS.md section found; leaving AGENTS.md alone. Install with: benjamin-docs init
Skills: refreshed 4 local skill installs.
Views: none generated yet; run benjamin-docs views when source docs are captured.
Hooks: installed for Claude Code, Codex CLI, Cursor.
  Codex: enable hooks with features.hooks = true in ~/.codex/config.toml, then trust them via /hooks in Codex.
MCP: memory server not registered. Agents get memory tools once you run: benjamin-docs mcp install

Next
  benjamin-docs drift    see docs whose watched code moved on
  benjamin-docs ready    run the repository readiness dimensions
```

Second run output:

```text
benjamin-docs upgrade

Project metadata already records CLI 0.12.0.
Agent guidance: no Benjamin-owned AGENTS.md section found; leaving AGENTS.md alone. Install with: benjamin-docs init
Skills: local skill installs already current.
Views: none generated yet; run benjamin-docs views when source docs are captured.
Hooks: already current for Claude Code, Codex CLI, Cursor.
  Codex: enable hooks with features.hooks = true in ~/.codex/config.toml, then trust them via /hooks in Codex.
MCP: memory server not registered. Agents get memory tools once you run: benjamin-docs mcp install

Next
  benjamin-docs drift    see docs whose watched code moved on
  benjamin-docs ready    run the repository readiness dimensions
```

Inspection result:

- first run refreshed isolated skills and installed all three session-start hook targets;
- second run reported skills and hooks already current;
- neither run asked for hook consent;
- neither run recommended `bd hooks install` as a required next step;
- the temporary project and home were removed afterward.

## Independent Review

Review package: `.superpowers/sdd/auto-upgrade-final-review-package.md`.

The first independent read-only review of `0216e37..b11e550` found two Important issues and did not approve:

1. `bdVersion` was stamped before required skill and hook migration completed, which could hide an incomplete upgrade from readiness/session-start version-skew hints.
2. Hook installation normalized parseable non-object `hooks` values and non-array relevant event values, which could overwrite structurally unexpected user-owned configuration.

Both findings were fixed test-first:

- new assertions first failed because hook and skill failures left `bdVersion: 0.12.0`;
- a new incompatible-shape fixture first failed because plain upgrade returned success and rewrote the files;
- `src/upgrade.ts` now stamps only after required skill work and a successful hook step;
- `src/hooks.ts` now skips incompatible relevant container/event shapes unchanged;
- the focused upgrade/hook/doctor set passes 70 tests;
- the complete post-review release gate passed 298 tests plus packed smoke, benchmarks, readiness, audit, and release dry-run before the adjacent re-review finding was added.

The second read-only review confirmed both original fixes, then found one adjacent Important mixed-group issue: a legacy top-level Benjamin stop command could cause the whole shared-schema group to be removed, including unrelated fields and nested user hooks.

That finding was also fixed test-first:

- the new upgrade regression first failed because the mixed Stop group disappeared;
- stop migration now removes only the Benjamin-owned top-level `command` property;
- custom fields, timeout metadata, and nested user hooks remain exact;
- the focused upgrade/hook/doctor set now passes 71 tests;
- the complete final release gate passes 299 tests plus packed smoke, benchmarks, readiness, audit, and release dry-run.

The third read-only review confirmed the shared-schema fix, then found a cross-schema Important issue: applying property-level preservation to Cursor's flat entries could leave commandless remnants. That finding was fixed test-first by making cleanup schema-aware. Shared Claude/Codex groups retain unrelated properties and nested user hooks; flat stale Cursor entries are removed whole. The strengthened legacy fixture asserts the complete final Cursor arrays, and the full 299-test/release gate passed again.

Final read-only review of `0216e37..0beb5b2` approved the implementation with no Critical or Important findings. It verified schema-aware cleanup, exact Cursor arrays, failure metadata, incompatible-structure preservation, idempotency, `--no-hooks`, focused tests, packed-home isolation, clean diffs, documentation consistency, and preserved 0.10.0 history.

## Concerns

No unresolved Critical or Important concern remains. Residual test-scope note: the packed smoke intentionally focuses on the required first-run installed-tarball assertion; second-run idempotency, `--no-hooks`, incompatible user configuration, and failure metadata are covered by unit/integration tests rather than additional packed-artifact scenarios. The added source-memory files beyond the brief's initial list were necessary to meet the brief's explicit zero-warning and zero-drift requirements after consuming Task 1's committed behavior.
