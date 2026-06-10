import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli, runCliResult, withTempDir } from "./helpers.js";

describe("scopes and anchors", () => {
  it("creates a feature scope with starter docs and metadata", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      const output = runCli(["scope", "create", "feature", "booking-capacity"], dir);

      assert.match(output, /Created feature scope booking-capacity/);
      assert.equal(existsSync(join(dir, "benjamin-docs/features/booking-capacity/brief.md")), true);
      assert.equal(existsSync(join(dir, "benjamin-docs/features/booking-capacity/plan.md")), true);
      assert.equal(existsSync(join(dir, "benjamin-docs/features/booking-capacity/decisions.md")), true);
      assert.equal(existsSync(join(dir, "benjamin-docs/features/booking-capacity/handoff.md")), true);
      assert.match(readFileSync(join(dir, "benjamin-docs/features/booking-capacity/handoff.md"), "utf8"), /## Continuation Proof/);

      const scopes = JSON.parse(readFileSync(join(dir, ".benjamin-docs/scopes.json"), "utf8")) as {
        scopes: Array<{ id: string; kind: string; path: string }>;
      };
      const manifest = JSON.parse(readFileSync(join(dir, ".benjamin-docs/manifest.json"), "utf8")) as {
        docs: string[];
      };
      assert.deepEqual(
        scopes.scopes.find((scope) => scope.id === "booking-capacity"),
        {
          id: "booking-capacity",
          kind: "feature",
          title: "Booking Capacity",
          path: "benjamin-docs/features/booking-capacity",
          status: "draft",
        },
      );
      assert.equal(manifest.docs.includes("benjamin-docs/features/booking-capacity/brief.md"), true);
    });
  });

  it("rejects duplicate scope ids", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      runCli(["scope", "create", "feature", "booking-capacity"], dir);

      const result = runCliResult(["scope", "create", "feature", "booking-capacity"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /Scope already exists: booking-capacity/);
    });
  });

  it("rejects unsupported scope kinds", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);

      const result = runCliResult(["scope", "create", "release", "v1"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /supports feature scopes/);
    });
  });

  it("rejects unsafe feature slugs", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);

      for (const slug of ["../escape", "feature/name", "/tmp/escape", "Feature", "feature_name"]) {
        const result = runCliResult(["scope", "create", "feature", slug], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /Invalid feature slug/);
      }
    });
  });

  it("rejects a symlinked feature docs directory during scope creation", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "benjamin-docs-outside-"));
      try {
        runCli(["init"], dir);
        symlinkSync(outsideDir, join(dir, "benjamin-docs/features/booking-capacity"), "dir");

        const result = runCliResult(["scope", "create", "feature", "booking-capacity"], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /Generated output path must not be a symlink: benjamin-docs\/features\/booking-capacity/);
        assert.equal(existsSync(join(outsideDir, "brief.md")), false);
      } finally {
        rmSync(outsideDir, { recursive: true, force: true });
      }
    });
  });

  it("adds a code anchor with metadata", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      mkdirSync(join(dir, "src/features/booking"), { recursive: true });
      writeFileSync(join(dir, "src/features/booking/capacity.ts"), "export const capacity = 1;\n");

      const output = runCli(["anchor", "add", "booking-capacity-rules", "src/features/booking/capacity.ts"], dir);

      assert.match(output, /Added anchor booking-capacity-rules/);
      const anchors = JSON.parse(readFileSync(join(dir, ".benjamin-docs/anchors.json"), "utf8")) as {
        anchors: Record<string, { file: string; docs: string[] }>;
      };
      assert.deepEqual(anchors.anchors["booking-capacity-rules"], {
        file: "src/features/booking/capacity.ts",
        docs: [],
      });
    });
  });

  it("lists code anchors", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      mkdirSync(join(dir, "src/features/booking"), { recursive: true });
      writeFileSync(join(dir, "src/features/booking/capacity.ts"), "export const capacity = 1;\n");
      writeFileSync(join(dir, "src/features/booking/rules.ts"), "export const rules = [];\n");
      runCli(["anchor", "add", "booking-rules", "src/features/booking/rules.ts"], dir);
      runCli(["anchor", "add", "booking-capacity", "src/features/booking/capacity.ts"], dir);

      const output = runCli(["anchor", "list"], dir);

      assert.match(output, /benjamin-docs anchors/);
      assert.match(output, /- booking-capacity: src\/features\/booking\/capacity\.ts/);
      assert.match(output, /- booking-rules: src\/features\/booking\/rules\.ts/);
    });
  });

  it("prints anchor help", () => {
    withTempDir((dir) => {
      const output = runCli(["anchor", "--help"], dir);

      assert.match(output, /benjamin-docs anchor/);
      assert.match(output, /benjamin-docs anchor add <id> <file>/);
      assert.match(output, /benjamin-docs anchor list/);
    });
  });

  it("prints scope help", () => {
    withTempDir((dir) => {
      const output = runCli(["scope", "--help"], dir);

      assert.match(output, /benjamin-docs scope/);
      assert.match(output, /benjamin-docs scope create feature <slug>/);
    });
  });

  it("rejects a symlinked metadata directory during anchor add", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "benjamin-docs-outside-"));
      try {
        runCli(["init"], dir);
        writeFileSync(join(dir, "safe.ts"), "export const safe = true;\n");
        rmSync(join(dir, ".benjamin-docs"), { recursive: true, force: true });
        symlinkSync(outsideDir, join(dir, ".benjamin-docs"), "dir");

        const result = runCliResult(["anchor", "add", "safe-anchor", "safe.ts"], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /Metadata path must not be a symlink: \.benjamin-docs/);
        assert.equal(existsSync(join(outsideDir, "anchors.json")), false);
      } finally {
        rmSync(outsideDir, { recursive: true, force: true });
      }
    });
  });

  it("rejects unsafe anchor ids", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      writeFileSync(join(dir, "safe.ts"), "export const safe = true;\n");

      for (const id of ["../rules", "rules/name", "/tmp/rules", "Rules", "rules_name"]) {
        const result = runCliResult(["anchor", "add", id, "safe.ts"], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /Invalid anchor id/);
      }
    });
  });

  it("rejects unsafe anchor file paths", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);

      for (const file of ["../package.json", "/tmp/package.json"]) {
        const result = runCliResult(["anchor", "add", "booking-capacity-rules", file], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /Invalid anchor file/);
      }
    });
  });

  it("rejects anchor files that do not exist inside the root", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);

      const result = runCliResult(["anchor", "add", "booking-capacity-rules", "src/missing.ts"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /Anchor file does not exist: src\/missing\.ts/);
    });
  });

  it("rejects directory anchor targets", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      mkdirSync(join(dir, "src/features/booking"), { recursive: true });

      const result = runCliResult(["anchor", "add", "booking-capacity-rules", "src/features/booking"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /Anchor target must be a regular file: src\/features\/booking/);
    });
  });

  it("rejects symlink anchor targets that resolve outside the root", () => {
    withTempDir((dir) => {
      const outsideDir = mkdtempSync(join(tmpdir(), "benjamin-docs-outside-"));
      try {
        runCli(["init"], dir);
        writeFileSync(join(outsideDir, "secret.ts"), "export const secret = true;\n");
        symlinkSync(join(outsideDir, "secret.ts"), join(dir, "secret-link.ts"), "file");

        const result = runCliResult(["anchor", "add", "secret-link", "secret-link.ts"], dir);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /Anchor target must remain inside project root: secret-link\.ts/);
      } finally {
        rmSync(outsideDir, { recursive: true, force: true });
      }
    });
  });
});
