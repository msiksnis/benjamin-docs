import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runCli, runCliResult, withTempDir } from "./helpers.js";

describe("info commands", () => {
  it("prints the package version with --version and -v", () => {
    withTempDir((dir) => {
      const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));

      assert.equal(runCli(["--version"], dir).trim(), pkg.version);
      assert.equal(runCli(["-v"], dir).trim(), pkg.version);
    });
  });

  it("prints help with command examples", () => {
    withTempDir((dir) => {
      const output = runCli(["help"], dir);

      assert.match(output, /benjamin-docs --version/);
      assert.match(output, /What it does/);
      assert.match(output, /plain language/);
      assert.match(output, /Use the benjamin-docs skill to create a project from this chat/);
      assert.match(output, /Documents\/Benjamin Docs/);
      assert.match(output, /benjamin-docs chat-project/);
      assert.match(output, /benjamin-docs init/);
      assert.match(output, /benjamin-docs validate/);
      assert.match(output, /benjamin-docs export --audience developer/);
      assert.match(output, /benjamin-docs promote --to codebase/);
    });
  });

  it("prints help for help flags", () => {
    withTempDir((dir) => {
      assert.match(runCli(["--help"], dir), /benjamin-docs introduce/);
      assert.match(runCli(["-h"], dir), /benjamin-docs introduce/);
    });
  });

  it("prints a plain-language introduction", () => {
    withTempDir((dir) => {
      const output = runCli(["introduce"], dir);

      assert.match(output, /project memory/i);
      assert.match(output, /In terminal, run:/);
      assert.match(output, /From any chat, ask your agent:/);
      assert.match(output, /No cloud\. No dashboard\. No transcript dump\./);
      assert.match(output, /Use the benjamin-docs skill to create a project from this chat/);
      assert.match(output, /benjamin-docs chat-project/);
      assert.match(output, /benjamin-docs init/);
      assert.match(output, /Capture the current project baseline with benjamin-docs/);
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
      assert.match(output, /benjamin-docs\/ with project, handoff, engineering, features, and releases docs/);
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
      assert.match(result.stderr, /benjamin-docs validate/);
    });
  });
});
