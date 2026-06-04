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
      assert.equal(existsSync(join(dir, "benjamin-docs/project/brief.md")), true);
      assert.equal(existsSync(join(dir, "benjamin-docs/handoff/agent-brief.md")), true);
      assert.equal(existsSync(join(dir, "benjamin-docs/engineering/architecture.md")), true);
      assert.equal(existsSync(join(dir, "benjamin-docs/features/index.md")), true);
      assert.equal(existsSync(join(dir, "benjamin-docs/releases/changelog.md")), true);
      assert.equal(existsSync(join(dir, ".benjamin-docs/config.json")), true);
      assert.equal(existsSync(join(dir, ".benjamin-docs/manifest.json")), true);
      assert.equal(existsSync(join(dir, ".benjamin-docs/scopes.json")), true);
      assert.equal(existsSync(join(dir, ".benjamin-docs/anchors.json")), true);
      assert.match(readFileSync(join(dir, ".benjamin-docs/config.json"), "utf8"), /"docsRoot": "benjamin-docs"/);
      assert.match(output, /Next, ask your agent:/);
      assert.match(output, /Use plain language/);
    });
  });

  it("does not overwrite an existing project brief", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      const briefPath = join(dir, "benjamin-docs/project/brief.md");
      const before = readFileSync(briefPath, "utf8");

      runCli(["init"], dir);
      const after = readFileSync(briefPath, "utf8");

      assert.equal(after, before);
    });
  });

  it("initializes codebase focus from flags", () => {
    withTempDir((dir) => {
      const output = runCli(["init", "--mode", "codebase"], dir);
      const config = readFileSync(join(dir, ".benjamin-docs/config.json"), "utf8");

      assert.match(config, /"mode": "codebase"/);
      assert.match(config, /"focus": "codebase"/);
      assert.match(output, /Capture the current project baseline/);
      assert.match(output, /benjamin-docs\/engineering\/architecture\.md/);
      assert.match(output, /understandable for non-technical readers/);
    });
  });

  it("initializes feature focus from flags", () => {
    withTempDir((dir) => {
      const output = runCli(["init", "--mode", "feature", "--feature", "billing-reminders"], dir);
      const config = readFileSync(join(dir, ".benjamin-docs/config.json"), "utf8");

      assert.match(config, /"focus": "feature"/);
      assert.match(config, /"feature": "billing-reminders"/);
      assert.equal(existsSync(join(dir, "benjamin-docs/features/billing-reminders/brief.md")), true);
      assert.match(output, /Capture the billing-reminders feature/);
      assert.match(output, /understandable for non-technical readers/);
    });
  });

  it("rejects a symlinked docs root during init", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "benjamin-docs-outside-"));
      try {
        symlinkSync(outsideDir, join(dir, "benjamin-docs"), "dir");

        const result = runCliResult(["init"], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /Generated output path must not be a symlink: benjamin-docs/);
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
