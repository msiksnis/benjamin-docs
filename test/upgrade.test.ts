import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compareVersions, isUpdateCacheStale } from "../src/update-check.js";
import { runCliResult, withTempDir } from "./helpers.js";

function stripBdVersion(dir: string): void {
  const configPath = join(dir, ".benjamin-docs/config.json");
  const config = JSON.parse(readFileSync(configPath, "utf8")) as Record<string, unknown>;
  delete config.bdVersion;
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

function seedUpdateCache(homeDir: string, latest: string, lastChecked: string): void {
  mkdirSync(join(homeDir, ".benjamin-docs"), { recursive: true });
  writeFileSync(join(homeDir, ".benjamin-docs/update-check.json"), JSON.stringify({ lastChecked, latest }));
}

describe("upgrade", () => {
  it("fails when benjamin-docs is not initialized", () => {
    withTempDir((dir) => {
      const result = runCliResult(["upgrade"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stdout, /benjamin-docs is not initialized here/);
    });
  });

  it("stamps bdVersion, refreshes agent guidance, and suggests hooks", () => {
    withTempDir((dir) => {
      withTempDir((home) => {
        runCliResult(["init", "--mode", "codebase"], dir, { BENJAMIN_DOCS_HOME: home });
        stripBdVersion(dir);
        const agentsPath = join(dir, "AGENTS.md");
        writeFileSync(agentsPath, readFileSync(agentsPath, "utf8").replace(/- Run `benjamin-docs drift`[^\n]*\n/, ""));

        const result = runCliResult(["upgrade"], dir, { BENJAMIN_DOCS_HOME: home });

        assert.equal(result.status, 0);
        assert.match(result.stdout, /Project metadata: recorded before 0\.10\.0 -> /);
        assert.match(result.stdout, /Agent guidance: refreshed the Benjamin-owned AGENTS\.md section/);
        assert.match(result.stdout, /Hooks: not installed/);
        assert.doesNotMatch(result.stdout, /Update check/);

        const config = JSON.parse(readFileSync(join(dir, ".benjamin-docs/config.json"), "utf8")) as { bdVersion?: string };
        assert.ok(config.bdVersion);
        assert.match(readFileSync(agentsPath, "utf8"), /benjamin-docs drift/);

        const again = runCliResult(["upgrade"], dir, { BENJAMIN_DOCS_HOME: home });
        assert.match(again.stdout, /Project metadata already records CLI /);
      });
    });
  });

  it("installs hooks with --hooks and skips with --no-hooks", () => {
    withTempDir((dir) => {
      withTempDir((home) => {
        runCliResult(["init", "--mode", "codebase", "--no-agent-contract"], dir, { BENJAMIN_DOCS_HOME: home });

        const skipped = runCliResult(["upgrade", "--no-hooks"], dir, { BENJAMIN_DOCS_HOME: home });
        assert.match(skipped.stdout, /Hooks: skipped/);

        const result = runCliResult(["upgrade", "--hooks"], dir, { BENJAMIN_DOCS_HOME: home });
        assert.match(result.stdout, /Hooks: installed for 3 agent targets/);
        assert.ok(readFileSync(join(dir, ".claude/settings.json"), "utf8").includes("benjamin-docs session-start"));
      });
    });
  });

  it("keeps an unmarked user AGENTS.md untouched", () => {
    withTempDir((dir) => {
      withTempDir((home) => {
        runCliResult(["init", "--mode", "codebase", "--no-agent-contract"], dir, { BENJAMIN_DOCS_HOME: home });
        writeFileSync(join(dir, "AGENTS.md"), "# My own rules\n\nDo not touch.\n");

        const result = runCliResult(["upgrade"], dir, { BENJAMIN_DOCS_HOME: home });

        assert.match(result.stdout, /no Benjamin-owned AGENTS\.md section found; leaving AGENTS\.md alone/);
        assert.equal(readFileSync(join(dir, "AGENTS.md"), "utf8"), "# My own rules\n\nDo not touch.\n");
      });
    });
  });
});

describe("upgrade hints", () => {
  it("ready shows an advisory upgrade hint for repos initialized before 0.10.0", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase", "--no-agent-contract"], dir);
      stripBdVersion(dir);

      const result = runCliResult(["ready"], dir);
      assert.match(result.stdout, /Upgrade \(advisory\)/);
      assert.match(result.stdout, /benjamin-docs upgrade/);
    });
  });

  it("ready shows no upgrade hint when bdVersion is current", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase", "--no-agent-contract"], dir);

      const result = runCliResult(["ready"], dir);
      assert.doesNotMatch(result.stdout, /Upgrade \(advisory\)/);
    });
  });

  it("session-start reports version skew and cached update availability", () => {
    withTempDir((dir) => {
      withTempDir((home) => {
        runCliResult(["init", "--mode", "codebase", "--no-agent-contract"], dir, { BENJAMIN_DOCS_HOME: home });

        const configPath = join(dir, ".benjamin-docs/config.json");
        const config = JSON.parse(readFileSync(configPath, "utf8")) as Record<string, unknown>;
        config.bdVersion = "0.9.0";
        writeFileSync(configPath, JSON.stringify(config, null, 2));

        seedUpdateCache(home, "99.0.0", new Date().toISOString());

        const result = runCliResult(["session-start"], dir, { BENJAMIN_DOCS_HOME: home, BENJAMIN_DOCS_NO_UPDATE_CHECK: "0" });

        assert.match(result.stdout, /last upgraded at 0\.9\.0/);
        assert.match(result.stdout, /Run: benjamin-docs upgrade/);
        assert.match(result.stdout, /benjamin-docs 99\.0\.0 is available/);
      });
    });
  });

  it("session-start stays quiet about updates when checks are disabled", () => {
    withTempDir((dir) => {
      withTempDir((home) => {
        runCliResult(["init", "--mode", "codebase", "--no-agent-contract"], dir, { BENJAMIN_DOCS_HOME: home });
        seedUpdateCache(home, "99.0.0", new Date().toISOString());

        const result = runCliResult(["session-start"], dir, { BENJAMIN_DOCS_HOME: home });

        assert.doesNotMatch(result.stdout, /99\.0\.0/);
      });
    });
  });
});

describe("update-check helpers", () => {
  it("compares versions numerically", () => {
    assert.equal(compareVersions("0.10.0", "0.9.3"), 1);
    assert.equal(compareVersions("0.9.3", "0.10.0"), -1);
    assert.equal(compareVersions("1.0.0", "1.0.0"), 0);
    assert.equal(compareVersions("v1.2.3", "1.2.2"), 1);
    assert.equal(compareVersions("not-a-version", "1.0.0"), 0);
  });

  it("treats missing, malformed, and old caches as stale", () => {
    const now = Date.parse("2026-07-09T12:00:00Z");
    assert.equal(isUpdateCacheStale(undefined, now), true);
    assert.equal(isUpdateCacheStale({ lastChecked: "not-a-date", latest: "1.0.0" }, now), true);
    assert.equal(isUpdateCacheStale({ lastChecked: "2026-07-01T12:00:00Z", latest: "1.0.0" }, now), true);
    assert.equal(isUpdateCacheStale({ lastChecked: "2026-07-09T11:00:00Z", latest: "1.0.0" }, now), false);
  });
});
