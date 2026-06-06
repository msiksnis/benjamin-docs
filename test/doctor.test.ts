import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
      assert.match(result.stdout, /Strict/);
      assert.match(result.stdout, /install-skill/);
      assert.match(result.stdout, /package-skill/);
      assert.match(result.stdout, /Project is not initialized/);
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
    });
  });
});
