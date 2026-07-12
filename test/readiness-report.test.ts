import { execFileSync } from "node:child_process";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { analyzeReadiness, type ReadinessDimensionId } from "../src/readiness.js";
import { runCliResult, withTempDir } from "./helpers.js";

const DIMENSION_IDS: ReadinessDimensionId[] = [
  "structure",
  "content_heuristics",
  "committed_freshness",
  "working_tree_impact",
  "agent_guidance",
];

const CROSS_STACK_PATHS = [
  "Sources/App.swift",
  "app/src/main/Main.kt",
  "src/App.cs",
  "lib/main.dart",
  "src/App.vue",
  "src/App.svelte",
  "scripts/deploy.sh",
  "config/runtime.toml",
];

describe("structured readiness", () => {
  it("reports a pristine captured repository as ready", () => {
    withTempDir((dir) => {
      setUpCapturedRepository(dir);

      const report = analyzeReadiness({ cwd: dir });

      assert.equal(report.schemaVersion, 1);
      assert.equal(report.status, "ready");
      assert.deepEqual(report.dimensions.map((dimension) => dimension.id), DIMENSION_IDS);
      assert.equal(report.dimensions.every((dimension) => !dimension.blocking || dimension.status === "pass"), true);
    });
  });

  it("blocks committed freshness when watched source changed after docs", () => {
    withTempDir((dir) => {
      setUpCapturedRepository(dir);
      writeFileSync(join(dir, "src/app.ts"), "export const value = 2;\n", "utf8");
      git(dir, "add", "src/app.ts");
      git(dir, "commit", "-m", "change source without memory");

      const report = analyzeReadiness({ cwd: dir });
      const freshness = dimension(report, "committed_freshness");
      const cli = runCliResult(["ready"], dir);

      assert.equal(report.status, "not_ready");
      assert.equal(freshness.status, "fail");
      assert.equal(freshness.blocking, true);
      assert.match(freshness.evidence.join("\n"), /src\/app\.ts|watched file/i);
      assert.equal(cli.status, 1);
    });
  });

  it("blocks working-tree impact for an untracked source file without a memory update", () => {
    withTempDir((dir) => {
      setUpCapturedRepository(dir);
      writeFileSync(join(dir, "src/new-feature.ts"), "export const newFeature = true;\n", "utf8");

      const report = analyzeReadiness({ cwd: dir });
      const workingTree = dimension(report, "working_tree_impact");
      const content = dimension(report, "content_heuristics");
      const cli = runCliResult(["ready"], dir);

      assert.equal(report.status, "not_ready");
      assert.equal(workingTree.status, "fail");
      assert.equal(workingTree.blocking, true);
      assert.equal(content.status, "pass");
      assert.match(workingTree.evidence.join("\n"), /Source files changed|May need update/);
      assert.equal(cli.status, 1);
    });
  });

  it("blocks working-tree impact for every repository stack", () => {
    for (const path of CROSS_STACK_PATHS) {
      withTempDir((dir) => {
        setUpCapturedRepository(dir);
        const fullPath = join(dir, path);
        mkdirSync(join(fullPath, ".."), { recursive: true });
        writeFileSync(fullPath, "changed repository behavior\n", "utf8");

        const report = analyzeReadiness({ cwd: dir });
        const workingTree = dimension(report, "working_tree_impact");

        assert.equal(workingTree.status, "fail", path);
        assert.match(workingTree.evidence.join("\n"), /Source files changed|May need update/, path);
      });
    }
  });

  it("blocks committed freshness when a watched source file is deleted", () => {
    withTempDir((dir) => {
      setUpCapturedRepository(dir);
      rmSync(join(dir, "src/app.ts"));
      git(dir, "add", "-A");
      git(dir, "commit", "-m", "delete source without memory");

      const report = analyzeReadiness({ cwd: dir });
      const freshness = dimension(report, "committed_freshness");

      assert.equal(report.status, "not_ready");
      assert.equal(freshness.status, "fail");
      assert.match(freshness.evidence.join("\n"), /src\/app\.ts|watched file/i);
    });
  });

  it("fails committed freshness closed when a committed watched diff exceeds the child-process default buffer", { skip: process.platform === "win32" }, () => {
    withTempDir((dir) => {
      setUpCapturedRepository(dir);
      const suffix = "x".repeat(110);
      for (let index = 0; index < 8_200; index += 1) {
        writeFileSync(
          join(dir, "src", `large-${String(index).padStart(5, "0")}-${suffix}.ts`),
          `export const value${index} = ${index};\n`,
          "utf8",
        );
      }
      git(dir, "add", "src");
      git(dir, "commit", "-q", "-m", "large watched source change without memory");

      const report = analyzeReadiness({ cwd: dir });
      const freshness = dimension(report, "committed_freshness");

      assert.equal(report.status, "not_ready");
      assert.equal(freshness.status, "fail");
      assert.equal(freshness.blocking, true);
      assert.match(freshness.evidence.join("\n"), /8,?200|large-00000|analysis failed/i);
      assert.equal(runCliResult(["ready", "--json"], dir).status, 1);
    });
  });

  it("keeps a non-Git planning folder usable when freshness is unavailable", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "planning", "--no-agent-contract", "--no-hooks"], dir);
      writeReadyBaseline(dir);

      const report = analyzeReadiness({ cwd: dir });
      const freshness = dimension(report, "committed_freshness");
      const workingTree = dimension(report, "working_tree_impact");

      assert.equal(report.status, "ready");
      assert.equal(freshness.status, "unavailable");
      assert.equal(freshness.blocking, false);
      assert.equal(workingTree.status, "unavailable");
      assert.equal(workingTree.blocking, false);
      assert.equal(runCliResult(["ready"], dir).status, 0);
    });
  });

  it("keeps a planning project usable in a Git repository without HEAD", () => {
    withTempDir((dir) => {
      git(dir, "init", "-q");
      runCliResult(["init", "--mode", "planning", "--no-agent-contract", "--no-hooks"], dir);
      writeReadyBaseline(dir);

      const report = analyzeReadiness({ cwd: dir });
      const freshness = dimension(report, "committed_freshness");
      const workingTree = dimension(report, "working_tree_impact");

      assert.equal(report.status, "ready");
      assert.equal(freshness.status, "unavailable");
      assert.equal(freshness.blocking, false);
      assert.match(freshness.summary, /planning mode remains usable/i);
      assert.equal(workingTree.status, "unavailable");
      assert.equal(workingTree.blocking, false);
      assert.match(workingTree.summary, /planning mode remains usable/i);
      assert.equal(runCliResult(["ready"], dir).status, 0);
    });
  });

  it("fails planning readiness closed when Git working-tree analysis fails", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "planning", "--no-agent-contract", "--no-hooks"], dir);
      writeReadyBaseline(dir);

      const report = analyzeReadiness({
        cwd: dir,
        dependencies: {
          getChangedFiles: () => ({
            files: [],
            ok: false,
            failure: {
              operation: "working-tree changes",
              message: "simulated Git execution failure",
            },
          }),
        },
      });
      const freshness = dimension(report, "committed_freshness");
      const workingTree = dimension(report, "working_tree_impact");

      assert.equal(report.status, "not_ready");
      assert.equal(freshness.status, "fail");
      assert.equal(freshness.blocking, true);
      assert.match(freshness.evidence.join("\n"), /working-tree changes.*simulated Git execution failure/i);
      assert.equal(workingTree.status, "fail");
      assert.equal(workingTree.blocking, true);
      assert.match(workingTree.evidence.join("\n"), /working-tree changes.*simulated Git execution failure/i);
    });
  });

  it("blocks enabled Benjamin agent guidance when AGENTS.md is broken", () => {
    withTempDir((dir) => {
      setUpCapturedRepository(dir, true);
      writeFileSync(join(dir, "AGENTS.md"), "<!-- benjamin-docs:start -->\nBroken\n", "utf8");

      const report = analyzeReadiness({ cwd: dir });
      const guidance = dimension(report, "agent_guidance");

      assert.equal(report.status, "not_ready");
      assert.equal(guidance.status, "fail");
      assert.equal(guidance.blocking, true);
      assert.match(guidance.evidence.join("\n"), /marker|unbalanced/i);
    });
  });

  it("keeps validation-only findings out of content heuristics", () => {
    withTempDir((dir) => {
      setUpCapturedRepository(dir);
      const anchorsPath = join(dir, ".benjamin-docs/anchors.json");
      const anchors = JSON.parse(readFileSync(anchorsPath, "utf8")) as {
        version: 1;
        anchors: Record<string, { file: string; docs: string[] }>;
      };
      anchors.anchors["Invalid Anchor"] = { file: "src/app.ts", docs: [] };
      writeFileSync(anchorsPath, `${JSON.stringify(anchors, null, 2)}\n`, "utf8");

      const report = analyzeReadiness({ cwd: dir });
      const structure = dimension(report, "structure");
      const content = dimension(report, "content_heuristics");

      assert.equal(report.status, "not_ready");
      assert.equal(structure.status, "fail");
      assert.match(structure.evidence.join("\n"), /Invalid anchor id: Invalid Anchor/);
      assert.equal(content.status, "pass");
      assert.deepEqual(content.evidence, []);
    });
  });

  it("blocks committed freshness when drift analysis throws even in planning mode", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "planning", "--no-agent-contract", "--no-hooks"], dir);
      writeReadyBaseline(dir);
      const report = analyzeReadiness({
        cwd: dir,
        dependencies: {
          detectDrift: () => {
            throw new Error("simulated drift analyzer failure");
          },
        },
      });
      const freshness = dimension(report, "committed_freshness");

      assert.equal(report.status, "not_ready");
      assert.equal(freshness.status, "fail");
      assert.equal(freshness.blocking, true);
      assert.match(freshness.evidence.join("\n"), /simulated drift analyzer failure/);
      assert.equal(freshness.repair, "benjamin-docs drift");
    });
  });

  it("preserves changed-work failures when drift analysis throws", () => {
    withTempDir((dir) => {
      setUpCapturedRepository(dir);
      writeFileSync(join(dir, "src/untracked-change.ts"), "export const changed = true;\n", "utf8");

      const report = analyzeReadiness({
        cwd: dir,
        dependencies: {
          detectDrift: () => {
            throw new Error("simulated committed freshness failure");
          },
        },
      });
      const freshness = dimension(report, "committed_freshness");
      const workingTree = dimension(report, "working_tree_impact");

      assert.equal(report.status, "not_ready");
      assert.equal(freshness.status, "fail");
      assert.match(freshness.evidence.join("\n"), /simulated committed freshness failure/);
      assert.equal(workingTree.status, "fail");
      assert.match(workingTree.evidence.join("\n"), /Source files changed|May need update/);
      assert.equal(workingTree.repair, "benjamin-docs review --changed --since HEAD");
    });
  });

  it("prints stable JSON without ANSI text", () => {
    withTempDir((dir) => {
      setUpCapturedRepository(dir);

      const result = runCliResult(["ready", "--json"], dir);
      const parsed = JSON.parse(result.stdout) as {
        schemaVersion: number;
        status: string;
        dimensions: Array<{ id: string }>;
      };

      assert.equal(result.status, 0);
      assert.equal(parsed.schemaVersion, 1);
      assert.equal(parsed.status, "ready");
      assert.deepEqual(parsed.dimensions.map((dimension) => dimension.id), DIMENSION_IDS);
      assert.doesNotMatch(result.stdout, /\u001b\[[0-9;]*m/);
    });
  });
});

function dimension(report: ReturnType<typeof analyzeReadiness>, id: ReadinessDimensionId) {
  const found = report.dimensions.find((candidate) => candidate.id === id);
  assert.ok(found, `missing readiness dimension: ${id}`);
  return found;
}

function setUpCapturedRepository(dir: string, agentContract = false): void {
  git(dir, "init");
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "src/app.ts"), "export const value = 1;\n", "utf8");
  const args = ["init", "--mode", "codebase", agentContract ? "--agent-contract" : "--no-agent-contract", "--no-hooks"];
  const initialized = runCliResult(args, dir);
  assert.equal(initialized.status, 0, initialized.stderr);
  writeReadyBaseline(dir);
  git(dir, "add", "-A");
  git(dir, "commit", "-m", "capture project memory");
}

function git(dir: string, ...args: string[]): void {
  execFileSync("git", ["-c", "user.email=test@example.com", "-c", "user.name=Test", ...args], {
    cwd: dir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function writeReadyBaseline(dir: string): void {
  writeBaselineDoc(dir, "benjamin-docs/project/brief.md", "Project Brief", capturedBody("This product helps teams preserve project context across AI sessions. It serves owners, developers, and future agents. The important baseline is local-first documentation with clear handoff notes, not hosted publishing or transcript dumping."));
  writeBaselineDoc(dir, "benjamin-docs/project/roadmap.md", "Roadmap", capturedBody("The current roadmap is to stabilize capture flows, improve existing-codebase onboarding, and keep README guidance short. Near-term work focuses on doc quality checks. Deferred work includes SaaS publishing, dashboards, and hosted collaboration."));
  writeBaselineDoc(dir, "benjamin-docs/project/open-questions.md", "Open Questions", "## Decisions\n\n- Should review warnings become stricter over time?\n- Which docs should be required for feature captures?\n- Should package publishing stay manual until the project is more stable?\n");
  writeBaselineDoc(dir, "benjamin-docs/handoff/human-brief.md", "Human Brief", capturedBody("This project is a local project-memory tool. It turns useful planning and build conversations into durable Markdown files. The important thing for a human reader is that docs stay inside the project and explain decisions, next steps, and open questions plainly."));
  writeBaselineDoc(dir, "benjamin-docs/handoff/agent-brief.md", "Agent Brief", capturedBody("Future agents should read the README, project brief, roadmap, open questions, architecture, and code map before changing behavior. Preserve local-first behavior, run benjamin-docs ready and pnpm check after edits, and avoid risky assumptions or hazards when context is missing. Next action is to improve deterministic review."));
  writeBaselineDoc(dir, "benjamin-docs/engineering/architecture.md", "Architecture", capturedBody("The CLI is a Node command that writes a docs workspace and metadata into the current project. Metadata lives in .benjamin-docs while human-readable docs live under benjamin-docs. Validation checks frontmatter, manifest entries, anchors, links, and path safety."));
  writeBaselineDoc(dir, "benjamin-docs/engineering/code-map.md", "Code Map", capturedBody("The main CLI entry is src/cli.ts. Initialization lives in src/init.ts. Validation lives in src/validate.ts. Skill installation lives in src/install-skill.ts. Prompt helpers live in src/next.ts and src/chat-project.ts. Tests live under test."));
  writeBaselineDoc(dir, "benjamin-docs/features/index.md", "Features Index", capturedBody("Feature scopes are created only when a distinct change needs its own brief, plan, decisions, and handoff. Current work is focused on baseline capture quality. Deferred feature work includes hosted publishing and collaboration."));
  writeBaselineDoc(dir, "benjamin-docs/releases/changelog.md", "Changelog", capturedBody("Recent changes include initialization, validation, review, readiness checks, agent guidance, skill installation, and package publishing. Release notes should stay concrete and mention behavior that future users or agents need to know."));
}

function writeBaselineDoc(root: string, path: string, title: string, body: string): void {
  const fullPath = join(root, path);
  const current = readFileSync(fullPath, "utf8");
  const next = current.replace(/title: .+/, `title: ${title}`).replace(/\n---\n\n[\s\S]*$/, `\n---\n\n# ${title}\n\n${body}`);
  writeFileSync(fullPath, next, "utf8");
}

function capturedBody(seed: string): string {
  return `${seed}\n\nIt records concrete decisions, risks, current status, and next actions. The doc should be useful to a person arriving cold and to an agent that needs enough context to continue without asking the owner to repeat the whole project history.`;
}
