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

  it("reports markdown links to symlinks that resolve outside the project root", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "agent-docs-outside-"));
      try {
        runCli(["init"], dir);
        writeFileSync(join(outsideDir, "outside.md"), "# Outside\n", "utf8");
        symlinkSync(join(outsideDir, "outside.md"), join(dir, "docs/project/outside-link.md"), "file");

        const briefPath = join(dir, "docs/project/brief.md");
        const brief = readFileSync(briefPath, "utf8");
        writeFileSync(briefPath, `${brief}\nSee [outside](outside-link.md).\n`, "utf8");

        const result = runCliResult(["validate"], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /docs\/project\/brief\.md: link must remain inside project root: outside-link\.md/);
      } finally {
        rmSync(outsideDir, { recursive: true, force: true });
      }
    });
  });

  it("reports broken markdown symlinks under docs without crashing", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      symlinkSync(join(dir, "docs/project/missing-target.md"), join(dir, "docs/project/broken-link.md"), "file");

      const result = runCliResult(["validate"], dir);

      assert.equal(result.status, 1);
      assert.doesNotMatch(result.stderr, /Unhandled|ENOENT: no such file or directory, open/);
      assert.match(result.stderr, /docs\/project\/broken-link\.md: symlink target is missing/);
    });
  });

  it("reports unsafe anchor ids in metadata", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      writeFileSync(join(dir, "safe.ts"), "export const safe = true;\n", "utf8");
      writeFileSync(
        join(dir, ".agent-docs/anchors.json"),
        JSON.stringify(
          {
            version: 1,
            anchors: {
              "../bad": {
                file: "safe.ts",
                docs: [],
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
      assert.match(result.stderr, /Invalid anchor id: \.\.\/bad/);
    });
  });

  it("reports unsafe anchor file paths in metadata", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      writeFileSync(
        join(dir, ".agent-docs/anchors.json"),
        JSON.stringify(
          {
            version: 1,
            anchors: {
              unsafe: {
                file: "src/../safe.ts",
                docs: [],
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
      assert.match(result.stderr, /Invalid anchor file: src\/\.\.\/safe\.ts/);
    });
  });

  it("reports docs directory symlinked outside the project root", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "agent-docs-outside-docs-"));
      try {
        runCli(["init"], dir);
        const brief = readFileSync(join(dir, "docs/project/brief.md"), "utf8");
        rmSync(join(dir, "docs"), { recursive: true, force: true });
        mkdirSync(join(outsideDir, "project"), { recursive: true });
        writeFileSync(join(outsideDir, "project/brief.md"), brief, "utf8");
        symlinkSync(outsideDir, join(dir, "docs"), "dir");
        writeFileSync(join(dir, ".agent-docs/manifest.json"), JSON.stringify({ version: 1, docs: [] }, null, 2), "utf8");
        writeFileSync(join(dir, ".agent-docs/scopes.json"), JSON.stringify({ version: 1, scopes: [] }, null, 2), "utf8");

        const result = runCliResult(["validate"], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /docs\/ must remain inside project root/);
      } finally {
        rmSync(outsideDir, { recursive: true, force: true });
      }
    });
  });

  it("reports scope paths symlinked outside the project root", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "agent-docs-outside-scope-"));
      try {
        runCli(["init"], dir);
        symlinkSync(outsideDir, join(dir, "external-scope"), "dir");
        writeFileSync(
          join(dir, ".agent-docs/scopes.json"),
          JSON.stringify(
            {
              version: 1,
              scopes: [
                {
                  id: "external",
                  kind: "feature",
                  title: "External",
                  path: "external-scope",
                  status: "draft",
                },
              ],
            },
            null,
            2,
          ),
          "utf8",
        );

        const result = runCliResult(["validate"], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /Scope external path must remain inside project root: external-scope/);
      } finally {
        rmSync(outsideDir, { recursive: true, force: true });
      }
    });
  });

  it("reports anchor docs symlinked outside the project root", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "agent-docs-outside-anchor-doc-"));
      try {
        runCli(["init"], dir);
        writeFileSync(join(dir, "safe.ts"), "export const safe = true;\n", "utf8");
        writeFileSync(join(outsideDir, "outside.md"), "# Outside\n", "utf8");
        symlinkSync(join(outsideDir, "outside.md"), join(dir, "anchor-doc.md"), "file");
        writeFileSync(
          join(dir, ".agent-docs/anchors.json"),
          JSON.stringify(
            {
              version: 1,
              anchors: {
                "linked-doc": {
                  file: "safe.ts",
                  docs: ["anchor-doc.md"],
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
        assert.match(result.stderr, /Anchor linked-doc doc must remain inside project root: anchor-doc\.md/);
      } finally {
        rmSync(outsideDir, { recursive: true, force: true });
      }
    });
  });

  it("reports .agent-docs directory symlinked outside the project root", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "agent-docs-outside-metadata-"));
      try {
        runCli(["init"], dir);
        for (const file of ["config.json", "manifest.json", "scopes.json", "anchors.json"]) {
          writeFileSync(
            join(outsideDir, file),
            readFileSync(join(dir, ".agent-docs", file), "utf8"),
            "utf8",
          );
        }
        rmSync(join(dir, ".agent-docs"), { recursive: true, force: true });
        symlinkSync(outsideDir, join(dir, ".agent-docs"), "dir");

        const result = runCliResult(["validate"], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /\.agent-docs\/ must remain inside project root/);
      } finally {
        rmSync(outsideDir, { recursive: true, force: true });
      }
    });
  });

  it("reports metadata files symlinked outside the project root", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "agent-docs-outside-manifest-"));
      try {
        runCli(["init"], dir);
        writeFileSync(
          join(outsideDir, "manifest.json"),
          readFileSync(join(dir, ".agent-docs/manifest.json"), "utf8"),
          "utf8",
        );
        rmSync(join(dir, ".agent-docs/manifest.json"));
        symlinkSync(join(outsideDir, "manifest.json"), join(dir, ".agent-docs/manifest.json"), "file");

        const result = runCliResult(["validate"], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /\.agent-docs\/manifest\.json must remain inside project root/);
      } finally {
        rmSync(outsideDir, { recursive: true, force: true });
      }
    });
  });
});

describe("status and export", () => {
  it("prints project status", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      const output = runCli(["status"], dir);

      assert.match(output, /agent-docs status/);
      assert.match(output, /mode: planning/);
      assert.match(output, /docs: 5/);
      assert.match(output, /scopes: 3/);
    });
  });

  it("exports docs for an audience while preserving docs-relative structure", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      const output = runCli(["export", "--audience", "agent"], dir);

      assert.match(output, /Exported agent bundle/);
      assert.equal(existsSync(join(dir, "exports/agent/handoff/agent-brief.md")), true);
      assert.equal(existsSync(join(dir, "exports/agent/project/brief.md")), true);
      assert.equal(existsSync(join(dir, "exports/agent/handoff/human-brief.md")), false);
    });
  });

  it("rejects unknown or unsafe export audiences", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);

      for (const audience of ["internal", "../agent"]) {
        const result = runCliResult(["export", "--audience", audience], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /Unknown audience/);
      }
    });
  });

  it("does not export docs when validation has errors", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      writeFileSync(join(dir, "docs/project/brief.md"), "# Project Brief\n\nMissing metadata.\n", "utf8");

      const result = runCliResult(["export", "--audience", "agent"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /Cannot export while validation has errors/);
      assert.equal(existsSync(join(dir, "exports/agent/project/brief.md")), false);
    });
  });

  it("promotes config to codebase mode and creates codebase docs", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      runCli(["promote", "--to", "codebase"], dir);
      const config = readFileSync(join(dir, ".agent-docs/config.json"), "utf8");

      assert.match(config, /"mode": "codebase"/);
      assert.equal(existsSync(join(dir, "docs/engineering/architecture.md")), true);
      assert.equal(existsSync(join(dir, "docs/engineering/code-map.md")), true);
      assert.equal(existsSync(join(dir, "docs/releases/changelog.md")), true);
    });
  });

  it("does not overwrite existing codebase docs during promote", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      mkdirSync(join(dir, "docs/engineering"), { recursive: true });
      const architecturePath = join(dir, "docs/engineering/architecture.md");
      const existing = [
        "---",
        "title: Existing Architecture",
        "scope: project",
        "scope_id: project",
        "audience: [developer, agent]",
        "status: draft",
        "visibility: private",
        "updated: 2026-06-03",
        "source: manual",
        "---",
        "",
        "# Existing Architecture",
        "",
        "Keep this content.",
        "",
      ].join("\n");
      writeFileSync(architecturePath, existing, "utf8");

      runCli(["promote", "--to", "codebase"], dir);

      assert.equal(readFileSync(architecturePath, "utf8"), existing);
    });
  });
});
