import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { rootPath } from "../src/fsx.js";
import { withTempDir } from "./helpers.js";

describe("filesystem helpers", () => {
  it("resolves relative paths inside the root", () => {
    withTempDir((dir) => {
      assert.equal(rootPath(dir, "docs", "project", "brief.md"), resolve(dir, "docs", "project", "brief.md"));
    });
  });

  it("rejects traversal outside the root", () => {
    withTempDir((dir) => {
      assert.throws(() => rootPath(dir, "..", "outside.md"), /outside root/);
    });
  });

  it("rejects absolute user path segments", () => {
    withTempDir((dir) => {
      assert.throws(() => rootPath(dir, "/tmp/outside.md"), /absolute path/);
    });
  });
});
