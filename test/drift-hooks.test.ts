import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runCliResult, withTempDir } from "./helpers.js";

function git(dir: string, ...args: string[]): void {
  execFileSync("git", ["-c", "user.email=test@example.com", "-c", "user.name=Test", ...args], {
    cwd: dir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function setUpCommittedProject(dir: string): void {
  git(dir, "init");
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "src/app.ts"), "export const a = 1;\n");
  runCliResult(["init", "--mode", "codebase", "--no-agent-contract"], dir);
  git(dir, "add", "-A");
  git(dir, "commit", "-m", "baseline with docs");
}

function commitSourceChange(dir: string): void {
  writeFileSync(join(dir, "src/app.ts"), "export const a = 1;\nexport const b = 2;\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-m", "code change without doc update");
}

describe("drift", () => {
  it("fails when benjamin-docs is not initialized", () => {
    withTempDir((dir) => {
      const result = runCliResult(["drift"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stdout, /benjamin-docs is not initialized/);
    });
  });

  it("reports unavailable outside a git repository without failing", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase", "--no-agent-contract"], dir);

      const result = runCliResult(["drift"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stdout, /status: unavailable/);
      assert.match(result.stdout, /needs git history/);
    });
  });

  it("reports no drift when docs are current with watched code", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);

      const result = runCliResult(["drift"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stdout, /status: no drift/);
      assert.match(result.stdout, /drifted docs: 0/);
    });
  });

  it("flags docs whose watched code changed in commits after the doc", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      commitSourceChange(dir);

      const result = runCliResult(["drift"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stdout, /status: drift detected/);
      assert.match(result.stdout, /benjamin-docs\/engineering\/code-map\.md/);
      assert.match(result.stdout, /src\/app\.ts/);
      assert.match(result.stdout, /across 1 commit/);

      const strict = runCliResult(["drift", "--strict"], dir);
      assert.equal(strict.status, 1);
    });
  });

  it("ignores uncommitted source changes and skips docs with uncommitted updates", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      writeFileSync(join(dir, "src/app.ts"), "export const a = 2;\n");

      const result = runCliResult(["drift"], dir);
      assert.equal(result.status, 0);
      assert.match(result.stdout, /status: no drift/);

      commitSourceChange(dir);
      writeFileSync(join(dir, "benjamin-docs/engineering/code-map.md"), readFileSync(join(dir, "benjamin-docs/engineering/code-map.md"), "utf8") + "\nupdated\n");

      const updated = runCliResult(["drift", "--json"], dir);
      const parsed = JSON.parse(updated.stdout) as { drifted: Array<{ doc: string }>; skipped: Array<{ doc: string; reason: string }> };
      assert.ok(!parsed.drifted.some((entry) => entry.doc === "benjamin-docs/engineering/code-map.md"));
      assert.ok(parsed.skipped.some((entry) => entry.doc === "benjamin-docs/engineering/code-map.md" && entry.reason === "doc has uncommitted updates"));
      assert.ok(parsed.drifted.some((entry) => entry.doc === "benjamin-docs/engineering/architecture.md"));
    });
  });

  it("clears drift for a doc after it is updated and committed", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      commitSourceChange(dir);
      writeFileSync(join(dir, "benjamin-docs/engineering/code-map.md"), readFileSync(join(dir, "benjamin-docs/engineering/code-map.md"), "utf8") + "\nre-verified against src/app.ts\n");
      git(dir, "add", "-A");
      git(dir, "commit", "-m", "update code map");

      const result = runCliResult(["drift", "--json"], dir);
      const parsed = JSON.parse(result.stdout) as { drifted: Array<{ doc: string }> };

      assert.ok(!parsed.drifted.some((entry) => entry.doc === "benjamin-docs/engineering/code-map.md"));
      assert.ok(parsed.drifted.some((entry) => entry.doc === "benjamin-docs/engineering/architecture.md"));
    });
  });

  it("shows an advisory drift section in ready output", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      commitSourceChange(dir);

      const result = runCliResult(["ready"], dir);

      assert.match(result.stdout, /Drift \(advisory\)/);
      assert.match(result.stdout, /Drift does not block readiness/);
    });
  });
});

describe("hooks", () => {
  it("installs, reports, and uninstalls hooks for all targets", () => {
    withTempDir((dir) => {
      const install = runCliResult(["hooks", "install"], dir);
      assert.equal(install.status, 0);
      assert.match(install.stdout, /installed\s+Claude Code\s+\.claude\/settings\.json/);
      assert.match(install.stdout, /installed\s+Codex CLI\s+\.codex\/hooks\.json/);
      assert.match(install.stdout, /installed\s+Cursor\s+\.cursor\/hooks\.json/);

      const claudeSettings = JSON.parse(readFileSync(join(dir, ".claude/settings.json"), "utf8")) as {
        hooks: { SessionStart: Array<{ hooks: Array<{ command: string }> }>; Stop: Array<{ hooks: Array<{ command: string }> }> };
      };
      assert.match(claudeSettings.hooks.SessionStart[0]?.hooks[0]?.command ?? "", /benjamin-docs session-start --format claude/);
      assert.match(claudeSettings.hooks.Stop[0]?.hooks[0]?.command ?? "", /benjamin-docs session-stop --format claude/);

      const cursorHooks = JSON.parse(readFileSync(join(dir, ".cursor/hooks.json"), "utf8")) as {
        version: number;
        hooks: { sessionStart: Array<{ command: string }>; stop: Array<{ command: string; loop_limit: number }> };
      };
      assert.equal(cursorHooks.version, 1);
      assert.match(cursorHooks.hooks.sessionStart[0]?.command ?? "", /--format cursor/);
      assert.equal(cursorHooks.hooks.stop[0]?.loop_limit, 1);

      const again = runCliResult(["hooks", "install"], dir);
      assert.match(again.stdout, /already installed\s+Claude Code/);

      const status = runCliResult(["hooks", "status"], dir);
      assert.match(status.stdout, /installed\s+Codex CLI/);

      const uninstall = runCliResult(["hooks", "uninstall"], dir);
      assert.equal(uninstall.status, 0);
      assert.ok(!existsSync(join(dir, ".codex/hooks.json")));
      assert.ok(!existsSync(join(dir, ".codex")));
      assert.ok(!existsSync(join(dir, ".claude/settings.json")));
    });
  });

  it("preserves existing user hooks and settings across install and uninstall", () => {
    withTempDir((dir) => {
      mkdirSync(join(dir, ".claude"), { recursive: true });
      const userSettings = {
        permissions: { allow: ["Bash(ls:*)"] },
        hooks: { SessionStart: [{ matcher: "startup", hooks: [{ type: "command", command: "echo user-hook" }] }] },
      };
      writeFileSync(join(dir, ".claude/settings.json"), JSON.stringify(userSettings, null, 2));

      runCliResult(["hooks", "install", "--target", "claude-code"], dir);

      const afterInstall = JSON.parse(readFileSync(join(dir, ".claude/settings.json"), "utf8")) as {
        permissions: { allow: string[] };
        hooks: { SessionStart: Array<{ hooks: Array<{ command: string }> }> };
      };
      assert.deepEqual(afterInstall.permissions.allow, ["Bash(ls:*)"]);
      assert.equal(afterInstall.hooks.SessionStart.length, 2);

      runCliResult(["hooks", "uninstall", "--target", "claude-code"], dir);

      const afterUninstall = JSON.parse(readFileSync(join(dir, ".claude/settings.json"), "utf8")) as {
        permissions: { allow: string[] };
        hooks: { SessionStart: Array<{ hooks: Array<{ command: string }> }> };
      };
      assert.deepEqual(afterUninstall.permissions.allow, ["Bash(ls:*)"]);
      assert.equal(afterUninstall.hooks.SessionStart.length, 1);
      assert.equal(afterUninstall.hooks.SessionStart[0]?.hooks[0]?.command, "echo user-hook");
    });
  });

  it("preserves unparseable hook files and reports them as skipped", () => {
    withTempDir((dir) => {
      mkdirSync(join(dir, ".claude"), { recursive: true });
      writeFileSync(join(dir, ".claude/settings.json"), "{ not json");

      const result = runCliResult(["hooks", "install", "--target", "claude-code"], dir);

      assert.match(result.stdout, /skipped\s+Claude Code/);
      assert.equal(readFileSync(join(dir, ".claude/settings.json"), "utf8"), "{ not json");
    });
  });

  it("installs hooks from init with --hooks and skips them with --no-hooks", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase", "--no-agent-contract", "--hooks"], dir);
      assert.ok(existsSync(join(dir, ".claude/settings.json")));
      assert.ok(existsSync(join(dir, ".cursor/hooks.json")));
    });

    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase", "--no-agent-contract", "--no-hooks"], dir);
      assert.ok(!existsSync(join(dir, ".claude/settings.json")));
    });
  });
});

describe("session commands", () => {
  it("prints nothing outside an initialized project", () => {
    withTempDir((dir) => {
      const result = runCliResult(["session-start"], dir);

      assert.equal(result.status, 0);
      assert.equal(result.stdout.trim(), "");
    });
  });

  it("prints compact context with drift summary per format", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      commitSourceChange(dir);

      const plain = runCliResult(["session-start", "--format", "claude"], dir);
      assert.match(plain.stdout, /Benjamin Docs project memory is active/);
      assert.match(plain.stdout, /Read first: benjamin-docs\/handoff\/agent-brief\.md/);
      assert.match(plain.stdout, /Drift: \d+ docs are behind watched code changes/);
      assert.match(plain.stdout, /benjamin-docs ready/);

      const cursor = JSON.parse(runCliResult(["session-start", "--format", "cursor"], dir).stdout) as { additional_context: string };
      assert.match(cursor.additional_context, /project memory is active/);

      const codex = JSON.parse(runCliResult(["session-start", "--format", "codex"], dir).stdout) as {
        hookSpecificOutput: { hookEventName: string; additionalContext: string };
      };
      assert.equal(codex.hookSpecificOutput.hookEventName, "SessionStart");
      assert.match(codex.hookSpecificOutput.additionalContext, /project memory is active/);
    });
  });

  it("nudges once when source changed without memory updates", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      writeFileSync(join(dir, "src/app.ts"), "export const a = 2;\n");

      const nudge = runCliResult(["session-stop", "--format", "claude"], dir);
      const parsed = JSON.parse(nudge.stdout) as { decision: string; reason: string };
      assert.equal(parsed.decision, "block");
      assert.match(parsed.reason, /no Benjamin Docs project memory was updated/);

      const cursorNudge = JSON.parse(runCliResult(["session-stop", "--format", "cursor"], dir).stdout) as { followup_message: string };
      assert.match(cursorNudge.followup_message, /no Benjamin Docs project memory was updated/);
    });
  });

  it("stays quiet when memory was updated or the stop hook already fired", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);

      const clean = runCliResult(["session-stop", "--format", "claude"], dir);
      assert.equal(clean.stdout.trim(), "");

      writeFileSync(join(dir, "src/app.ts"), "export const a = 2;\n");
      writeFileSync(join(dir, "benjamin-docs/handoff/agent-brief.md"), readFileSync(join(dir, "benjamin-docs/handoff/agent-brief.md"), "utf8") + "\nupdated\n");

      const updated = runCliResult(["session-stop", "--format", "claude"], dir);
      assert.equal(updated.stdout.trim(), "");
    });
  });

  it("does not nudge again when the stop hook is already active", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      writeFileSync(join(dir, "src/app.ts"), "export const a = 2;\n");

      const output = execFileSync("node", [join(process.cwd(), "dist/src/cli.js"), "session-stop", "--format", "claude"], {
        cwd: dir,
        encoding: "utf8",
        input: JSON.stringify({ stop_hook_active: true }),
      });

      assert.equal(output.trim(), "");
    });
  });
});
