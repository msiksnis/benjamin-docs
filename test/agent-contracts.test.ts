import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runCli, withTempDir } from "./helpers.js";

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
});
