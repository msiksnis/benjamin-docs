import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { stableGitEnvironment } from "../src/git.js";

describe("git diagnostics", () => {
  it("forces stable English diagnostics without dropping caller environment", () => {
    const environment = stableGitEnvironment({
      PATH: "/custom/bin",
      HOME: "/custom/home",
      LC_ALL: "nb_NO.UTF-8",
      LANG: "nb_NO.UTF-8",
      BENJAMIN_TEST_VALUE: "preserved",
    });

    assert.equal(environment.LC_ALL, "C");
    assert.equal(environment.LANG, "C");
    assert.equal(environment.PATH, "/custom/bin");
    assert.equal(environment.HOME, "/custom/home");
    assert.equal(environment.BENJAMIN_TEST_VALUE, "preserved");
  });
});
