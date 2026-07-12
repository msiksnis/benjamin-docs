import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runCli, runCliResult, withTempDir } from "./helpers.js";

describe("info commands", () => {
  it("keeps public copy aligned with the project-memory guarantees", () => {
    withTempDir((dir) => {
      const readme = readFileSync(join(process.cwd(), "README.md"), "utf8");
      const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as { description: string };
      const surfaces = [readme, pkg.description, runCli(["introduce"], dir), runCli(["help"], dir)];
      const forbiddenClaims = [
        "hooks load it automatically",
        "ready means current",
        "ready for handoff",
        "private docs are confidential",
        "self-updating documentation",
      ];

      for (const surface of surfaces) {
        assert.match(surface, /project memory/i);
        for (const claim of forbiddenClaims) assert.doesNotMatch(surface, new RegExp(claim, "i"));
      }

      assert.match(readme, /session-start`? supplies one compact routing pointer/i);
      assert.match(readme, /agents maintain (?:the )?project memory during normal work/i);
      assert.match(readme, /deterministic checks do not prove semantic truth/i);
      assert.match(readme, /publication metadata does not change (?:the )?Git repository visibility/i);
      assert.match(readme, /Benjamin Docs never needs to alter the substantive final answer/i);
    });
  });

  it("prints the package version with --version and -v", () => {
    withTempDir((dir) => {
      const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));

      assert.equal(runCli(["--version"], dir).trim(), pkg.version);
      assert.equal(runCli(["-v"], dir).trim(), pkg.version);
    });
  });

  it("publishes the short bd bin alias", () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));

    assert.equal(pkg.bin["benjamin-docs"], "dist/src/cli.js");
    assert.equal(pkg.bin.bd, "dist/src/cli.js");
  });

  it("prints concise help with the main command surface", () => {
    withTempDir((dir) => {
      const output = runCli(["help"], dir);

      assert.match(output, /benjamin-docs/);
      assert.match(output, /Persistent project memory/);
      assert.match(output, /living project knowledge/);
      assert.match(output, /Start a new session with pointers to context/);
      assert.match(output, /benjamin-docs init/);
      assert.match(output, /benjamin-docs ready/);
      assert.match(output, /benjamin-docs export/);
      assert.match(output, /benjamin-docs help/);
      assert.match(output, /benjamin-docs views/);
      assert.match(output, /benjamin-docs init[\s\S]*benjamin-docs views[\s\S]*benjamin-docs ready/);
      assert.match(output, /Use the benjamin-docs skill to create a project from this chat/);
      assert.match(output, /benjamin-docs package-skill/);
      assert.match(output, /benjamin-docs commands/);
      assert.doesNotMatch(output, /benjamin-docs validate/);
      assert.doesNotMatch(output, /benjamin-docs doctor --strict/);
      assert.doesNotMatch(output, /benjamin-docs export --audience developer/);
    });
  });

  it("prints help for help flags", () => {
    withTempDir((dir) => {
      assert.match(runCli(["--help"], dir), /benjamin-docs ready/);
      assert.match(runCli(["-h"], dir), /benjamin-docs ready/);
    });
  });

  it("prints a plain-language introduction", () => {
    withTempDir((dir) => {
      const output = runCli(["introduce"], dir);

      assert.match(output, /persistent project memory/i);
      assert.match(output, /living project knowledge/);
      assert.match(output, /Continuity is the product/);
      assert.match(output, /Inside a project, run:/);
      assert.match(output, /auto-detects codebase memory, installs agent guidance, and offers agent session hooks/);
      assert.match(output, /session-start supplies a compact pointer\/context packet/);
      assert.match(output, /Agents maintain project memory during normal work/);
      assert.match(output, /benjamin-docs drift reports watched docs behind committed code/);
      assert.match(output, /From any chat, ask your agent:/);
      assert.match(output, /No cloud\. No dashboard\. No transcript dump\./);
      assert.match(output, /benjamin-docs install-skill/);
      assert.match(output, /Use the benjamin-docs skill to create a project from this chat/);
      assert.match(output, /benjamin-docs chat-project/);
      assert.match(output, /benjamin-docs init/);
      assert.match(output, /benjamin-docs views/);
      assert.match(output, /benjamin-docs ready/);
      assert.match(output, /benjamin-docs export/);
      assert.match(output, /benjamin-docs help/);
      assert.match(output, /benjamin-docs commands/);
      assert.match(output, /Read the Benjamin Docs project memory, capture the current baseline, and keep it updated as you work/);
      assert.doesNotMatch(output, /benjamin-docs validate/);
      assert.doesNotMatch(output, /local notebook/i);
    });
  });

  it("prints chat-to-project confirmation guidance", () => {
    withTempDir((dir) => {
      const output = runCli(["chat-project", "--name", "Daily Handover Printable PDF"], dir);

      assert.match(output, /Before writing files, ask the user:/);
      assert.match(output, /Project name: Daily Handover Printable PDF/);
      assert.match(output, /Suggested folder: ~\/Documents\/Benjamin Docs\/Daily Handover Printable PDF/);
      assert.match(output, /Reply "yes" to create it/);
      assert.match(output, /benjamin-docs init --mode planning/);
      assert.match(output, /benjamin-docs views/);
      assert.match(output, /benjamin-docs ready/);
      assert.match(output, /If ready fails/);
      assert.match(output, /validate, review, or doctor --strict/);
      assert.doesNotMatch(output, /Run: benjamin-docs validate/);
      assert.match(output, /benjamin-docs\/ with project, handoff, engineering, features, releases, and views docs/);
      assert.match(output, /\.benjamin-docs\/ with config, manifest, scopes, and anchors metadata/);
      assert.match(output, /Do not use temporary chat workspaces/);
    });
  });

  it("supports an explicit chat-to-project path", () => {
    withTempDir((dir) => {
      const output = runCli(["chat-project", "--name", "Atelier Edits", "--path", "~/Projects/Atelier Edits"], dir);

      assert.match(output, /Project name: Atelier Edits/);
      assert.match(output, /Suggested folder: ~\/Projects\/Atelier Edits/);
    });
  });

  it("returns exit code 1 with help text for an unknown command", () => {
    withTempDir((dir) => {
      const result = runCliResult(["unknown"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /Unknown command: unknown/);
      assert.match(result.stderr, /benjamin-docs init/);
      assert.match(result.stderr, /benjamin-docs commands/);
      assert.doesNotMatch(result.stderr, /benjamin-docs validate/);
    });
  });
});
