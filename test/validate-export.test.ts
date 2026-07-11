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
    "Historical records may require deactivation instead, and operators should confirm the selected account before continuing.",
    "The workflow reports blocked deletion clearly so support can explain the next safe action without exposing internal implementation details.",
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
    "Evidence:",
    "- Checked the owner page, deletion action, retention guard, and visible blocked state against the current implementation.",
    "",
    "## Known Limits",
    "",
    "Deletion may be unavailable when historical records must be preserved.",
    "",
    "## Support Notes",
    "",
    "Contact support if deletion is blocked. Include the owner identifier, the action attempted, and the visible error message.",
    "Support should confirm whether historical records require preservation before recommending any follow-up action.",
    "The documented flow and its limits were checked against the implementation used by operators.",
    "",
    "## Current Status",
    "",
    "The documented owner deletion flow is implemented and ready for verified customer feature export.",
    "",
    "## Risks / Open Questions",
    "",
    "Retention rules may block deletion when historical records must remain available.",
    "",
    "## Next Actions",
    "",
    "Recheck the workflow and refresh evidence whenever implementation behavior changes.",
  ].join("\n");
}

function captureProjectBaseline(dir: string): void {
  const bodies: Record<string, string> = {
    "project/brief.md": [
      "# Project Brief",
      "",
      "This project gives operations teams a dependable workspace for managing owners, staff, and daily records. It serves operators who need clear workflows and support staff who need durable context. The current product includes account administration, guarded deletion, historical record preservation, and documented recovery paths. Customer-facing material should explain visible behavior without exposing local paths, secrets, or agent instructions. The project prioritizes safe actions, accurate status, and concise guidance over speculative features.",
    ].join("\n"),
    "project/roadmap.md": [
      "# Roadmap",
      "",
      "## Now",
      "",
      "The current milestone stabilizes owner administration, deletion safeguards, and customer documentation. Active work keeps implementation evidence aligned with user-visible behavior and verifies that exports contain only intended source material.",
      "",
      "## Next",
      "",
      "Next steps improve support guidance, exercise edge cases, and keep release notes current after behavior changes.",
      "",
      "## Later / Deferred",
      "",
      "Hosted publishing, broad customization, and unrelated workflow expansion remain deferred until the core operational path is dependable.",
    ].join("\n"),
    "project/open-questions.md": [
      "# Open Questions",
      "",
      "Which historical records should prevent permanent deletion, and which may be detached safely? What evidence should support collect when an operator reports a blocked action? The product owner must confirm retention rules before these decisions change.",
    ].join("\n"),
    "handoff/human-brief.md": [
      "# Human Brief",
      "",
      "The application supports day-to-day account administration for operations teams. Owners can be reviewed, deactivated, or deleted when retention rules allow it. The interface explains blocked actions and directs operators toward safe follow-up. Product memory records the current workflows, limits, decisions, and release state so a new collaborator can understand the project without reconstructing earlier conversations. Customer exports must stay concise and exclude internal implementation details.",
    ].join("\n"),
    "handoff/agent-brief.md": [
      "# Agent Brief",
      "",
      "## Read First",
      "",
      "Read the project brief, roadmap, open questions, feature brief, and feature handoff before changing behavior.",
      "",
      "## Current State",
      "",
      "Owner administration and guarded deletion are implemented. Product memory describes the visible workflow, retention limits, and support path.",
      "",
      "## Commands And Checks",
      "",
      "Run benjamin-docs ready and the focused export tests before handoff. Validate implementation evidence before customer export.",
      "",
      "## Risks / Hazards",
      "",
      "Do not publish private notes, local paths, secrets, or unverified behavior. Preserve historical records when retention rules require them.",
      "",
      "## Next Actions",
      "",
      "Continue by checking edge cases, updating durable docs after behavior changes, and recording concrete verification evidence.",
    ].join("\n"),
    "engineering/architecture.md": [
      "# Architecture",
      "",
      "The command-line application reads managed Markdown from benjamin-docs and deterministic metadata from .benjamin-docs. Export commands select source documents, run a side-effect-free publication preflight, render an eligible snapshot, and write it below exports. Readiness analysis keeps structural validation, content heuristics, committed freshness, working-tree impact, and agent guidance separate. Customer publication requires all blocking readiness dimensions to pass, while developer snapshots require structural validity.",
    ].join("\n"),
    "engineering/code-map.md": [
      "# Code Map",
      "",
      "The CLI entry is src/cli.ts. Export orchestration and rendering live in src/export.ts. Publication decisions live in src/export-policy.ts. Structured readiness lives in src/readiness.ts. Markdown parsing lives in src/frontmatter.ts, and generated-path safety lives in src/fsx.ts. Focused export regressions live in test/validate-export.test.ts and pure publication-policy coverage lives in test/export-policy.test.ts for dependable behavior.",
    ].join("\n"),
    "features/index.md": "# Features Index\n\nOwner Delete is the active documented feature. Its brief and handoff describe the operator workflow, limits, support guidance, and implementation evidence.\n",
    "releases/changelog.md": "# Changelog\n\nThe current release includes guarded owner deletion, preservation checks for historical records, operator-facing blocked states, support guidance, and verified customer feature documentation.\n",
  };

  for (const [relativePath, body] of Object.entries(bodies)) {
    const path = join(dir, "benjamin-docs", relativePath);
    const current = readFileSync(path, "utf8");
    const frontmatter = current.match(/^---\n[\s\S]*?\n---\n/)?.[0];
    assert.ok(frontmatter, `missing frontmatter in ${relativePath}`);
    writeFileSync(path, `${frontmatter}\n${body}\n`, "utf8");
  }
}

function captureFeaturePlanningDocs(dir: string, slug: string): void {
  const docs: Record<string, string> = {
    "plan.md": [
      `# ${slug} Plan`,
      "",
      "## Steps",
      "",
      "Confirm the operator workflow and retention rules. Exercise successful deletion and blocked deletion against the implementation. Record visible behavior, known limits, and support guidance in the feature brief and handoff. Run focused export tests and project readiness checks. Review generated customer output for private notes, local paths, secrets, and invented prose before sharing it.",
    ].join("\n"),
    "decisions.md": [
      `# ${slug} Decisions`,
      "",
      "## Durable Decisions",
      "",
      "Permanent deletion is available only when retention rules allow it. Historical records remain preserved when required. Customer documentation describes the visible workflow and blocked state without exposing implementation details. A customer export requires explicit implementation evidence and publication-safe source documents. Support guidance names the information an operator should provide when asking for help.",
    ].join("\n"),
  };

  for (const [name, body] of Object.entries(docs)) {
    const path = join(dir, "benjamin-docs", "features", slug, name);
    const current = readFileSync(path, "utf8");
    const frontmatter = current.match(/^---\n[\s\S]*?\n---\n/)?.[0];
    assert.ok(frontmatter, `missing frontmatter in ${name}`);
    writeFileSync(path, `${frontmatter}\n${body}\n`, "utf8");
  }
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
      captureProjectBaseline(dir);
      runCli(["scope", "create", "feature", "owner-delete"], dir);
      captureFeaturePlanningDocs(dir, "owner-delete");
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
      captureProjectBaseline(dir);
      runCli(["scope", "create", "feature", "owner-delete"], dir);
      captureFeaturePlanningDocs(dir, "owner-delete");
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
      captureProjectBaseline(dir);
      runCli(["scope", "create", "feature", "owner-delete"], dir);
      runCli(["scope", "create", "feature", "legacy-flow"], dir);
      captureFeaturePlanningDocs(dir, "owner-delete");
      writeFileSync(join(dir, "benjamin-docs/features/owner-delete/brief.md"), customerFeatureBrief("owner-delete", "Owner Delete"), "utf8");
      writeFileSync(join(dir, "benjamin-docs/features/owner-delete/handoff.md"), customerFeatureHandoff("owner-delete", "Owner Delete"), "utf8");
      runCli(["scope", "status", "legacy-flow", "archived"], dir);

      const output = runCli(["export", "--list"], dir);

      assert.match(output, /Feature export readiness/);
      assert.match(output, /Owner Delete \(owner-delete\) - ready/);
      assert.match(output, /Legacy Flow \(legacy-flow\) - archived/);
    });
  });

  it("keeps list readiness blocked when starter content blocks the actual export", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      captureProjectBaseline(dir);
      runCli(["scope", "create", "feature", "owner-delete"], dir);
      captureFeaturePlanningDocs(dir, "owner-delete");
      writeFileSync(
        join(dir, "benjamin-docs/features/owner-delete/brief.md"),
        `${customerFeatureBrief("owner-delete", "Owner Delete")}\n\nCapture what this feature is meant to accomplish.\n`,
        "utf8",
      );
      writeFileSync(join(dir, "benjamin-docs/features/owner-delete/handoff.md"), customerFeatureHandoff("owner-delete", "Owner Delete"), "utf8");

      const list = runCli(["export", "--list"], dir);
      const exported = runCliResult(["export", "--feature", "owner-delete", "--profile", "customer"], dir);

      assert.match(list, /Owner Delete \(owner-delete\) - blocked: Customer export source still contains untouched starter content/);
      assert.equal(exported.status, 1);
      assert.match(exported.stderr, /Customer export source still contains untouched starter content/);
    });
  });

  it("keeps list readiness blocked when an absolute path blocks the actual export", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      captureProjectBaseline(dir);
      runCli(["scope", "create", "feature", "owner-delete"], dir);
      captureFeaturePlanningDocs(dir, "owner-delete");
      writeFileSync(
        join(dir, "benjamin-docs/features/owner-delete/brief.md"),
        `${customerFeatureBrief("owner-delete", "Owner Delete")}\n\nLocal checkout: /Users/alice/project\n`,
        "utf8",
      );
      writeFileSync(join(dir, "benjamin-docs/features/owner-delete/handoff.md"), customerFeatureHandoff("owner-delete", "Owner Delete"), "utf8");

      const list = runCli(["export", "--list"], dir);
      const exported = runCliResult(["export", "--feature", "owner-delete", "--profile", "customer"], dir);

      assert.match(list, /Owner Delete \(owner-delete\) - blocked: Customer or public export source contains an absolute user path/);
      assert.equal(exported.status, 1);
      assert.match(exported.stderr, /Customer or public export source contains an absolute user path/);
    });
  });

  it("keeps list readiness blocked when project readiness blocks the actual export", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      runCli(["scope", "create", "feature", "owner-delete"], dir);
      captureFeaturePlanningDocs(dir, "owner-delete");
      writeFileSync(join(dir, "benjamin-docs/features/owner-delete/brief.md"), customerFeatureBrief("owner-delete", "Owner Delete"), "utf8");
      writeFileSync(join(dir, "benjamin-docs/features/owner-delete/handoff.md"), customerFeatureHandoff("owner-delete", "Owner Delete"), "utf8");

      const list = runCli(["export", "--list"], dir);
      const exported = runCliResult(["export", "--feature", "owner-delete", "--profile", "customer"], dir);

      assert.match(list, /Owner Delete \(owner-delete\) - blocked: Project readiness is not ready/);
      assert.equal(exported.status, 1);
      assert.match(exported.stderr, /Project readiness is not ready/);
    });
  });

  it("blocks customer app, handoff, and summary exports before writing", () => {
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

      const app = runCliResult(["export", "--type", "app", "--profile", "customer"], dir);
      const handoff = runCliResult(["export", "--type", "handoff", "--profile", "customer", "--detail", "brief"], dir);
      const summary = runCliResult(["export", "--type", "summary"], dir);

      assert.equal(app.status, 1);
      assert.equal(handoff.status, 1);
      assert.equal(summary.status, 1);
      assert.match(app.stderr, /Customer app export is disabled until the publication schema is implemented/);
      assert.match(handoff.stderr, /Customer handoff export is disabled until the publication schema is implemented/);
      assert.match(summary.stderr, /Customer summary export is disabled until the publication schema is implemented/);
      assert.equal(existsSync(join(dir, "exports/app")), false);
      assert.equal(existsSync(join(dir, "exports/handoff")), false);
      assert.equal(existsSync(join(dir, "exports/summary")), false);
    });
  });

  it("keeps developer handoff exports available after structural validation", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);

      const result = runCliResult(["export", "--type", "handoff", "--profile", "developer", "--detail", "detailed"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stdout, /Exported developer handoff/);
      assert.equal(existsSync(join(dir, "exports/handoff/developer-handoff-detailed.md")), true);
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
      assert.match(result.stderr, /Export preflight blocked/);
      assert.match(result.stderr, /Customer-facing feature export requires an Implementation Verification section with a verified marker and at least one evidence entry/);
      assert.match(result.stderr, /benjamin-docs export --verify owner-delete --evidence "Checked the implemented customer workflow against the current code\."/);
      assert.equal(existsSync(join(dir, "exports/features/owner-delete-customer.md")), false);
    });
  });

  it("blocks absolute paths and untouched starter text before creating customer feature output", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      captureProjectBaseline(dir);
      runCli(["scope", "create", "feature", "owner-delete"], dir);
      captureFeaturePlanningDocs(dir, "owner-delete");
      writeFileSync(
        join(dir, "benjamin-docs/features/owner-delete/brief.md"),
        `${customerFeatureBrief("owner-delete", "Owner Delete")}\n\nCapture what this feature is meant to accomplish.\n\nLocal checkout: /Users/alice/project\n`,
        "utf8",
      );
      writeFileSync(join(dir, "benjamin-docs/features/owner-delete/handoff.md"), customerFeatureHandoff("owner-delete", "Owner Delete"), "utf8");

      const result = runCliResult(["export", "--feature", "owner-delete", "--profile", "customer"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /absolute user path/);
      assert.match(result.stderr, /untouched starter content/);
      assert.match(result.stderr, /benjamin-docs\/features\/owner-delete\/brief\.md/);
      assert.equal(existsSync(join(dir, "exports/features")), false);
    });
  });

  it("records agent verification evidence before customer feature export", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      captureProjectBaseline(dir);
      runCli(["scope", "create", "feature", "owner-delete"], dir);
      captureFeaturePlanningDocs(dir, "owner-delete");
      writeFileSync(join(dir, "benjamin-docs/features/owner-delete/brief.md"), customerFeatureBrief("owner-delete", "Owner Delete"), "utf8");
      writeFileSync(
        join(dir, "benjamin-docs/features/owner-delete/handoff.md"),
        customerFeatureHandoff("owner-delete", "Owner Delete").replace("Implementation verified: yes", "Implementation verification is pending."),
        "utf8",
      );

      const blocked = runCliResult(["export", "--feature", "owner-delete", "--profile", "customer"], dir);
      assert.equal(blocked.status, 1);
      assert.match(blocked.stderr, /Customer-facing feature export requires an Implementation Verification section with a verified marker and at least one evidence entry/);

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

  it("blocks public and user audience bundles without creating or cleaning their directories", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      mkdirSync(join(dir, "exports/public"), { recursive: true });
      writeFileSync(join(dir, "exports/public/existing.md"), "keep me\n", "utf8");

      for (const audience of ["public", "user"]) {
        const result = runCliResult(["export", "--audience", audience], dir);
        assert.equal(result.status, 1);
        assert.match(result.stderr, new RegExp(`${audience} audience export is disabled until the publication schema is implemented`, "i"));
      }

      assert.equal(readFileSync(join(dir, "exports/public/existing.md"), "utf8"), "keep me\n");
      assert.equal(existsSync(join(dir, "exports/user")), false);
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
      assert.match(result.stderr, /Export preflight blocked/);
      assert.match(result.stderr, /validation findings/);
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
