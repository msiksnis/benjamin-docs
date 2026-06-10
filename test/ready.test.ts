import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runCliResult, withTempDir } from "./helpers.js";

describe("ready", () => {
  it("fails when benjamin-docs is not initialized", () => {
    withTempDir((dir) => {
      const result = runCliResult(["ready"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 1);
      assert.match(result.stdout, /benjamin-docs ready/);
      assert.match(result.stdout, /status: not ready/);
      assert.match(result.stdout, /fail\s+validate/);
      assert.match(result.stdout, /fail\s+review/);
      assert.match(result.stdout, /fail\s+doctor --strict/);
    });
  });

  it("fails after init until starter docs are captured", () => {
    withTempDir((dir) => {
      runCliResult(["install-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["package-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["init", "--mode", "codebase"], dir);

      const result = runCliResult(["ready"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 1);
      assert.match(result.stdout, /status: not ready/);
      assert.match(result.stdout, /ok\s+validate/);
      assert.match(result.stdout, /fail\s+review/);
      assert.match(result.stdout, /starter template/);
      assert.match(result.stdout, /ok\s+doctor --strict/);
    });
  });

  it("passes when setup, validation, and review are clean", () => {
    withTempDir((dir) => {
      runCliResult(["install-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["package-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["init", "--mode", "codebase"], dir);
      writeReadyBaseline(dir);

      const result = runCliResult(["ready"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 0);
      assert.match(result.stdout, /status: ready/);
      assert.match(result.stdout, /ok\s+validate/);
      assert.match(result.stdout, /ok\s+review/);
      assert.match(result.stdout, /ok\s+doctor --strict/);
      assert.match(result.stdout, /ok\s+agent guidance - /);
      assert.match(result.stdout, /Project memory is ready for handoff/);
    });
  });

  it("includes agent guidance health when AGENTS.md exists", () => {
    withTempDir((dir) => {
      runCliResult(["install-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["package-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["init", "--mode", "codebase", "--agent-contract"], dir);
      writeReadyBaseline(dir);

      const result = runCliResult(["ready"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 0);
      assert.match(result.stdout, /ok\s+agent guidance - /);
      assert.match(result.stdout, /agent guidance/i);
    });
  });

  it("fails ready when Benjamin agent guidance has broken markers", () => {
    withTempDir((dir) => {
      runCliResult(["install-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["package-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["init", "--mode", "codebase", "--agent-contract"], dir);
      writeReadyBaseline(dir);
      writeFileSync(join(dir, "AGENTS.md"), "<!-- benjamin-docs:start -->\nBroken\n", "utf8");

      const result = runCliResult(["ready"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 1);
      assert.match(result.stdout, /fail\s+agent guidance/);
      assert.match(result.stdout, /unbalanced|marker/i);
    });
  });

  it("shows existing unmarked AGENTS.md as a non-fatal agent guidance warning", () => {
    withTempDir((dir) => {
      runCliResult(["install-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["package-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["init", "--mode", "codebase", "--no-agent-contract"], dir);
      writeReadyBaseline(dir);
      writeFileSync(join(dir, "AGENTS.md"), "# Existing Agent Rules\n\nKeep these.\n", "utf8");

      const result = runCliResult(["ready"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 0);
      assert.match(result.stdout, /ok\s+agent guidance/);
      assert.match(result.stdout, /warning: Existing AGENTS\.md/);
    });
  });

  it("fails when child agent guidance exists under unmarked root guidance", () => {
    withTempDir((dir) => {
      runCliResult(["install-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["package-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["init", "--mode", "codebase", "--agent-contract", "--children"], dir);
      writeReadyBaseline(dir);
      writeFileSync(join(dir, "AGENTS.md"), "# Existing Agent Rules\n\nKeep local policy.\n", "utf8");

      const result = runCliResult(["ready"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 1);
      assert.match(result.stdout, /status: not ready/);
      assert.match(result.stdout, /fail\s+agent guidance/);
      assert.match(result.stdout, /Child AGENTS\.md exists but is missing from root index: benjamin-docs\/AGENTS\.md/);
      assert.match(result.stdout, /warning: Existing AGENTS\.md/);
    });
  });

  it("fails when child agent guidance exists without a root AGENTS.md index", () => {
    withTempDir((dir) => {
      runCliResult(["install-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["package-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["init", "--mode", "codebase", "--agent-contract", "--children"], dir);
      writeReadyBaseline(dir);
      rmSync(join(dir, "AGENTS.md"));

      const result = runCliResult(["ready"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 1);
      assert.match(result.stdout, /status: not ready/);
      assert.match(result.stdout, /fail\s+agent guidance/);
      assert.match(result.stdout, /Child AGENTS\.md exists but root AGENTS\.md is missing: benjamin-docs\/AGENTS\.md/);
    });
  });
});

function writeReadyBaseline(dir: string): void {
  writeBaselineDoc(dir, "benjamin-docs/project/brief.md", "Project Brief", capturedBody("This product helps teams preserve project context across AI sessions. It serves owners, developers, and future agents. The important baseline is local-first documentation with clear handoff notes, not hosted publishing or transcript dumping."));
  writeBaselineDoc(dir, "benjamin-docs/project/roadmap.md", "Roadmap", capturedBody("The current roadmap is to stabilize capture flows, improve existing-codebase onboarding, and keep README guidance short. Near-term work focuses on doc quality checks. Deferred work includes SaaS publishing, dashboards, and hosted collaboration."));
  writeBaselineDoc(dir, "benjamin-docs/project/open-questions.md", "Open Questions", "## Decisions\n\n- Should review warnings become stricter over time?\n- Which docs should be required for feature captures?\n- Should package publishing stay manual until the project is more stable?\n");
  writeBaselineDoc(dir, "benjamin-docs/handoff/human-brief.md", "Human Brief", capturedBody("This project is a local project-memory tool. It turns useful planning and build conversations into durable Markdown files. The important thing for a human reader is that docs stay inside the project and are meant to explain decisions, next steps, and open questions plainly."));
  writeBaselineDoc(dir, "benjamin-docs/handoff/agent-brief.md", "Agent Brief", capturedBody("Future agents should read the README, project brief, roadmap, open questions, architecture, and code map before changing behavior. Preserve local-first behavior, ask before creating chat projects, run benjamin-docs ready and pnpm check after edits, and avoid risky assumptions or hazards when context is missing. Next action is to improve deterministic review without making the CLI harder to use."));
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
