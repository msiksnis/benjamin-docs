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

      assert.match(output, /agent-docs init/);
      assert.match(output, /agent-docs validate/);
      assert.match(output, /agent-docs export --audience developer/);
    });
  });

  it("prints help for help flags", () => {
    withTempDir((dir) => {
      assert.match(runCli(["--help"], dir), /agent-docs introduce/);
      assert.match(runCli(["-h"], dir), /agent-docs introduce/);
    });
  });

  it("prints a plain-language introduction", () => {
    withTempDir((dir) => {
      const output = runCli(["introduce"], dir);

      assert.match(output, /project memory/i);
      assert.match(output, /humans/i);
      assert.match(output, /AI agents/i);
      assert.match(output, /source of truth/i);
    });
  });

  it("returns exit code 1 with help text for an unknown command", () => {
    withTempDir((dir) => {
      const result = runCliResult(["unknown"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /Unknown command: unknown/);
      assert.match(result.stderr, /agent-docs init/);
      assert.match(result.stderr, /agent-docs validate/);
    });
  });
});
