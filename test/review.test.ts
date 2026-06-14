import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runCliResult, withTempDir } from "./helpers.js";

describe("review", () => {
  it("fails when benjamin-docs is not initialized", () => {
    withTempDir((dir) => {
      const result = runCliResult(["review"], dir);

      assert.equal(result.status, 1);
      assert.match(result.stdout, /benjamin-docs review/);
      assert.match(result.stdout, /status: failed/);
      assert.match(result.stdout, /benjamin-docs is not initialized/);
    });
  });

  it("warns for starter-template docs without failing", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);

      const result = runCliResult(["review"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stdout, /status: passed with warnings/);
      assert.match(result.stdout, /starter template/);
      assert.match(result.stdout, /Agent brief should include continuation proof/);
      assert.match(result.stdout, /human-brief\.md/);
      assert.match(result.stdout, /architecture\.md/);
    });
  });

  it("warns for untouched feature scope starter docs", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);
      runCliResult(["scope", "create", "feature", "checkout-flow"], dir);

      const result = runCliResult(["review"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stdout, /status: passed with warnings/);
      assert.match(result.stdout, /features\/checkout-flow\/brief\.md/);
      assert.match(result.stdout, /features\/checkout-flow\/plan\.md/);
      assert.match(result.stdout, /features\/checkout-flow\/decisions\.md/);
      assert.match(result.stdout, /features\/checkout-flow\/handoff\.md/);
      assert.match(result.stdout, /Still looks like a starter template/);
    });
  });

  it("passes for captured baseline docs", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);
      writeReviewBaseline(dir);

      const result = runCliResult(["review"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stdout, /status: passed/);
      assert.doesNotMatch(result.stdout, /Warnings/);
    });
  });

  it("warns when status-bearing docs have no watch coverage", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);
      writeReviewBaseline(dir);
      setConfigWatch(dir, [
        { label: "api handlers", paths: ["handlers/**"], docs: ["benjamin-docs/engineering/code-map.md"] },
      ]);

      const result = runCliResult(["review"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stdout, /status: passed with warnings/);
      assert.match(result.stdout, /project\/roadmap\.md: Freshness blind spot/);
      assert.match(result.stdout, /handoff\/human-brief\.md: Freshness blind spot/);
      assert.match(result.stdout, /handoff\/agent-brief\.md: Freshness blind spot/);
      assert.match(result.stdout, /can never be flagged stale/);
    });
  });

  it("warns when active feature docs have no watch coverage", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);
      writeReviewBaseline(dir);
      runCliResult(["scope", "create", "feature", "audit-remediation"], dir);
      setConfigWatch(dir, [
        { label: "api handlers", paths: ["handlers/**"], docs: ["benjamin-docs/engineering/code-map.md"] },
      ]);

      const result = runCliResult(["review"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stdout, /features\/audit-remediation\/brief\.md: Freshness blind spot/);
      assert.match(result.stdout, /features\/audit-remediation\/plan\.md: Freshness blind spot/);
      assert.match(result.stdout, /features\/audit-remediation\/decisions\.md: Freshness blind spot/);
      assert.match(result.stdout, /features\/audit-remediation\/handoff\.md: Freshness blind spot/);
    });
  });

  it("warns when the agent brief lacks continuation proof", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);
      writeReviewBaseline(dir);
      writeBaselineDoc(
        dir,
        "benjamin-docs/handoff/agent-brief.md",
        "Agent Brief",
        "This handoff gives a broad orientation for future agents working on the local project memory tool. It explains that the repository should keep a small command surface and that the docs should stay plain enough for owners, teammates, and implementation agents. Run benjamin-docs ready and pnpm check after edits. The text is intentionally long enough to be substantial, but it omits several concrete proof pieces the review gate expects.",
      );

      const result = runCliResult(["review"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stdout, /status: passed with warnings/);
      assert.match(result.stdout, /Agent brief should include continuation proof/);
      assert.match(result.stdout, /Missing: read-first docs, current state, risks\/hazards, next actions/);
    });
  });

  it("warns when implementation files changed without source docs updates", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);
      writeReviewBaseline(dir);
      writeSourceFile(dir, "src/app/[locale]/admin/products/page.tsx", "export default function ProductsPage() { return null; }\n");
      writeSourceFile(dir, "supabase/migrations/20260611052322_content.sql", "create table products (id uuid primary key);\n");
      commitAll(dir, "baseline");

      writeSourceFile(dir, "src/app/[locale]/admin/products/page.tsx", "export default function ProductsPage() { return 'products'; }\n");
      writeSourceFile(dir, "supabase/migrations/20260611055152_product_rpcs.sql", "create function admin_products() returns void language sql as $$ select 1; $$;\n");

      const result = runCliResult(["review", "--changed", "--since", "HEAD"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stdout, /status: passed with warnings/);
      assert.match(result.stdout, /changed files checked: 2/);
      assert.match(result.stdout, /Source files changed, but no Benjamin Docs source files changed/);
      assert.match(result.stdout, /benjamin-docs\/engineering\/architecture\.md/);
      assert.match(result.stdout, /benjamin-docs\/engineering\/code-map\.md/);
      assert.match(result.stdout, /benjamin-docs\/releases\/changelog\.md/);
    });
  });

  it("warns when changed review cannot inspect git history", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);
      writeReviewBaseline(dir);

      const result = runCliResult(["review", "--changed"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stdout, /status: passed with warnings/);
      assert.match(result.stdout, /Changed-work review needs git history/);
    });
  });

  it("warns when project docs still contain stale not-implemented claims for changed code areas", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);
      writeReviewBaseline(dir);
      writeBaselineDoc(
        dir,
        "benjamin-docs/engineering/architecture.md",
        "Architecture",
        capturedBody("Admin CMS routes are not implemented yet. Once the CMS schema exists, add tests and document the content model."),
      );
      writeSourceFile(dir, "src/app/[locale]/admin/products/page.tsx", "export default function ProductsPage() { return null; }\n");
      commitAll(dir, "baseline");

      writeSourceFile(dir, "src/app/[locale]/admin/products/page.tsx", "export default function ProductsPage() { return 'products'; }\n");

      const result = runCliResult(["review", "--changed", "--since", "HEAD"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stdout, /status: passed with warnings/);
      assert.match(result.stdout, /Possible stale claim while source files changed/);
      assert.match(result.stdout, /Admin CMS routes are not implemented yet/);
    });
  });

  it("uses custom watch rules from config for changed-work mapping", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);
      writeReviewBaseline(dir);
      setConfigWatch(dir, [
        { label: "api handlers", paths: ["handlers/**"], docs: ["benjamin-docs/engineering/code-map.md"] },
      ]);
      writeSourceFile(dir, "handlers/users.go", "package handlers\n");
      commitAll(dir, "baseline");

      writeSourceFile(dir, "handlers/users.go", "package handlers // updated\n");

      const result = runCliResult(["review", "--changed", "--since", "HEAD"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stdout, /benjamin-docs\/engineering\/code-map\.md: May need update because changed source files affect api handlers\./);
      assert.doesNotMatch(result.stdout, /releases\/changelog\.md/);
    });
  });

  it("warns when a watch rule expects a doc that does not exist", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);
      writeReviewBaseline(dir);
      setConfigWatch(dir, [{ label: "api", paths: ["handlers/**"], docs: ["benjamin-docs/engineering/api.md"] }]);
      writeSourceFile(dir, "handlers/users.go", "package handlers\n");
      commitAll(dir, "baseline");

      writeSourceFile(dir, "handlers/users.go", "package handlers // updated\n");

      const result = runCliResult(["review", "--changed", "--since", "HEAD"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stdout, /benjamin-docs\/engineering\/api\.md: Watch rule expects this doc, but it does not exist/);
    });
  });

  it("warns when engineering docs reference paths that no longer exist", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);
      writeReviewBaseline(dir);
      writeSourceFile(dir, "src/real.ts", "export const real = true;\n");
      writeBaselineDoc(
        dir,
        "benjamin-docs/engineering/code-map.md",
        "Code Map",
        capturedBody("The main entry is `src/real.ts` and the removed module was `src/removed.ts`. An external example like `someorg/somerepo` is not checked."),
      );

      const result = runCliResult(["review"], dir);

      assert.equal(result.status, 0);
      assert.match(result.stdout, /code-map\.md: References missing path `src\/removed\.ts`/);
      assert.doesNotMatch(result.stdout, /src\/real\.ts/);
      assert.doesNotMatch(result.stdout, /someorg\/somerepo/);
    });
  });

  it("warns when many source files changed since engineering docs last changed in git", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);
      writeReviewBaseline(dir);
      commitAll(dir, "baseline");

      for (let index = 0; index < 10; index += 1) {
        writeSourceFile(dir, `lib/module-${index}.ts`, `export const value${index} = ${index};\n`);
      }

      const churned = runCliResult(["review"], dir);

      assert.equal(churned.status, 0);
      assert.match(churned.stdout, /code-map\.md: 10 source files changed since this doc last changed in git/);
      assert.match(churned.stdout, /architecture\.md: 10 source files changed since this doc last changed in git/);

      writeBaselineDoc(
        dir,
        "benjamin-docs/engineering/code-map.md",
        "Code Map",
        capturedBody("The lib directory now holds ten generated modules that expose simple constants for the application runtime and tests."),
      );

      const refreshed = runCliResult(["review"], dir);

      assert.equal(refreshed.status, 0);
      assert.doesNotMatch(refreshed.stdout, /code-map\.md: 10 source files changed/);
      assert.match(refreshed.stdout, /architecture\.md: 10 source files changed/);
    });
  });

  it("warns when Memory Views are stale and clears after regenerating", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);
      writeReviewBaseline(dir);
      runCliResult(["views"], dir);

      const fresh = runCliResult(["review"], dir);
      assert.equal(fresh.status, 0);
      assert.doesNotMatch(fresh.stdout, /Memory View is stale/);

      appendDocBody(dir, "benjamin-docs/project/roadmap.md", ["## Next Actions", "", "- Ship the next milestone gate."].join("\n"));

      const stale = runCliResult(["review"], dir);
      assert.equal(stale.status, 0);
      assert.match(stale.stdout, /views\/next-actions\.md: Memory View is stale\. Run: benjamin-docs views/);

      runCliResult(["views"], dir);

      const regenerated = runCliResult(["review"], dir);
      assert.equal(regenerated.status, 0);
      assert.doesNotMatch(regenerated.stdout, /Memory View is stale/);
    });
  });

  it("skips quality warnings for archived docs", () => {
    withTempDir((dir) => {
      runCliResult(["init", "--mode", "codebase"], dir);
      writeReviewBaseline(dir);
      runCliResult(["scope", "create", "feature", "old-experiment"], dir);

      const before = runCliResult(["review"], dir);
      assert.match(before.stdout, /features\/old-experiment\/brief\.md: Still looks like a starter template/);

      runCliResult(["scope", "status", "old-experiment", "archived"], dir);

      const after = runCliResult(["review"], dir);
      assert.equal(after.status, 0);
      assert.doesNotMatch(after.stdout, /features\/old-experiment/);
    });
  });
});

function writeReviewBaseline(dir: string): void {
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

function setConfigWatch(root: string, watch: Array<{ label?: string; paths: string[]; docs: string[] }>): void {
  const configPath = join(root, ".benjamin-docs/config.json");
  const config = JSON.parse(readFileSync(configPath, "utf8")) as Record<string, unknown>;
  config.watch = watch;
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function appendDocBody(root: string, path: string, content: string): void {
  const fullPath = join(root, path);
  const existing = readFileSync(fullPath, "utf8");
  writeFileSync(fullPath, `${existing.trimEnd()}\n\n${content}\n`, "utf8");
}

function writeSourceFile(root: string, path: string, content: string): void {
  const fullPath = join(root, path);
  mkdirSync(join(fullPath, ".."), { recursive: true });
  writeFileSync(fullPath, content, "utf8");
}

function commitAll(root: string, message: string): void {
  execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
  execFileSync("git", ["config", "user.email", "test@example.com"], { cwd: root, stdio: "ignore" });
  execFileSync("git", ["config", "user.name", "Test User"], { cwd: root, stdio: "ignore" });
  execFileSync("git", ["add", "."], { cwd: root, stdio: "ignore" });
  execFileSync("git", ["commit", "-m", message], { cwd: root, stdio: "ignore" });
}
