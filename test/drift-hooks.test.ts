import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CONTEXT_BUDGETS, estimatedTokens } from "../src/context-budget.js";
import { getSessionStopNudge } from "../src/session.js";
import { MAX_DOCS_ROOT_CHARACTERS } from "../src/session-context.js";
import { beginSessionTracking, evaluateSessionStop } from "../src/session-state.js";
import { runCliResult, withTempDir } from "./helpers.js";

function git(dir: string, ...args: string[]): void {
  execFileSync("git", ["-c", "user.email=test@example.com", "-c", "user.name=Test", ...args], {
    cwd: dir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function setUpCommittedProject(dir: string, docsRoot?: string, includeContinuationView = false): void {
  git(dir, "init");
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "src/app.ts"), "export const a = 1;\n");
  const initArgs = ["init", "--mode", "codebase", "--no-agent-contract"];
  if (docsRoot) initArgs.push("--docs-root", docsRoot);
  const initialized = runCliResult(initArgs, dir);
  assert.equal(initialized.status, 0, initialized.stderr);
  if (docsRoot && includeContinuationView) {
    mkdirSync(join(dir, docsRoot, "views"), { recursive: true });
    writeFileSync(join(dir, docsRoot, "views/agent-continuation.md"), "# Agent Continuation\n");
  }
  git(dir, "add", "-A");
  git(dir, "commit", "-m", "baseline with docs");
}

function commitSourceChange(dir: string): void {
  writeFileSync(join(dir, "src/app.ts"), "export const a = 1;\nexport const b = 2;\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-m", "code change without doc update");
}

interface CodexHookPayload {
  session_id: string;
  turn_id: string;
  stop_hook_active: boolean;
  last_assistant_message: string;
}

function codexHookPayload(overrides: Partial<CodexHookPayload> = {}): CodexHookPayload {
  return {
    session_id: "session-1",
    turn_id: "turn-1",
    stop_hook_active: false,
    last_assistant_message: "The requested work is complete.",
    ...overrides,
  };
}

function runCodexSessionCommand(dir: string, command: "session-start" | "session-stop", payload: CodexHookPayload): string {
  return execFileSync("node", [join(process.cwd(), "dist/src/cli.js"), command, "--format", "codex"], {
    cwd: dir,
    encoding: "utf8",
    input: JSON.stringify(payload),
    env: {
      ...process.env,
      NO_COLOR: "1",
      BENJAMIN_DOCS_NO_UPDATE_CHECK: "1",
      BENJAMIN_DOCS_HOME: join(dir, ".git", "benjamin-docs-test-home"),
    },
  });
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

  it("keeps commit counts specific to each document's last update", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      commitSourceChange(dir);
      writeFileSync(
        join(dir, "benjamin-docs/engineering/code-map.md"),
        `${readFileSync(join(dir, "benjamin-docs/engineering/code-map.md"), "utf8")}\nre-verified after first source change\n`,
      );
      git(dir, "add", "-A");
      git(dir, "commit", "-m", "update code map between source changes");
      writeFileSync(join(dir, "src/app.ts"), "export const a = 1;\nexport const b = 2;\nexport const c = 3;\n");
      git(dir, "add", "-A");
      git(dir, "commit", "-m", "second code change without doc update");

      const result = runCliResult(["drift", "--json"], dir);
      const parsed = JSON.parse(result.stdout) as { drifted: Array<{ doc: string; commitsBehind?: number }> };

      assert.equal(parsed.drifted.find((entry) => entry.doc === "benjamin-docs/engineering/code-map.md")?.commitsBehind, 1);
      assert.equal(parsed.drifted.find((entry) => entry.doc === "benjamin-docs/engineering/architecture.md")?.commitsBehind, 2);
    });
  });

  it("tracks non-ASCII watched docs through batched last-commit lookup", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      const watchedDoc = "benjamin-docs/engineering/überblick.md";
      writeFileSync(
        join(dir, watchedDoc),
        [
          "---",
          "title: Überblick",
          "scope: project",
          "scope_id: project",
          "audience: [developer, agent]",
          "status: review",
          "visibility: private",
          "updated: 2026-07-10",
          "source: codebase-scan",
          "---",
          "",
          "# Überblick",
          "",
          "Tracks source changes.",
          "",
        ].join("\n"),
      );
      const configPath = join(dir, ".benjamin-docs/config.json");
      const config = JSON.parse(readFileSync(configPath, "utf8")) as {
        watch: Array<{ label: string; paths: string[]; docs: string[] }>;
      };
      config.watch.push({ label: "non-ASCII doc", paths: ["src/**"], docs: [watchedDoc] });
      writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
      git(dir, "add", "-A");
      git(dir, "commit", "-m", "add non-ASCII watched doc");

      writeFileSync(join(dir, "src/app.ts"), "export const a = 2;\n");
      git(dir, "add", "-A");
      git(dir, "commit", "-m", "change source after non-ASCII doc");

      const result = runCliResult(["drift", "--json"], dir);
      const parsed = JSON.parse(result.stdout) as { drifted: Array<{ doc: string; changedFiles: string[] }> };
      const entry = parsed.drifted.find((candidate) => candidate.doc === watchedDoc);

      assert.deepEqual(entry?.changedFiles, ["src/app.ts"]);
    });
  });

  it("blocks ready when committed watched source is ahead of memory", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      commitSourceChange(dir);

      const result = runCliResult(["ready"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stdout, /fail\s+committed freshness/);
      assert.match(result.stdout, /repair: benjamin-docs drift/);
      assert.doesNotMatch(result.stdout, /advisory|does not block readiness/i);
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
        hooks: { SessionStart: Array<{ hooks: Array<{ command: string }> }>; Stop?: unknown };
      };
      assert.match(claudeSettings.hooks.SessionStart[0]?.hooks[0]?.command ?? "", /session-start --format claude/);
      assert.equal(claudeSettings.hooks.Stop, undefined);

      const codexSettings = JSON.parse(readFileSync(join(dir, ".codex/hooks.json"), "utf8")) as {
        hooks: { SessionStart: Array<{ hooks: Array<{ command: string }> }>; Stop?: unknown };
      };
      assert.match(codexSettings.hooks.SessionStart[0]?.hooks[0]?.command ?? "", /session-start --format codex/);
      assert.equal(codexSettings.hooks.Stop, undefined);

      const cursorSettings = JSON.parse(readFileSync(join(dir, ".cursor/hooks.json"), "utf8")) as {
        version: number;
        hooks: { sessionStart: Array<{ command: string }>; stop?: unknown };
      };
      assert.equal(cursorSettings.version, 1);
      assert.match(cursorSettings.hooks.sessionStart[0]?.command ?? "", /session-start --format cursor/);
      assert.equal(cursorSettings.hooks.stop, undefined);

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
        hooks: {
          SessionStart: [{ matcher: "startup", hooks: [{ type: "command", command: "echo user-hook" }] }],
          Stop: [
            {
              matcher: "user-stop",
              customField: "preserve-me",
              hooks: [
                { type: "command", command: "echo user-stop", timeout: 10 },
                { type: "command", command: "benjamin-docs session-stop --format claude" },
              ],
            },
          ],
        },
      };
      writeFileSync(join(dir, ".claude/settings.json"), JSON.stringify(userSettings, null, 2));

      runCliResult(["hooks", "install", "--target", "claude-code"], dir);

      const afterInstall = JSON.parse(readFileSync(join(dir, ".claude/settings.json"), "utf8")) as {
        permissions: { allow: string[] };
        hooks: {
          SessionStart: Array<{ hooks: Array<{ command: string }> }>;
          Stop: Array<{ matcher: string; customField: string; hooks: Array<{ command: string; timeout?: number }> }>;
        };
      };
      assert.deepEqual(afterInstall.permissions.allow, ["Bash(ls:*)"]);
      assert.equal(afterInstall.hooks.SessionStart.length, 2);
      assert.deepEqual(afterInstall.hooks.Stop, [
        {
          matcher: "user-stop",
          customField: "preserve-me",
          hooks: [{ type: "command", command: "echo user-stop", timeout: 10 }],
        },
      ]);

      runCliResult(["hooks", "uninstall", "--target", "claude-code"], dir);

      const afterUninstall = JSON.parse(readFileSync(join(dir, ".claude/settings.json"), "utf8")) as {
        permissions: { allow: string[] };
        hooks: {
          SessionStart: Array<{ hooks: Array<{ command: string }> }>;
          Stop: Array<{ matcher: string; customField: string; hooks: Array<{ command: string; timeout?: number }> }>;
        };
      };
      assert.deepEqual(afterUninstall.permissions.allow, ["Bash(ls:*)"]);
      assert.equal(afterUninstall.hooks.SessionStart.length, 1);
      assert.equal(afterUninstall.hooks.SessionStart[0]?.hooks[0]?.command, "echo user-hook");
      assert.deepEqual(afterUninstall.hooks.Stop, afterInstall.hooks.Stop);
    });
  });

  it("removes only Benjamin commands when directly uninstalling mixed shared-schema groups", () => {
    withTempDir((dir) => {
      mkdirSync(join(dir, ".claude"), { recursive: true });
      const mixedSettings = {
        permissions: { allow: ["Bash(git status:*)"] },
        hooks: {
          SessionStart: [
            {
              matcher: "startup|resume|clear",
              customField: "keep-start-group",
              hooks: [
                { type: "command", command: "echo user-start", timeout: 5 },
                { type: "command", command: "benjamin-docs session-start --format claude" },
              ],
            },
          ],
          Stop: [
            {
              customField: "keep-stop-group",
              hooks: [
                { type: "command", command: "echo user-stop" },
                { type: "command", command: "benjamin-docs session-stop --format claude" },
              ],
            },
          ],
        },
      };
      writeFileSync(join(dir, ".claude/settings.json"), JSON.stringify(mixedSettings, null, 2));

      const uninstall = runCliResult(["hooks", "uninstall", "--target", "claude-code"], dir);
      const afterUninstall = JSON.parse(readFileSync(join(dir, ".claude/settings.json"), "utf8")) as typeof mixedSettings;

      assert.equal(uninstall.status, 0);
      assert.deepEqual(afterUninstall, {
        permissions: { allow: ["Bash(git status:*)"] },
        hooks: {
          SessionStart: [
            {
              matcher: "startup|resume|clear",
              customField: "keep-start-group",
              hooks: [{ type: "command", command: "echo user-start", timeout: 5 }],
            },
          ],
          Stop: [
            {
              customField: "keep-stop-group",
              hooks: [{ type: "command", command: "echo user-stop" }],
            },
          ],
        },
      });
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
      assert.match(plain.stdout, /Benjamin Docs memory is active/);
      assert.match(plain.stdout, /Docs root: benjamin-docs\//);
      assert.match(plain.stdout, /Read first: handoff\/agent-brief\.md/);
      assert.match(plain.stdout, /Drift: \d+ docs are behind watched code changes/);
      assert.match(plain.stdout, /bd ready/);
      const claudeContext = plain.stdout.trimEnd();
      assert.ok(claudeContext.length <= CONTEXT_BUDGETS.sessionStartCharacters);
      assert.ok(estimatedTokens(claudeContext) <= CONTEXT_BUDGETS.sessionStartEstimatedTokens);

      const plainContext = runCliResult(["session-start"], dir).stdout.trim();
      assert.ok(plainContext.length <= 400);
      assert.ok(Math.ceil(plainContext.length / 4) <= 100);
      assert.match(plainContext, /^Benjamin Docs memory is active\./);
      assert.match(plainContext, /^Docs root: benjamin-docs\/$/m);
      assert.match(plainContext, /^Read first: handoff\/agent-brief\.md/m);
      assert.doesNotMatch(plainContext, / Run bd status for details\.$/);

      const cursor = JSON.parse(runCliResult(["session-start", "--format", "cursor"], dir).stdout) as { additional_context: string };
      assert.match(cursor.additional_context, /Benjamin Docs memory is active/);

      const codex = JSON.parse(runCliResult(["session-start", "--format", "codex"], dir).stdout) as {
        hookSpecificOutput: { hookEventName: string; additionalContext: string };
      };
      assert.equal(codex.hookSpecificOutput.hookEventName, "SessionStart");
      assert.match(codex.hookSpecificOutput.additionalContext, /Benjamin Docs memory is active/);
    });
  });

  it("keeps a maximum-length custom docs root and the full overflow suffix within budget", () => {
    withTempDir((dir) => {
      const docsRoot = "m".repeat(MAX_DOCS_ROOT_CHARACTERS);
      setUpCommittedProject(dir, docsRoot, true);
      commitSourceChange(dir);

      const context = runCliResult(["session-start"], dir).stdout.trim();

      assert.ok(context.length <= CONTEXT_BUDGETS.sessionStartCharacters, `Expected at most 400 characters, got ${context.length}`);
      assert.ok(estimatedTokens(context) <= CONTEXT_BUDGETS.sessionStartEstimatedTokens);
      assert.match(context, new RegExp(`^Benjamin Docs memory is active\\.\\nDocs root: ${docsRoot}/$`, "m"));
      assert.match(context, /^Read first: handoff\/agent-brief\.md, views\/agent-continuation\.md$/m);
      assert.ok(context.endsWith(" Run bd status for details."));
      assert.equal(context.split(docsRoot).length - 1, 1);
    });
  });

  it("keeps the legacy session-stop command silent for every output format", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      writeFileSync(join(dir, "src/app.ts"), "export const a = 2;\n");

      assert.equal(runCliResult(["session-stop", "--format", "claude"], dir).stdout, "");
      assert.equal(runCliResult(["session-stop", "--format", "cursor"], dir).stdout, "");
    });
  });

  it("keeps the source-change nudge available as an explicit diagnostic", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      writeFileSync(join(dir, "src/app.ts"), "export const a = 2;\n");

      const nudge = getSessionStopNudge(dir);

      assert.match(nudge, /Source files changed \(1\)/);
      assert.match(nudge, /no Benjamin Docs project memory was updated/);
      assert.match(nudge, /complete answer to the user's original request/);
    });
  });

  it("keeps the explicit diagnostic quiet when memory changed with source work", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      writeFileSync(join(dir, "src/app.ts"), "export const a = 2;\n");
      const agentBrief = join(dir, "benjamin-docs/handoff/agent-brief.md");
      writeFileSync(agentBrief, `${readFileSync(agentBrief, "utf8")}\nUpdated for this source change.\n`);

      assert.equal(getSessionStopNudge(dir), "");
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

  it("ignores source changes that were already dirty when the session started", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      writeFileSync(join(dir, "src/app.ts"), "export const a = 2;\n");
      const payload = codexHookPayload();

      runCodexSessionCommand(dir, "session-start", payload);
      const output = runCodexSessionCommand(dir, "session-stop", payload);

      assert.equal(output.trim(), "");
    });
  });

  it("does not continue the agent loop when source changes during a session", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      const payload = codexHookPayload();
      runCodexSessionCommand(dir, "session-start", payload);
      writeFileSync(join(dir, "src/app.ts"), "export const a = 2;\n");

      assert.equal(runCodexSessionCommand(dir, "session-stop", payload).trim(), "");
    });
  });

  it("diagnoses a source deletion during a session while installed stop output stays silent", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      const payload = codexHookPayload({ session_id: "deletion-session" });
      const previousHome = process.env.BENJAMIN_DOCS_HOME;
      process.env.BENJAMIN_DOCS_HOME = join(dir, ".git", "benjamin-docs-test-home");
      try {
        const hookInput = {
          provided: true,
          sessionId: payload.session_id,
          turnId: payload.turn_id,
          stopHookActive: payload.stop_hook_active,
          lastAssistantMessage: payload.last_assistant_message,
        };
        beginSessionTracking(dir, "benjamin-docs", "codex", hookInput);
        rmSync(join(dir, "src/app.ts"));
        const diagnostic = evaluateSessionStop(dir, "benjamin-docs", "codex", hookInput);

        assert.deepEqual(diagnostic.sourceChanges, ["src/app.ts"]);
      } finally {
        if (previousHome === undefined) delete process.env.BENJAMIN_DOCS_HOME;
        else process.env.BENJAMIN_DOCS_HOME = previousHome;
      }

      assert.equal(runCodexSessionCommand(dir, "session-stop", payload), "");
    });
  });

  it("stays silent when an already-dirty source file changes again during the session", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      writeFileSync(join(dir, "src/app.ts"), "export const a = 2;\n");
      const payload = codexHookPayload();
      runCodexSessionCommand(dir, "session-start", payload);

      writeFileSync(join(dir, "src/app.ts"), "export const a = 3;\n");
      assert.equal(runCodexSessionCommand(dir, "session-stop", payload).trim(), "");
    });
  });

  it("fails open when a stop hook has no session baseline", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      writeFileSync(join(dir, "src/app.ts"), "export const a = 2;\n");

      const output = runCodexSessionCommand(dir, "session-stop", codexHookPayload({ session_id: "missing-session" }));

      assert.equal(output.trim(), "");
    });
  });

  it("stays quiet when memory changed along with new source work", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      const payload = codexHookPayload();
      runCodexSessionCommand(dir, "session-start", payload);

      writeFileSync(join(dir, "src/app.ts"), "export const a = 2;\n");
      const agentBrief = join(dir, "benjamin-docs/handoff/agent-brief.md");
      writeFileSync(agentBrief, `${readFileSync(agentBrief, "utf8")}\nUpdated for this source change.\n`);

      assert.equal(runCodexSessionCommand(dir, "session-stop", payload).trim(), "");
    });
  });

  it("keeps session baselines isolated", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      const firstSession = codexHookPayload({ session_id: "session-a" });
      runCodexSessionCommand(dir, "session-start", firstSession);

      writeFileSync(join(dir, "src/app.ts"), "export const a = 2;\n");
      const secondSession = codexHookPayload({ session_id: "session-b" });
      runCodexSessionCommand(dir, "session-start", secondSession);

      assert.equal(runCodexSessionCommand(dir, "session-stop", firstSession).trim(), "");
      assert.equal(runCodexSessionCommand(dir, "session-stop", secondSession).trim(), "");
    });
  });

  it("prunes expired session state when a new session starts", () => {
    withTempDir((dir) => {
      setUpCommittedProject(dir);
      runCodexSessionCommand(dir, "session-start", codexHookPayload({ session_id: "expired-session" }));

      const stateDir = join(dir, ".git", "benjamin-docs-test-home", ".benjamin-docs", "session-hooks");
      const [expiredFile] = readdirSync(stateDir);
      assert.ok(expiredFile);
      const expiredPath = join(stateDir, expiredFile);
      const expired = JSON.parse(readFileSync(expiredPath, "utf8")) as Record<string, unknown>;
      expired.updatedAt = "2000-01-01T00:00:00.000Z";
      writeFileSync(expiredPath, `${JSON.stringify(expired, null, 2)}\n`);

      runCodexSessionCommand(dir, "session-start", codexHookPayload({ session_id: "current-session" }));

      assert.equal(readdirSync(stateDir).length, 1);
    });
  });
});
