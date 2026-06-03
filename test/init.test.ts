import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { withTempDir, runCli } from "./helpers.js";

describe("init", () => {
  it("creates docs and metadata in an empty planning repo", () => {
    withTempDir((dir) => {
      const output = runCli(["init"], dir);

      assert.match(output, /Initialized agent-docs/);
      assert.equal(existsSync(join(dir, "docs/project/brief.md")), true);
      assert.equal(existsSync(join(dir, "docs/handoff/agent-brief.md")), true);
      assert.equal(existsSync(join(dir, ".agent-docs/config.json")), true);
      assert.equal(existsSync(join(dir, ".agent-docs/manifest.json")), true);
      assert.equal(existsSync(join(dir, ".agent-docs/scopes.json")), true);
      assert.equal(existsSync(join(dir, ".agent-docs/anchors.json")), true);
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
});
