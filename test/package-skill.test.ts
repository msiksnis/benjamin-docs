import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { inflateRawSync } from "node:zlib";
import { packageSkill, SKILL_ZIP_NAME } from "../src/package-skill.js";
import { runCli, runCliResult, withTempDir } from "./helpers.js";

describe("package-skill", () => {
  it("creates a Claude upload zip in Downloads by default", () => {
    withTempDir((home) => {
      const result = packageSkill({ homeDir: home });
      const zipPath = join(home, "Downloads", SKILL_ZIP_NAME);

      assert.equal(result.zipPath, zipPath);
      assert.equal(existsSync(zipPath), true);

      const entries = readZipEntries(zipPath);
      assert.deepEqual(Object.keys(entries).sort(), ["benjamin-docs/", "benjamin-docs/SKILL.md"]);
      assert.match(entries["benjamin-docs/SKILL.md"]?.toString("utf8") ?? "", /^name: benjamin-docs/m);
    });
  });

  it("supports an output directory", () => {
    withTempDir((dir) => {
      const output = runCli(["package-skill", "--out", "packages"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.match(output, /Packaged benjamin-docs skill/);
      assert.match(output, /packages\/benjamin-docs-skill\.zip/);
      assert.equal(existsSync(join(dir, "packages", SKILL_ZIP_NAME)), true);
    });
  });

  it("supports an explicit output file", () => {
    withTempDir((dir) => {
      const output = runCli(["package-skill", "--out", "skill.zip"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.match(output, /skill\.zip/);
      assert.equal(existsSync(join(dir, "skill.zip")), true);
    });
  });

  it("explains how to recover when the output path is not writable", { skip: process.platform === "win32" }, () => {
    withTempDir((dir) => {
      const locked = join(dir, "locked");
      mkdirSync(locked);
      chmodSync(locked, 0o500);

      try {
        const result = runCliResult(["package-skill", "--out", join(locked, "skill.zip")], dir, { BENJAMIN_DOCS_HOME: dir });

        assert.equal(result.status, 1);
        assert.match(result.stderr, /Cannot write Claude skill zip to/);
        assert.match(result.stderr, /benjamin-docs package-skill --out \.\/benjamin-docs-skill\.zip/);
      } finally {
        chmodSync(locked, 0o700);
      }
    });
  });
});

function readZipEntries(path: string): Record<string, Buffer> {
  const zip = readFileSync(path);
  const entries: Record<string, Buffer> = {};
  let offset = 0;

  while (zip.readUInt32LE(offset) === 0x04034b50) {
    const method = zip.readUInt16LE(offset + 8);
    const compressedSize = zip.readUInt32LE(offset + 18);
    const fileNameLength = zip.readUInt16LE(offset + 26);
    const extraLength = zip.readUInt16LE(offset + 28);
    const fileNameStart = offset + 30;
    const dataStart = fileNameStart + fileNameLength + extraLength;
    const fileName = zip.subarray(fileNameStart, fileNameStart + fileNameLength).toString("utf8");
    const compressed = zip.subarray(dataStart, dataStart + compressedSize);

    entries[fileName] = method === 8 ? inflateRawSync(compressed) : compressed;
    offset = dataStart + compressedSize;
  }

  return entries;
}
