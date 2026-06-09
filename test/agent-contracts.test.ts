import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkAgentContracts } from "../src/agent-contracts.js";
import { runCli, runCliResult, withTempDir } from "./helpers.js";

describe("agent contracts", () => {
  it("creates a root AGENTS.md when requested during init", () => {
    withTempDir((dir) => {
      const output = runCli(["init", "--mode", "codebase", "--agent-contract"], dir);
      const agentsPath = join(dir, "AGENTS.md");

      assert.equal(existsSync(agentsPath), true);
      const content = readFileSync(agentsPath, "utf8");
      assert.match(content, /<!-- benjamin-docs:start -->/);
      assert.match(content, /<!-- benjamin-docs:end -->/);
      assert.match(content, /\.benjamin-docs\/config\.json/);
      assert.match(content, /benjamin-docs\/project\/brief\.md/);
      assert.match(content, /benjamin-docs ready/);
      assert.match(output, /Agent guidance: created AGENTS\.md/);
    });
  });

  it("updates only the Benjamin-owned section on repeat init", () => {
    withTempDir((dir) => {
      runCli(["init", "--mode", "codebase", "--agent-contract"], dir);
      const agentsPath = join(dir, "AGENTS.md");
      const first = readFileSync(agentsPath, "utf8");
      writeFileSync(agentsPath, `${first}\n\n# Local Note\n\nKeep this line.\n`, "utf8");

      runCli(["init", "--mode", "codebase", "--agent-contract"], dir);
      const second = readFileSync(agentsPath, "utf8");

      assert.match(second, /# Local Note/);
      assert.match(second, /Keep this line\./);
      assert.equal((second.match(/<!-- benjamin-docs:start -->/g) ?? []).length, 1);
      assert.equal((second.match(/<!-- benjamin-docs:end -->/g) ?? []).length, 1);
    });
  });

  it("preserves an existing unmarked AGENTS.md and reports guidance", () => {
    withTempDir((dir) => {
      writeFileSync(join(dir, "AGENTS.md"), "# Existing Agent Rules\n\nDo not overwrite this.\n", "utf8");

      const output = runCli(["init", "--mode", "codebase", "--agent-contract"], dir);
      const content = readFileSync(join(dir, "AGENTS.md"), "utf8");

      assert.equal(content, "# Existing Agent Rules\n\nDo not overwrite this.\n");
      assert.match(output, /Agent guidance: preserved existing AGENTS\.md/);
      assert.match(output, /Consider adding a Benjamin Docs section/);
    });
  });

  it("reports existing unmarked AGENTS.md as enabled but ok", () => {
    withTempDir((dir) => {
      writeFileSync(join(dir, "AGENTS.md"), "# Existing Agent Rules\n\nDo not overwrite this.\n", "utf8");

      const result = checkAgentContracts(dir);

      assert.equal(result.enabled, true);
      assert.equal(result.ok, true);
      assert.match(result.summary, /Existing AGENTS\.md has no Benjamin Docs section/);
      assert.deepEqual(result.errors, []);
      assert.match(result.warnings.join("\n"), /no Benjamin Docs markers/);
    });
  });

  it("fails safely when root AGENTS.md is a symlink during install", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "benjamin-docs-outside-"));
      try {
        const outsideAgentsPath = join(outsideDir, "AGENTS.md");
        writeFileSync(outsideAgentsPath, "# External Rules\n\nDo not touch this.\n", "utf8");
        symlinkSync(outsideAgentsPath, join(dir, "AGENTS.md"), "file");

        const result = runCliResult(["init", "--mode", "codebase", "--agent-contract"], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /Agent guidance path must not be a symlink: AGENTS\.md/);
        assert.equal(readFileSync(outsideAgentsPath, "utf8"), "# External Rules\n\nDo not touch this.\n");
      } finally {
        rmSync(outsideDir, { recursive: true, force: true });
      }
    });
  });

  it("returns a structured error when root AGENTS.md is a symlink during check", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "benjamin-docs-outside-"));
      try {
        const outsideAgentsPath = join(outsideDir, "AGENTS.md");
        writeFileSync(outsideAgentsPath, "# External Rules\n\nDo not read this.\n", "utf8");
        symlinkSync(outsideAgentsPath, join(dir, "AGENTS.md"), "file");

        const result = checkAgentContracts(dir);

        assert.equal(result.enabled, true);
        assert.equal(result.ok, false);
        assert.match(result.summary, /cannot be checked safely/);
        assert.match(result.errors.join("\n"), /Agent guidance path must not be a symlink: AGENTS\.md/);
        assert.deepEqual(result.warnings, []);
      } finally {
        rmSync(outsideDir, { recursive: true, force: true });
      }
    });
  });

  it("preserves duplicate Benjamin marker sections during install", () => {
    withTempDir((dir) => {
      runCli(["init", "--mode", "codebase"], dir);
      const agentsPath = join(dir, "AGENTS.md");
      const malformed = [
        "# Existing Agent Rules",
        "",
        "<!-- benjamin-docs:start -->",
        "First section.",
        "<!-- benjamin-docs:end -->",
        "",
        "<!-- benjamin-docs:start -->",
        "Second section.",
        "<!-- benjamin-docs:end -->",
        "",
      ].join("\n");
      writeFileSync(agentsPath, malformed, "utf8");

      const output = runCli(["init", "--mode", "codebase", "--agent-contract"], dir);

      assert.equal(readFileSync(agentsPath, "utf8"), malformed);
      assert.match(output, /Agent guidance: preserved existing AGENTS\.md/);
    });
  });

  it("preserves one-sided Benjamin markers during install", () => {
    withTempDir((dir) => {
      runCli(["init", "--mode", "codebase"], dir);
      const agentsPath = join(dir, "AGENTS.md");
      const malformed = "# Existing Agent Rules\n\n<!-- benjamin-docs:start -->\nIncomplete section.\n";
      writeFileSync(agentsPath, malformed, "utf8");

      const output = runCli(["init", "--mode", "codebase", "--agent-contract"], dir);

      assert.equal(readFileSync(agentsPath, "utf8"), malformed);
      assert.match(output, /Agent guidance: preserved existing AGENTS\.md/);
    });
  });

  it("creates conservative child contracts when requested", () => {
    withTempDir((dir) => {
      runCli(["init", "--mode", "codebase", "--agent-contract", "--children"], dir);

      assert.equal(existsSync(join(dir, "benjamin-docs/AGENTS.md")), true);
      assert.equal(existsSync(join(dir, "AGENTS.md")), true);
      const root = readFileSync(join(dir, "AGENTS.md"), "utf8");
      const child = readFileSync(join(dir, "benjamin-docs/AGENTS.md"), "utf8");

      assert.match(root, /Child Agent Contract Index/);
      assert.match(root, /benjamin-docs\/AGENTS\.md/);
      assert.match(child, /Benjamin-managed project memory/);
    });
  });

  it("reports a missing indexed child contract", () => {
    withTempDir((dir) => {
      runCli(["init", "--mode", "codebase", "--agent-contract", "--children"], dir);
      rmSync(join(dir, "benjamin-docs/AGENTS.md"));

      const result = checkAgentContracts(dir);

      assert.equal(result.enabled, true);
      assert.equal(result.ok, false);
      assert.match(result.errors.join("\n"), /missing child contract: benjamin-docs\/AGENTS\.md/);
    });
  });

  it("reports an existing child contract missing from the root index", () => {
    withTempDir((dir) => {
      runCli(["init", "--mode", "codebase", "--agent-contract", "--children"], dir);
      const rootAgentsPath = join(dir, "AGENTS.md");
      const rootContent = readFileSync(rootAgentsPath, "utf8");
      writeFileSync(rootAgentsPath, rootContent.replace("- `benjamin-docs/AGENTS.md`\n", ""), "utf8");

      const result = checkAgentContracts(dir);

      assert.equal(existsSync(join(dir, "benjamin-docs/AGENTS.md")), true);
      assert.equal(result.enabled, true);
      assert.equal(result.ok, false);
      assert.match(result.errors.join("\n"), /Child AGENTS\.md exists but is missing from root index: benjamin-docs\/AGENTS\.md/);
    });
  });

  it("rejects the unsupported agent guidance alias", () => {
    withTempDir((dir) => {
      const result = runCliResult(["init", "--agent-guidance"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /Unknown init option: --agent-guidance/);
    });
  });
});
