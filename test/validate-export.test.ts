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
      rmSync(join(dir, "benjamin-docs/project/brief.md"));

      const result = runCliResult(["validate"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /benjamin-docs\/project\/brief\.md/);
    });
  });

  it("reports markdown docs without valid frontmatter", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      writeFileSync(join(dir, "benjamin-docs/project/brief.md"), "# Project Brief\n\nMissing metadata.\n", "utf8");

      const result = runCliResult(["validate"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /benjamin-docs\/project\/brief\.md: Markdown file is missing frontmatter/);
    });
  });

  it("ignores unmanaged legacy markdown docs without frontmatter", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      mkdirSync(join(dir, "docs"), { recursive: true });
      writeFileSync(join(dir, "docs/legacy-notes.md"), "# Legacy Notes\n\nAlready existed before benjamin-docs.\n", "utf8");

      const result = runCliResult(["validate"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stdout, /Validation passed/);
      assert.equal(result.stderr, "");
    });
  });

  it("reports broken relative markdown links", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      const briefPath = join(dir, "benjamin-docs/project/brief.md");
      const brief = readFileSync(briefPath, "utf8");
      writeFileSync(briefPath, `${brief}\nSee [missing notes](missing-notes.md).\n`, "utf8");

      const result = runCliResult(["validate"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /benjamin-docs\/project\/brief\.md: broken link missing-notes\.md/);
    });
  });

  it("warns without failing when docs is empty", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      rmSync(join(dir, "benjamin-docs"), { recursive: true, force: true });
      mkdirSync(join(dir, "benjamin-docs"));
      writeFileSync(join(dir, ".benjamin-docs/manifest.json"), JSON.stringify({ version: 1, docs: [] }, null, 2), "utf8");
      writeFileSync(join(dir, ".benjamin-docs/scopes.json"), JSON.stringify({ version: 1, scopes: [] }, null, 2), "utf8");

      const result = runCliResult(["validate"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stderr, /Warning: No Markdown docs found under benjamin-docs\//);
      assert.match(result.stdout, /Validation passed/);
    });
  });

  it("reports anchor files that resolve outside the project root", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "benjamin-docs-outside-"));
      try {
        runCli(["init"], dir);
        writeFileSync(join(outsideDir, "secret.ts"), "export const secret = true;\n", "utf8");
        symlinkSync(join(outsideDir, "secret.ts"), join(dir, "secret-link.ts"), "file");
        writeFileSync(
          join(dir, ".benjamin-docs/anchors.json"),
          JSON.stringify(
            {
              version: 1,
              anchors: {
                secret: {
                  file: "secret-link.ts",
                  docs: ["benjamin-docs/project/brief.md"],
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
      const outsideDir = mkdtempSync(join(tmpdir(), "benjamin-docs-outside-"));
      try {
        runCli(["init"], dir);
        writeFileSync(join(outsideDir, "outside.md"), "# Outside\n", "utf8");
        symlinkSync(join(outsideDir, "outside.md"), join(dir, "benjamin-docs/project/outside-link.md"), "file");

        const briefPath = join(dir, "benjamin-docs/project/brief.md");
        const brief = readFileSync(briefPath, "utf8");
        writeFileSync(briefPath, `${brief}\nSee [outside](outside-link.md).\n`, "utf8");

        const result = runCliResult(["validate"], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /benjamin-docs\/project\/brief\.md: link must remain inside project root: outside-link\.md/);
      } finally {
        rmSync(outsideDir, { recursive: true, force: true });
      }
    });
  });

  it("reports broken markdown symlinks under docs without crashing", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      symlinkSync(join(dir, "benjamin-docs/project/missing-target.md"), join(dir, "benjamin-docs/project/broken-link.md"), "file");

      const result = runCliResult(["validate"], dir);

      assert.equal(result.status, 1);
      assert.doesNotMatch(result.stderr, /Unhandled|ENOENT: no such file or directory, open/);
      assert.match(result.stderr, /benjamin-docs\/project\/broken-link\.md: symlink target is missing/);
    });
  });

  it("reports unsafe anchor ids in metadata", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      writeFileSync(join(dir, "safe.ts"), "export const safe = true;\n", "utf8");
      writeFileSync(
        join(dir, ".benjamin-docs/anchors.json"),
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
        join(dir, ".benjamin-docs/anchors.json"),
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

  it("reports docs root symlinked outside the project root", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "benjamin-docs-outside-docs-"));
      try {
        runCli(["init"], dir);
        const brief = readFileSync(join(dir, "benjamin-docs/project/brief.md"), "utf8");
        rmSync(join(dir, "benjamin-docs"), { recursive: true, force: true });
        mkdirSync(join(outsideDir, "project"), { recursive: true });
        writeFileSync(join(outsideDir, "project/brief.md"), brief, "utf8");
        symlinkSync(outsideDir, join(dir, "benjamin-docs"), "dir");
        writeFileSync(join(dir, ".benjamin-docs/manifest.json"), JSON.stringify({ version: 1, docs: [] }, null, 2), "utf8");
        writeFileSync(join(dir, ".benjamin-docs/scopes.json"), JSON.stringify({ version: 1, scopes: [] }, null, 2), "utf8");

        const result = runCliResult(["validate"], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /benjamin-docs\/ must remain inside project root/);
      } finally {
        rmSync(outsideDir, { recursive: true, force: true });
      }
    });
  });

  it("reports scope paths symlinked outside the project root", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "benjamin-docs-outside-scope-"));
      try {
        runCli(["init"], dir);
        symlinkSync(outsideDir, join(dir, "external-scope"), "dir");
        writeFileSync(
          join(dir, ".benjamin-docs/scopes.json"),
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
      const outsideDir = mkdtempSync(join(tmpdir(), "benjamin-docs-outside-anchor-doc-"));
      try {
        runCli(["init"], dir);
        writeFileSync(join(dir, "safe.ts"), "export const safe = true;\n", "utf8");
        writeFileSync(join(outsideDir, "outside.md"), "# Outside\n", "utf8");
        symlinkSync(join(outsideDir, "outside.md"), join(dir, "anchor-doc.md"), "file");
        writeFileSync(
          join(dir, ".benjamin-docs/anchors.json"),
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

  it("reports .benjamin-docs directory symlinked outside the project root", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "benjamin-docs-outside-metadata-"));
      try {
        runCli(["init"], dir);
        for (const file of ["config.json", "manifest.json", "scopes.json", "anchors.json"]) {
          writeFileSync(
            join(outsideDir, file),
            readFileSync(join(dir, ".benjamin-docs", file), "utf8"),
            "utf8",
          );
        }
        rmSync(join(dir, ".benjamin-docs"), { recursive: true, force: true });
        symlinkSync(outsideDir, join(dir, ".benjamin-docs"), "dir");

        const result = runCliResult(["validate"], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /\.benjamin-docs\/ must remain inside project root/);
      } finally {
        rmSync(outsideDir, { recursive: true, force: true });
      }
    });
  });

  it("reports metadata files symlinked outside the project root", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "benjamin-docs-outside-manifest-"));
      try {
        runCli(["init"], dir);
        writeFileSync(
          join(outsideDir, "manifest.json"),
          readFileSync(join(dir, ".benjamin-docs/manifest.json"), "utf8"),
          "utf8",
        );
        rmSync(join(dir, ".benjamin-docs/manifest.json"));
        symlinkSync(join(outsideDir, "manifest.json"), join(dir, ".benjamin-docs/manifest.json"), "file");

        const result = runCliResult(["validate"], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /\.benjamin-docs\/manifest\.json must remain inside project root/);
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

      assert.match(output, /benjamin-docs status/);
      assert.match(output, /mode: planning/);
      assert.match(output, /focus: project/);
      assert.match(output, /docsRoot: benjamin-docs/);
      assert.match(output, /docs: 9/);
      assert.match(output, /scopes: 4/);
    });
  });

  it("prints the next recommended agent prompt", () => {
    withTempDir((dir) => {
      runCli(["init", "--mode", "feature", "--feature", "billing-reminders"], dir);
      const output = runCli(["next"], dir);

      assert.match(output, /Next, ask your agent:/);
      assert.match(output, /Capture the billing-reminders feature/);
      assert.match(output, /benjamin-docs\/features\/billing-reminders/);
    });
  });

  it("reports a clear status error for uninitialized projects", () => {
    withTempDir((dir) => {
      const result = runCliResult(["status"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /benjamin-docs is not initialized/);
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

  it("rejects symlinked export bundle directories before writing", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "benjamin-docs-outside-export-"));
      try {
        runCli(["init"], dir);
        mkdirSync(join(dir, "exports"), { recursive: true });
        symlinkSync(outsideDir, join(dir, "exports/agent"), "dir");

        const result = runCliResult(["export", "--audience", "agent"], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /Generated output path must not be a symlink/);
        assert.equal(existsSync(join(outsideDir, "project/brief.md")), false);
      } finally {
        rmSync(outsideDir, { recursive: true, force: true });
      }
    });
  });

  it("removes stale files when regenerating an audience export", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      runCli(["export", "--audience", "agent"], dir);

      const briefPath = join(dir, "benjamin-docs/project/brief.md");
      const brief = readFileSync(briefPath, "utf8");
      writeFileSync(
        briefPath,
        brief.replace("audience: [developer, designer, business, agent]", "audience: [developer, designer, business]"),
        "utf8",
      );

      runCli(["export", "--audience", "agent"], dir);

      assert.equal(existsSync(join(dir, "exports/agent/project/brief.md")), false);
      assert.equal(existsSync(join(dir, "exports/agent/handoff/agent-brief.md")), true);
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
      writeFileSync(join(dir, "benjamin-docs/project/brief.md"), "# Project Brief\n\nMissing metadata.\n", "utf8");

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
      const config = readFileSync(join(dir, ".benjamin-docs/config.json"), "utf8");

      assert.match(config, /"mode": "codebase"/);
      assert.equal(existsSync(join(dir, "benjamin-docs/engineering/architecture.md")), true);
      assert.equal(existsSync(join(dir, "benjamin-docs/engineering/code-map.md")), true);
      assert.equal(existsSync(join(dir, "benjamin-docs/releases/changelog.md")), true);
    });
  });

  it("rejects symlinked codebase doc parent directories before promoting", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "benjamin-docs-outside-promote-"));
      try {
        runCli(["init"], dir);
        rmSync(join(dir, "benjamin-docs/engineering"), { recursive: true, force: true });
        symlinkSync(outsideDir, join(dir, "benjamin-docs/engineering"), "dir");

        const result = runCliResult(["promote", "--to", "codebase"], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /Generated output path must not be a symlink/);
        assert.equal(existsSync(join(outsideDir, "architecture.md")), false);
      } finally {
        rmSync(outsideDir, { recursive: true, force: true });
      }
    });
  });

  it("does not overwrite existing codebase docs during promote", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      mkdirSync(join(dir, "benjamin-docs/engineering"), { recursive: true });
      const architecturePath = join(dir, "benjamin-docs/engineering/architecture.md");
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
