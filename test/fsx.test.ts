import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { removeGeneratedFile, rootPath, writeGeneratedTextAtomically } from "../src/fsx.js";
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

  it("preserves the original file when atomic replacement fails after a partial temporary write", () => {
    withTempDir((dir) => {
      const relativePath = ".claude/settings.json";
      const fullPath = join(dir, relativePath);
      mkdirSync(join(dir, ".claude"), { recursive: true });
      writeFileSync(fullPath, "original settings\n", "utf8");

      assert.throws(
        () => writeGeneratedTextAtomically(dir, relativePath, "replacement settings\n", "Agent hook path", {
          expectedState: { text: "original settings\n" },
          writeTempFile(tempPath) {
            writeFileSync(tempPath, "partial", "utf8");
            throw new Error("simulated ENOSPC");
          },
        }),
        /simulated ENOSPC/,
      );

      assert.equal(readFileSync(fullPath, "utf8"), "original settings\n");
      assert.deepEqual(readdirSync(join(dir, ".claude")), ["settings.json"]);
    });
  });

  it("preserves the primary replacement error when temporary-file cleanup also fails", () => {
    withTempDir((dir) => {
      const relativePath = ".claude/settings.json";
      const fullPath = join(dir, relativePath);
      const replacementError = Object.freeze(new Error("simulated rename failure"));
      const cleanupError = new Error("simulated cleanup failure");
      mkdirSync(join(dir, ".claude"), { recursive: true });
      writeFileSync(fullPath, "original settings\n", "utf8");

      let caught: unknown;
      try {
        writeGeneratedTextAtomically(dir, relativePath, "replacement settings\n", "Agent hook path", {
          expectedState: { text: "original settings\n" },
          replaceFile() {
            throw replacementError;
          },
          removeTempFile() {
            throw cleanupError;
          },
        });
      } catch (error) {
        caught = error;
      }

      assert.equal(caught, replacementError);
      assert.equal(readFileSync(fullPath, "utf8"), "original settings\n");
    });
  });

  it("preserves a newer edit observed at the final pre-rename check", () => {
    withTempDir((dir) => {
      const relativePath = ".claude/settings.json";
      const fullPath = join(dir, relativePath);
      mkdirSync(join(dir, ".claude"), { recursive: true });
      writeFileSync(fullPath, "settings read by Benjamin Docs\n", "utf8");

      assert.throws(
        () => writeGeneratedTextAtomically(dir, relativePath, "Benjamin Docs replacement\n", "Agent hook path", {
          expectedState: { text: "settings read by Benjamin Docs\n" },
          beforeRename({ targetPath }) {
            writeFileSync(targetPath, "newer user settings\n", "utf8");
          },
        }),
        /changed while it was being updated/,
      );

      assert.equal(readFileSync(fullPath, "utf8"), "newer user settings\n");
      assert.deepEqual(readdirSync(join(dir, ".claude")), ["settings.json"]);
    });
  });

  it("preserves a newer edit observed at the final pre-delete check", () => {
    withTempDir((dir) => {
      const relativePath = ".codex/hooks.json";
      const fullPath = join(dir, relativePath);
      mkdirSync(join(dir, ".codex"), { recursive: true });
      writeFileSync(fullPath, "hook file read by Benjamin Docs\n", "utf8");

      assert.throws(
        () => removeGeneratedFile(dir, relativePath, "Agent hook path", {
          expectedState: { text: "hook file read by Benjamin Docs\n" },
          beforeRemove({ targetPath }) {
            writeFileSync(targetPath, "newer user hook settings\n", "utf8");
          },
        }),
        /changed while it was being updated/,
      );

      assert.equal(readFileSync(fullPath, "utf8"), "newer user hook settings\n");
    });
  });

  it("preserves the existing file mode during atomic replacement", { skip: process.platform === "win32" }, () => {
    withTempDir((dir) => {
      const relativePath = ".codex/hooks.json";
      const fullPath = join(dir, relativePath);
      mkdirSync(join(dir, ".codex"), { recursive: true });
      writeFileSync(fullPath, "old\n", "utf8");
      chmodSync(fullPath, 0o640);
      const before = statSync(fullPath);

      writeGeneratedTextAtomically(dir, relativePath, "new\n", "Agent hook path");

      const after = statSync(fullPath);
      assert.equal(readFileSync(fullPath, "utf8"), "new\n");
      assert.equal(after.mode & 0o777, 0o640);
      assert.equal(after.uid, before.uid);
      assert.equal(after.gid, before.gid);
    });
  });
});
