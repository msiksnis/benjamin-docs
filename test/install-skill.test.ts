import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { formatInstallSkillResult, installSkill } from "../src/install-skill.js";
import { runCli, withTempDir } from "./helpers.js";

describe("install-skill", () => {
  it("installs the bundled skill into shared and app-specific skill folders", () => {
    withTempDir((home) => {
      const result = installSkill({ homeDir: home });

      assert.deepEqual(
        result.targets.map((target) => target.id),
        ["agents", "codex", "claude-code", "cursor"],
      );
      assert.deepEqual(
        result.targets.map((target) => target.status),
        ["installed", "installed", "installed", "installed"],
      );

      const expectedPaths = [
        ".agents/skills/benjamin-docs/SKILL.md",
        ".codex/skills/benjamin-docs/SKILL.md",
        ".claude/skills/benjamin-docs/SKILL.md",
        ".cursor/skills/benjamin-docs/SKILL.md",
      ];

      for (const path of expectedPaths) {
        const content = readFileSync(join(home, path), "utf8");
        assert.match(content, /^name: benjamin-docs/m);
        assert.match(content, /Chat-To-Project Workflow/);
      }
    });
  });

  it("reports unchanged targets when the skill is already installed", () => {
    withTempDir((home) => {
      installSkill({ homeDir: home });
      const result = installSkill({ homeDir: home });

      assert.deepEqual(
        result.targets.map((target) => target.status),
        ["unchanged", "unchanged", "unchanged", "unchanged"],
      );
    });
  });

  it("updates an existing target with the packaged skill", () => {
    withTempDir((home) => {
      const target = join(home, ".codex/skills/benjamin-docs/SKILL.md");
      mkdirSync(join(home, ".codex/skills/benjamin-docs"), { recursive: true });
      writeFileSync(target, "old skill\n", { encoding: "utf8", flag: "wx" });

      const result = installSkill({ homeDir: home, target: "codex" });

      assert.equal(result.targets[0]?.status, "updated");
      assert.match(readFileSync(target, "utf8"), /^name: benjamin-docs/m);
    });
  });

  it("supports dry-run without writing files", () => {
    withTempDir((home) => {
      const result = installSkill({ homeDir: home, dryRun: true });

      assert.deepEqual(
        result.targets.map((target) => target.status),
        ["would-install", "would-install", "would-install", "would-install"],
      );
      assert.equal(existsSync(join(home, ".codex/skills/benjamin-docs/SKILL.md")), false);
    });
  });

  it("prints install-skill output from the CLI", () => {
    withTempDir((home) => {
      const output = runCli(["install-skill", "--target", "codex"], home, { BENJAMIN_DOCS_HOME: home });

      assert.match(output, /Installed benjamin-docs skill/);
      assert.match(output, /Codex/);
      assert.match(output, /~\/.codex\/skills\/benjamin-docs\/SKILL.md/);
      assert.equal(existsSync(join(home, ".codex/skills/benjamin-docs/SKILL.md")), true);
    });
  });

  it("formats Claude Desktop upload guidance", () => {
    withTempDir((home) => {
      const result = installSkill({ homeDir: home, target: "claude-code", dryRun: true });
      const output = formatInstallSkillResult(result);

      assert.match(output, /Claude Desktop \/ Claude\.ai/);
      assert.match(output, /Claude's Skills UI/);
      assert.match(output, /Use the benjamin-docs skill to create a project from this chat/);
    });
  });
});
