import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runCli, runCliResult, withTempDir } from "./helpers.js";

describe("views", () => {
  it("generates memory views from managed docs and registers them in the manifest", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      runCli(["scope", "create", "feature", "memory-views"], dir);

      appendDoc(
        dir,
        "benjamin-docs/project/roadmap.md",
        [
          "## Immediate Next Work",
          "",
          "- Build Memory Views as an advanced command before promoting it to the main command list.",
        ].join("\n"),
      );
      appendDoc(
        dir,
        "benjamin-docs/project/open-questions.md",
        [
          "## Questions",
          "",
          "- Should views remain advanced until dogfooding proves they deserve main-command status?",
        ].join("\n"),
      );
      appendDoc(
        dir,
        "benjamin-docs/features/memory-views/decisions.md",
        [
          "## Decisions",
          "",
          "- Keep `bd init`, `bd ready`, and `bd help` as the primary path.",
          "",
          "## Rejected Options",
          "",
          "- Do not make Memory Views a hosted dashboard.",
        ].join("\n"),
      );
      appendDoc(
        dir,
        "benjamin-docs/features/memory-views/handoff.md",
        [
          "## Risks / Open Questions",
          "",
          "- Generated views must not become a second source of truth.",
          "",
          "## Next Actions",
          "",
          "- Add `bd views` to the advanced command drawer.",
          "",
          "## Continuation Proof",
          "",
          "- Read `src/commands.ts`, `src/cli.ts`, and `src/views.ts` before changing the feature.",
        ].join("\n"),
      );

      const output = runCli(["views"], dir);

      assert.match(output, /Generated Memory Views\. 5 files updated\./);

      const decisions = readDoc(dir, "benjamin-docs/views/decisions.md");
      assert.match(decisions, /features\/memory-views\/decisions\.md/);
      assert.match(decisions, /Keep `bd init`, `bd ready`, and `bd help` as the primary path\./);
      assert.match(decisions, /Do not make Memory Views a hosted dashboard\./);

      const openQuestions = readDoc(dir, "benjamin-docs/views/open-questions.md");
      assert.match(openQuestions, /What unresolved questions and open risks are captured across managed Benjamin docs\?/);
      assert.match(openQuestions, /Should views remain advanced/);
      assert.match(openQuestions, /Generated views must not become a second source of truth\./);

      const nextActions = readDoc(dir, "benjamin-docs/views/next-actions.md");
      assert.match(nextActions, /Build Memory Views as an advanced command/);
      assert.match(nextActions, /Add `bd views` to the advanced command drawer\./);

      const risks = readDoc(dir, "benjamin-docs/views/risks.md");
      assert.match(risks, /Generated views must not become a second source of truth\./);

      const continuation = readDoc(dir, "benjamin-docs/views/agent-continuation.md");
      assert.match(continuation, /Read `src\/commands\.ts`, `src\/cli\.ts`, and `src\/views\.ts` before changing the feature\./);

      const manifest = JSON.parse(readDoc(dir, ".benjamin-docs/manifest.json")) as { docs: string[] };
      assert.ok(manifest.docs.includes("benjamin-docs/views/decisions.md"));
      assert.ok(manifest.docs.includes("benjamin-docs/views/open-questions.md"));
      assert.ok(manifest.docs.includes("benjamin-docs/views/next-actions.md"));
      assert.ok(manifest.docs.includes("benjamin-docs/views/risks.md"));
      assert.ok(manifest.docs.includes("benjamin-docs/views/agent-continuation.md"));

      const validation = runCliResult(["validate"], dir);
      assert.equal(validation.status, 0);
      assert.match(validation.stdout, /Validation passed/);
    });
  });

  it("skips rewriting views when nothing changed", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      appendDoc(dir, "benjamin-docs/project/roadmap.md", ["## Next", "", "- Keep iterating on capture quality."].join("\n"));

      const first = runCli(["views"], dir);
      assert.match(first, /Generated Memory Views\. 5 files updated\./);

      const second = runCli(["views"], dir);
      assert.match(second, /Memory Views are already up to date\. 0 files updated\./);
    });
  });

  it("excludes archived scopes from generated views", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      runCli(["scope", "create", "feature", "old-feature"], dir);
      appendDoc(
        dir,
        "benjamin-docs/features/old-feature/decisions.md",
        ["## Decisions", "", "- Use the legacy export pipeline for the first release."].join("\n"),
      );

      runCli(["views"], dir);
      assert.match(readDoc(dir, "benjamin-docs/views/decisions.md"), /Use the legacy export pipeline/);

      runCli(["scope", "status", "old-feature", "archived"], dir);
      runCli(["views"], dir);

      const decisions = readDoc(dir, "benjamin-docs/views/decisions.md");
      assert.doesNotMatch(decisions, /Use the legacy export pipeline/);
      assert.doesNotMatch(decisions, /old-feature/);
    });
  });

  it("groups multiple matching sections under a single source heading", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      runCli(["scope", "create", "feature", "memory-views"], dir);
      appendDoc(
        dir,
        "benjamin-docs/features/memory-views/handoff.md",
        [
          "## Risks / Open Questions",
          "",
          "- Views must not become a second source of truth.",
          "",
          "## Next Actions",
          "",
          "- Dogfood grouped views on a real project.",
          "",
          "## Continuation Proof",
          "",
          "- Read `src/views.ts` before changing the renderer.",
        ].join("\n"),
      );

      runCli(["views"], dir);

      const continuation = readDoc(dir, "benjamin-docs/views/agent-continuation.md");
      const headerCount = continuation.split("## [memory-views Handoff]").length - 1;
      assert.equal(headerCount, 1);
      assert.match(continuation, /Views must not become a second source of truth\./);
      assert.match(continuation, /Dogfood grouped views on a real project\./);
      assert.match(continuation, /Read `src\/views\.ts` before changing the renderer\./);
    });
  });

  it("reports uninitialized projects clearly", () => {
    withTempDir((dir) => {
      const result = runCliResult(["views"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stderr, /Cannot generate Memory Views before benjamin-docs is initialized/);
    });
  });

  it("writes valid relative source links for custom docs roots", () => {
    withTempDir((dir) => {
      runCli(["init", "--docs-root", "project-memory"], dir);
      appendDoc(
        dir,
        "project-memory/project/roadmap.md",
        ["## Next", "", "- Verify Memory Views with a custom docs root."].join("\n"),
      );

      runCli(["views"], dir);

      const nextActions = readDoc(dir, "project-memory/views/next-actions.md");
      assert.match(nextActions, /\[Roadmap]\(\.\.\/project\/roadmap\.md\)/);
      assert.match(nextActions, /Verify Memory Views with a custom docs root\./);

      const validation = runCliResult(["validate"], dir);
      assert.equal(validation.status, 0);
      assert.match(validation.stdout, /Validation passed/);
    });
  });

  it("ignores markdown headings inside fenced code examples", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      appendDoc(
        dir,
        "benjamin-docs/project/roadmap.md",
        [
          "## Next",
          "",
          "- Keep the real next action.",
          "",
          "```md",
          "## Next Actions",
          "",
          "- Do not extract this template action.",
          "```",
        ].join("\n"),
      );

      runCli(["views"], dir);

      const nextActions = readDoc(dir, "benjamin-docs/views/next-actions.md");
      assert.match(nextActions, /Keep the real next action\./);
      assert.doesNotMatch(nextActions, /Do not extract this template action\./);

      const validation = runCliResult(["validate"], dir);
      assert.equal(validation.status, 0);
      assert.match(validation.stdout, /Validation passed/);
    });
  });
});

function appendDoc(root: string, relativePath: string, content: string): void {
  const path = join(root, relativePath);
  const existing = readFileSync(path, "utf8");
  writeFileSync(path, `${existing.trimEnd()}\n\n${content}\n`, "utf8");
}

function readDoc(root: string, relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}
