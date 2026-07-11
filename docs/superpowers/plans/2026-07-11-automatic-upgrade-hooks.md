# Automatic Upgrade Hooks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make plain `bd upgrade` install or repair hooks for Claude Code, Codex, and Cursor and refresh the current skill bundle, with no follow-up BD command required.

**Architecture:** Keep `runUpgrade()` as the orchestrator and make `hooks: undefined` mean the new default: install or repair every supported hook target. Extend hook installation outcomes so upgrade output can distinguish new installs, repairs, current targets, and failures; retain `hooks: false` as the only opt-out. The existing skill installer remains the source of truth and is exercised through upgrade-level migration tests.

**Tech Stack:** TypeScript, Node.js filesystem APIs, Node test runner, pnpm, existing Benjamin Docs hook/skill installers.

## Global Constraints

- Plain `bd upgrade` installs or repairs hooks for Claude Code, Codex, and Cursor.
- `bd upgrade --no-hooks` remains an explicit opt-out and must not touch hook files.
- `bd upgrade --hooks` remains accepted and behaves exactly like the default.
- Upgrade removes only stale or legacy Benjamin-owned hook entries and preserves unrelated user commands, matchers, settings, custom fields, and configuration.
- Upgrade refreshes the Benjamin Docs skill in Shared Agent Skills, Codex, Claude Code, and Cursor; the skill is updated in place, not removed.
- A required hook target that cannot be parsed or written makes upgrade exit non-zero instead of claiming success.
- Upgrade must not change Codex host-level `features.hooks` or hook trust.
- No new runtime dependency.
- Existing agent budgets remain: session start at most 400 characters / 100 estimated tokens and local p95 at most 400 ms; session stop remains silent with local p95 at most 400 ms.

---

## File Structure

- `src/hooks.ts` — classify hook installation as installed, repaired, already installed, or skipped while preserving the existing target-specific repair logic.
- `src/upgrade.ts` — always install/repair all hooks unless explicitly opted out, aggregate exact outcomes, and fail on skipped targets.
- `src/cli.ts` — parse upgrade flags without an interactive hook-consent prompt; default remains `undefined`, which now means automatic installation.
- `test/upgrade.test.ts` — own the end-to-end upgrade contract, including default installation, legacy migration, opt-out, alias, idempotency, skill replacement, and failure exit status.
- `scripts/smoke-packed-cli.mjs` — install and exercise the packed CLI against isolated project and home directories so upgrade never touches the developer's real agent configuration.
- `README.md` and `skills/benjamin-docs/references/integrations.md` — teach the one-command post-package upgrade flow.
- Current Benjamin source docs under `benjamin-docs/` — record the new automatic-upgrade decision without rewriting historical 0.10.0 behavior.

### Task 1: Implement And Prove The One-Command Upgrade Contract

**Files:**
- Modify: `src/hooks.ts:16-91`
- Modify: `src/upgrade.ts:17-102`
- Modify: `src/cli.ts:157-161,461-486`
- Modify: `test/upgrade.test.ts:20-88`

**Interfaces:**
- Consumes: `installHooks(root: string, targetIds?: HookTargetId[]): HooksResult` and `installSkill(options?: InstallSkillOptions): InstallSkillResult`.
- Produces: `HookTargetResult.status` with the additional value `"repaired"`; `runUpgrade(root, { hooks: undefined })` installs/repairs all targets; `runUpgrade(root, { hooks: false })` skips hooks; `UpgradeResult.ok` is false when any hook target is skipped.

- [ ] **Step 1: Add failing default-install, alias, and opt-out tests**

Replace the existing flag-only test in `test/upgrade.test.ts` with explicit independent cases. Use the real CLI and temporary home/project directories:

```ts
it("installs every supported hook during plain upgrade", () => {
  withTempDir((dir) => {
    withTempDir((home) => {
      runCliResult(["init", "--mode", "codebase", "--no-agent-contract", "--no-hooks"], dir, {
        BENJAMIN_DOCS_HOME: home,
      });

      const result = runCliResult(["upgrade"], dir, { BENJAMIN_DOCS_HOME: home });

      assert.equal(result.status, 0);
      assert.match(result.stdout, /Hooks: installed.*Claude Code.*Codex CLI.*Cursor/s);
      assert.match(readFileSync(join(dir, ".claude/settings.json"), "utf8"), /session-start --format claude/);
      assert.match(readFileSync(join(dir, ".codex/hooks.json"), "utf8"), /session-start --format codex/);
      assert.match(readFileSync(join(dir, ".cursor/hooks.json"), "utf8"), /session-start --format cursor/);
    });
  });
});

it("keeps --hooks as the default-compatible alias", () => {
  withTempDir((dir) => {
    withTempDir((home) => {
      runCliResult(["init", "--mode", "codebase", "--no-agent-contract", "--no-hooks"], dir, {
        BENJAMIN_DOCS_HOME: home,
      });
      const result = runCliResult(["upgrade", "--hooks"], dir, { BENJAMIN_DOCS_HOME: home });
      assert.equal(result.status, 0);
      assert.match(result.stdout, /Hooks: installed/);
    });
  });
});

it("leaves every hook file untouched with --no-hooks", () => {
  withTempDir((dir) => {
    withTempDir((home) => {
      runCliResult(["init", "--mode", "codebase", "--no-agent-contract", "--no-hooks"], dir, {
        BENJAMIN_DOCS_HOME: home,
      });
      mkdirSync(join(dir, ".claude"), { recursive: true });
      const original = `${JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: "command", command: "echo user" }] }] } }, null, 2)}\n`;
      writeFileSync(join(dir, ".claude/settings.json"), original);

      const result = runCliResult(["upgrade", "--no-hooks"], dir, { BENJAMIN_DOCS_HOME: home });

      assert.equal(result.status, 0);
      assert.match(result.stdout, /Hooks: skipped \(--no-hooks\)/);
      assert.equal(readFileSync(join(dir, ".claude/settings.json"), "utf8"), original);
      assert.equal(existsSync(join(dir, ".codex/hooks.json")), false);
      assert.equal(existsSync(join(dir, ".cursor/hooks.json")), false);
    });
  });
});
```

- [ ] **Step 2: Run the upgrade tests and verify RED**

Run:

```bash
pnpm build
node --test --test-name-pattern="installs every supported hook|default-compatible alias|untouched with --no-hooks" dist/test/upgrade.test.js
```

Expected: the plain-upgrade and alias cases fail because output says hooks are not installed or the expected hook files do not exist. The `--no-hooks` case passes and remains the opt-out regression.

- [ ] **Step 3: Add failing migration, preservation, idempotency, and skill replacement tests**

Add a helper that seeds the previous release's hook shapes and an old one-file skill:

```ts
function seedLegacyIntegrations(dir: string, home: string): void {
  mkdirSync(join(dir, ".claude"), { recursive: true });
  writeFileSync(join(dir, ".claude/settings.json"), `${JSON.stringify({
    custom: "keep-claude",
    hooks: {
      SessionStart: [{ matcher: "startup|resume|clear", hooks: [
        { type: "command", command: "benjamin-docs session-start --format claude" },
        { type: "command", command: "echo user-start", timeout: 9 },
      ] }],
      Stop: [{ hooks: [
        { type: "command", command: "benjamin-docs session-stop --format claude" },
        { type: "command", command: "echo user-stop" },
      ] }],
    },
  }, null, 2)}\n`);

  mkdirSync(join(dir, ".codex"), { recursive: true });
  writeFileSync(join(dir, ".codex/hooks.json"), `${JSON.stringify({
    hooks: { SessionStart: [{ matcher: "wrong", hooks: [
      { type: "command", command: "benjamin-docs session-start --format claude" },
      { type: "command", command: "echo codex-user" },
    ] }] },
  }, null, 2)}\n`);

  mkdirSync(join(dir, ".cursor"), { recursive: true });
  writeFileSync(join(dir, ".cursor/hooks.json"), `${JSON.stringify({
    version: 1,
    custom: { preserve: true },
    hooks: {
      sessionStart: [{ command: "benjamin-docs session-start --format claude" }, { command: "echo cursor-user" }],
      stop: [{ command: "benjamin-docs session-stop --format cursor" }],
    },
  }, null, 2)}\n`);

  for (const target of [".agents", ".codex", ".claude", ".cursor"]) {
    const skillDir = join(home, target, "skills/benjamin-docs");
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, "SKILL.md"), "old skill\n");
  }
}
```

Then add the end-to-end test:

```ts
it("migrates legacy hooks, preserves user data, refreshes skills, and is idempotent", () => {
  withTempDir((dir) => {
    withTempDir((home) => {
      runCliResult(["init", "--mode", "codebase", "--no-agent-contract", "--no-hooks"], dir, {
        BENJAMIN_DOCS_HOME: home,
      });
      seedLegacyIntegrations(dir, home);

      const first = runCliResult(["upgrade"], dir, { BENJAMIN_DOCS_HOME: home });
      assert.equal(first.status, 0);
      assert.match(first.stdout, /Hooks: repaired/);
      assert.doesNotMatch(readFileSync(join(dir, ".claude/settings.json"), "utf8"), /session-stop/);
      assert.match(readFileSync(join(dir, ".claude/settings.json"), "utf8"), /echo user-start/);
      assert.match(readFileSync(join(dir, ".claude/settings.json"), "utf8"), /echo user-stop/);
      assert.match(readFileSync(join(dir, ".codex/hooks.json"), "utf8"), /session-start --format codex/);
      assert.match(readFileSync(join(dir, ".codex/hooks.json"), "utf8"), /echo codex-user/);
      assert.match(readFileSync(join(dir, ".cursor/hooks.json"), "utf8"), /session-start --format cursor/);
      assert.match(readFileSync(join(dir, ".cursor/hooks.json"), "utf8"), /echo cursor-user/);

      for (const target of [".agents", ".codex", ".claude", ".cursor"]) {
        const skillDir = join(home, target, "skills/benjamin-docs");
        assert.match(readFileSync(join(skillDir, "SKILL.md"), "utf8"), /^name: benjamin-docs/m);
        for (const reference of ["capture.md", "export.md", "integrations.md"]) {
          assert.equal(existsSync(join(skillDir, "references", reference)), true);
        }
      }

      const hookFiles = [".claude/settings.json", ".codex/hooks.json", ".cursor/hooks.json"];
      const afterFirst = hookFiles.map((path) => readFileSync(join(dir, path), "utf8"));
      const second = runCliResult(["upgrade"], dir, { BENJAMIN_DOCS_HOME: home });
      assert.equal(second.status, 0);
      assert.match(second.stdout, /Hooks: already current/);
      assert.deepEqual(hookFiles.map((path) => readFileSync(join(dir, path), "utf8")), afterFirst);
    });
  });
});
```

- [ ] **Step 4: Add the failing unreadable-target test**

```ts
it("fails upgrade when a required hook target cannot be migrated", () => {
  withTempDir((dir) => {
    withTempDir((home) => {
      runCliResult(["init", "--mode", "codebase", "--no-agent-contract", "--no-hooks"], dir, {
        BENJAMIN_DOCS_HOME: home,
      });
      mkdirSync(join(dir, ".codex"), { recursive: true });
      writeFileSync(join(dir, ".codex/hooks.json"), "{ not valid json\n");

      const result = runCliResult(["upgrade"], dir, { BENJAMIN_DOCS_HOME: home });

      assert.equal(result.status, 1);
      assert.match(result.stdout, /Hooks: failed/);
      assert.match(result.stdout, /\.codex\/hooks\.json could not be parsed/);
      assert.equal(readFileSync(join(dir, ".codex/hooks.json"), "utf8"), "{ not valid json\n");
    });
  });
});
```

Add a separate skill-write failure fixture so required skill refresh is also proven fail-closed:

```ts
it("fails upgrade when a required skill target cannot be refreshed", () => {
  withTempDir((dir) => {
    withTempDir((home) => {
      runCliResult(["init", "--mode", "codebase", "--no-agent-contract", "--no-hooks"], dir, {
        BENJAMIN_DOCS_HOME: home,
      });
      mkdirSync(join(home, ".agents/skills/benjamin-docs/SKILL.md"), { recursive: true });

      const result = runCliResult(["upgrade"], dir, { BENJAMIN_DOCS_HOME: home });

      assert.equal(result.status, 1);
      assert.match(result.stderr, /SKILL\.md|directory|EISDIR/i);
    });
  });
});
```

- [ ] **Step 5: Run the new migration and failure tests and verify RED**

Run:

```bash
pnpm build
node --test --test-name-pattern="migrates legacy hooks|fails upgrade when a required hook|fails upgrade when a required skill" dist/test/upgrade.test.js
```

Expected: migration fails because plain upgrade does not repair unhealthy targets; unreadable hook test fails because current upgrade returns success after a skipped target; required skill failure already exits non-zero and locks that behavior against regression.

- [ ] **Step 6: Classify repaired hook installations in `src/hooks.ts`**

Extend the status union:

```ts
status: "installed" | "repaired" | "already installed" | "removed" | "not installed" | "skipped";
```

Before mutating a parsed existing hook file, record whether it contains any Benjamin session command, then return `repaired` when a changed install replaced or removed Benjamin-owned state:

```ts
function installHooksForTarget(root: string, target: HookTarget): HookTargetResult {
  const existing = readHookFile(root, target);
  if (existing.unreadable) {
    return { ...target, status: "skipped", note: `Existing ${target.path} could not be parsed. Preserved unchanged; add the Benjamin Docs hooks manually.` };
  }

  const content = existing.value ?? {};
  const hadBenjaminHook = eventContainsCommand(content, (command) => command.includes(HOOK_COMMAND_MARKER));
  const changed = target.id === "cursor" ? addCursorHooks(content) : addSharedSchemaHooks(content, target.id);
  if (!changed) return { ...target, status: "already installed" };

  writeGeneratedText(root, target.path, `${JSON.stringify(content, null, 2)}\n`, HOOK_FILE_LABEL);
  return { ...target, status: hadBenjaminHook ? "repaired" : "installed" };
}
```

Keep `formatHooksResult()` data-driven so the new status renders without a separate branch.

- [ ] **Step 7: Make `runUpgrade()` install all hooks by default and fail truthfully**

Add a small step result beside `UpgradeResult`:

```ts
interface UpgradeStepResult {
  ok: boolean;
  lines: string[];
}
```

Change `runUpgrade()` to collect the hook step and propagate its status:

```ts
const hookStep = resolveHooks(root, options.hooks);
lines.push(...hookStep.lines);
// Keep MCP and update reporting unchanged.
return { ok: hookStep.ok, output: lines.join("\n") };
```

Replace `resolveHooks()` with default installation and explicit outcome lines:

```ts
function resolveHooks(root: string, hooksOption: boolean | undefined): UpgradeStepResult {
  if (hooksOption === false) return { ok: true, lines: ["Hooks: skipped (--no-hooks)."] };

  const result = installHooks(root);
  const installed = result.targets.filter((target) => target.status === "installed");
  const repaired = result.targets.filter((target) => target.status === "repaired");
  const current = result.targets.filter((target) => target.status === "already installed");
  const skipped = result.targets.filter((target) => target.status === "skipped");
  const lines: string[] = [];

  if (installed.length > 0) lines.push(`Hooks: installed for ${installed.map((target) => target.label).join(", ")}.`);
  if (repaired.length > 0) lines.push(`Hooks: repaired for ${repaired.map((target) => target.label).join(", ")}.`);
  if (current.length > 0) lines.push(`Hooks: already current for ${current.map((target) => target.label).join(", ")}.`);
  for (const target of skipped) lines.push(`Hooks: failed for ${target.label}: ${target.note ?? target.path}.`);
  lines.push("  Codex: enable hooks with features.hooks = true in ~/.codex/config.toml, then trust them via /hooks in Codex.");

  return { ok: skipped.length === 0, lines };
}
```

Do not catch exceptions from skill installation or hook writes: the CLI's existing error boundary must continue to return non-zero for those failures.

- [ ] **Step 8: Remove upgrade's interactive consent branch in `src/cli.ts`**

Keep flag parsing, but remove the TTY prompt and `checkHooks()` decision from `resolveUpgradeHooksOption()`:

```ts
async function resolveUpgradeHooksOption(args: string[]): Promise<boolean | undefined> {
  let hooks: boolean | undefined;
  for (const arg of args) {
    if (arg === "--hooks") hooks = true;
    else if (arg === "--no-hooks") hooks = false;
    else throw new Error("Usage: benjamin-docs upgrade [--hooks|--no-hooks]");
  }
  return hooks;
}
```

Update the call site to `resolveUpgradeHooksOption(argv.slice(1))`. Do not alter init's separate consent prompt.

- [ ] **Step 9: Run focused tests and verify GREEN**

Run:

```bash
pnpm check
node --test dist/test/upgrade.test.js dist/test/doctor.test.js dist/test/drift-hooks.test.js dist/test/install-skill.test.js
```

Expected: all tests pass; the total suite count increases by at least five; upgrade tests prove default install, repair, preservation, idempotency, opt-out, alias, skill replacement, and non-zero failure.

- [ ] **Step 10: Commit Task 1**

```bash
git add src/hooks.ts src/upgrade.ts src/cli.ts test/upgrade.test.ts
git commit -m "feat: make upgrade refresh all agent integrations"
```

### Task 2: Align Product Memory And Verify The Packed Upgrade

**Files:**
- Modify: `README.md:72-82,126-132`
- Modify: `src/commands.ts:15`
- Modify: `skills/benjamin-docs/references/integrations.md:7-15,28-33`
- Modify: `benjamin-docs/engineering/architecture.md`
- Modify: `benjamin-docs/project/brief.md`
- Modify: `benjamin-docs/project/roadmap.md`
- Modify: `benjamin-docs/handoff/human-brief.md`
- Modify: `benjamin-docs/handoff/agent-brief.md`
- Modify: `benjamin-docs/features/launch-readiness-audit/decisions.md`
- Modify: `benjamin-docs/features/launch-readiness-audit/handoff.md`
- Modify: `benjamin-docs/releases/changelog.md`
- Regenerate: `benjamin-docs/views/*.md` through `node dist/src/cli.js views`
- Modify: `scripts/smoke-packed-cli.mjs`

**Interfaces:**
- Consumes: the Task 1 command contract and packed CLI binary.
- Produces: one public upgrade instruction—update the package, then run `bd upgrade` in each initialized repository—with no required hook command.

- [ ] **Step 1: Add a packed-upgrade assertion**

Extend the installed-package fixture immediately after `init` and before `validate`:

```js
// Add beside packDirectory/projectDirectory declarations:
let homeDirectory;

// Add after the other mkdtemp calls:
homeDirectory = await mkdtemp(join(tmpdir(), "benjamin docs home -"));
env.BENJAMIN_DOCS_HOME = homeDirectory;

const upgradeOutput = runBd(["upgrade"]);
if (!upgradeOutput.includes("Hooks: installed")) {
  throw new Error(`plain packed upgrade did not install hooks:\n${upgradeOutput}`);
}
for (const [relativePath, format] of [
  [".claude/settings.json", "claude"],
  [".codex/hooks.json", "codex"],
  [".cursor/hooks.json", "cursor"],
]) {
  const hookText = await readFile(join(projectDirectory, relativePath), "utf8");
  if (!hookText.includes(`benjamin-docs session-start --format ${format}`)) {
    throw new Error(`${relativePath} does not contain the expected ${format} session-start hook`);
  }
}
```

Add `homeDirectory` to the existing `finally` cleanup array. Use the script's existing shell-free CLI helper and temporary-directory cleanup; do not introduce a second process runner. This isolation is mandatory because upgrade refreshes global skill targets beneath `BENJAMIN_DOCS_HOME`.

- [ ] **Step 2: Run packed smoke and verify the assertion**

Run:

```bash
pnpm build
pnpm smoke:pack
```

Expected before Task 1 is present in the packed artifact: FAIL because plain upgrade does not create hook files. Expected after Task 1: PASS.

- [ ] **Step 3: Update public and agent-facing instructions**

Make these statements exact and consistent:

```md
After updating the package, run `bd upgrade` once in each initialized repository. It refreshes Benjamin-owned project metadata, agent guidance, the current skill bundle, existing Memory Views, and session-start hooks for Claude Code, Codex, and Cursor. It removes legacy Benjamin stop hooks while preserving user-owned configuration. No separate hook command is required. Use `bd upgrade --no-hooks` only when the environment must opt out of hooks.
```

Apply the same contract to:

- `README.md` upgrade/setup copy;
- `src/commands.ts` upgrade description;
- `skills/benjamin-docs/references/integrations.md`;
- current architecture, roadmap, release, and handoff docs.

Preserve historical truth in the archived 0.10.0 feature docs and older changelog entries. Add a current superseding 0.12.0 statement instead of rewriting what shipped previously.

- [ ] **Step 4: Refresh views and run Benjamin Docs gates**

Run:

```bash
pnpm build
node dist/src/cli.js views
node dist/src/cli.js review --changed
node dist/src/cli.js drift --strict
node dist/src/cli.js ready --json
```

Expected:

- views are current after regeneration;
- review reports zero errors and zero warnings;
- drift reports zero drift;
- readiness returns status `ready` with all five dimensions `pass`.

- [ ] **Step 5: Run full release and agent-overhead verification**

Run:

```bash
pnpm check
pnpm smoke:pack
pnpm benchmark:agent -- --assert
pnpm audit --prod
pnpm release:check
git diff --check
git status --short
```

Expected:

- every test passes;
- packed 0.12.0 install and plain upgrade create all three hooks;
- benchmark assertions pass under the existing character, token, silence, and p95 limits;
- production audit reports no known vulnerabilities;
- release check and package dry-run pass;
- diff check is clean;
- only the intended Task 2 files are uncommitted before the commit.

- [ ] **Step 6: Manually inspect the one-command output**

In a temporary initialized repository using the built CLI, run:

```bash
node /Users/marty/Important/benjamin-docs/.worktrees/dependable-standard/dist/src/cli.js upgrade
node /Users/marty/Important/benjamin-docs/.worktrees/dependable-standard/dist/src/cli.js upgrade
```

Expected first run: skills refresh and hooks report installed or repaired for all applicable targets. Expected second run: skills and hooks report already current. Neither run asks for hook consent or recommends `bd hooks install` as a required next step.

- [ ] **Step 7: Commit Task 2**

```bash
git add README.md src/commands.ts skills/benjamin-docs/references/integrations.md scripts/smoke-packed-cli.mjs benjamin-docs/
git commit -m "docs: make upgrade the complete migration path"
```

## Final Review Gate

- [ ] Generate a review package from the pre-plan implementation HEAD through the final HEAD.
- [ ] Request an independent read-only review focused on default hook installation, legacy migration, user-data preservation, idempotency, opt-out behavior, failure truthfulness, packed-package behavior, and documentation consistency.
- [ ] Fix every Critical or Important finding through a fresh test-first change and re-run review.
- [ ] Re-run `pnpm check`, `pnpm smoke:pack`, `pnpm benchmark:agent -- --assert`, built `review --changed`, `drift --strict`, `ready --json`, `pnpm audit --prod`, `pnpm release:check`, and `git diff --check` before completion.
- [ ] Do not publish, push, tag, or create a release without separate user authorization.
