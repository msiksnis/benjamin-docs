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
