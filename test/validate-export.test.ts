import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MAX_DOCS_ROOT_CHARACTERS } from "../src/session-context.js";
import { runCli, runCliResult, withTempDir } from "./helpers.js";

function customerFeatureBrief(slug: string, title: string): string {
  return [
    "---",
    `title: ${title} Brief`,
    "scope: feature",
    `scope_id: ${slug}`,
    "audience: [developer, designer, agent, user]",
    "status: review",
    "visibility: unlisted",
    "updated: 2026-06-19",
    "source: manual",
    "freshness: status",
    "---",
    "",
    `# ${title}`,
    "",
    "## What It Is",
    "",
    "This feature lets an operator safely remove an owner from active operations.",
    "",
    "## When To Use It",
    "",
    "Use it when an owner account should no longer be active.",
    "",
    "## How To Use It",
    "",
    "1. Open Owners.",
    "2. Select the owner.",
    "3. Choose Delete and confirm.",
    "",
    "## Known Limits",
    "",
    "Deletion cannot be undone.",
  ].join("\n");
}

function customerFeatureHandoff(slug: string, title: string): string {
  return [
    "---",
    `title: ${title} Handoff`,
    "scope: feature",
    `scope_id: ${slug}`,
    "audience: [developer, agent, user]",
    "status: review",
    "visibility: unlisted",
    "updated: 2026-06-19",
    "source: manual",
    "---",
    "",
    `# ${title} Handoff`,
    "",
    "## Implementation Verification",
    "",
    "Implementation verified: yes",
    "",
    "## Known Limits",
    "",
    "Deletion may be unavailable when historical records must be preserved.",
    "",
    "## Support Notes",
    "",
    "Contact support if deletion is blocked.",
  ].join("\n");
}

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

  it("reports invalid watch rules in config", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);

      const configPath = join(dir, ".benjamin-docs/config.json");
      const config = JSON.parse(readFileSync(configPath, "utf8")) as Record<string, unknown>;
      config.watch = [{ label: 7, paths: [], docs: ["../outside.md"] }];
      writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

      const result = runCliResult(["validate"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /watch\[0]\.label must be a string/);
      assert.match(result.stderr, /watch\[0]\.paths must be a non-empty array of glob strings/);
      assert.match(result.stderr, /watch\[0] doc must be a safe relative path: \.\.\/outside\.md/);
    });
  });

  it("reports a configured docs root that exceeds the session-start budget", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);

      const configPath = join(dir, ".benjamin-docs/config.json");
      const config = JSON.parse(readFileSync(configPath, "utf8")) as Record<string, unknown>;
      config.docsRoot = "m".repeat(MAX_DOCS_ROOT_CHARACTERS + 1);
      writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

      const result = runCliResult(["validate"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, new RegExp(`docsRoot must be at most ${MAX_DOCS_ROOT_CHARACTERS} characters`, "i"));
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
      assert.match(output, /continuation proof/);
      assert.match(output, /run `benjamin-docs views`, then `benjamin-docs ready`/);
    });
  });

  it("includes the human handoff in the codebase baseline prompt", () => {
    withTempDir((dir) => {
      runCli(["init", "--mode", "codebase"], dir);
      const output = runCli(["next"], dir);

      assert.match(output, /Capture the current project baseline/);
      assert.match(output, /benjamin-docs\/handoff\/human-brief\.md/);
      assert.match(output, /benjamin-docs\/handoff\/agent-brief\.md/);
      assert.match(output, /human-brief\.md a short plain-language summary/);
      assert.match(output, /agent-brief\.md a continuation proof/);
      assert.match(output, /run `benjamin-docs views`, then `benjamin-docs ready`/);
    });
  });

  it("reports a clear status error for uninitialized projects", () => {
    withTempDir((dir) => {
      const result = runCliResult(["status"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /benjamin-docs is not initialized/);
    });
  });

  it("exports concise customer feature documentation", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      runCli(["scope", "create", "feature", "owner-delete"], dir);
      writeFileSync(join(dir, "benjamin-docs/features/owner-delete/brief.md"), customerFeatureBrief("owner-delete", "Owner Delete"), "utf8");
      writeFileSync(join(dir, "benjamin-docs/features/owner-delete/handoff.md"), customerFeatureHandoff("owner-delete", "Owner Delete"), "utf8");

      const result = runCliResult(["export", "--feature", "owner-delete", "--profile", "customer"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stdout, /Exported feature documentation/);
      const outputPath = join(dir, "exports/features/owner-delete-customer.md");
      assert.equal(existsSync(outputPath), true);
      const output = readFileSync(outputPath, "utf8");
      assert.match(output, /# Owner Delete/);
      assert.match(output, /## What It Is/);
      assert.match(output, /## How To Use It/);
      assert.match(output, /2\. Select the owner/);
      assert.match(output, /Deletion cannot be undone/);
      assert.match(output, /## Verification/);
      assert.match(output, /Implementation verified: yes/);
      assert.doesNotMatch(output, /Owner Delete Handoff/);
      assert.match(output, /implementation_verified: true/);
      assert.match(output, /generated: true/);
      assert.match(output, /source_commit:/);
      assert.match(output, /source_dirty:/);
      assert.match(output, /Regenerate this file with bd export/);
      assert.doesNotMatch(output, /Agent Brief|Commands And Checks/);
    });
  });

  it("regenerates feature exports from current source docs", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      runCli(["scope", "create", "feature", "owner-delete"], dir);
      const briefPath = join(dir, "benjamin-docs/features/owner-delete/brief.md");
      writeFileSync(briefPath, customerFeatureBrief("owner-delete", "Owner Delete"), "utf8");
      writeFileSync(join(dir, "benjamin-docs/features/owner-delete/handoff.md"), customerFeatureHandoff("owner-delete", "Owner Delete"), "utf8");

      runCli(["export", "--feature", "owner-delete", "--profile", "customer"], dir);
      writeFileSync(
        briefPath,
        customerFeatureBrief("owner-delete", "Owner Delete").replace("safely remove an owner", "quickly deactivate an owner"),
        "utf8",
      );
      runCli(["export", "--feature", "owner-delete", "--profile", "customer"], dir);

      const output = readFileSync(join(dir, "exports/features/owner-delete-customer.md"), "utf8");
      assert.match(output, /quickly deactivate an owner/);
      assert.doesNotMatch(output, /safely remove an owner/);
      assert.match(output, /Generated snapshot/);
    });
  });

  it("prints feature export readiness", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      runCli(["scope", "create", "feature", "owner-delete"], dir);
      runCli(["scope", "create", "feature", "staff-payroll"], dir);
      runCli(["scope", "create", "feature", "legacy-flow"], dir);
      writeFileSync(join(dir, "benjamin-docs/features/owner-delete/brief.md"), customerFeatureBrief("owner-delete", "Owner Delete"), "utf8");
      writeFileSync(join(dir, "benjamin-docs/features/owner-delete/handoff.md"), customerFeatureHandoff("owner-delete", "Owner Delete"), "utf8");
      runCli(["scope", "status", "legacy-flow", "archived"], dir);

      const output = runCli(["export", "--list"], dir);

      assert.match(output, /Feature export readiness/);
      assert.match(output, /Owner Delete \(owner-delete\) - ready/);
      assert.match(output, /Staff Payroll \(staff-payroll\) - blocked:/);
      assert.match(output, /Legacy Flow \(legacy-flow\) - archived/);
    });
  });

  it("exports app documentation, handoff, summary, and detail variants", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      runCli(["scope", "create", "feature", "owner-delete"], dir);
      runCli(["scope", "create", "feature", "leak-risk"], dir);
      writeFileSync(join(dir, "benjamin-docs/features/owner-delete/brief.md"), customerFeatureBrief("owner-delete", "Owner Delete"), "utf8");
      writeFileSync(join(dir, "benjamin-docs/features/owner-delete/handoff.md"), customerFeatureHandoff("owner-delete", "Owner Delete"), "utf8");
      writeFileSync(
        join(dir, "benjamin-docs/features/leak-risk/brief.md"),
        customerFeatureBrief("leak-risk", "Leak Risk").replace("This feature lets", "internal only. This feature lets"),
        "utf8",
      );
      writeFileSync(join(dir, "benjamin-docs/features/leak-risk/handoff.md"), customerFeatureHandoff("leak-risk", "Leak Risk"), "utf8");

      const app = runCli(["export", "--type", "app", "--profile", "customer"], dir);
      const handoff = runCli(["export", "--type", "handoff", "--profile", "customer", "--detail", "brief"], dir);
      const developer = runCli(["export", "--type", "handoff", "--profile", "developer", "--detail", "detailed"], dir);
      const summary = runCli(["export", "--type", "summary"], dir);

      assert.match(app, /Exported customer app documentation/);
      assert.match(handoff, /Exported customer handoff/);
      assert.match(developer, /Exported developer handoff/);
      assert.match(summary, /Exported customer project summary/);
      assert.equal(existsSync(join(dir, "exports/app/customer-app-documentation.md")), true);
      assert.equal(existsSync(join(dir, "exports/handoff/customer-handoff-brief.md")), true);
      assert.equal(existsSync(join(dir, "exports/handoff/developer-handoff-detailed.md")), true);
      assert.equal(existsSync(join(dir, "exports/summary/customer-project-summary-brief.md")), true);
      const appOutput = readFileSync(join(dir, "exports/app/customer-app-documentation.md"), "utf8");
      assert.match(appOutput, /# App Documentation/);
      assert.match(appOutput, /## Core Workflows/);
      assert.match(appOutput, /Owner Delete: ready/);
      assert.match(appOutput, /Leak Risk: blocked: not export-ready/);
      assert.doesNotMatch(appOutput, /internal only/);
    });
  });

  it("uses configured customer export blocked phrases", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      const configPath = join(dir, ".benjamin-docs/config.json");
      const config = JSON.parse(readFileSync(configPath, "utf8")) as Record<string, unknown>;
      config.export = { blockedPhrases: ["operator-only"] };
      writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
      const briefPath = join(dir, "benjamin-docs/project/brief.md");
      writeFileSync(briefPath, `${readFileSync(briefPath, "utf8")}\n\noperator-only note.\n`, "utf8");

      const result = runCliResult(["export", "--type", "app", "--profile", "customer"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /Possible customer-facing leak risk: operator-only/);
      assert.equal(existsSync(join(dir, "exports/app/customer-app-documentation.md")), false);
    });
  });

  it("suggests a close feature match instead of exporting the wrong feature", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      runCli(["scope", "create", "feature", "owner-delete"], dir);

      const result = runCliResult(["export", "--feature", "owener-delete"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /Feature "owener-delete" was not found/);
      assert.match(result.stderr, /Did you mean "owner-delete"/);
      assert.match(result.stderr, /bd export --feature owner-delete/);
    });
  });

  it("rejects path-like feature queries", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      runCli(["scope", "create", "feature", "owner-delete"], dir);
      writeFileSync(join(dir, "benjamin-docs/features/owner-delete/brief.md"), customerFeatureBrief("owner-delete", "Owner Delete"), "utf8");
      writeFileSync(join(dir, "benjamin-docs/features/owner-delete/handoff.md"), customerFeatureHandoff("owner-delete", "Owner Delete"), "utf8");

      const result = runCliResult(["export", "--feature", "../owner-delete", "--profile", "customer"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /Feature must be a feature slug or title, not a path/);
      assert.equal(existsSync(join(dir, "exports/features/owner-delete-customer.md")), false);
    });
  });

  it("prints an agent prompt when a feature does not exist", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);

      const result = runCliResult(["export", "--feature", "staff-payroll"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /Feature "staff-payroll" does not exist/);
      assert.match(result.stderr, /Next prompt:/);
      assert.match(result.stderr, /Create a Benjamin Docs feature scope for staff-payroll/);
    });
  });

  it("blocks customer feature export when docs need agent verification", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      runCli(["scope", "create", "feature", "owner-delete"], dir);

      const result = runCliResult(["export", "--feature", "owner-delete", "--profile", "customer"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /Feature export readiness: blocked/);
      assert.match(result.stderr, /Customer-facing feature export should be verified against implementation first/);
      assert.match(result.stderr, /Verify the owner-delete feature implementation against its Benjamin Docs/);
      assert.equal(existsSync(join(dir, "exports/features/owner-delete-customer.md")), false);
    });
  });

  it("records agent verification evidence before customer feature export", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      runCli(["scope", "create", "feature", "owner-delete"], dir);
      writeFileSync(join(dir, "benjamin-docs/features/owner-delete/brief.md"), customerFeatureBrief("owner-delete", "Owner Delete"), "utf8");
      writeFileSync(
        join(dir, "benjamin-docs/features/owner-delete/handoff.md"),
        customerFeatureHandoff("owner-delete", "Owner Delete").replace("Implementation verified: yes", "Implementation verification is pending."),
        "utf8",
      );

      const blocked = runCliResult(["export", "--feature", "owner-delete", "--profile", "customer"], dir);
      assert.equal(blocked.status, 1);
      assert.match(blocked.stderr, /Customer-facing feature export should be verified against implementation first/);

      const verified = runCliResult([
        "export",
        "--verify",
        "owner-delete",
        "--evidence",
        "Checked owner page, delete mutation, cascade RPC, and cache updates.",
      ], dir);

      assert.equal(verified.status, 0);
      assert.match(verified.stdout, /Recorded export verification for owner-delete/);
      assert.match(verified.stdout, /bd export --feature owner-delete --profile customer/);

      const handoff = readFileSync(join(dir, "benjamin-docs/features/owner-delete/handoff.md"), "utf8");
      assert.match(handoff, /updated: 20\d\d-\d\d-\d\d/);
      assert.match(handoff, /## Implementation Verification/);
      assert.match(handoff, /Implementation verified: yes/);
      assert.match(handoff, /Evidence:\n- Checked owner page, delete mutation, cascade RPC, and cache updates\./);
      assert.doesNotMatch(handoff, /Implementation verification is pending/);

      const exported = runCliResult(["export", "--feature", "owner-delete", "--profile", "customer"], dir);
      assert.equal(exported.status, 0);
      const output = readFileSync(join(dir, "exports/features/owner-delete-customer.md"), "utf8");
      assert.match(output, /implementation_verified: true/);
      assert.match(output, /Checked owner page, delete mutation, cascade RPC, and cache updates\./);
    });
  });

  it("requires verification evidence when recording feature export verification", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      runCli(["scope", "create", "feature", "owner-delete"], dir);

      const result = runCliResult(["export", "--verify", "owner-delete"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /Usage: benjamin-docs export --verify <feature> --evidence/);
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

  it("ignores child agent guidance during export", () => {
    withTempDir((dir) => {
      runCli(["init", "--mode", "codebase", "--agent-contract", "--children"], dir);
      const output = runCli(["export", "--audience", "agent"], dir);

      assert.match(output, /Exported agent bundle/);
      assert.equal(existsSync(join(dir, "benjamin-docs/AGENTS.md")), true);
      assert.equal(existsSync(join(dir, "exports/agent/AGENTS.md")), false);
      assert.equal(existsSync(join(dir, "exports/agent/handoff/agent-brief.md")), true);
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
