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

## Final Review Follow-up: Incompatible Nested Shared Groups

The final review found that shared Claude/Codex event arrays were preflighted, but a group-level `hooks` property with a non-array value was not. Repair could then remove a top-level Benjamin command, discard the remaining incompatible group, and stamp the upgrade as complete. The fix adds group-level structural preflight for both `SessionStart` and `Stop`, preserving the target file unchanged and preventing the current `bdVersion` stamp. A separate regression proves that a shared group with no `hooks` property still receives the existing safe property-level repair.

### RED

Command:

```bash
pnpm build && node --test --test-name-pattern='preserves shared hook groups with incompatible nested hooks|repairs top-level Benjamin commands in shared groups that omit nested hooks' dist/test/upgrade.test.js
```

Output:

```text
$ tsc -p tsconfig.json
▶ upgrade
  ✖ preserves shared hook groups with incompatible nested hooks and leaves metadata unstamped (397.281916ms)
  ✔ repairs top-level Benjamin commands in shared groups that omit nested hooks (358.547834ms)
✖ upgrade (756.833708ms)
ℹ tests 2
ℹ suites 1
ℹ pass 1
ℹ fail 1
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 857.365958

✖ failing tests:

test at dist/test/upgrade.test.js:241:5
✖ preserves shared hook groups with incompatible nested hooks and leaves metadata unstamped (397.281916ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  0 !== 1
```

The failure was the intended missing-behavior failure: plain upgrade returned success instead of failing closed.

### GREEN

Command:

```bash
pnpm build && node --test --test-name-pattern='preserves shared hook groups with incompatible nested hooks|repairs top-level Benjamin commands in shared groups that omit nested hooks' dist/test/upgrade.test.js
```

Output:

```text
$ tsc -p tsconfig.json
▶ upgrade
  ✔ preserves shared hook groups with incompatible nested hooks and leaves metadata unstamped (359.172083ms)
  ✔ repairs top-level Benjamin commands in shared groups that omit nested hooks (361.830292ms)
✔ upgrade (722.039917ms)
ℹ tests 2
ℹ suites 1
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 823.659208
```

### Focused Upgrade, Doctor, And Drift-Hooks Verification

Command:

```bash
pnpm build && node --test dist/test/upgrade.test.js dist/test/doctor.test.js dist/test/drift-hooks.test.js
```

Output:

```text
$ tsc -p tsconfig.json
▶ doctor
  ✔ reports missing skills and an uninitialized project without failing (187.880083ms)
  ✔ reports installed skills and a valid initialized project (627.92275ms)
  ✔ reports stale skills without failing (223.279417ms)
  ✔ fails when an initialized project does not validate (480.719541ms)
  ✔ strict mode fails on setup gaps (202.318958ms)
  ✔ strict mode passes when setup and validation are clean (834.950709ms)
  ✔ repository-only strict mode never reads unreadable integration state (408.57975ms)
  ✔ strict mode isolates Codex requirements from other targets (423.176708ms)
  ✔ strict target mode rejects a legacy stop-only hook and reports it separately (713.046ms)
  ✔ strict target mode requires the exact session-start format command (603.540833ms)
  ✔ repairs wrong matcher claude-code session hooks without deleting user data (1156.170625ms)
  ✔ repairs command on group claude-code session hooks without deleting user data (1209.19325ms)
  ✔ repairs a direct claude-code command without deleting mixed group data (1101.478209ms)
  ✔ repairs wrong matcher codex session hooks without deleting user data (1120.968667ms)
  ✔ repairs command on group codex session hooks without deleting user data (1124.35225ms)
  ✔ repairs a direct codex command without deleting mixed group data (1092.861625ms)
  ✔ repairs wrong-format and legacy-stop claude-code hooks through diagnose, install, diagnose (892.728291ms)
  ✔ repairs wrong-format and legacy-stop codex hooks through diagnose, install, diagnose (901.401125ms)
  ✔ repairs wrong-format and legacy-stop cursor hooks through diagnose, install, diagnose (940.87975ms)
  ✔ strict mode isolates Claude Desktop to the upload zip (376.311791ms)
  ✔ passes a Codex target when only its skill and hook are installed (749.53725ms)
  ✔ passes a Claude Desktop target when only its upload zip exists (568.875333ms)
  ✔ rejects unknown doctor targets with the exact allowed-value usage (172.146833ms)
  ✔ rejects a missing doctor target with the exact allowed-value usage (174.472417ms)
✔ doctor (16288.726542ms)
▶ drift
  ✔ fails when benjamin-docs is not initialized (187.113708ms)
  ✔ reports unavailable outside a git repository without failing (413.594666ms)
  ✔ reports no drift when docs are current with watched code (591.612875ms)
  ✔ flags docs whose watched code changed in commits after the doc (919.403542ms)
  ✔ ignores uncommitted source changes and skips docs with uncommitted updates (856.136417ms)
  ✔ clears drift for a doc after it is updated and committed (668.639458ms)
  ✔ keeps commit counts specific to each document's last update (776.458292ms)
  ✔ tracks non-ASCII watched docs through batched last-commit lookup (625.808458ms)
  ✔ blocks ready when committed watched source is ahead of memory (716.002ms)
✔ drift (5756.73075ms)
▶ hooks
  ✔ installs, reports, and uninstalls hooks for all targets (818.132083ms)
  ✔ preserves existing user hooks and settings across install and uninstall (382.090417ms)
  ✔ removes only Benjamin commands when directly uninstalling mixed shared-schema groups (190.069791ms)
  ✔ preserves unparseable hook files and reports them as skipped (183.347166ms)
  ✔ installs hooks from init with --hooks and skips them with --no-hooks (380.840208ms)
✔ hooks (1954.729667ms)
▶ session commands
  ✔ prints nothing outside an initialized project (173.917333ms)
  ✔ prints compact context with drift summary per format (1318.3625ms)
  ✔ keeps a maximum-length custom docs root and the full overflow suffix within budget (522.185917ms)
  ✔ keeps the legacy session-stop command silent for every output format (616.497208ms)
  ✔ keeps the source-change nudge available as an explicit diagnostic (300.876792ms)
  ✔ keeps the explicit diagnostic quiet when memory changed with source work (298.346166ms)
  ✔ stays quiet when memory was updated or the stop hook already fired (604.694209ms)
  ✔ does not nudge again when the stop hook is already active (424.732291ms)
  ✔ ignores source changes that were already dirty when the session started (670.639625ms)
  ✔ does not continue the agent loop when source changes during a session (688.090291ms)
  ✔ diagnoses a source deletion during a session while installed stop output stays silent (504.245ms)
  ✔ stays silent when an already-dirty source file changes again during the session (714.321042ms)
  ✔ fails open when a stop hook has no session baseline (441.8095ms)
  ✔ stays quiet when memory changed along with new source work (723.381583ms)
  ✔ keeps session baselines isolated (1075.634875ms)
  ✔ prunes expired session state when a new session starts (722.282917ms)
✔ session commands (9800.607125ms)
▶ upgrade
  ✔ fails when benjamin-docs is not initialized (184.627084ms)
  ✔ stamps bdVersion, refreshes agent guidance, and installs hooks (653.302375ms)
  ✔ installs every supported hook during plain upgrade (500.584958ms)
  ✔ keeps --hooks as the default-compatible alias (424.654375ms)
  ✔ leaves every hook file untouched with --no-hooks (446.911ms)
  ✔ migrates legacy hooks, preserves user data, refreshes skills, and is idempotent (627.277917ms)
  ✔ removes only a top-level legacy stop command from a mixed user-owned group (425.060292ms)
  ✔ fails upgrade when a required hook target cannot be migrated (447.759583ms)
  ✔ preserves incompatible user-owned hook structures and leaves metadata unstamped (519.418125ms)
  ✔ preserves shared hook groups with incompatible nested hooks and leaves metadata unstamped (419.07825ms)
  ✔ repairs top-level Benjamin commands in shared groups that omit nested hooks (407.060292ms)
  ✔ fails upgrade when a required skill target cannot be refreshed (394.792833ms)
  ✔ keeps an unmarked user AGENTS.md untouched (402.484042ms)
✔ upgrade (5854.434458ms)
▶ upgrade hints
  ✔ ready shows an advisory upgrade hint for repos initialized before 0.10.0 (471.000458ms)
  ✔ ready shows no upgrade hint when bdVersion is current (434.556833ms)
  ✔ session-start reports version skew and cached update availability (394.991167ms)
  ✔ session-start stays quiet about updates when checks are disabled (391.538958ms)
✔ upgrade hints (1692.300334ms)
▶ update-check helpers
  ✔ compares versions numerically (0.373708ms)
  ✔ treats missing, malformed, and old caches as stale (0.081584ms)
✔ update-check helpers (0.542125ms)
ℹ tests 73
ℹ suites 7
ℹ pass 73
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 17635.979833
```
