import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compareVersions, isUpdateCacheStale } from "../src/update-check.js";
import { runCliResult, withTempDir } from "./helpers.js";

function stripBdVersion(dir: string): void {
  const configPath = join(dir, ".benjamin-docs/config.json");
  const config = JSON.parse(readFileSync(configPath, "utf8")) as Record<string, unknown>;
  delete config.bdVersion;
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

function seedUpdateCache(homeDir: string, latest: string, lastChecked: string): void {
  mkdirSync(join(homeDir, ".benjamin-docs"), { recursive: true });
  writeFileSync(join(homeDir, ".benjamin-docs/update-check.json"), JSON.stringify({ lastChecked, latest }));
}

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
      stop: [{ command: "benjamin-docs session-stop --format cursor", customField: "remove-whole-benjamin-entry" }],
    },
  }, null, 2)}\n`);

  for (const target of [".agents", ".codex", ".claude", ".cursor"]) {
    const skillDir = join(home, target, "skills/benjamin-docs");
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, "SKILL.md"), "old skill\n");
  }
}

describe("upgrade", () => {
  it("fails before any skill write when a skill directory is symlinked outside home", () => {
    withTempDir((dir) => {
      withTempDir((home) => {
        withTempDir((external) => {
          runCliResult(["init", "--mode", "codebase", "--no-agent-contract", "--no-hooks"], dir, {
            BENJAMIN_DOCS_HOME: home,
          });
          const configPath = join(dir, ".benjamin-docs/config.json");
          const config = JSON.parse(readFileSync(configPath, "utf8")) as Record<string, unknown>;
          config.bdVersion = "0.11.1";
          writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

          const victim = join(external, "SKILL.md");
          const original = Buffer.from("external directory victim\n", "utf8");
          writeFileSync(victim, original);
          mkdirSync(join(home, ".codex/skills"), { recursive: true });
          symlinkSync(external, join(home, ".codex/skills/benjamin-docs"));

          const result = runCliResult(["upgrade"], dir, { BENJAMIN_DOCS_HOME: home });

          assert.equal(result.status, 1);
          assert.match(result.stderr, /must not be a symlink/i);
          assert.deepEqual(readFileSync(victim), original);
          assert.equal(existsSync(join(home, ".agents/skills/benjamin-docs/SKILL.md")), false);
          const after = JSON.parse(readFileSync(configPath, "utf8")) as { bdVersion?: string };
          assert.equal(after.bdVersion, "0.11.1");
        });
      });
    });
  });

  it("fails when benjamin-docs is not initialized", () => {
    withTempDir((dir) => {
      const result = runCliResult(["upgrade"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stdout, /benjamin-docs is not initialized here/);
    });
  });

  it("stamps bdVersion, refreshes agent guidance, and installs hooks", () => {
    withTempDir((dir) => {
      withTempDir((home) => {
        runCliResult(["init", "--mode", "codebase"], dir, { BENJAMIN_DOCS_HOME: home });
        stripBdVersion(dir);
        const agentsPath = join(dir, "AGENTS.md");
        writeFileSync(agentsPath, readFileSync(agentsPath, "utf8").replace(/- Run `benjamin-docs drift`[^\n]*\n/, ""));

        const result = runCliResult(["upgrade"], dir, { BENJAMIN_DOCS_HOME: home });

        assert.equal(result.status, 0);
        assert.match(result.stdout, /Project metadata: recorded before 0\.10\.0 -> /);
        assert.match(result.stdout, /Agent guidance: refreshed the Benjamin-owned AGENTS\.md section/);
        assert.match(result.stdout, /Hooks: installed for Claude Code, Codex CLI, Cursor/);
        assert.doesNotMatch(result.stdout, /load|maintain project memory automatically/i);
        assert.doesNotMatch(result.stdout, /Update check/);

        const config = JSON.parse(readFileSync(join(dir, ".benjamin-docs/config.json"), "utf8")) as { bdVersion?: string };
        assert.ok(config.bdVersion);
        assert.match(readFileSync(agentsPath, "utf8"), /benjamin-docs drift/);

        const again = runCliResult(["upgrade"], dir, { BENJAMIN_DOCS_HOME: home });
        assert.match(again.stdout, /Project metadata already records CLI /);
      });
    });
  });

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
        const cursorHooks = JSON.parse(readFileSync(join(dir, ".cursor/hooks.json"), "utf8")) as {
          hooks: { sessionStart: Array<Record<string, unknown>>; stop?: unknown };
        };
        assert.deepEqual(cursorHooks.hooks.sessionStart, [
          { command: "echo cursor-user" },
          { command: "benjamin-docs session-start --format cursor" },
        ]);
        assert.equal(cursorHooks.hooks.stop, undefined);

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

  it("removes only a top-level legacy stop command from a mixed user-owned group", () => {
    withTempDir((dir) => {
      withTempDir((home) => {
        runCliResult(["init", "--mode", "codebase", "--no-agent-contract", "--no-hooks"], dir, {
          BENJAMIN_DOCS_HOME: home,
        });
        mkdirSync(join(dir, ".claude"), { recursive: true });
        writeFileSync(join(dir, ".claude/settings.json"), `${JSON.stringify({
          hooks: {
            Stop: [{
              command: "benjamin-docs session-stop --format claude",
              customField: "keep-stop-group",
              timeout: 17,
              hooks: [{ type: "command", command: "echo user-stop", customEntry: "keep-user-entry" }],
            }],
          },
        }, null, 2)}\n`);

        const result = runCliResult(["upgrade"], dir, { BENJAMIN_DOCS_HOME: home });
        const updated = JSON.parse(readFileSync(join(dir, ".claude/settings.json"), "utf8")) as {
          hooks: { Stop: Array<Record<string, unknown>> };
        };

        assert.equal(result.status, 0);
        assert.deepEqual(updated.hooks.Stop, [{
          customField: "keep-stop-group",
          timeout: 17,
          hooks: [{ type: "command", command: "echo user-stop", customEntry: "keep-user-entry" }],
        }]);
      });
    });
  });

  it("fails upgrade when a required hook target cannot be migrated", () => {
    withTempDir((dir) => {
      withTempDir((home) => {
        runCliResult(["init", "--mode", "codebase", "--no-agent-contract", "--no-hooks"], dir, {
          BENJAMIN_DOCS_HOME: home,
        });
        stripBdVersion(dir);
        mkdirSync(join(dir, ".codex"), { recursive: true });
        writeFileSync(join(dir, ".codex/hooks.json"), "{ not valid json\n");

        const result = runCliResult(["upgrade"], dir, { BENJAMIN_DOCS_HOME: home });

        assert.equal(result.status, 1);
        assert.match(result.stdout, /Hooks: failed/);
        assert.match(result.stdout, /\.codex\/hooks\.json could not be parsed/);
        assert.equal(readFileSync(join(dir, ".codex/hooks.json"), "utf8"), "{ not valid json\n");
        const config = JSON.parse(readFileSync(join(dir, ".benjamin-docs/config.json"), "utf8")) as { bdVersion?: string };
        assert.equal(config.bdVersion, undefined);
      });
    });
  });

  it("preserves incompatible user-owned hook structures and leaves metadata unstamped", () => {
    withTempDir((dir) => {
      withTempDir((home) => {
        runCliResult(["init", "--mode", "codebase", "--no-agent-contract", "--no-hooks"], dir, {
          BENJAMIN_DOCS_HOME: home,
        });
        stripBdVersion(dir);

        const fixtures = [
          [".claude/settings.json", { custom: "keep-claude", hooks: "user-owned" }],
          [".codex/hooks.json", { custom: "keep-codex", hooks: { SessionStart: { command: "echo user" } } }],
          [".cursor/hooks.json", { version: 1, custom: "keep-cursor", hooks: { stop: "user-owned" } }],
        ] as const;
        for (const [relativePath, value] of fixtures) {
          mkdirSync(join(dir, relativePath.split("/")[0] ?? ""), { recursive: true });
          writeFileSync(join(dir, relativePath), `${JSON.stringify(value, null, 2)}\n`);
        }
        const originals = fixtures.map(([relativePath]) => readFileSync(join(dir, relativePath), "utf8"));

        const result = runCliResult(["upgrade"], dir, { BENJAMIN_DOCS_HOME: home });

        assert.equal(result.status, 1);
        assert.match(result.stdout, /Hooks: failed for Claude Code/);
        assert.match(result.stdout, /Hooks: failed for Codex CLI/);
        assert.match(result.stdout, /Hooks: failed for Cursor/);
        assert.deepEqual(fixtures.map(([relativePath]) => readFileSync(join(dir, relativePath), "utf8")), originals);
        const config = JSON.parse(readFileSync(join(dir, ".benjamin-docs/config.json"), "utf8")) as { bdVersion?: string };
        assert.equal(config.bdVersion, undefined);
      });
    });
  });

  it("preserves shared hook groups with incompatible nested hooks and leaves metadata unstamped", () => {
    withTempDir((dir) => {
      withTempDir((home) => {
        runCliResult(["init", "--mode", "codebase", "--no-agent-contract", "--no-hooks"], dir, {
          BENJAMIN_DOCS_HOME: home,
        });
        stripBdVersion(dir);

        const fixtures = [
          [".claude/settings.json", {
            custom: "keep-claude",
            hooks: {
              SessionStart: [{
                command: "benjamin-docs session-start --format claude",
                hooks: "user-owned",
                customGroup: "keep-session-start",
              }],
            },
          }],
          [".codex/hooks.json", {
            custom: "keep-codex",
            hooks: {
              Stop: [{
                command: "benjamin-docs session-stop --format codex",
                hooks: { custom: "user-owned" },
                customGroup: "keep-stop",
              }],
            },
          }],
        ] as const;
        for (const [relativePath, value] of fixtures) {
          mkdirSync(join(dir, relativePath.split("/")[0] ?? ""), { recursive: true });
          writeFileSync(join(dir, relativePath), `${JSON.stringify(value, null, 2)}\n`);
        }
        const originals = fixtures.map(([relativePath]) => readFileSync(join(dir, relativePath), "utf8"));

        const result = runCliResult(["upgrade"], dir, { BENJAMIN_DOCS_HOME: home });

        assert.equal(result.status, 1);
        assert.match(result.stdout, /Hooks: failed for Claude Code/);
        assert.match(result.stdout, /SessionStart group hooks must be an array/);
        assert.match(result.stdout, /Hooks: failed for Codex CLI/);
        assert.match(result.stdout, /Stop group hooks must be an array/);
        assert.deepEqual(fixtures.map(([relativePath]) => readFileSync(join(dir, relativePath), "utf8")), originals);
        const config = JSON.parse(readFileSync(join(dir, ".benjamin-docs/config.json"), "utf8")) as { bdVersion?: string };
        assert.equal(config.bdVersion, undefined);
      });
    });
  });

  it("repairs top-level Benjamin commands in shared groups that omit nested hooks", () => {
    withTempDir((dir) => {
      withTempDir((home) => {
        runCliResult(["init", "--mode", "codebase", "--no-agent-contract", "--no-hooks"], dir, {
          BENJAMIN_DOCS_HOME: home,
        });
        stripBdVersion(dir);
        mkdirSync(join(dir, ".claude"), { recursive: true });
        writeFileSync(join(dir, ".claude/settings.json"), `${JSON.stringify({
          hooks: {
            SessionStart: [{
              command: "benjamin-docs session-start --format wrong",
              customGroup: "keep-session-start",
            }],
            Stop: [{
              command: "benjamin-docs session-stop --format claude",
              customGroup: "keep-stop",
            }],
          },
        }, null, 2)}\n`);

        const result = runCliResult(["upgrade"], dir, { BENJAMIN_DOCS_HOME: home });
        const updated = JSON.parse(readFileSync(join(dir, ".claude/settings.json"), "utf8")) as {
          hooks: { SessionStart: Array<Record<string, unknown>>; Stop: Array<Record<string, unknown>> };
        };

        assert.equal(result.status, 0);
        assert.deepEqual(updated.hooks.SessionStart, [
          { customGroup: "keep-session-start" },
          {
            matcher: "startup|resume|clear",
            hooks: [{ type: "command", command: "benjamin-docs session-start --format claude" }],
          },
        ]);
        assert.deepEqual(updated.hooks.Stop, [{ customGroup: "keep-stop" }]);
        const config = JSON.parse(readFileSync(join(dir, ".benjamin-docs/config.json"), "utf8")) as { bdVersion?: string };
        assert.equal(config.bdVersion, "0.12.0");
      });
    });
  });

  for (const target of ["claude-code", "codex", "cursor"] as const) {
    it(`preserves prefixed start and stop user commands while upgrading ${target}`, () => {
      withTempDir((dir) => {
        withTempDir((home) => {
          runCliResult(["init", "--mode", "codebase", "--no-agent-contract", "--no-hooks"], dir, {
            BENJAMIN_DOCS_HOME: home,
          });
          stripBdVersion(dir);
          const cursor = target === "cursor";
          const hookPath = cursor ? ".cursor/hooks.json" : target === "codex" ? ".codex/hooks.json" : ".claude/settings.json";
          const format = target === "codex" ? "codex" : target === "cursor" ? "cursor" : "claude";
          const userStart = { command: "echo benjamin-docs session-start --format claude", user: "keep-start" };
          const userStop = { command: "logger benjamin-docs session-stop --format claude", user: "keep-stop" };
          const content = cursor
            ? {
                version: 1,
                custom: "keep-file",
                hooks: {
                  sessionStart: [userStart, { command: "benjamin-docs session-start --format wrong", stale: true }],
                  stop: [userStop, { command: `benjamin-docs session-stop --format ${format}`, legacy: true }],
                },
              }
            : {
                custom: "keep-file",
                hooks: {
                  SessionStart: [{
                    matcher: "startup|resume|clear",
                    customGroup: "keep-start-group",
                    hooks: [
                      { type: "command", ...userStart },
                      { type: "command", command: "benjamin-docs session-start --format wrong", stale: true },
                    ],
                  }],
                  Stop: [{
                    customGroup: "keep-stop-group",
                    hooks: [
                      { type: "command", ...userStop },
                      { type: "command", command: `benjamin-docs session-stop --format ${format}`, legacy: true },
                    ],
                  }],
                },
              };
          mkdirSync(join(dir, hookPath, ".."), { recursive: true });
          writeFileSync(join(dir, hookPath), `${JSON.stringify(content, null, 2)}\n`);

          const result = runCliResult(["upgrade"], dir, { BENJAMIN_DOCS_HOME: home });
          const updated = JSON.parse(readFileSync(join(dir, hookPath), "utf8")) as Record<string, unknown>;

          assert.equal(result.status, 0, result.stderr || result.stdout);
          assert.match(JSON.stringify(updated), new RegExp(`benjamin-docs session-start --format ${format}`));
          assert.doesNotMatch(JSON.stringify(updated), /--format wrong|"legacy":true/);
          assert.match(JSON.stringify(updated), /echo benjamin-docs session-start/);
          assert.match(JSON.stringify(updated), /logger benjamin-docs session-stop/);
          assert.equal(updated.custom, "keep-file");
          const serialized = JSON.stringify(updated);
          assert.equal(serialized.match(/"user":"keep-start"/g)?.length, 1);
          assert.equal(serialized.match(/"user":"keep-stop"/g)?.length, 1);
          const hookMap = updated.hooks as Record<string, unknown[]>;
          const preserved = cursor
            ? [...(hookMap.sessionStart ?? []), ...(hookMap.stop ?? [])].filter((entry) => typeof entry === "object" && entry !== null && "user" in entry)
            : [...(hookMap.SessionStart ?? []), ...(hookMap.Stop ?? [])]
                .flatMap((group) => typeof group === "object" && group !== null && Array.isArray((group as { hooks?: unknown }).hooks)
                  ? (group as { hooks: unknown[] }).hooks
                  : [])
                .filter((entry) => typeof entry === "object" && entry !== null && "user" in entry);
          assert.deepEqual(preserved, cursor
            ? [userStart, userStop]
            : [{ type: "command", ...userStart }, { type: "command", ...userStop }]);
        });
      });
    });
  }

  it("fails upgrade when a required skill target cannot be refreshed", () => {
    withTempDir((dir) => {
      withTempDir((home) => {
        runCliResult(["init", "--mode", "codebase", "--no-agent-contract", "--no-hooks"], dir, {
          BENJAMIN_DOCS_HOME: home,
        });
        stripBdVersion(dir);
        mkdirSync(join(home, ".agents/skills/benjamin-docs/SKILL.md"), { recursive: true });

        const result = runCliResult(["upgrade"], dir, { BENJAMIN_DOCS_HOME: home });

        assert.equal(result.status, 1);
        assert.match(result.stderr, /SKILL\.md|directory|EISDIR/i);
        const config = JSON.parse(readFileSync(join(dir, ".benjamin-docs/config.json"), "utf8")) as { bdVersion?: string };
        assert.equal(config.bdVersion, undefined);
      });
    });
  });

  it("keeps an unmarked user AGENTS.md untouched", () => {
    withTempDir((dir) => {
      withTempDir((home) => {
        runCliResult(["init", "--mode", "codebase", "--no-agent-contract"], dir, { BENJAMIN_DOCS_HOME: home });
        writeFileSync(join(dir, "AGENTS.md"), "# My own rules\n\nDo not touch.\n");

        const result = runCliResult(["upgrade"], dir, { BENJAMIN_DOCS_HOME: home });

        assert.match(result.stdout, /no Benjamin-owned AGENTS\.md section found; leaving AGENTS\.md alone/);
        assert.equal(readFileSync(join(dir, "AGENTS.md"), "utf8"), "# My own rules\n\nDo not touch.\n");
      });
    });
  });
});

describe("upgrade hints", () => {
  it("ready shows an advisory upgrade hint for repos initialized before 0.10.0", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase", "--no-agent-contract"], dir);
      stripBdVersion(dir);

      const result = runCliResult(["ready"], dir);
      assert.match(result.stdout, /Upgrade \(advisory\)/);
      assert.match(result.stdout, /benjamin-docs upgrade/);
    });
  });

  it("ready shows no upgrade hint when bdVersion is current", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase", "--no-agent-contract"], dir);

      const result = runCliResult(["ready"], dir);
      assert.doesNotMatch(result.stdout, /Upgrade \(advisory\)/);
    });
  });

  it("session-start reports version skew and cached update availability", () => {
    withTempDir((dir) => {
      withTempDir((home) => {
        runCliResult(["init", "--mode", "codebase", "--no-agent-contract"], dir, { BENJAMIN_DOCS_HOME: home });

        const configPath = join(dir, ".benjamin-docs/config.json");
        const config = JSON.parse(readFileSync(configPath, "utf8")) as Record<string, unknown>;
        config.bdVersion = "0.9.0";
        writeFileSync(configPath, JSON.stringify(config, null, 2));

        seedUpdateCache(home, "99.0.0", new Date().toISOString());

        const result = runCliResult(["session-start"], dir, { BENJAMIN_DOCS_HOME: home, BENJAMIN_DOCS_NO_UPDATE_CHECK: "0" });

        assert.match(result.stdout, /last upgraded at 0\.9\.0/);
        assert.match(result.stdout, /Run: benjamin-docs upgrade/);
        assert.match(result.stdout, /benjamin-docs 99\.0\.0 is available/);
      });
    });
  });

  it("session-start stays quiet about updates when checks are disabled", () => {
    withTempDir((dir) => {
      withTempDir((home) => {
        runCliResult(["init", "--mode", "codebase", "--no-agent-contract"], dir, { BENJAMIN_DOCS_HOME: home });
        seedUpdateCache(home, "99.0.0", new Date().toISOString());

        const result = runCliResult(["session-start"], dir, { BENJAMIN_DOCS_HOME: home });

        assert.doesNotMatch(result.stdout, /99\.0\.0/);
      });
    });
  });
});

describe("update-check helpers", () => {
  it("compares versions numerically", () => {
    assert.equal(compareVersions("0.10.0", "0.9.3"), 1);
    assert.equal(compareVersions("0.9.3", "0.10.0"), -1);
    assert.equal(compareVersions("1.0.0", "1.0.0"), 0);
    assert.equal(compareVersions("v1.2.3", "1.2.2"), 1);
    assert.equal(compareVersions("not-a-version", "1.0.0"), 0);
  });

  it("treats missing, malformed, and old caches as stale", () => {
    const now = Date.parse("2026-07-09T12:00:00Z");
    assert.equal(isUpdateCacheStale(undefined, now), true);
    assert.equal(isUpdateCacheStale({ lastChecked: "not-a-date", latest: "1.0.0" }, now), true);
    assert.equal(isUpdateCacheStale({ lastChecked: "2026-07-01T12:00:00Z", latest: "1.0.0" }, now), true);
    assert.equal(isUpdateCacheStale({ lastChecked: "2026-07-09T11:00:00Z", latest: "1.0.0" }, now), false);
  });
});
