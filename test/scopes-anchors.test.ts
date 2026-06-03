import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runCli, runCliResult, withTempDir } from "./helpers.js";

describe("scopes and anchors", () => {
  it("creates a feature scope with starter docs and metadata", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      const output = runCli(["scope", "create", "feature", "booking-capacity"], dir);

      assert.match(output, /Created feature scope booking-capacity/);
      assert.equal(existsSync(join(dir, "docs/features/booking-capacity/brief.md")), true);
      assert.equal(existsSync(join(dir, "docs/features/booking-capacity/plan.md")), true);
      assert.equal(existsSync(join(dir, "docs/features/booking-capacity/decisions.md")), true);
      assert.equal(existsSync(join(dir, "docs/features/booking-capacity/handoff.md")), true);

      const scopes = JSON.parse(readFileSync(join(dir, ".agent-docs/scopes.json"), "utf8")) as {
        scopes: Array<{ id: string; kind: string; path: string }>;
      };
      assert.deepEqual(
        scopes.scopes.find((scope) => scope.id === "booking-capacity"),
        {
          id: "booking-capacity",
          kind: "feature",
          title: "Booking Capacity",
          path: "docs/features/booking-capacity",
          status: "draft",
        },
      );
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

  it("adds a code anchor with metadata", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      mkdirSync(join(dir, "src/features/booking"), { recursive: true });
      writeFileSync(join(dir, "src/features/booking/capacity.ts"), "export const capacity = 1;\n");

      const output = runCli(["anchor", "add", "booking-capacity-rules", "src/features/booking/capacity.ts"], dir);

      assert.match(output, /Added anchor booking-capacity-rules/);
      const anchors = JSON.parse(readFileSync(join(dir, ".agent-docs/anchors.json"), "utf8")) as {
        anchors: Record<string, { file: string; docs: string[] }>;
      };
      assert.deepEqual(anchors.anchors["booking-capacity-rules"], {
        file: "src/features/booking/capacity.ts",
        docs: [],
      });
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
});
