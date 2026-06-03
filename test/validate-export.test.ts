import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli, runCliResult, withTempDir } from "./helpers.js";

describe("validate", () => {
  it("passes for a freshly initialized project", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);

      const result = runCliResult(["validate"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stdout, /Validation passed/);
      assert.equal(result.stderr, "");
    });
  });

  it("reports missing docs", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      rmSync(join(dir, "docs/project/brief.md"));

      const result = runCliResult(["validate"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /docs\/project\/brief\.md/);
    });
  });

  it("reports markdown docs without valid frontmatter", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      writeFileSync(join(dir, "docs/project/brief.md"), "# Project Brief\n\nMissing metadata.\n", "utf8");

      const result = runCliResult(["validate"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /docs\/project\/brief\.md: Markdown file is missing frontmatter/);
    });
  });

  it("reports broken relative markdown links", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      const briefPath = join(dir, "docs/project/brief.md");
      const brief = readFileSync(briefPath, "utf8");
      writeFileSync(briefPath, `${brief}\nSee [missing notes](missing-notes.md).\n`, "utf8");

      const result = runCliResult(["validate"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /docs\/project\/brief\.md: broken link missing-notes\.md/);
    });
  });

  it("warns without failing when docs is empty", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      rmSync(join(dir, "docs"), { recursive: true, force: true });
      mkdirSync(join(dir, "docs"));
      writeFileSync(join(dir, ".agent-docs/manifest.json"), JSON.stringify({ version: 1, docs: [] }, null, 2), "utf8");
      writeFileSync(join(dir, ".agent-docs/scopes.json"), JSON.stringify({ version: 1, scopes: [] }, null, 2), "utf8");

      const result = runCliResult(["validate"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stderr, /Warning: No Markdown docs found under docs\//);
      assert.match(result.stdout, /Validation passed/);
    });
  });

  it("reports anchor files that resolve outside the project root", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "agent-docs-outside-"));
      try {
        runCli(["init"], dir);
        writeFileSync(join(outsideDir, "secret.ts"), "export const secret = true;\n", "utf8");
        symlinkSync(join(outsideDir, "secret.ts"), join(dir, "secret-link.ts"), "file");
        writeFileSync(
          join(dir, ".agent-docs/anchors.json"),
          JSON.stringify(
            {
              version: 1,
              anchors: {
                secret: {
                  file: "secret-link.ts",
                  docs: ["docs/project/brief.md"],
                },
              },
            },
            null,
            2,
          ),
          "utf8",
        );

        const result = runCliResult(["validate"], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /Anchor secret file must remain inside project root: secret-link\.ts/);
      } finally {
        rmSync(outsideDir, { recursive: true, force: true });
      }
    });
  });
});
