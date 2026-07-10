import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { MAX_DOCS_ROOT_CHARACTERS } from "../src/session-context.js";
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
      assert.doesNotMatch(result.stdout, /doctor --strict/i);
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
      assert.doesNotMatch(result.stdout, /doctor --strict/i);
    });
  });

  it("passes when setup, validation, and review are clean", () => {
    withTempDir((dir) => {
      initializeGit(dir);
      runCliResult(["init", "--mode", "codebase"], dir);
      writeReadyBaseline(dir);
      commitAll(dir);

      const result = runCliResult(["ready"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 0);
      assert.match(result.stdout, /status: ready/);
      assert.match(result.stdout, /ok\s+validate/);
      assert.match(result.stdout, /ok\s+review/);
      assert.match(result.stdout, /ok\s+agent guidance - /);
      assert.match(result.stdout, /Repository memory passes the configured structural, heuristic, freshness, and guidance checks\./);
      assert.match(result.stdout, /These deterministic checks do not prove semantic truth; implementation verification remains an agent responsibility\./);
      assert.doesNotMatch(result.stdout, /docs useful|ready for handoff/i);
    });
  });

  it("keeps a maximum-length custom docs root valid through validate and ready", () => {
    withTempDir((dir) => {
      const docsRoot = "m".repeat(MAX_DOCS_ROOT_CHARACTERS);
      const env = { BENJAMIN_DOCS_HOME: dir };
      initializeGit(dir);
      runCliResult(["install-skill"], dir, env);
      runCliResult(["package-skill"], dir, env);
      const initialized = runCliResult(["init", "--mode", "codebase", "--docs-root", docsRoot], dir, env);
      assert.equal(initialized.status, 0, initialized.stderr);
      writeReadyBaseline(dir, docsRoot);
      commitAll(dir);

      const validation = runCliResult(["validate"], dir, env);
      assert.equal(validation.status, 0, validation.stderr);
      assert.doesNotMatch(validation.stderr, /watch\[\d+\] doc must be a safe relative path/);

      const ready = runCliResult(["ready"], dir, env);
      assert.equal(ready.status, 0, ready.stdout);
      assert.match(ready.stdout, /status: ready/);
      assert.doesNotMatch(ready.stdout, /watch\[\d+\] doc must be a safe relative path/);
    });
  });

  it("surfaces recorded environment and tooling blockers without failing readiness", () => {
    withTempDir((dir) => {
      initializeGit(dir);
      runCliResult(["install-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["package-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["init", "--mode", "codebase"], dir);
      writeReadyBaseline(dir);
      appendDocBody(
        dir,
        "benjamin-docs/handoff/agent-brief.md",
        "## Local Environment Blockers\n\n- Rust checks are blocked because cargo is not installed on this machine.\n- Backend pytest is blocked because PostgreSQL was not listening on 127.0.0.1:5432 and the connection was refused.\n",
      );
      appendDocBody(
        dir,
        "benjamin-docs/project/brief.md",
        "## Product Behavior\n\nBD can surface environment blockers such as missing cargo or PostgreSQL not listening when agents record concrete check results.\n",
      );
      commitAll(dir);

      const result = runCliResult(["ready"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 0);
      assert.match(result.stdout, /status: ready/);
      assert.match(result.stdout, /Recorded Environment \/ Tooling Blockers/);
      assert.match(result.stdout, /cargo is not installed/);
      assert.match(result.stdout, /PostgreSQL was not listening/);
      assert.match(result.stdout, /not BD setup failures/);
      assert.doesNotMatch(result.stdout, /such as missing cargo/);
    });
  });

  it("fails when status-bearing docs can never be flagged stale", () => {
    withTempDir((dir) => {
      runCliResult(["install-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["package-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["init", "--mode", "codebase"], dir);
      writeReadyBaseline(dir);
      setConfigWatch(dir, [
        { label: "api handlers", paths: ["handlers/**"], docs: ["benjamin-docs/engineering/code-map.md"] },
      ]);

      const result = runCliResult(["ready"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 1);
      assert.match(result.stdout, /status: not ready/);
      assert.match(result.stdout, /fail\s+review/);
      assert.match(result.stdout, /project\/roadmap\.md: Freshness blind spot/);
      assert.match(result.stdout, /handoff\/agent-brief\.md: Freshness blind spot/);
    });
  });

  it("fails when the agent brief does not prove continuation", () => {
    withTempDir((dir) => {
      runCliResult(["install-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["package-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["init", "--mode", "codebase"], dir);
      writeReadyBaseline(dir);
      writeBaselineDoc(
        dir,
        "benjamin-docs/handoff/agent-brief.md",
        "Agent Brief",
        "This handoff gives a broad orientation for future agents working on the local project memory tool. It explains that the repository should keep a small command surface and that the docs should stay plain enough for owners, teammates, and implementation agents. Run benjamin-docs ready and pnpm check after edits. The text is intentionally long enough to be substantial, but it omits several concrete proof pieces the review gate expects.",
      );

      const result = runCliResult(["ready"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 1);
      assert.match(result.stdout, /status: not ready/);
      assert.match(result.stdout, /fail\s+review/);
      assert.match(result.stdout, /Agent brief should include continuation proof/);
    });
  });

  it("includes agent guidance health when AGENTS.md exists", () => {
    withTempDir((dir) => {
      initializeGit(dir);
      runCliResult(["install-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["package-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["init", "--mode", "codebase", "--agent-contract"], dir);
      writeReadyBaseline(dir);
      commitAll(dir);

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
      initializeGit(dir);
      runCliResult(["install-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["package-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["init", "--mode", "codebase", "--no-agent-contract"], dir);
      writeReadyBaseline(dir);
      writeFileSync(join(dir, "AGENTS.md"), "# Existing Agent Rules\n\nKeep these.\n", "utf8");
      commitAll(dir);

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

function writeReadyBaseline(dir: string, docsRoot = "benjamin-docs"): void {
  writeBaselineDoc(dir, `${docsRoot}/project/brief.md`, "Project Brief", capturedBody("This product helps teams preserve project context across AI sessions. It serves owners, developers, and future agents. The important baseline is local-first documentation with clear handoff notes, not hosted publishing or transcript dumping."));
  writeBaselineDoc(dir, `${docsRoot}/project/roadmap.md`, "Roadmap", capturedBody("The current roadmap is to stabilize capture flows, improve existing-codebase onboarding, and keep README guidance short. Near-term work focuses on doc quality checks. Deferred work includes SaaS publishing, dashboards, and hosted collaboration."));
  writeBaselineDoc(dir, `${docsRoot}/project/open-questions.md`, "Open Questions", "## Decisions\n\n- Should review warnings become stricter over time?\n- Which docs should be required for feature captures?\n- Should package publishing stay manual until the project is more stable?\n");
  writeBaselineDoc(dir, `${docsRoot}/handoff/human-brief.md`, "Human Brief", capturedBody("This project is a local project-memory tool. It turns useful planning and build conversations into durable Markdown files. The important thing for a human reader is that docs stay inside the project and are meant to explain decisions, next steps, and open questions plainly."));
  writeBaselineDoc(dir, `${docsRoot}/handoff/agent-brief.md`, "Agent Brief", capturedBody("Future agents should read the README, project brief, roadmap, open questions, architecture, and code map before changing behavior. Preserve local-first behavior, ask before creating chat projects, run benjamin-docs ready and pnpm check after edits, and avoid risky assumptions or hazards when context is missing. Next action is to improve deterministic review without making the CLI harder to use."));
  writeBaselineDoc(dir, `${docsRoot}/engineering/architecture.md`, "Architecture", capturedBody("The CLI is a Node command that writes a docs workspace and metadata into the current project. Metadata lives in .benjamin-docs while human-readable docs live under benjamin-docs. Validation checks frontmatter, manifest entries, anchors, links, and path safety."));
  writeBaselineDoc(dir, `${docsRoot}/engineering/code-map.md`, "Code Map", capturedBody("The main CLI entry is src/cli.ts. Initialization lives in src/init.ts. Validation lives in src/validate.ts. Skill installation lives in src/install-skill.ts. Prompt helpers live in src/next.ts and src/chat-project.ts. Tests live under test."));
  writeBaselineDoc(dir, `${docsRoot}/features/index.md`, "Features Index", capturedBody("Feature scopes are created only when a distinct change needs its own brief, plan, decisions, and handoff. Current work is focused on baseline capture quality. Deferred feature work includes hosted publishing and collaboration."));
  writeBaselineDoc(dir, `${docsRoot}/releases/changelog.md`, "Changelog", capturedBody("Recent changes include initialization, validation, review, readiness checks, agent guidance, skill installation, and package publishing. Release notes should stay concrete and mention behavior that future users or agents need to know."));
}

function initializeGit(dir: string): void {
  git(dir, "init");
}

function commitAll(dir: string): void {
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

function writeBaselineDoc(root: string, path: string, title: string, body: string): void {
  const fullPath = join(root, path);
  const current = readFileSync(fullPath, "utf8");
  const next = current.replace(/title: .+/, `title: ${title}`).replace(/\n---\n\n[\s\S]*$/, `\n---\n\n# ${title}\n\n${body}`);
  writeFileSync(fullPath, next, "utf8");
}

function capturedBody(seed: string): string {
  return `${seed}\n\nIt records concrete decisions, risks, current status, and next actions. The doc should be useful to a person arriving cold and to an agent that needs enough context to continue without asking the owner to repeat the whole project history.`;
}

function setConfigWatch(root: string, watch: Array<{ label?: string; paths: string[]; docs: string[] }>): void {
  const configPath = join(root, ".benjamin-docs/config.json");
  const config = JSON.parse(readFileSync(configPath, "utf8")) as Record<string, unknown>;
  config.watch = watch;
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function appendDocBody(root: string, path: string, body: string): void {
  const fullPath = join(root, path);
  writeFileSync(fullPath, `${readFileSync(fullPath, "utf8").trimEnd()}\n\n${body}`, "utf8");
}
