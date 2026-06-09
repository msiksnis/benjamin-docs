import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runCli, withTempDir } from "./helpers.js";

describe("commands", () => {
  it("prints the full command drawer outside an interactive terminal", () => {
    withTempDir((dir) => {
      const output = runCli(["commands"], dir);

      assert.match(output, /benjamin-docs commands/);
      assert.match(output, /Main commands/);
      assert.match(output, /benjamin-docs init/);
      assert.match(output, /benjamin-docs ready/);
      assert.match(output, /Advanced commands/);
      assert.match(output, /benjamin-docs validate/);
      assert.match(output, /benjamin-docs review/);
      assert.match(output, /benjamin-docs doctor/);
      assert.match(output, /benjamin-docs export --audience developer/);
      assert.match(output, /benjamin-docs install-skill/);
      assert.match(output, /benjamin-docs package-skill/);
    });
  });
});
