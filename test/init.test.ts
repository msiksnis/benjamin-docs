import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { withTempDir, runCli, runCliResult } from "./helpers.js";

describe("init", () => {
  it("creates docs and metadata in an empty planning repo", () => {
    withTempDir((dir) => {
      const output = runCli(["init"], dir);

      assert.match(output, /Initialized benjamin-docs/);
      assert.equal(existsSync(join(dir, "docs/project/brief.md")), true);
      assert.equal(existsSync(join(dir, "docs/handoff/agent-brief.md")), true);
      assert.equal(existsSync(join(dir, ".benjamin-docs/config.json")), true);
      assert.equal(existsSync(join(dir, ".benjamin-docs/manifest.json")), true);
      assert.equal(existsSync(join(dir, ".benjamin-docs/scopes.json")), true);
      assert.equal(existsSync(join(dir, ".benjamin-docs/anchors.json")), true);
    });
  });

  it("does not overwrite an existing project brief", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      const briefPath = join(dir, "docs/project/brief.md");
      const before = readFileSync(briefPath, "utf8");

      runCli(["init"], dir);
      const after = readFileSync(briefPath, "utf8");

      assert.equal(after, before);
    });
  });

  it("rejects a symlinked docs directory during init", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "benjamin-docs-outside-"));
      try {
        symlinkSync(outsideDir, join(dir, "docs"), "dir");

        const result = runCliResult(["init"], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /Generated output path must not be a symlink: docs/);
        assert.equal(existsSync(join(outsideDir, "project/brief.md")), false);
      } finally {
        rmSync(outsideDir, { recursive: true, force: true });
      }
    });
  });

  it("rejects a symlinked metadata directory during init", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "benjamin-docs-outside-"));
      try {
        symlinkSync(outsideDir, join(dir, ".benjamin-docs"), "dir");

        const result = runCliResult(["init"], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /Metadata path must not be a symlink: \.benjamin-docs/);
        assert.equal(existsSync(join(outsideDir, "config.json")), false);
      } finally {
        rmSync(outsideDir, { recursive: true, force: true });
      }
    });
  });
});
