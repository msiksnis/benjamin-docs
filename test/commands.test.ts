import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { allCommands } from "../src/commands.js";
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
      assert.match(output, /benjamin-docs anchor list/);
      assert.match(output, /benjamin-docs install-skill/);
      assert.match(output, /benjamin-docs package-skill/);
      assert.match(output, /\s+1\. benjamin-docs init/);
      assert.match(output, /\s+16\. benjamin-docs chat-project/);
      assert.match(output, /type a number/);
    });
  });

  it("maps every drawer entry to runnable cli args", () => {
    const commands = allCommands();

    assert.equal(commands.length, 16);
    assert.deepEqual(commands[0]?.args, ["init"]);
    assert.deepEqual(commands[1]?.args, ["ready"]);
    assert.deepEqual(commands[5]?.args, ["validate"]);
    assert.deepEqual(commands[9]?.args, ["export", "--audience", "developer"]);
    assert.deepEqual(commands[10]?.args, ["scope", "create", "feature", "<slug>"]);
    assert.deepEqual(commands[11]?.args, ["anchor", "add", "<id>", "<file>"]);
    assert.deepEqual(commands[12]?.args, ["anchor", "list"]);
  });
});
