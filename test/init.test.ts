import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { withTempDir, runCli, runCliResult } from "./helpers.js";

describe("init", () => {
  it("uses broad setup labels for interactive init choices", async () => {
    const cliPath = pathToFileURL(join(process.cwd(), "dist/src/cli.js")).href;
    const cli = await import(cliPath);

    assert.deepEqual(cli.initChoiceLabels(), [
      "A new project or idea",
      "A codebase or app",
      "One feature, change, or plan",
    ]);
  });

  it("offers agent guidance from codebase and feature init choices", async () => {
    const cliPath = pathToFileURL(join(process.cwd(), "dist/src/cli.js")).href;
    const cli = await import(cliPath);

    assert.equal(cli.shouldOfferAgentGuidance("project"), false);
    assert.equal(cli.shouldOfferAgentGuidance("codebase"), true);
    assert.equal(cli.shouldOfferAgentGuidance("feature"), true);
    assert.equal(cli.agentGuidancePromptLabel(), "Add AI agent guidance for this project? Recommended.");
  });

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
      assert.match(readFileSync(join(dir, "benjamin-docs/handoff/agent-brief.md"), "utf8"), /## Continuation Proof/);
      assert.match(readFileSync(join(dir, "benjamin-docs/handoff/agent-brief.md"), "utf8"), /## Commands And Checks/);
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
      assert.equal(existsSync(join(dir, "AGENTS.md")), true);
      assert.equal(existsSync(join(dir, "benjamin-docs/AGENTS.md")), true);
      assert.match(output, /Capture the current project baseline/);
      assert.match(output, /benjamin-docs\/engineering\/architecture\.md/);
      assert.match(output, /understandable for non-technical readers/);
      assert.match(output, /continuation proof/);
    });
  });

  it("defaults plain non-interactive init to codebase memory in an obvious codebase", () => {
    withTempDir((dir) => {
      writeFileSync(join(dir, "package.json"), '{"name":"demo"}\n');

      const output = runCli(["init"], dir);
      const config = readFileSync(join(dir, ".benjamin-docs/config.json"), "utf8");
      const agents = readFileSync(join(dir, "AGENTS.md"), "utf8");

      assert.match(config, /"mode": "codebase"/);
      assert.match(config, /"focus": "codebase"/);
      assert.match(output, /Agent guidance: created benjamin-docs\/AGENTS\.md/);
      assert.match(output, /Agent guidance: created AGENTS\.md/);
      assert.match(agents, /Benjamin Docs Project Memory/);
      assert.match(agents, /benjamin-docs\/AGENTS\.md/);
      assert.match(output, /Capture the current project baseline/);
    });
  });

  it("lets automation opt out of codebase agent guidance", () => {
    withTempDir((dir) => {
      writeFileSync(join(dir, "package.json"), '{"name":"demo"}\n');

      const output = runCli(["init", "--no-agent-contract"], dir);
      const config = readFileSync(join(dir, ".benjamin-docs/config.json"), "utf8");

      assert.match(config, /"mode": "codebase"/);
      assert.match(config, /"focus": "codebase"/);
      assert.equal(existsSync(join(dir, "AGENTS.md")), false);
      assert.equal(existsSync(join(dir, "benjamin-docs/AGENTS.md")), false);
      assert.doesNotMatch(output, /Agent guidance:/);
    });
  });

  it("prints init help", () => {
    withTempDir((dir) => {
      const output = runCli(["init", "--help"], dir);

      assert.match(output, /benjamin-docs init/);
      assert.match(output, /For most people:/);
      assert.match(output, /benjamin-docs init --mode codebase/);
      assert.match(output, /benjamin-docs init --no-agent-contract/);
      assert.match(runCli(["init", "--mode", "codebase", "--help"], dir), /benjamin-docs init/);
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
