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
      assert.match(output, /benjamin-docs export/);
      assert.match(output, /Advanced commands/);
      assert.match(output, /benjamin-docs validate/);
      assert.match(output, /benjamin-docs review/);
      assert.match(output, /benjamin-docs review --changed/);
      assert.match(output, /benjamin-docs doctor \[--strict\] \[--target shared\|claude-code\|codex\|cursor\|claude-desktop\]/);
      assert.match(output, /benjamin-docs views/);
      assert.match(output, /benjamin-docs export --verify <slug>/);
      assert.match(output, /benjamin-docs anchor list/);
      assert.match(output, /benjamin-docs install-skill/);
      assert.match(output, /benjamin-docs package-skill/);
      assert.match(output, /\s+1\. benjamin-docs init/);
      assert.match(output, /benjamin-docs scope status <slug> <status>/);
      assert.match(output, /benjamin-docs drift/);
      assert.match(output, /benjamin-docs hooks install/);
      assert.match(output, /benjamin-docs session-start/);
      assert.match(output, /benjamin-docs upgrade/);
      assert.match(output, /benjamin-docs mcp install/);
      assert.match(output, /\s+27\. benjamin-docs chat-project/);
      assert.doesNotMatch(output, /benjamin-docs export --audience developer/);
      assert.match(output, /type a number/);
    });
  });

  it("maps every drawer entry to runnable cli args", () => {
    const commands = allCommands();

    assert.equal(commands.length, 27);
    assert.deepEqual(commands[0]?.args, ["init"]);
    assert.deepEqual(commands[1]?.args, ["ready"]);
    assert.deepEqual(commands[2]?.args, ["export"]);
    assert.deepEqual(commands[3]?.args, ["upgrade"]);
    assert.deepEqual(commands[7]?.args, ["validate"]);
    assert.deepEqual(commands[9]?.args, ["review", "--changed"]);
    assert.deepEqual(commands[10]?.args, ["drift"]);
    assert.deepEqual(commands[11]?.args, ["hooks", "install"]);
    assert.deepEqual(commands[12]?.args, ["hooks", "status"]);
    assert.deepEqual(commands[13]?.args, ["mcp", "install"]);
    assert.deepEqual(commands[14]?.args, ["mcp", "status"]);
    assert.deepEqual(commands[15]?.args, ["session-start"]);
    assert.equal(commands[17]?.command, "benjamin-docs doctor [--strict] [--target shared|claude-code|codex|cursor|claude-desktop]");
    assert.deepEqual(commands[17]?.args, ["doctor", "--strict"]);
    assert.deepEqual(commands[18]?.args, ["views"]);
    assert.deepEqual(commands[19]?.args, ["export", "--verify", "<slug>", "--evidence", "<evidence>"]);
    assert.deepEqual(commands[20]?.args, ["scope", "create", "feature", "<slug>"]);
    assert.deepEqual(commands[21]?.args, ["scope", "status", "<slug>", "<status>"]);
    assert.deepEqual(commands[22]?.args, ["anchor", "add", "<id>", "<file>"]);
    assert.deepEqual(commands[23]?.args, ["anchor", "list"]);
  });
});
