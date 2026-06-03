# Agent Docs MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first repo-local `agent-docs` npm CLI and Codex/Claude skill package described in `docs/superpowers/specs/2026-06-03-agent-docs-design.md`.

**Architecture:** The CLI is a small TypeScript package with no runtime dependencies. It writes human-readable Markdown under `docs/`, writes machine metadata under `.agent-docs/`, validates the structure, exports audience bundles, and exposes approachable help/intro commands. Agent skills perform conversation synthesis and use the CLI for structure and validation.

**Tech Stack:** Node.js 22+, TypeScript 6.0.3, Node built-in `node:test`, Node built-in `fs/path/url/child_process`.

---

## File Structure

- Create: `package.json` - npm package metadata, bin entry, scripts.
- Create: `tsconfig.json` - TypeScript compiler config for ESM CLI output.
- Create: `src/constants.ts` - shared paths, enum-like values, defaults.
- Create: `src/types.ts` - frontmatter, manifest, scope, and anchor types.
- Create: `src/fsx.ts` - focused filesystem helpers.
- Create: `src/frontmatter.ts` - parse and serialize Markdown frontmatter.
- Create: `src/info.ts` - help, version, and introduction text.
- Create: `src/templates.ts` - starter Markdown and metadata templates.
- Create: `src/init.ts` - initialize `docs/` and `.agent-docs/`.
- Create: `src/scopes.ts` - create and read project/feature/release/handoff scopes.
- Create: `src/anchors.ts` - create and read code anchors.
- Create: `src/validate.ts` - validate docs, metadata, links, scopes, and anchors.
- Create: `src/export.ts` - export audience-specific Markdown bundles.
- Create: `src/status.ts` - summarize initialized project state.
- Create: `src/cli.ts` - argument parsing and command dispatch.
- Create: `test/helpers.ts` - temp workspace and command helpers.
- Create: `test/info.test.ts` - version/help/introduce behavior.
- Create: `test/init.test.ts` - initialization behavior.
- Create: `test/scopes-anchors.test.ts` - scope and anchor behavior.
- Create: `test/validate-export.test.ts` - validation and export behavior.
- Create: `skills/agent-docs/SKILL.md` - agent workflow instructions.
- Create: `README.md` - quickstart and command reference.
- Create: `.gitignore` - generated files and dependency folders.

## Implementation Tasks

### Task 1: Package Scaffold And Info Commands

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `src/info.ts`
- Create: `src/cli.ts`
- Create: `test/helpers.ts`
- Create: `test/info.test.ts`

- [ ] **Step 1: Create failing tests for help, version, and introduction**

Create `test/helpers.ts`:

```ts
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

export function withTempDir<T>(fn: (dir: string) => T): T {
  const dir = mkdtempSync(join(tmpdir(), "agent-docs-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function runCli(args: string[], cwd: string): string {
  return execFileSync("node", [join(process.cwd(), "dist/src/cli.js"), ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
}
```

Create `test/info.test.ts`:

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { withTempDir, runCli } from "./helpers.js";

describe("info commands", () => {
  it("prints the package version with --version and -v", () => {
    withTempDir((dir) => {
      const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));

      assert.equal(runCli(["--version"], dir).trim(), pkg.version);
      assert.equal(runCli(["-v"], dir).trim(), pkg.version);
    });
  });

  it("prints help with command examples", () => {
    withTempDir((dir) => {
      const output = runCli(["help"], dir);

      assert.match(output, /agent-docs init/);
      assert.match(output, /agent-docs validate/);
      assert.match(output, /agent-docs export --audience developer/);
    });
  });

  it("prints a plain-language introduction", () => {
    withTempDir((dir) => {
      const output = runCli(["introduce"], dir);

      assert.match(output, /project memory/i);
      assert.match(output, /humans/i);
      assert.match(output, /AI agents/i);
      assert.match(output, /source of truth/i);
    });
  });
});
```

- [ ] **Step 2: Add package and TypeScript config**

Create `package.json`:

```json
{
  "name": "agent-docs",
  "version": "0.1.0",
  "description": "Repo-local project memory for humans and AI agents.",
  "type": "module",
  "bin": {
    "agent-docs": "./dist/src/cli.js"
  },
  "files": [
    "dist",
    "skills",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "node --test dist/test/**/*.test.js",
    "typecheck": "tsc --noEmit",
    "check": "pnpm typecheck && pnpm build && pnpm test"
  },
  "engines": {
    "node": ">=22"
  },
  "devDependencies": {
    "@types/node": "25.9.1",
    "typescript": "6.0.3"
  },
  "license": "MIT"
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "rootDir": ".",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*.ts", "test/**/*.ts"]
}
```

Create `.gitignore`:

```gitignore
node_modules/
dist/
exports/
.DS_Store
```

- [ ] **Step 3: Implement info text and minimal CLI dispatch**

Create `src/info.ts`:

```ts
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function getPackageVersion(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const packagePath = join(currentDir, "..", "..", "package.json");
  const pkg = JSON.parse(readFileSync(packagePath, "utf8")) as { version: string };
  return pkg.version;
}

export function getHelpText(): string {
  return [
    "agent-docs",
    "",
    "Repo-local project memory for humans and AI agents.",
    "",
    "Common commands:",
    "  agent-docs introduce",
    "  agent-docs init",
    "  agent-docs status",
    "  agent-docs validate",
    "  agent-docs scope create feature booking-capacity",
    "  agent-docs anchor add booking-capacity-rules src/features/booking/capacity.ts",
    "  agent-docs export --audience developer",
    "",
    "Start here:",
    "  agent-docs introduce",
    "  agent-docs init",
  ].join("\n");
}

export function getIntroductionText(): string {
  return [
    "agent-docs turns planning and build conversations into durable project memory.",
    "",
    "The docs live inside your project, close to the work, so they can be versioned, reviewed, and reused by future sessions.",
    "",
    "The same source docs can help humans, developers, designers, advisors, and AI agents understand what the project is, what was decided, what remains open, and where the work should go next.",
    "",
    "Publishing and collaboration can come later. The repo-local docs are the source of truth.",
  ].join("\n");
}
```

Create `src/cli.ts`:

```ts
#!/usr/bin/env node
import { getHelpText, getIntroductionText, getPackageVersion } from "./info.js";

export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const [command] = argv;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    console.log(getHelpText());
    return 0;
  }

  if (command === "--version" || command === "-v") {
    console.log(getPackageVersion());
    return 0;
  }

  if (command === "introduce") {
    console.log(getIntroductionText());
    return 0;
  }

  console.error(`Unknown command: ${command}`);
  console.error("");
  console.error(getHelpText());
  return 1;
}

main().then((code) => {
  process.exitCode = code;
});
```

- [ ] **Step 4: Run tests to verify initial behavior**

Run:

```bash
pnpm install
pnpm build
pnpm test
```

Expected: all three `info commands` tests pass.

- [ ] **Step 5: Commit package scaffold**

```bash
git add package.json pnpm-lock.yaml tsconfig.json .gitignore src/info.ts src/cli.ts test/helpers.ts test/info.test.ts
git commit -m "feat: scaffold agent-docs cli"
```

### Task 2: Frontmatter And Filesystem Core

**Files:**
- Create: `src/constants.ts`
- Create: `src/types.ts`
- Create: `src/fsx.ts`
- Create: `src/frontmatter.ts`
- Create: `test/frontmatter.test.ts`

- [ ] **Step 1: Write failing frontmatter tests**

Create `test/frontmatter.test.ts`:

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseMarkdown, serializeMarkdown } from "../src/frontmatter.js";

describe("frontmatter", () => {
  it("parses markdown with yaml-like frontmatter", () => {
    const parsed = parseMarkdown(`---\ntitle: Test Doc\nscope: feature\nscope_id: booking-capacity\naudience: [developer, agent]\nstatus: draft\nvisibility: private\nupdated: 2026-06-03\nsource: session-capture\n---\n\n# Test Doc\n`);

    assert.equal(parsed.frontmatter.title, "Test Doc");
    assert.equal(parsed.frontmatter.scope, "feature");
    assert.deepEqual(parsed.frontmatter.audience, ["developer", "agent"]);
    assert.equal(parsed.body.trim(), "# Test Doc");
  });

  it("serializes markdown frontmatter deterministically", () => {
    const output = serializeMarkdown(
      {
        title: "Agent Brief",
        scope: "handoff",
        scope_id: "agent-brief",
        audience: ["agent"],
        status: "draft",
        visibility: "private",
        updated: "2026-06-03",
        source: "session-capture",
      },
      "# Agent Brief\n\nCurrent state.\n",
    );

    assert.match(output, /^---\ntitle: Agent Brief\nscope: handoff\n/);
    assert.match(output, /audience: \[agent\]/);
    assert.match(output, /\n---\n\n# Agent Brief/);
  });
});
```

- [ ] **Step 2: Implement shared constants and types**

Create `src/constants.ts`:

```ts
export const DOCS_DIR = "docs";
export const CONFIG_DIR = ".agent-docs";
export const MANIFEST_FILE = "manifest.json";
export const SCOPES_FILE = "scopes.json";
export const ANCHORS_FILE = "anchors.json";
export const CONFIG_FILE = "config.json";

export const KNOWN_SCOPES = ["project", "feature", "release", "handoff"] as const;
export const KNOWN_AUDIENCES = ["developer", "designer", "agent", "business", "public", "user", "advisor"] as const;
export const KNOWN_STATUSES = ["draft", "review", "approved", "stale", "archived"] as const;
export const KNOWN_VISIBILITIES = ["private", "unlisted", "public"] as const;
export const KNOWN_SOURCES = ["session-capture", "manual", "codebase-scan", "release-sync"] as const;
```

Create `src/types.ts`:

```ts
import type { KNOWN_AUDIENCES, KNOWN_SCOPES, KNOWN_SOURCES, KNOWN_STATUSES, KNOWN_VISIBILITIES } from "./constants.js";

export type ScopeKind = (typeof KNOWN_SCOPES)[number];
export type Audience = (typeof KNOWN_AUDIENCES)[number];
export type DocStatus = (typeof KNOWN_STATUSES)[number];
export type Visibility = (typeof KNOWN_VISIBILITIES)[number];
export type DocSource = (typeof KNOWN_SOURCES)[number];

export interface DocFrontmatter {
  title: string;
  scope: ScopeKind;
  scope_id: string;
  audience: Audience[];
  status: DocStatus;
  visibility: Visibility;
  updated: string;
  source: DocSource;
}

export interface ParsedMarkdown {
  frontmatter: DocFrontmatter;
  body: string;
}

export interface AgentDocsConfig {
  version: 1;
  mode: "planning" | "codebase";
}

export interface ScopeRecord {
  id: string;
  kind: ScopeKind;
  title: string;
  path: string;
  status: DocStatus;
}

export interface ScopesFile {
  version: 1;
  scopes: ScopeRecord[];
}

export interface AnchorRecord {
  file: string;
  docs: string[];
}

export interface AnchorsFile {
  version: 1;
  anchors: Record<string, AnchorRecord>;
}

export interface ManifestFile {
  version: 1;
  docs: string[];
}
```

- [ ] **Step 3: Implement filesystem helpers**

Create `src/fsx.ts`:

```ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export function pathExists(path: string): boolean {
  return existsSync(path);
}

export function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function writeJson(path: string, value: unknown): void {
  ensureDir(dirname(path));
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function writeText(path: string, value: string): void {
  ensureDir(dirname(path));
  writeFileSync(path, value, "utf8");
}

export function rootPath(root: string, ...parts: string[]): string {
  return join(root, ...parts);
}
```

- [ ] **Step 4: Implement frontmatter parser and serializer**

Create `src/frontmatter.ts`:

```ts
import type { DocFrontmatter, ParsedMarkdown } from "./types.js";

const ORDER: Array<keyof DocFrontmatter> = [
  "title",
  "scope",
  "scope_id",
  "audience",
  "status",
  "visibility",
  "updated",
  "source",
];

export function parseMarkdown(markdown: string): ParsedMarkdown {
  if (!markdown.startsWith("---\n")) {
    throw new Error("Markdown file is missing frontmatter");
  }

  const end = markdown.indexOf("\n---\n", 4);
  if (end === -1) {
    throw new Error("Markdown frontmatter is not closed");
  }

  const raw = markdown.slice(4, end);
  const body = markdown.slice(end + 5);
  const frontmatter: Record<string, unknown> = {};

  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    const colon = line.indexOf(":");
    if (colon === -1) throw new Error(`Invalid frontmatter line: ${line}`);

    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    frontmatter[key] = parseValue(value);
  }

  return { frontmatter: frontmatter as unknown as DocFrontmatter, body };
}

export function serializeMarkdown(frontmatter: DocFrontmatter, body: string): string {
  const lines = ORDER.map((key) => `${key}: ${serializeValue(frontmatter[key])}`);
  return `---\n${lines.join("\n")}\n---\n\n${body.replace(/^\n+/, "")}`;
}

function parseValue(value: string): string | string[] {
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((item) => item.trim());
  }
  return value;
}

function serializeValue(value: string | string[]): string {
  if (Array.isArray(value)) return `[${value.join(", ")}]`;
  return value;
}
```

- [ ] **Step 5: Run tests and commit**

Run:

```bash
pnpm build
pnpm test
```

Expected: `info commands` and `frontmatter` tests pass.

Commit:

```bash
git add src/constants.ts src/types.ts src/fsx.ts src/frontmatter.ts test/frontmatter.test.ts
git commit -m "feat: add markdown metadata core"
```

### Task 3: Initialize Repo-Local Docs

**Files:**
- Create: `src/templates.ts`
- Create: `src/init.ts`
- Modify: `src/cli.ts`
- Create: `test/init.test.ts`

- [ ] **Step 1: Write failing initialization tests**

Create `test/init.test.ts`:

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { withTempDir, runCli } from "./helpers.js";

describe("init", () => {
  it("creates docs and metadata in an empty planning repo", () => {
    withTempDir((dir) => {
      const output = runCli(["init"], dir);

      assert.match(output, /Initialized agent-docs/);
      assert.equal(existsSync(join(dir, "docs/project/brief.md")), true);
      assert.equal(existsSync(join(dir, "docs/handoff/agent-brief.md")), true);
      assert.equal(existsSync(join(dir, ".agent-docs/config.json")), true);
      assert.equal(existsSync(join(dir, ".agent-docs/manifest.json")), true);
      assert.equal(existsSync(join(dir, ".agent-docs/scopes.json")), true);
      assert.equal(existsSync(join(dir, ".agent-docs/anchors.json")), true);
    });
  });

  it("does not overwrite an existing project brief", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      const briefPath = join(dir, "docs/project/brief.md");
      const before = readFileSync(briefPath, "utf8");

      runCli(["init"], dir);
      const after = readFileSync(briefPath, "utf8");

      assert.equal(after, before);
    });
  });
});
```

- [ ] **Step 2: Implement templates**

Create `src/templates.ts`:

```ts
import { serializeMarkdown } from "./frontmatter.js";
import type { DocFrontmatter } from "./types.js";

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function doc(title: string, scope: DocFrontmatter["scope"], scopeId: string, audience: DocFrontmatter["audience"], body: string): string {
  return serializeMarkdown(
    {
      title,
      scope,
      scope_id: scopeId,
      audience,
      status: "draft",
      visibility: "private",
      updated: today(),
      source: "manual",
    },
    body,
  );
}

export const starterDocs: Array<{ path: string; content: string }> = [
  {
    path: "docs/project/brief.md",
    content: doc("Project Brief", "project", "project", ["developer", "designer", "business", "agent"], "# Project Brief\n\nCapture what this project is, who it serves, and why it matters.\n"),
  },
  {
    path: "docs/project/roadmap.md",
    content: doc("Roadmap", "project", "project", ["developer", "business", "agent"], "# Roadmap\n\nCapture the current MVP, near-term next steps, and deferred ideas.\n"),
  },
  {
    path: "docs/project/open-questions.md",
    content: doc("Open Questions", "project", "project", ["developer", "designer", "business", "agent"], "# Open Questions\n\nTrack decisions that are not settled yet.\n"),
  },
  {
    path: "docs/handoff/human-brief.md",
    content: doc("Human Brief", "handoff", "human-brief", ["developer", "designer", "business", "advisor"], "# Human Brief\n\nUse this for a concise handoff to another person.\n"),
  },
  {
    path: "docs/handoff/agent-brief.md",
    content: doc("Agent Brief", "handoff", "agent-brief", ["agent"], "# Agent Brief\n\nUse this to orient future AI agents quickly.\n"),
  },
];
```

- [ ] **Step 3: Implement initialization**

Create `src/init.ts`:

```ts
import { join } from "node:path";
import { ANCHORS_FILE, CONFIG_DIR, CONFIG_FILE, MANIFEST_FILE, SCOPES_FILE } from "./constants.js";
import { ensureDir, pathExists, writeJson, writeText } from "./fsx.js";
import { starterDocs } from "./templates.js";
import type { AgentDocsConfig, AnchorsFile, ManifestFile, ScopesFile } from "./types.js";

export function initProject(root: string): string[] {
  const written: string[] = [];

  ensureDir(join(root, "docs"));
  ensureDir(join(root, CONFIG_DIR));

  for (const starter of starterDocs) {
    const fullPath = join(root, starter.path);
    if (!pathExists(fullPath)) {
      writeText(fullPath, starter.content);
      written.push(starter.path);
    }
  }

  writeIfMissing(join(root, CONFIG_DIR, CONFIG_FILE), { version: 1, mode: "planning" } satisfies AgentDocsConfig, written);
  writeIfMissing(join(root, CONFIG_DIR, MANIFEST_FILE), { version: 1, docs: starterDocs.map((item) => item.path) } satisfies ManifestFile, written);
  writeIfMissing(
    join(root, CONFIG_DIR, SCOPES_FILE),
    {
      version: 1,
      scopes: [
        { id: "project", kind: "project", title: "Project", path: "docs/project", status: "draft" },
        { id: "human-brief", kind: "handoff", title: "Human Brief", path: "docs/handoff/human-brief.md", status: "draft" },
        { id: "agent-brief", kind: "handoff", title: "Agent Brief", path: "docs/handoff/agent-brief.md", status: "draft" },
      ],
    } satisfies ScopesFile,
    written,
  );
  writeIfMissing(join(root, CONFIG_DIR, ANCHORS_FILE), { version: 1, anchors: {} } satisfies AnchorsFile, written);

  return written;
}

function writeIfMissing(path: string, value: unknown, written: string[]): void {
  if (pathExists(path)) return;
  writeJson(path, value);
  written.push(path);
}
```

- [ ] **Step 4: Wire `init` into the CLI**

Modify `src/cli.ts`:

```ts
#!/usr/bin/env node
import { initProject } from "./init.js";
import { getHelpText, getIntroductionText, getPackageVersion } from "./info.js";

export async function main(argv: string[] = process.argv.slice(2), cwd: string = process.cwd()): Promise<number> {
  const [command] = argv;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    console.log(getHelpText());
    return 0;
  }

  if (command === "--version" || command === "-v") {
    console.log(getPackageVersion());
    return 0;
  }

  if (command === "introduce") {
    console.log(getIntroductionText());
    return 0;
  }

  if (command === "init") {
    const written = initProject(cwd);
    console.log(`Initialized agent-docs. ${written.length} files created.`);
    return 0;
  }

  console.error(`Unknown command: ${command}`);
  console.error("");
  console.error(getHelpText());
  return 1;
}

main().then((code) => {
  process.exitCode = code;
});
```

- [ ] **Step 5: Run tests and commit**

Run:

```bash
pnpm build
pnpm test
```

Expected: initialization tests pass and previous tests remain green.

Commit:

```bash
git add src/templates.ts src/init.ts src/cli.ts test/init.test.ts
git commit -m "feat: initialize agent-docs structure"
```

### Task 4: Scopes And Anchors

**Files:**
- Create: `src/scopes.ts`
- Create: `src/anchors.ts`
- Modify: `src/templates.ts`
- Modify: `src/cli.ts`
- Create: `test/scopes-anchors.test.ts`

- [ ] **Step 1: Write failing scope and anchor tests**

Create `test/scopes-anchors.test.ts`:

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { withTempDir, runCli } from "./helpers.js";

describe("scopes and anchors", () => {
  it("creates a feature scope with starter docs", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      const output = runCli(["scope", "create", "feature", "booking-capacity"], dir);

      assert.match(output, /Created feature scope booking-capacity/);
      assert.equal(existsSync(join(dir, "docs/features/booking-capacity/brief.md")), true);
      assert.equal(existsSync(join(dir, "docs/features/booking-capacity/plan.md")), true);
      assert.equal(existsSync(join(dir, "docs/features/booking-capacity/decisions.md")), true);
      assert.equal(existsSync(join(dir, "docs/features/booking-capacity/handoff.md")), true);
    });
  });

  it("adds a code anchor", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      mkdirSync(join(dir, "src/features/booking"), { recursive: true });
      writeFileSync(join(dir, "src/features/booking/capacity.ts"), "export const capacity = 1;\n");

      const output = runCli(["anchor", "add", "booking-capacity-rules", "src/features/booking/capacity.ts"], dir);

      assert.match(output, /Added anchor booking-capacity-rules/);
    });
  });
});
```

- [ ] **Step 2: Add feature templates**

Modify `src/templates.ts` by adding:

```ts
export function featureDocs(slug: string): Array<{ path: string; content: string }> {
  return [
    {
      path: `docs/features/${slug}/brief.md`,
      content: doc(`${slug} Brief`, "feature", slug, ["developer", "designer", "agent"], `# ${slug} Brief\n\nCapture what this feature is meant to accomplish.\n`),
    },
    {
      path: `docs/features/${slug}/plan.md`,
      content: doc(`${slug} Plan`, "feature", slug, ["developer", "agent"], `# ${slug} Plan\n\nCapture the implementation or execution plan.\n`),
    },
    {
      path: `docs/features/${slug}/decisions.md`,
      content: doc(`${slug} Decisions`, "feature", slug, ["developer", "agent"], `# ${slug} Decisions\n\nCapture durable decisions, rejected options, and reasoning.\n`),
    },
    {
      path: `docs/features/${slug}/handoff.md`,
      content: doc(`${slug} Handoff`, "feature", slug, ["developer", "agent"], `# ${slug} Handoff\n\nCapture status, open questions, and next actions for this feature.\n`),
    },
  ];
}
```

- [ ] **Step 3: Implement scope creation**

Create `src/scopes.ts`:

```ts
import { join } from "node:path";
import { CONFIG_DIR, SCOPES_FILE } from "./constants.js";
import { pathExists, readJson, writeJson, writeText } from "./fsx.js";
import { featureDocs } from "./templates.js";
import type { ScopeKind, ScopeRecord, ScopesFile } from "./types.js";

export function createScope(root: string, kind: ScopeKind, id: string): string[] {
  if (kind !== "feature") {
    throw new Error("V1 scope creation supports feature scopes");
  }

  const scopesPath = join(root, CONFIG_DIR, SCOPES_FILE);
  const scopes = readJson<ScopesFile>(scopesPath);
  if (scopes.scopes.some((scope) => scope.id === id)) {
    throw new Error(`Scope already exists: ${id}`);
  }

  const written: string[] = [];
  for (const file of featureDocs(id)) {
    const fullPath = join(root, file.path);
    if (!pathExists(fullPath)) {
      writeText(fullPath, file.content);
      written.push(file.path);
    }
  }

  const record: ScopeRecord = {
    id,
    kind,
    title: titleFromSlug(id),
    path: `docs/features/${id}`,
    status: "draft",
  };
  scopes.scopes.push(record);
  writeJson(scopesPath, scopes);
  return written;
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
```

- [ ] **Step 4: Implement anchors**

Create `src/anchors.ts`:

```ts
import { join } from "node:path";
import { ANCHORS_FILE, CONFIG_DIR } from "./constants.js";
import { pathExists, readJson, writeJson } from "./fsx.js";
import type { AnchorsFile } from "./types.js";

export function addAnchor(root: string, id: string, file: string, docs: string[] = []): void {
  if (!pathExists(join(root, file))) {
    throw new Error(`Anchor file does not exist: ${file}`);
  }

  const anchorsPath = join(root, CONFIG_DIR, ANCHORS_FILE);
  const anchors = readJson<AnchorsFile>(anchorsPath);
  anchors.anchors[id] = { file, docs };
  writeJson(anchorsPath, anchors);
}
```

- [ ] **Step 5: Wire scope and anchor commands into the CLI**

Modify `src/cli.ts` by importing `createScope` and `addAnchor`, then add these branches before the unknown-command branch:

```ts
  if (command === "scope" && argv[1] === "create") {
    const kind = argv[2];
    const id = argv[3];
    if (!kind || !id) throw new Error("Usage: agent-docs scope create feature <slug>");
    const written = createScope(cwd, kind as never, id);
    console.log(`Created ${kind} scope ${id}. ${written.length} files created.`);
    return 0;
  }

  if (command === "anchor" && argv[1] === "add") {
    const id = argv[2];
    const file = argv[3];
    if (!id || !file) throw new Error("Usage: agent-docs anchor add <id> <file>");
    addAnchor(cwd, id, file);
    console.log(`Added anchor ${id}.`);
    return 0;
  }
```

Wrap the CLI body with error reporting so thrown usage errors return code 1:

```ts
main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
```

- [ ] **Step 6: Run tests and commit**

Run:

```bash
pnpm build
pnpm test
```

Expected: scope and anchor tests pass and previous tests remain green.

Commit:

```bash
git add src/templates.ts src/scopes.ts src/anchors.ts src/cli.ts test/scopes-anchors.test.ts
git commit -m "feat: add scopes and anchors"
```

### Task 5: Validation

**Files:**
- Create: `src/validate.ts`
- Modify: `src/cli.ts`
- Create: `test/validate-export.test.ts`

- [ ] **Step 1: Write failing validation tests**

Create the first half of `test/validate-export.test.ts`:

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { withTempDir, runCli } from "./helpers.js";

describe("validate", () => {
  it("passes for a freshly initialized project", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      const output = runCli(["validate"], dir);

      assert.match(output, /Validation passed/);
    });
  });

  it("reports missing docs", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      rmSync(join(dir, "docs/project/brief.md"));

      assert.throws(() => runCli(["validate"], dir), /docs\/project\/brief\.md/);
    });
  });
});
```

- [ ] **Step 2: Implement validation**

Create `src/validate.ts`:

```ts
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname, normalize } from "node:path";
import { ANCHORS_FILE, CONFIG_DIR, CONFIG_FILE, KNOWN_AUDIENCES, KNOWN_SCOPES, KNOWN_SOURCES, KNOWN_STATUSES, KNOWN_VISIBILITIES, MANIFEST_FILE, SCOPES_FILE } from "./constants.js";
import { parseMarkdown } from "./frontmatter.js";
import { readJson } from "./fsx.js";
import type { AnchorsFile, ManifestFile, ScopesFile } from "./types.js";

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export function validateProject(root: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const required of [
    join(CONFIG_DIR, CONFIG_FILE),
    join(CONFIG_DIR, MANIFEST_FILE),
    join(CONFIG_DIR, SCOPES_FILE),
    join(CONFIG_DIR, ANCHORS_FILE),
  ]) {
    if (!existsSync(join(root, required))) errors.push(`Missing required file: ${required}`);
  }

  if (errors.length > 0) return { errors, warnings };

  const manifest = readJson<ManifestFile>(join(root, CONFIG_DIR, MANIFEST_FILE));
  const scopes = readJson<ScopesFile>(join(root, CONFIG_DIR, SCOPES_FILE));
  const anchors = readJson<AnchorsFile>(join(root, CONFIG_DIR, ANCHORS_FILE));

  const seenScopes = new Set<string>();
  for (const scope of scopes.scopes) {
    if (seenScopes.has(scope.id)) errors.push(`Duplicate scope id: ${scope.id}`);
    seenScopes.add(scope.id);
    if (!existsSync(join(root, scope.path))) errors.push(`Scope path is missing: ${scope.path}`);
  }

  const docs = findMarkdownFiles(join(root, "docs")).map((path) => normalize(path));
  for (const doc of manifest.docs) {
    if (!existsSync(join(root, doc))) errors.push(`Manifest doc is missing: ${doc}`);
  }

  for (const doc of docs) {
    const relative = normalize(doc.slice(root.length + 1));
    const content = readFileSync(doc, "utf8");
    try {
      const parsed = parseMarkdown(content);
      validateFrontmatter(relative, parsed.frontmatter, errors);
      validateLinks(root, relative, parsed.body, errors);
    } catch (error) {
      errors.push(`${relative}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  for (const [id, anchor] of Object.entries(anchors.anchors)) {
    if (!existsSync(join(root, anchor.file))) errors.push(`Anchor ${id} points to missing file: ${anchor.file}`);
    for (const doc of anchor.docs) {
      if (!existsSync(join(root, doc))) errors.push(`Anchor ${id} points to missing doc: ${doc}`);
    }
  }

  if (docs.length === 0) warnings.push("No Markdown docs found under docs/");
  return { errors, warnings };
}

function validateFrontmatter(path: string, frontmatter: Record<string, unknown>, errors: string[]): void {
  if (!KNOWN_SCOPES.includes(frontmatter.scope as never)) errors.push(`${path}: unknown scope ${String(frontmatter.scope)}`);
  if (!KNOWN_STATUSES.includes(frontmatter.status as never)) errors.push(`${path}: unknown status ${String(frontmatter.status)}`);
  if (!KNOWN_VISIBILITIES.includes(frontmatter.visibility as never)) errors.push(`${path}: unknown visibility ${String(frontmatter.visibility)}`);
  if (!KNOWN_SOURCES.includes(frontmatter.source as never)) errors.push(`${path}: unknown source ${String(frontmatter.source)}`);
  const audience = Array.isArray(frontmatter.audience) ? frontmatter.audience : [];
  for (const value of audience) {
    if (!KNOWN_AUDIENCES.includes(value as never)) errors.push(`${path}: unknown audience ${String(value)}`);
  }
}

function validateLinks(root: string, docPath: string, body: string, errors: string[]): void {
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
  for (const match of body.matchAll(linkPattern)) {
    const target = match[1];
    if (!target || target.startsWith("http://") || target.startsWith("https://") || target.startsWith("#")) continue;
    const targetPath = join(root, dirname(docPath), target.split("#")[0]);
    if (!existsSync(targetPath)) errors.push(`${docPath}: broken link ${target}`);
  }
}

function findMarkdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) files.push(...findMarkdownFiles(fullPath));
    if (stat.isFile() && fullPath.endsWith(".md")) files.push(fullPath);
  }
  return files;
}
```

- [ ] **Step 3: Wire `validate` into the CLI**

Modify `src/cli.ts`:

```ts
import { validateProject } from "./validate.js";
```

Add the command branch:

```ts
  if (command === "validate") {
    const result = validateProject(cwd);
    for (const warning of result.warnings) console.warn(`Warning: ${warning}`);
    if (result.errors.length > 0) {
      for (const error of result.errors) console.error(`Error: ${error}`);
      return 1;
    }
    console.log("Validation passed.");
    return 0;
  }
```

- [ ] **Step 4: Run tests and commit**

Run:

```bash
pnpm build
pnpm test
```

Expected: validation tests pass and previous tests remain green.

Commit:

```bash
git add src/validate.ts src/cli.ts test/validate-export.test.ts
git commit -m "feat: validate agent-docs projects"
```

### Task 6: Status, Export, And Promote

**Files:**
- Create: `src/status.ts`
- Create: `src/export.ts`
- Modify: `src/init.ts`
- Modify: `src/cli.ts`
- Modify: `test/validate-export.test.ts`

- [ ] **Step 1: Extend tests for status, export, and promote**

Append to `test/validate-export.test.ts`:

```ts
describe("status and export", () => {
  it("prints project status", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      const output = runCli(["status"], dir);

      assert.match(output, /mode: planning/);
      assert.match(output, /docs:/);
      assert.match(output, /scopes:/);
    });
  });

  it("exports docs for an audience", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      const output = runCli(["export", "--audience", "agent"], dir);

      assert.match(output, /Exported agent bundle/);
      assert.equal(existsSync(join(dir, "exports/agent/handoff/agent-brief.md")), true);
      assert.equal(existsSync(join(dir, "exports/agent/project/brief.md")), true);
    });
  });

  it("promotes config to codebase mode", () => {
    withTempDir((dir) => {
      runCli(["init"], dir);
      runCli(["promote", "--to", "codebase"], dir);
      const config = readFileSync(join(dir, ".agent-docs/config.json"), "utf8");

      assert.match(config, /"mode": "codebase"/);
      assert.equal(existsSync(join(dir, "docs/engineering/architecture.md")), true);
      assert.equal(existsSync(join(dir, "docs/releases/changelog.md")), true);
    });
  });
});
```

- [ ] **Step 2: Implement status**

Create `src/status.ts`:

```ts
import { join } from "node:path";
import { CONFIG_DIR, CONFIG_FILE, MANIFEST_FILE, SCOPES_FILE } from "./constants.js";
import { readJson } from "./fsx.js";
import type { AgentDocsConfig, ManifestFile, ScopesFile } from "./types.js";

export function getStatus(root: string): string {
  const config = readJson<AgentDocsConfig>(join(root, CONFIG_DIR, CONFIG_FILE));
  const manifest = readJson<ManifestFile>(join(root, CONFIG_DIR, MANIFEST_FILE));
  const scopes = readJson<ScopesFile>(join(root, CONFIG_DIR, SCOPES_FILE));

  return [
    "agent-docs status",
    `mode: ${config.mode}`,
    `docs: ${manifest.docs.length}`,
    `scopes: ${scopes.scopes.length}`,
  ].join("\n");
}
```

- [ ] **Step 3: Implement export**

Create `src/export.ts`:

```ts
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { parseMarkdown } from "./frontmatter.js";
import type { Audience } from "./types.js";

export function exportAudience(root: string, audience: Audience): string[] {
  const docs = findMarkdownFiles(join(root, "docs"));
  const written: string[] = [];

  for (const doc of docs) {
    const content = readFileSync(doc, "utf8");
    const parsed = parseMarkdown(content);
    if (!parsed.frontmatter.audience.includes(audience)) continue;

    const relative = doc.slice(join(root, "docs").length + 1);
    const target = join(root, "exports", audience, relative);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content, "utf8");
    written.push(target);
  }

  return written;
}

function findMarkdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) files.push(...findMarkdownFiles(fullPath));
    if (stat.isFile() && fullPath.endsWith(".md")) files.push(fullPath);
  }
  return files;
}
```

- [ ] **Step 4: Implement promote-to-codebase support**

Modify `src/templates.ts` by adding:

```ts
export const codebaseDocs: Array<{ path: string; content: string }> = [
  {
    path: "docs/engineering/architecture.md",
    content: doc("Architecture", "project", "project", ["developer", "agent"], "# Architecture\n\nCapture the current system shape, major boundaries, and important constraints.\n"),
  },
  {
    path: "docs/engineering/code-map.md",
    content: doc("Code Map", "project", "project", ["developer", "agent"], "# Code Map\n\nCapture important files, modules, routes, schemas, and tests.\n"),
  },
  {
    path: "docs/releases/changelog.md",
    content: doc("Changelog", "release", "release", ["developer", "business", "public"], "# Changelog\n\nTrack notable changes.\n"),
  },
];
```

Modify `src/init.ts` by adding:

```ts
import { readJson } from "./fsx.js";
import { codebaseDocs } from "./templates.js";

export function promoteToCodebase(root: string): string[] {
  const written: string[] = [];
  for (const starter of codebaseDocs) {
    const fullPath = join(root, starter.path);
    if (!pathExists(fullPath)) {
      writeText(fullPath, starter.content);
      written.push(starter.path);
    }
  }

  const configPath = join(root, CONFIG_DIR, CONFIG_FILE);
  const config = readJson<AgentDocsConfig>(configPath);
  config.mode = "codebase";
  writeJson(configPath, config);
  return written;
}
```

- [ ] **Step 5: Wire commands into the CLI**

Modify `src/cli.ts` imports:

```ts
import { exportAudience } from "./export.js";
import { initProject, promoteToCodebase } from "./init.js";
import { getStatus } from "./status.js";
```

Add branches:

```ts
  if (command === "status") {
    console.log(getStatus(cwd));
    return 0;
  }

  if (command === "export") {
    const audienceIndex = argv.indexOf("--audience");
    const audience = audienceIndex === -1 ? undefined : argv[audienceIndex + 1];
    if (!audience) throw new Error("Usage: agent-docs export --audience <audience>");
    const written = exportAudience(cwd, audience as never);
    console.log(`Exported ${audience} bundle. ${written.length} files written.`);
    return 0;
  }

  if (command === "promote") {
    if (argv[1] !== "--to" || argv[2] !== "codebase") throw new Error("Usage: agent-docs promote --to codebase");
    const written = promoteToCodebase(cwd);
    console.log(`Promoted agent-docs to codebase mode. ${written.length} files created.`);
    return 0;
  }
```

- [ ] **Step 6: Run tests and commit**

Run:

```bash
pnpm build
pnpm test
```

Expected: status, export, and promote tests pass and previous tests remain green.

Commit:

```bash
git add src/status.ts src/export.ts src/init.ts src/templates.ts src/cli.ts test/validate-export.test.ts
git commit -m "feat: add status export and promote"
```

### Task 7: Agent Skill And User Documentation

**Files:**
- Create: `skills/agent-docs/SKILL.md`
- Create: `README.md`
- Modify: `src/info.ts`

- [ ] **Step 1: Create the agent skill**

Create `skills/agent-docs/SKILL.md`:

```markdown
---
name: agent-docs
description: Capture planning and build conversations into repo-local project memory for humans and AI agents.
---

# agent-docs

Use this skill when the user asks to capture, document, summarize, hand off, export, or preserve a planning or development conversation with `agent-docs`.

## Purpose

`agent-docs` turns long-running project conversations into durable Markdown docs inside the project repo. It is useful before code exists, inside existing codebases, and for individual feature scopes.

## Workflow

1. Check whether `.agent-docs/config.json` exists.
2. If it does not exist, run `npx agent-docs init`.
3. Decide the capture scope:
   - project: whole project, product, app, or business
   - feature: one feature, module, redesign, experiment, or v2 plan
   - handoff: context for another person or future agent
   - release: shipped change notes
4. Write durable docs under `docs/`.
5. Update existing docs instead of dumping a transcript.
6. Run `npx agent-docs validate`.
7. Report changed files, key decisions captured, and unresolved questions.

## Capture Quality

Capture:

- agreed decisions
- rejected options
- open questions
- current plan
- audience-specific summaries
- relevant code references when code exists
- recommended next actions

Do not capture raw transcript unless the user explicitly asks for an archive.

## Constructive Challenge

Do not act as a passive note taker. Preserve the user's intent, but speak up when the plan has weak assumptions, missing decisions, contradictory goals, overbuilt V1 scope, unclear audience, or risks that future humans and agents need to know.

Pushback should be direct, specific, and useful. Offer a better alternative when possible.
```

- [ ] **Step 2: Create README quickstart**

Create `README.md`:

```markdown
# agent-docs

Repo-local project memory for humans and AI agents.

`agent-docs` turns planning and build conversations into structured Markdown docs that live inside your project. It works before code exists, inside existing codebases, and for individual feature scopes.

## Install

```bash
npm install --save-dev agent-docs
```

For local development in this repo:

```bash
pnpm install
pnpm build
node dist/src/cli.js introduce
```

## Common Commands

```bash
agent-docs introduce
agent-docs help
agent-docs --version
agent-docs init
agent-docs status
agent-docs validate
agent-docs scope create feature booking-capacity
agent-docs anchor add booking-capacity-rules src/features/booking/capacity.ts
agent-docs export --audience developer
agent-docs promote --to codebase
```

## What It Creates

```text
docs/
.agent-docs/
```

`docs/` contains human-readable Markdown. `.agent-docs/` contains machine metadata for validation, exports, anchors, and future publishing.

## Agent Workflow

The CLI owns structure and validation. Codex or Claude skills own synthesis from the current conversation.

Ask your agent:

```text
Capture this conversation with agent-docs.
```

The agent should update the relevant docs, run validation, and report what changed.
```

- [ ] **Step 3: Update help text to mention skill workflow**

Modify `src/info.ts` help text by adding:

```ts
    "",
    "With an AI agent:",
    "  Ask: Capture this conversation with agent-docs.",
```

- [ ] **Step 4: Run checks and commit**

Run:

```bash
pnpm check
```

Expected: typecheck, build, and tests pass.

Commit:

```bash
git add skills/agent-docs/SKILL.md README.md src/info.ts
git commit -m "docs: add agent skill and quickstart"
```

### Task 8: Final Smoke Test And Self-Capture Seed

**Files:**
- Create: `docs/project/brief.md`
- Create: `docs/project/roadmap.md`
- Create: `docs/features/session-capture/plan.md`
- Create: `docs/handoff/human-brief.md`
- Create: `docs/handoff/agent-brief.md`
- Create: `.agent-docs/config.json`
- Create: `.agent-docs/manifest.json`
- Create: `.agent-docs/scopes.json`
- Create: `.agent-docs/anchors.json`

- [ ] **Step 1: Run the CLI against this repo**

Run:

```bash
node dist/src/cli.js init
node dist/src/cli.js scope create feature session-capture
node dist/src/cli.js validate
```

Expected:

```text
Initialized agent-docs.
Created feature scope session-capture.
Validation passed.
```

- [ ] **Step 2: Replace starter docs with captured project memory**

Update `docs/project/brief.md` to summarize:

```markdown
# Project Brief

`agent-docs` is a repo-local project memory system for humans and AI agents. It turns planning and build conversations into structured Markdown docs that live close to the work.

V1 is an open-source npm CLI plus Codex/Claude skill. The CLI owns structure, validation, scopes, anchors, exports, and approachable commands. The skill owns synthesis from chat context and should challenge weak plans instead of acting as a passive note taker.
```

Update `docs/project/roadmap.md` to summarize:

```markdown
# Roadmap

## V1

- Initialize repo-local `docs/` and `.agent-docs/`.
- Support project, feature, release, and handoff scopes.
- Support planning-only and existing-codebase projects.
- Export audience bundles for developers, designers, agents, business readers, and public summaries.
- Provide a Codex/Claude skill for session capture.

## Deferred SaaS

- Hosted docs portals.
- Public, private, and unlisted access.
- Comments and suggestions.
- Non-technical editing.
- GitHub sync.
- Cross-project dashboards.
```

Update `docs/features/session-capture/plan.md` to summarize:

```markdown
# session-capture Plan

Session capture is the first wedge. A user should be able to chat with an agent about an idea or feature, then ask the agent to capture the conversation into durable docs.

The CLI cannot read chat context by itself. The skill reads the conversation, writes Markdown docs, and then uses the CLI to validate the result.
```

Update `docs/handoff/human-brief.md` to summarize:

```markdown
# Human Brief

This project is ready for MVP implementation. The approved design spec lives at `docs/superpowers/specs/2026-06-03-agent-docs-design.md`, and the implementation plan lives at `docs/superpowers/plans/2026-06-03-agent-docs-mvp.md`.
```

Update `docs/handoff/agent-brief.md` to summarize:

```markdown
# Agent Brief

Read the design spec and implementation plan before changing code.

The first implementation should stay small: TypeScript CLI, no runtime dependencies, Markdown docs as source of truth, JSON metadata for validation and exports, and a skill file that captures conversations with constructive challenge.
```

Keep the generated frontmatter at the top of each file.

- [ ] **Step 3: Validate and export bundles**

Run:

```bash
node dist/src/cli.js validate
node dist/src/cli.js export --audience developer
node dist/src/cli.js export --audience designer
node dist/src/cli.js export --audience agent
```

Expected:

```text
Validation passed.
Exported developer bundle.
Exported designer bundle.
Exported agent bundle.
```

- [ ] **Step 4: Run full check and commit**

Run:

```bash
pnpm check
```

Expected: typecheck, build, and tests pass.

Commit:

```bash
git add docs .agent-docs
git commit -m "docs: seed agent-docs project memory"
```

### Task 9: Release Readiness Review

**Files:**
- Modify: `README.md`
- Modify: `package.json`

- [ ] **Step 1: Verify command behavior manually**

Run:

```bash
node dist/src/cli.js --version
node dist/src/cli.js -v
node dist/src/cli.js help
node dist/src/cli.js introduce
node dist/src/cli.js status
node dist/src/cli.js validate
```

Expected:

- Version commands print `0.1.0`.
- Help lists `init`, `validate`, `scope create`, `anchor add`, `export`, `promote`, and `introduce`.
- Introduce explains the tool in simple language.
- Status prints mode, docs count, and scopes count.
- Validate passes.

- [ ] **Step 2: Verify package contents**

Run:

```bash
pnpm pack --dry-run
```

Expected: package includes `dist/`, `skills/`, `README.md`, and excludes `src/`, `test/`, `docs/`, `.agent-docs/`, and `exports/`.

If `docs/` appears in the dry run output, update `package.json` `files` to keep only:

```json
[
  "dist",
  "skills",
  "README.md",
  "LICENSE"
]
```

- [ ] **Step 3: Run final check**

Run:

```bash
pnpm check
```

Expected: typecheck, build, and tests pass.

- [ ] **Step 4: Commit release readiness updates**

```bash
git add README.md package.json
git commit -m "chore: prepare package for local testing"
```

## Self-Review

Spec coverage:

- CLI/npm package: Tasks 1-6 and 9.
- Repo-local `docs/` and `.agent-docs/`: Tasks 3 and 8.
- Project and feature scopes: Tasks 3 and 4.
- Planning-only and existing-codebase usage: Tasks 3 and 6.
- Markdown templates with frontmatter: Tasks 2 and 3.
- Session capture via skill: Task 7.
- Audience metadata and exports: Tasks 2, 3, 6, and 8.
- Validation: Task 5.
- Help, version, and introduction commands: Task 1.
- Constructive agent challenge stance: Task 7.
- First self-test from this conversation: Task 8.

No implementation task requires hosted SaaS, auth, browser editing, GitHub App integration, automatic CLI access to agent chat, static site generation, project generator wrapping, or deep code understanding.
