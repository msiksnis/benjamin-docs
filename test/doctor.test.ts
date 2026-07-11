import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runCliResult, withTempDir } from "./helpers.js";

describe("doctor", () => {
  it("reports missing skills and an uninitialized project without failing", () => {
    withTempDir((dir) => {
      const result = runCliResult(["doctor"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 0);
      const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as { version: string };
      assert.match(result.stdout, /benjamin-docs doctor/);
      assert.match(result.stdout, new RegExp(`version: ${pkg.version.replaceAll(".", "\\.")}`));
      assert.match(result.stdout, /missing\s+Codex/);
      assert.match(result.stdout, /status: not initialized/);
      assert.match(result.stdout, /Fix\n  benjamin-docs install-skill/);
      assert.match(result.stdout, /Claude Desktop/);
      assert.match(result.stdout, /upload zip: missing ~\/Downloads\/benjamin-docs-skill\.zip/);
      assert.match(result.stdout, /Claude Desktop fix\n  benjamin-docs package-skill/);
      assert.doesNotMatch(result.stdout, /\nNext\n/);
    });
  });

  it("reports installed skills and a valid initialized project", () => {
    withTempDir((dir) => {
      runCliResult(["install-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["init", "--mode", "codebase"], dir);

      const result = runCliResult(["doctor"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 0);
      assert.match(result.stdout, /ok\s+Shared Agent Skills/);
      assert.match(result.stdout, /ok\s+Claude Code/);
      assert.match(result.stdout, /status: initialized/);
      assert.match(result.stdout, /mode: codebase/);
      assert.match(result.stdout, /docs root: benjamin-docs\//);
      assert.match(result.stdout, /validation: passed/);
      assert.doesNotMatch(result.stdout, /Fix\n/);
      assert.match(result.stdout, /Claude Desktop fix\n  benjamin-docs package-skill/);
    });
  });

  it("reports stale skills without failing", () => {
    withTempDir((dir) => {
      const stalePath = join(dir, ".codex/skills/benjamin-docs/SKILL.md");
      mkdirSync(join(dir, ".codex/skills/benjamin-docs"), { recursive: true });
      writeFileSync(stalePath, "old skill\n", "utf8");

      const result = runCliResult(["doctor"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 0);
      assert.match(result.stdout, /stale\s+Codex/);
      assert.match(result.stdout, /Fix\n  benjamin-docs install-skill/);
    });
  });

  it("fails when an initialized project does not validate", () => {
    withTempDir((dir) => {
      runCliResult(["init"], dir);
      rmSync(join(dir, "benjamin-docs/project/brief.md"));

      const result = runCliResult(["doctor"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 1);
      assert.match(result.stdout, /status: initialized/);
      assert.match(result.stdout, /validation: failed/);
      assert.match(result.stdout, /Errors/);
    });
  });

  it("strict mode fails on setup gaps", () => {
    withTempDir((dir) => {
      const result = runCliResult(["doctor", "--strict"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 1);
      assert.match(result.stdout, /benjamin-docs doctor --strict/);
      assert.match(result.stdout, /Strict\n  - Project is not initialized/);
      assert.doesNotMatch(result.stdout, /\nSkills\n/);
      assert.doesNotMatch(result.stdout, /Shared Agent Skills|Claude Code|Codex|Cursor|Claude Desktop|upload zip:/);
      assert.doesNotMatch(result.stdout, /\nFix\n|\nClaude Desktop fix\n/);
    });
  });

  it("strict mode passes when setup and validation are clean", () => {
    withTempDir((dir) => {
      runCliResult(["install-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["package-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["init", "--mode", "codebase"], dir);

      const result = runCliResult(["doctor", "--strict"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 0);
      assert.match(result.stdout, /benjamin-docs doctor --strict/);
      assert.doesNotMatch(result.stdout, /Strict\n/);
      assert.doesNotMatch(result.stdout, /\nSkills\n|Shared Agent Skills|Claude Code|Codex|Cursor|Claude Desktop|upload zip:/);
      assert.doesNotMatch(result.stdout, /\nFix\n|\nClaude Desktop fix\n/);
    });
  });

  it("repository-only strict mode never reads unreadable integration state", { skip: process.platform === "win32" }, () => {
    withTempDir((dir) => {
      withTempDir((unreadableHome) => {
        runCliResult(["init", "--mode", "codebase"], dir);
        chmodSync(unreadableHome, 0o000);
        try {
          const result = runCliResult(["doctor", "--strict"], dir, { BENJAMIN_DOCS_HOME: unreadableHome });

          assert.equal(result.status, 0, result.stderr);
          assert.match(result.stdout, /validation: passed/);
          assert.doesNotMatch(result.stdout, /Skills|Claude Desktop|upload zip|session hook/);
        } finally {
          chmodSync(unreadableHome, 0o700);
        }
      });
    });
  });

  it("strict mode isolates Codex requirements from other targets", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);

      const result = runCliResult(["doctor", "--strict", "--target", "codex"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 1);
      assert.match(result.stdout, /\nCodex\n/);
      assert.match(result.stdout, /skill: missing/);
      assert.match(result.stdout, /session hook: not installed/);
      assert.match(result.stdout, /Strict\n  - Codex skill is missing/);
      assert.match(result.stdout, /install-skill --target codex/);
      assert.match(result.stdout, /hooks install --target codex/);
      assert.doesNotMatch(result.stdout, /\nSkills\n|Shared Agent Skills|Claude Code|Cursor|Claude Desktop|upload zip:/);
      assert.doesNotMatch(result.stdout, /\nFix\n|\nClaude Desktop fix\n|package-skill/);
    });
  });

  it("strict target mode rejects a legacy stop-only hook and reports it separately", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);
      runCliResult(["install-skill", "--target", "codex"], dir, { BENJAMIN_DOCS_HOME: dir });
      mkdirSync(join(dir, ".codex"), { recursive: true });
      writeFileSync(
        join(dir, ".codex/hooks.json"),
        `${JSON.stringify({ hooks: { Stop: [{ hooks: [{ type: "command", command: "benjamin-docs session-stop --format codex" }] }] } }, null, 2)}\n`,
      );

      const result = runCliResult(["doctor", "--strict", "--target", "codex"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 1);
      assert.match(result.stdout, /session hook: not installed/);
      assert.match(result.stdout, /legacy Benjamin stop hook detected/i);
      assert.match(result.stdout, /benjamin-docs hooks install --target codex/);
    });
  });

  it("strict target mode requires the exact session-start format command", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);
      runCliResult(["install-skill", "--target", "codex"], dir, { BENJAMIN_DOCS_HOME: dir });
      mkdirSync(join(dir, ".codex"), { recursive: true });
      writeFileSync(
        join(dir, ".codex/hooks.json"),
        `${JSON.stringify({ hooks: { SessionStart: [{ hooks: [{ type: "command", command: "benjamin-docs session-start --format claude" }] }] } }, null, 2)}\n`,
      );

      const result = runCliResult(["doctor", "--strict", "--target", "codex"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 1);
      assert.match(result.stdout, /session hook: not installed/);
      assert.doesNotMatch(result.stdout, /legacy Benjamin stop hook detected/i);
    });
  });

  for (const target of ["claude-code", "codex"] as const) {
    const hookPath = target === "codex" ? ".codex/hooks.json" : ".claude/settings.json";
    const format = target === "codex" ? "codex" : "claude";

    for (const malformedShape of ["wrong matcher", "command on group"] as const) {
      it(`repairs ${malformedShape} ${target} session hooks without deleting user data`, () => {
        withTempDir((dir) => {
          runCliResult(["init", "--mode", "codebase"], dir);
          runCliResult(["install-skill", "--target", target], dir, { BENJAMIN_DOCS_HOME: dir });
          mkdirSync(join(dir, hookPath, ".."), { recursive: true });

          const expectedCommand = `benjamin-docs session-start --format ${format}`;
          const userGroup = {
            matcher: "user-event",
            customField: "preserve-user-group",
            hooks: [{ type: "command", command: "echo user-start", timeout: 7 }],
          };
          const staleBenjaminGroup = malformedShape === "wrong matcher"
            ? {
                matcher: "never-match",
                customField: "preserve-mixed-group",
                hooks: [
                  { type: "command", command: "echo mixed-user-start", timeout: 9 },
                  { type: "command", command: expectedCommand },
                ],
              }
            : {
                matcher: "startup|resume|clear",
                command: expectedCommand,
                customField: "malformed-direct-command",
              };
          writeFileSync(
            join(dir, hookPath),
            `${JSON.stringify({
              permissions: { allow: ["Bash(git status:*)"] },
              hooks: {
                SessionStart: [
                  userGroup,
                  staleBenjaminGroup,
                  ...(malformedShape === "wrong matcher"
                    ? [{ matcher: "startup|resume|clear", hooks: [{ type: "command", command: expectedCommand }] }]
                    : []),
                ],
              },
            }, null, 2)}\n`,
          );

          const unhealthy = runCliResult(["doctor", "--strict", "--target", target], dir, { BENJAMIN_DOCS_HOME: dir });
          assert.equal(unhealthy.status, 1);
          assert.match(unhealthy.stdout, /session hook: not installed/);

          const install = runCliResult(["hooks", "install", "--target", target], dir);
          assert.equal(install.status, 0);
          assert.match(install.stdout, /repaired\s+(Claude Code|Codex CLI)/);
          assert.doesNotMatch(install.stdout, /already installed/);

          const repaired = JSON.parse(readFileSync(join(dir, hookPath), "utf8")) as {
            permissions: { allow: string[] };
            hooks: { SessionStart: Array<Record<string, unknown>> };
          };
          assert.deepEqual(repaired.permissions.allow, ["Bash(git status:*)"]);
          assert.deepEqual(repaired.hooks.SessionStart[0], userGroup);
          if (malformedShape === "wrong matcher") {
            assert.deepEqual(repaired.hooks.SessionStart[1], {
              matcher: "never-match",
              customField: "preserve-mixed-group",
              hooks: [{ type: "command", command: "echo mixed-user-start", timeout: 9 }],
            });
          } else {
            assert.deepEqual(repaired.hooks.SessionStart[1], {
              matcher: "startup|resume|clear",
              customField: "malformed-direct-command",
            });
            assert.equal((repaired.hooks.SessionStart[1] as Record<string, unknown>).command, undefined);
          }
          assert.ok(repaired.hooks.SessionStart.some((group) =>
            group.matcher === "startup|resume|clear"
            && Array.isArray(group.hooks)
            && group.hooks.some((entry) =>
              typeof entry === "object"
              && entry !== null
              && (entry as Record<string, unknown>).type === "command"
              && (entry as Record<string, unknown>).command === expectedCommand),
          ));

          const healthy = runCliResult(["doctor", "--strict", "--target", target], dir, { BENJAMIN_DOCS_HOME: dir });
          assert.equal(healthy.status, 0, healthy.stdout);
          assert.match(healthy.stdout, /session hook: installed/);

          const again = runCliResult(["hooks", "install", "--target", target], dir);
          assert.equal(again.status, 0);
          assert.match(again.stdout, /already installed\s+(Claude Code|Codex CLI)/);
        });
      });
    }

    it(`repairs a direct ${target} command without deleting mixed group data`, () => {
      withTempDir((dir) => {
        runCliResult(["init", "--mode", "codebase"], dir);
        runCliResult(["install-skill", "--target", target], dir, { BENJAMIN_DOCS_HOME: dir });
        mkdirSync(join(dir, hookPath, ".."), { recursive: true });

        const expectedCommand = `benjamin-docs session-start --format ${format}`;
        const staleCommand = `${expectedCommand} --stale`;
        const mixedGroup = {
          matcher: "startup|resume|clear",
          command: staleCommand,
          timeout: 23,
          customField: "preserve-mixed-group",
          other: { owner: "user", enabled: true },
          hooks: [
            { type: "command", command: "echo user-owned", timeout: 17, customField: "preserve-user-entry" },
          ],
        };
        const mixedGroupWithValidBenjaminEntry = {
          matcher: "startup|resume|clear",
          command: staleCommand,
          timeout: 31,
          customField: "preserve-group-with-valid-entry",
          other: ["user", "data"],
          hooks: [
            { type: "command", command: "echo second-user-owned", timeout: 19 },
            { type: "command", command: expectedCommand },
          ],
        };
        const unrelatedEmptyGroup = { matcher: "user-empty", hooks: [] };
        writeFileSync(
          join(dir, hookPath),
          `${JSON.stringify({ hooks: { SessionStart: [mixedGroup, mixedGroupWithValidBenjaminEntry, unrelatedEmptyGroup] } }, null, 2)}\n`,
        );

        const unhealthy = runCliResult(["doctor", "--strict", "--target", target], dir, { BENJAMIN_DOCS_HOME: dir });
        assert.equal(unhealthy.status, 1);
        assert.match(unhealthy.stdout, /session hook: not installed/);

        const install = runCliResult(["hooks", "install", "--target", target], dir);
        assert.equal(install.status, 0);
        assert.match(install.stdout, /repaired\s+(Claude Code|Codex CLI)/);

        const repaired = JSON.parse(readFileSync(join(dir, hookPath), "utf8")) as {
          hooks: { SessionStart: Array<Record<string, unknown>> };
        };
        assert.deepEqual(repaired.hooks.SessionStart, [
          {
            matcher: "startup|resume|clear",
            timeout: 23,
            customField: "preserve-mixed-group",
            other: { owner: "user", enabled: true },
            hooks: [
              { type: "command", command: "echo user-owned", timeout: 17, customField: "preserve-user-entry" },
            ],
          },
          {
            matcher: "startup|resume|clear",
            timeout: 31,
            customField: "preserve-group-with-valid-entry",
            other: ["user", "data"],
            hooks: [
              { type: "command", command: "echo second-user-owned", timeout: 19 },
              { type: "command", command: expectedCommand },
            ],
          },
          unrelatedEmptyGroup,
        ]);
        assert.doesNotMatch(JSON.stringify(repaired), /--stale/);
        assert.equal(JSON.stringify(repaired).match(new RegExp(expectedCommand, "g"))?.length, 1);

        const healthy = runCliResult(["doctor", "--strict", "--target", target], dir, { BENJAMIN_DOCS_HOME: dir });
        assert.equal(healthy.status, 0, healthy.stdout);
        assert.match(healthy.stdout, /session hook: installed/);

        const beforeSecondInstall = readFileSync(join(dir, hookPath), "utf8");
        const again = runCliResult(["hooks", "install", "--target", target], dir);
        assert.equal(again.status, 0);
        assert.match(again.stdout, /already installed\s+(Claude Code|Codex CLI)/);
        assert.equal(readFileSync(join(dir, hookPath), "utf8"), beforeSecondInstall);
      });
    });
  }

  for (const target of ["claude-code", "codex", "cursor"] as const) {
    it(`repairs wrong-format and legacy-stop ${target} hooks through diagnose, install, diagnose`, () => {
      withTempDir((dir) => {
        runCliResult(["init", "--mode", "codebase"], dir);
        runCliResult(["install-skill", "--target", target], dir, { BENJAMIN_DOCS_HOME: dir });

        const isCursor = target === "cursor";
        const hookPath = isCursor ? ".cursor/hooks.json" : target === "codex" ? ".codex/hooks.json" : ".claude/settings.json";
        const wrongFormat = target === "codex" ? "claude" : target === "cursor" ? "claude" : "codex";
        const expectedFormat = target === "codex" ? "codex" : target === "cursor" ? "cursor" : "claude";
        const content = isCursor
          ? {
              version: 1,
              hooks: {
                sessionStart: [
                  { command: "echo user-start", customField: "keep-user-entry" },
                  { command: `benjamin-docs session-start --format ${wrongFormat}`, customField: "remove-stale-entry" },
                ],
                stop: [
                  { command: "echo user-stop", customField: "keep-user-stop" },
                  { command: "benjamin-docs session-stop --format cursor", customField: "remove-legacy-stop" },
                ],
              },
            }
          : {
              hooks: {
                SessionStart: [{
                  matcher: "startup|resume|clear",
                  customField: "keep-group",
                  hooks: [
                    { type: "command", command: "echo user-start", timeout: 5 },
                    { type: "command", command: `benjamin-docs session-start --format ${wrongFormat}`, timeout: 10 },
                  ],
                }],
                Stop: [{
                  matcher: "user-stop",
                  customField: "keep-stop-group",
                  hooks: [
                    { type: "command", command: "echo user-stop" },
                    { type: "command", command: `benjamin-docs session-stop --format ${target === "codex" ? "codex" : "claude"}` },
                  ],
                }],
              },
            };
        mkdirSync(join(dir, hookPath, ".."), { recursive: true });
        writeFileSync(join(dir, hookPath), `${JSON.stringify(content, null, 2)}\n`);

        const unhealthy = runCliResult(["doctor", "--strict", "--target", target], dir, { BENJAMIN_DOCS_HOME: dir });
        assert.equal(unhealthy.status, 1);
        assert.match(unhealthy.stdout, /session hook: not installed/);
        assert.match(unhealthy.stdout, /legacy Benjamin stop hook detected/i);

        const install = runCliResult(["hooks", "install", "--target", target], dir);
        assert.equal(install.status, 0);
        assert.match(install.stdout, /repaired\s+(Claude Code|Codex CLI|Cursor)/);
        assert.doesNotMatch(install.stdout, /already installed/);

        const repairedText = readFileSync(join(dir, hookPath), "utf8");
        assert.match(repairedText, /echo user-start/);
        assert.match(repairedText, /echo user-stop/);
        assert.match(repairedText, new RegExp(`benjamin-docs session-start --format ${expectedFormat}`));
        assert.doesNotMatch(repairedText, new RegExp(`benjamin-docs session-start --format ${wrongFormat}`));
        assert.doesNotMatch(repairedText, /benjamin-docs session-stop/);
        assert.match(repairedText, isCursor ? /keep-user-entry/ : /keep-group/);

        const healthy = runCliResult(["doctor", "--strict", "--target", target], dir, { BENJAMIN_DOCS_HOME: dir });
        assert.equal(healthy.status, 0, healthy.stdout);
        assert.match(healthy.stdout, /session hook: installed/);
      });
    });
  }

  it("strict mode isolates Claude Desktop to the upload zip", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);

      const result = runCliResult(["doctor", "--strict", "--target", "claude-desktop"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 1);
      assert.match(result.stdout, /\nClaude Desktop\n/);
      assert.match(result.stdout, /upload zip: missing/);
      assert.match(result.stdout, /Strict\n  - Claude Desktop upload zip is missing/);
      assert.match(result.stdout, /package-skill/);
      assert.doesNotMatch(result.stdout, /\nSkills\n|Shared Agent Skills|Claude Code|Codex|Cursor/);
      assert.doesNotMatch(result.stdout, /\nFix\n|\nClaude Desktop fix\n|install-skill/);
    });
  });

  it("passes a Codex target when only its skill and hook are installed", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);
      runCliResult(["install-skill", "--target", "codex"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["hooks", "install", "--target", "codex"], dir);

      const result = runCliResult(["doctor", "--strict", "--target", "codex"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 0, result.stdout);
      assert.match(result.stdout, /\nCodex\n/);
      assert.match(result.stdout, /skill: ok/);
      assert.match(result.stdout, /session hook: installed/);
      assert.doesNotMatch(result.stdout, /Strict\n/);
      assert.doesNotMatch(result.stdout, /\nSkills\n|Shared Agent Skills|Claude Code|Cursor|Claude Desktop|upload zip:/);
    });
  });

  it("passes a Claude Desktop target when only its upload zip exists", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);
      runCliResult(["package-skill"], dir, { BENJAMIN_DOCS_HOME: dir });

      const result = runCliResult(["doctor", "--strict", "--target", "claude-desktop"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 0, result.stdout);
      assert.match(result.stdout, /\nClaude Desktop\n/);
      assert.match(result.stdout, /upload zip: ok/);
      assert.doesNotMatch(result.stdout, /Strict\n/);
      assert.doesNotMatch(result.stdout, /\nSkills\n|Shared Agent Skills|Claude Code|Codex|Cursor/);
    });
  });

  it("rejects unknown doctor targets with the exact allowed-value usage", () => {
    withTempDir((dir) => {
      const result = runCliResult(["doctor", "--strict", "--target", "windsurf"], dir);

      assert.equal(result.status, 1);
      assert.equal(result.stderr, "benjamin-docs doctor [--strict] [--target shared|claude-code|codex|cursor|claude-desktop]\n");
    });
  });

  it("rejects a missing doctor target with the exact allowed-value usage", () => {
    withTempDir((dir) => {
      const result = runCliResult(["doctor", "--target"], dir);

      assert.equal(result.status, 1);
      assert.equal(result.stderr, "benjamin-docs doctor [--strict] [--target shared|claude-code|codex|cursor|claude-desktop]\n");
    });
  });
});
