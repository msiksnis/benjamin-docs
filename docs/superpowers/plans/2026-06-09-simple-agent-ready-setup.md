# Simple Agent-Ready Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Benjamin Docs 0.3.0's simple command surface and protective agent-contract setup inside `init` and `ready`.

**Architecture:** Keep the public UX centered on `init`, `ready`, and `help`. Add a small `src/commands.ts` command drawer and a focused `src/agent-contracts.ts` module that can create Benjamin-owned `AGENTS.md` sections, preserve existing user-authored guidance, and run deterministic health checks. Wire agent-contract setup into `init` via flags and interactive prompts, then wire contract health into `ready`.

**Tech Stack:** Node.js 22+, TypeScript ESM, Node built-in `node:test`, existing filesystem helpers in `src/fsx.ts`, existing CLI dispatch in `src/cli.ts`.

---

## File Structure

- Create: `src/commands.ts` - owns the full command drawer text and optional interactive command selection.
- Create: `src/agent-contracts.ts` - owns AGENTS.md generation, preservation, child contract generation, and deterministic health checks.
- Create: `test/commands.test.ts` - covers `benjamin-docs commands` output.
- Create: `test/agent-contracts.test.ts` - covers agent-contract creation, preservation, child contracts, and checks.
- Modify: `src/cli.ts` - adds `commands`, `bd`-friendly behavior through bin alias, `init --agent-contract`, `init --agent-contract --children`, and improved init labels.
- Modify: `src/info.ts` - makes help concise and points to `commands`.
- Modify: `src/init.ts` - extends `InitProjectOptions` with agent-contract flags or returns enough data for CLI-level agent-contract setup.
- Modify: `src/ready.ts` - includes agent-contract health when a root `AGENTS.md` exists or Benjamin contract markers are present.
- Modify: `src/types.ts` - only if shared option types are cleaner there.
- Modify: `package.json` - adds `bd` bin alias.
- Modify: `skills/benjamin-docs/SKILL.md` - updates the skill around `init`, `ready`, and protective AGENTS.md stewardship.
- Modify: `README.md` - simplifies the main command story and moves advanced command discovery to `commands`.
- Modify: existing tests under `test/info.test.ts`, `test/init.test.ts`, and `test/ready.test.ts`.

## Task 1: Simplify Help And Add Command Drawer

**Files:**
- Create: `src/commands.ts`
- Create: `test/commands.test.ts`
- Modify: `src/cli.ts`
- Modify: `src/info.ts`
- Modify: `test/info.test.ts`

- [ ] **Step 1: Write failing tests for concise help**

Update `test/info.test.ts` help assertions so `help` emphasizes only the main path and points to `commands`.

```ts
  it("prints concise help with the main command surface", () => {
    withTempDir((dir) => {
      const output = runCli(["help"], dir);

      assert.match(output, /benjamin-docs/);
      assert.match(output, /Repo-local project memory/);
      assert.match(output, /benjamin-docs init/);
      assert.match(output, /benjamin-docs ready/);
      assert.match(output, /benjamin-docs help/);
      assert.match(output, /Use the benjamin-docs skill to create a project from this chat/);
      assert.match(output, /benjamin-docs commands/);
      assert.doesNotMatch(output, /benjamin-docs validate/);
      assert.doesNotMatch(output, /benjamin-docs doctor --strict/);
      assert.doesNotMatch(output, /benjamin-docs export --audience developer/);
    });
  });
```

Keep the existing `--version`, `--help`, `-h`, `introduce`, and `chat-project` tests, but update help-flag assertions from `introduce` to a main-command string:

```ts
  it("prints help for help flags", () => {
    withTempDir((dir) => {
      assert.match(runCli(["--help"], dir), /benjamin-docs ready/);
      assert.match(runCli(["-h"], dir), /benjamin-docs ready/);
    });
  });
```

- [ ] **Step 2: Write failing tests for `commands`**

Create `test/commands.test.ts`.

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { runCli, withTempDir } from "./helpers.js";

describe("commands", () => {
  it("prints the full command drawer outside an interactive terminal", () => {
    withTempDir((dir) => {
      const output = runCli(["commands"], dir);

      assert.match(output, /benjamin-docs commands/);
      assert.match(output, /Main commands/);
      assert.match(output, /benjamin-docs init/);
      assert.match(output, /benjamin-docs ready/);
      assert.match(output, /Advanced commands/);
      assert.match(output, /benjamin-docs validate/);
      assert.match(output, /benjamin-docs review/);
      assert.match(output, /benjamin-docs doctor/);
      assert.match(output, /benjamin-docs export --audience developer/);
      assert.match(output, /benjamin-docs install-skill/);
      assert.match(output, /benjamin-docs package-skill/);
    });
  });
});
```

- [ ] **Step 3: Run focused tests and verify failure**

Run:

```bash
pnpm build && node --test dist/test/info.test.js dist/test/commands.test.js
```

Expected: tests fail because `commands` is unknown and help still lists every command.

- [ ] **Step 4: Add `src/commands.ts`**

Create `src/commands.ts`.

```ts
export interface CommandEntry {
  command: string;
  description: string;
}

export const mainCommands: CommandEntry[] = [
  { command: "benjamin-docs init", description: "Set up local project memory and optional agent guidance." },
  { command: "benjamin-docs ready", description: "Check whether project memory is handoff-ready." },
  { command: "benjamin-docs help", description: "Show the short getting-started guide." },
];

export const advancedCommands: CommandEntry[] = [
  { command: "benjamin-docs status", description: "Show current Benjamin Docs setup." },
  { command: "benjamin-docs next", description: "Print the next recommended agent prompt." },
  { command: "benjamin-docs validate", description: "Check structure, frontmatter, links, scopes, and anchors." },
  { command: "benjamin-docs review", description: "Check for thin or starter-template docs." },
  { command: "benjamin-docs doctor", description: "Check local setup and skill packaging." },
  { command: "benjamin-docs doctor --strict", description: "Run setup checks as a strict gate." },
  { command: "benjamin-docs export --audience developer", description: "Build a local audience-specific Markdown bundle." },
  { command: "benjamin-docs scope create feature <slug>", description: "Create feature docs and metadata." },
  { command: "benjamin-docs anchor add <id> <file>", description: "Link a stable code anchor to docs." },
  { command: "benjamin-docs install-skill", description: "Install the bundled agent skill locally." },
  { command: "benjamin-docs package-skill", description: "Package the skill for Claude upload." },
  { command: "benjamin-docs chat-project", description: "Print exact guidance for chat-to-project workflows." },
];

export function getCommandsText(): string {
  return [
    "benjamin-docs commands",
    "",
    "Main commands",
    ...mainCommands.map(formatEntry),
    "",
    "Advanced commands",
    ...advancedCommands.map(formatEntry),
    "",
    "Tip: use the short alias `bd` when it is installed, for example `bd init`.",
  ].join("\n");
}

function formatEntry(entry: CommandEntry): string {
  return `  ${entry.command.padEnd(48)} ${entry.description}`;
}
```

- [ ] **Step 5: Wire `commands` into CLI**

In `src/cli.ts`, import `getCommandsText`.

```ts
import { getCommandsText } from "./commands.js";
```

Add this branch after help/version handling:

```ts
  if (command === "commands") {
    console.log(getCommandsText());
    return 0;
  }
```

- [ ] **Step 6: Simplify help text**

Replace `getHelpText()` in `src/info.ts` with:

```ts
export function getHelpText(): string {
  return [
    "benjamin-docs",
    "",
    "Repo-local project memory for humans and AI agents.",
    "",
    "Main commands:",
    "  benjamin-docs init   Set up project memory.",
    "  benjamin-docs ready  Check whether memory is handoff-ready.",
    "  benjamin-docs help   Show this guide.",
    "",
    "If you are starting from a chat, ask your agent:",
    "  Use the benjamin-docs skill to create a project from this chat.",
    "",
    "If you are inside a project, run:",
    "  benjamin-docs init",
    "",
    "Then ask your agent:",
    "  Capture the current project baseline with benjamin-docs in plain language.",
    "",
    "For every command, run:",
    "  benjamin-docs commands",
  ].join("\n");
}
```

- [ ] **Step 7: Run focused tests and verify pass**

Run:

```bash
pnpm build && node --test dist/test/info.test.js dist/test/commands.test.js
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/commands.ts src/cli.ts src/info.ts test/commands.test.ts test/info.test.ts
git commit -m "feat: add command drawer"
```

## Task 2: Add `bd` Alias And Guided Init Wording

**Files:**
- Modify: `package.json`
- Modify: `src/cli.ts`
- Modify: `test/init.test.ts`
- Modify: `test/info.test.ts`

- [ ] **Step 1: Write failing package alias test**

In `test/info.test.ts`, add:

```ts
  it("publishes the short bd bin alias", () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));

    assert.equal(pkg.bin["benjamin-docs"], "dist/src/cli.js");
    assert.equal(pkg.bin.bd, "dist/src/cli.js");
  });
```

- [ ] **Step 2: Write failing init wording test**

In `test/init.test.ts`, add a direct unit-level test by exporting a helper from `src/cli.ts` in the implementation step. Test against built JS after export exists:

```ts
  it("uses broad setup labels for interactive init choices", async () => {
    const cli = await import("../dist/src/cli.js");

    assert.deepEqual(cli.initChoiceLabels(), [
      "A new project or idea",
      "A codebase or app",
      "One feature, change, or plan",
    ]);
  });
```

- [ ] **Step 3: Run focused tests and verify failure**

Run:

```bash
pnpm build && node --test dist/test/info.test.js dist/test/init.test.js
```

Expected: FAIL because `bd` is missing and `initChoiceLabels` is not exported.

- [ ] **Step 4: Add `bd` bin alias**

In `package.json`, change `bin` to:

```json
  "bin": {
    "benjamin-docs": "dist/src/cli.js",
    "bd": "dist/src/cli.js"
  },
```

- [ ] **Step 5: Export init choice labels**

In `src/cli.ts`, add:

```ts
export function initChoiceLabels(): string[] {
  return ["A new project or idea", "A codebase or app", "One feature, change, or plan"];
}
```

Then update `promptForInitOptions()` choices:

```ts
async function promptForInitOptions(): Promise<InitProjectOptions> {
  const labels = initChoiceLabels();
  const choices: Array<{ label: string; setup: FocusType }> = [
    { label: labels[0] ?? "A new project or idea", setup: "project" },
    { label: labels[1] ?? "A codebase or app", setup: "codebase" },
    { label: labels[2] ?? "One feature, change, or plan", setup: "feature" },
  ];
  const selected = await selectChoice("What are you setting up?", choices.map((choice) => choice.label));
  const setup = choices[selected]?.setup ?? "project";

  if (setup !== "feature") return { setup };

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const feature = (await rl.question("Feature slug: ")).trim();
    return { setup, feature };
  } finally {
    rl.close();
  }
}
```

- [ ] **Step 6: Run focused tests and verify pass**

Run:

```bash
pnpm build && node --test dist/test/info.test.js dist/test/init.test.js
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add package.json src/cli.ts test/info.test.ts test/init.test.ts
git commit -m "feat: simplify init choices"
```

## Task 3: Implement Protective Agent Contract Setup

**Files:**
- Create: `src/agent-contracts.ts`
- Create: `test/agent-contracts.test.ts`
- Modify: `src/cli.ts`
- Modify: `src/init.ts`
- Modify: `src/types.ts` if option typing needs a shared type

- [ ] **Step 1: Write failing tests for root contract creation and preservation**

Create `test/agent-contracts.test.ts`.

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runCli, withTempDir } from "./helpers.js";

describe("agent contracts", () => {
  it("creates a root AGENTS.md when requested during init", () => {
    withTempDir((dir) => {
      const output = runCli(["init", "--mode", "codebase", "--agent-contract"], dir);
      const agentsPath = join(dir, "AGENTS.md");

      assert.equal(existsSync(agentsPath), true);
      const content = readFileSync(agentsPath, "utf8");
      assert.match(content, /<!-- benjamin-docs:start -->/);
      assert.match(content, /<!-- benjamin-docs:end -->/);
      assert.match(content, /\.benjamin-docs\/config\.json/);
      assert.match(content, /benjamin-docs\/project\/brief\.md/);
      assert.match(content, /benjamin-docs ready/);
      assert.match(output, /Agent guidance: created AGENTS\.md/);
    });
  });

  it("updates only the Benjamin-owned section on repeat init", () => {
    withTempDir((dir) => {
      runCli(["init", "--mode", "codebase", "--agent-contract"], dir);
      const agentsPath = join(dir, "AGENTS.md");
      const first = readFileSync(agentsPath, "utf8");
      writeFileSync(agentsPath, `${first}\n\n# Local Note\n\nKeep this line.\n`, "utf8");

      runCli(["init", "--mode", "codebase", "--agent-contract"], dir);
      const second = readFileSync(agentsPath, "utf8");

      assert.match(second, /# Local Note/);
      assert.match(second, /Keep this line\./);
      assert.equal((second.match(/<!-- benjamin-docs:start -->/g) ?? []).length, 1);
      assert.equal((second.match(/<!-- benjamin-docs:end -->/g) ?? []).length, 1);
    });
  });

  it("preserves an existing unmarked AGENTS.md and reports guidance", () => {
    withTempDir((dir) => {
      writeFileSync(join(dir, "AGENTS.md"), "# Existing Agent Rules\n\nDo not overwrite this.\n", "utf8");

      const output = runCli(["init", "--mode", "codebase", "--agent-contract"], dir);
      const content = readFileSync(join(dir, "AGENTS.md"), "utf8");

      assert.equal(content, "# Existing Agent Rules\n\nDo not overwrite this.\n");
      assert.match(output, /Agent guidance: preserved existing AGENTS\.md/);
      assert.match(output, /Consider adding a Benjamin Docs section/);
    });
  });
});
```

- [ ] **Step 2: Write failing tests for child contracts**

Add to `test/agent-contracts.test.ts`:

```ts
  it("creates conservative child contracts when requested", () => {
    withTempDir((dir) => {
      runCli(["init", "--mode", "codebase", "--agent-contract", "--children"], dir);

      assert.equal(existsSync(join(dir, "benjamin-docs/AGENTS.md")), true);
      assert.equal(existsSync(join(dir, "AGENTS.md")), true);
      const root = readFileSync(join(dir, "AGENTS.md"), "utf8");
      const child = readFileSync(join(dir, "benjamin-docs/AGENTS.md"), "utf8");

      assert.match(root, /Child Agent Contract Index/);
      assert.match(root, /benjamin-docs\/AGENTS\.md/);
      assert.match(child, /Benjamin-managed project memory/);
    });
  });
```

- [ ] **Step 3: Run focused tests and verify failure**

Run:

```bash
pnpm build && node --test dist/test/agent-contracts.test.js
```

Expected: FAIL because `--agent-contract` is unknown.

- [ ] **Step 4: Create `src/agent-contracts.ts`**

Create this focused implementation:

```ts
import { existsSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { CONFIG_DIR, CONFIG_FILE } from "./constants.js";
import { readGeneratedJson, writeGeneratedText, writeGeneratedTextIfMissing } from "./fsx.js";
import { readConfig } from "./project-config.js";
import type { BenjaminDocsConfig } from "./types.js";

export interface AgentContractOptions {
  children?: boolean;
}

export interface AgentContractResult {
  written: string[];
  messages: string[];
  preservedExisting: boolean;
}

export interface AgentContractCheckResult {
  ok: boolean;
  enabled: boolean;
  summary: string;
  errors: string[];
  warnings: string[];
}

const ROOT_PATH = "AGENTS.md";
const START_MARKER = "<!-- benjamin-docs:start -->";
const END_MARKER = "<!-- benjamin-docs:end -->";

export function installAgentContracts(root: string, options: AgentContractOptions = {}): AgentContractResult {
  const config = readConfig(root);
  const written: string[] = [];
  const messages: string[] = [];
  const childPaths = options.children ? createChildContracts(root, config, written, messages) : [];
  const section = buildBenjaminSection(config, childPaths);
  const rootPath = `${root}/${ROOT_PATH}`;

  if (!existsSync(rootPath)) {
    writeGeneratedTextIfMissing(root, ROOT_PATH, `# AGENTS\n\n${section}\n`);
    written.push(ROOT_PATH);
    messages.push("Agent guidance: created AGENTS.md.");
    return { written, messages, preservedExisting: false };
  }

  const current = readFileSync(rootPath, "utf8");
  if (current.includes(START_MARKER) && current.includes(END_MARKER)) {
    const next = replaceMarkedSection(current, section);
    if (next !== current) {
      writeGeneratedText(root, ROOT_PATH, next);
      written.push(ROOT_PATH);
    }
    messages.push("Agent guidance: updated Benjamin Docs section in AGENTS.md.");
    return { written, messages, preservedExisting: false };
  }

  messages.push("Agent guidance: preserved existing AGENTS.md.");
  messages.push("Consider adding a Benjamin Docs section or splitting long guidance into child AGENTS.md files.");
  return { written, messages, preservedExisting: true };
}

export function checkAgentContracts(root: string): AgentContractCheckResult {
  const rootPath = `${root}/${ROOT_PATH}`;
  if (!existsSync(rootPath)) {
    return { ok: true, enabled: false, summary: "not configured", errors: [], warnings: [] };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const content = readFileSync(rootPath, "utf8");
  const hasStart = content.includes(START_MARKER);
  const hasEnd = content.includes(END_MARKER);

  if (hasStart !== hasEnd) errors.push("AGENTS.md has unbalanced Benjamin Docs section markers.");
  if (!hasStart && !hasEnd) {
    warnings.push("AGENTS.md exists, but no Benjamin Docs section was found.");
    return { ok: true, enabled: true, summary: "existing AGENTS.md without Benjamin section", errors, warnings };
  }

  const config = safeReadConfig(root, errors);
  if (config) {
    if (!content.includes(`${CONFIG_DIR}/${CONFIG_FILE}`)) errors.push("AGENTS.md does not reference .benjamin-docs/config.json.");
    if (!content.includes(`${config.docsRoot}/`)) errors.push(`AGENTS.md does not reference configured docs root: ${config.docsRoot}/`);
  }

  for (const childPath of parseChildPaths(content)) {
    if (!existsSync(`${root}/${childPath}`)) errors.push(`Referenced child AGENTS.md is missing: ${childPath}`);
  }

  return {
    ok: errors.length === 0,
    enabled: true,
    summary: errors.length === 0 ? "agent guidance ok" : `${errors.length} errors, ${warnings.length} warnings`,
    errors,
    warnings,
  };
}

function buildBenjaminSection(config: BenjaminDocsConfig, childPaths: string[]): string {
  const lines = [
    START_MARKER,
    "## Benjamin Docs Project Memory",
    "",
    `- Project memory lives in \`${config.docsRoot}/\`.`,
    `- Machine metadata lives in \`${CONFIG_DIR}/${CONFIG_FILE}\` and sibling files.`,
    "- Before project or code changes, read the most relevant Benjamin docs first:",
    `  - \`${config.docsRoot}/project/brief.md\``,
    `  - \`${config.docsRoot}/project/roadmap.md\``,
    `  - \`${config.docsRoot}/project/open-questions.md\``,
    `  - \`${config.docsRoot}/handoff/agent-brief.md\``,
    "- Update Benjamin docs when durable decisions, workflows, architecture, risks, or handoff context change.",
    "- Do not dump raw transcripts unless the user explicitly asks for an archive.",
    "- Preserve the user's intent, but call out weak assumptions, contradictions, and useful alternatives.",
    "- Before claiming handoff readiness, run `benjamin-docs ready`.",
  ];

  if (childPaths.length > 0) {
    lines.push("", "### Child Agent Contract Index");
    for (const childPath of childPaths) lines.push(`- \`${childPath}\``);
  }

  lines.push(END_MARKER);
  return lines.join("\n");
}

function createChildContracts(root: string, config: BenjaminDocsConfig, written: string[], messages: string[]): string[] {
  const candidates = [
    { path: `${config.docsRoot}/AGENTS.md`, body: `# AGENTS\n\n${config.docsRoot}/ contains Benjamin-managed project memory. Keep docs readable, scoped, and current.\n` },
    { path: "src/AGENTS.md", body: "# AGENTS\n\nsrc/ contains source code. Keep changes focused and update Benjamin docs when durable behavior or architecture changes.\n" },
    { path: "test/AGENTS.md", body: "# AGENTS\n\ntest/ contains automated tests. Add or update focused tests for behavior changes.\n" },
    { path: "skills/AGENTS.md", body: "# AGENTS\n\nskills/ contains bundled agent skill instructions. Keep skill guidance concise, operational, and aligned with README and Benjamin docs.\n" },
    { path: ".github/AGENTS.md", body: "# AGENTS\n\n.github/ contains repository automation and community files. Keep public workflow guidance aligned with README and release docs.\n" },
  ];
  const created: string[] = [];

  for (const candidate of candidates) {
    if (!existsSync(`${root}/${dirname(candidate.path)}`)) continue;
    if (writeGeneratedTextIfMissing(root, candidate.path, candidate.body)) {
      written.push(candidate.path);
      created.push(candidate.path);
    } else if (existsSync(`${root}/${candidate.path}`)) {
      created.push(candidate.path);
    }
  }

  if (created.length > 0) messages.push(`Agent guidance: child contracts available: ${created.join(", ")}.`);
  return created;
}

function replaceMarkedSection(content: string, section: string): string {
  const start = content.indexOf(START_MARKER);
  const end = content.indexOf(END_MARKER);
  if (start === -1 || end === -1 || end < start) return content;
  const afterEnd = end + END_MARKER.length;
  return `${content.slice(0, start).trimEnd()}\n\n${section}\n\n${content.slice(afterEnd).trimStart()}`.trimEnd() + "\n";
}

function parseChildPaths(content: string): string[] {
  return [...content.matchAll(/`([^`]+\/AGENTS\.md)`/g)].map((match) => match[1]).filter((path): path is string => Boolean(path));
}

function safeReadConfig(root: string, errors: string[]): BenjaminDocsConfig | undefined {
  try {
    return readGeneratedJson<BenjaminDocsConfig>(root, `${CONFIG_DIR}/${CONFIG_FILE}`, "Metadata path");
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    return undefined;
  }
}
```

- [ ] **Step 5: Add init options and CLI parsing**

Extend `InitProjectOptions` in `src/init.ts`:

```ts
export interface InitProjectOptions {
  setup?: FocusType;
  feature?: string;
  docsRoot?: string;
  agentContract?: boolean;
  childContracts?: boolean;
}
```

In `src/cli.ts`, import:

```ts
import { installAgentContracts } from "./agent-contracts.js";
```

In `parseInitArgs`, add:

```ts
    if (arg === "--agent-contract" || arg === "--agent-guidance") {
      options.agentContract = true;
      continue;
    }

    if (arg === "--children") {
      options.childContracts = true;
      options.agentContract = true;
      continue;
    }
```

In the `init` branch after `initProject`:

```ts
    if (options.agentContract) {
      const agentResult = installAgentContracts(cwd, { children: options.childContracts });
      for (const message of agentResult.messages) console.log(message);
    }
```

- [ ] **Step 6: Run focused tests and verify pass**

Run:

```bash
pnpm build && node --test dist/test/agent-contracts.test.js dist/test/init.test.js
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/agent-contracts.ts src/cli.ts src/init.ts src/fsx.ts test/agent-contracts.test.ts test/init.test.ts
git commit -m "feat: add protective agent contracts"
```

## Task 4: Include Agent Contract Health In `ready`

**Files:**
- Modify: `src/ready.ts`
- Modify: `test/ready.test.ts`
- Modify: `src/agent-contracts.ts` if check output needs adjustment

- [ ] **Step 1: Write failing ready tests for agent guidance**

In `test/ready.test.ts`, add:

```ts
  it("includes agent guidance health when AGENTS.md exists", () => {
    withTempDir((dir) => {
      runCliResult(["install-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["package-skill"], dir, { BENJAMIN_DOCS_HOME: dir });
      runCliResult(["init", "--mode", "codebase", "--agent-contract"], dir);
      writeReadyBaseline(dir);

      const result = runCliResult(["ready"], dir, { BENJAMIN_DOCS_HOME: dir });

      assert.equal(result.status, 0);
      assert.match(result.stdout, /ok\s+agent guidance - agent guidance ok/);
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
      assert.match(result.stdout, /unbalanced Benjamin Docs section markers/);
    });
  });
```

Refactor the existing successful ready test setup into a helper so the new tests can reuse it:

```ts
function writeReadyBaseline(dir: string): void {
  writeBaselineDoc(dir, "benjamin-docs/project/brief.md", "Project Brief", capturedBody("This product helps teams preserve project context across AI sessions. It serves owners, developers, and future agents. The important baseline is local-first documentation with clear handoff notes, not hosted publishing or transcript dumping."));
  writeBaselineDoc(dir, "benjamin-docs/project/roadmap.md", "Roadmap", capturedBody("The current roadmap is to stabilize capture flows, improve existing-codebase onboarding, and keep README guidance short. Near-term work focuses on doc quality checks. Deferred work includes SaaS publishing, dashboards, and hosted collaboration."));
  writeBaselineDoc(dir, "benjamin-docs/project/open-questions.md", "Open Questions", "## Decisions\n\n- Should review warnings become stricter over time?\n- Which docs should be required for feature captures?\n- Should package publishing stay manual until the project is more stable?\n");
  writeBaselineDoc(dir, "benjamin-docs/handoff/human-brief.md", "Human Brief", capturedBody("This project is a local project-memory tool. It turns useful planning and build conversations into durable Markdown files. The important thing for a human reader is that docs stay inside the project and are meant to explain decisions, next steps, and open questions plainly."));
  writeBaselineDoc(dir, "benjamin-docs/handoff/agent-brief.md", "Agent Brief", capturedBody("Future agents should read the README, project brief, roadmap, open questions, architecture, and code map before changing behavior. Preserve local-first behavior, ask before creating chat projects, run validation after edits, and avoid inventing certainty when context is missing."));
  writeBaselineDoc(dir, "benjamin-docs/engineering/architecture.md", "Architecture", capturedBody("The CLI is a Node command that writes a docs workspace and metadata into the current project. Metadata lives in .benjamin-docs while human-readable docs live under benjamin-docs. Validation checks frontmatter, manifest entries, anchors, links, and path safety."));
  writeBaselineDoc(dir, "benjamin-docs/engineering/code-map.md", "Code Map", capturedBody("The main CLI entry is src/cli.ts. Initialization lives in src/init.ts. Validation lives in src/validate.ts. Skill installation lives in src/install-skill.ts. Prompt helpers live in src/next.ts and src/chat-project.ts. Tests live under test."));
}
```

- [ ] **Step 2: Run focused tests and verify failure**

Run:

```bash
pnpm build && node --test dist/test/ready.test.js
```

Expected: FAIL because `ready` does not include agent guidance.

- [ ] **Step 3: Update `src/ready.ts`**

Import:

```ts
import { checkAgentContracts } from "./agent-contracts.js";
```

Inside `checkReady`, call:

```ts
  const agentContracts = checkAgentContracts(cwd);
  const agentContractsOk = agentContracts.ok;
```

Include it in overall `ok` only when enabled:

```ts
  const ok = validationOk && reviewOk && doctorOk && (!agentContracts.enabled || agentContractsOk);
```

Add a check line only when enabled:

```ts
  const checks = [
    formatCheck("validate", validationOk, summarizeValidation(validation)),
    formatCheck("review", reviewOk, summarizeReview(review)),
    formatCheck("doctor --strict", doctorOk, doctorOk ? "setup ok" : "setup gaps found"),
  ];

  if (agentContracts.enabled) {
    checks.push(formatCheck("agent guidance", agentContractsOk, agentContracts.summary));
  }
```

Use `...checks` in the `lines` array after `"Checks"`.

If agent guidance has errors or warnings, add:

```ts
  if (agentContracts.enabled && (agentContracts.errors.length > 0 || agentContracts.warnings.length > 0)) {
    lines.push("");
    lines.push("Agent Guidance");
    for (const error of agentContracts.errors) lines.push(`  - error: ${error}`);
    for (const warning of agentContracts.warnings) lines.push(`  - warning: ${warning}`);
  }
```

- [ ] **Step 4: Run focused tests and verify pass**

Run:

```bash
pnpm build && node --test dist/test/ready.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ready.ts test/ready.test.ts src/agent-contracts.ts
git commit -m "feat: include agent guidance in ready"
```

## Task 5: Update Skill And README Around The Simple Surface

**Files:**
- Modify: `skills/benjamin-docs/SKILL.md`
- Modify: `README.md`
- Modify: `test/info.test.ts` if public text expectations move

- [ ] **Step 1: Update skill workflow rules**

In `skills/benjamin-docs/SKILL.md`, update the normal workflow to make `ready` the primary gate:

```md
11. Run the local CLI command with `ready` for baseline captures, handoffs, or whenever the user asks whether the project is ready.
12. Use lower-level commands such as `validate`, `review`, or `doctor --strict` only when debugging a failed `ready` result or when the user asks for that specific check.
13. Report changed files, key decisions captured, unresolved questions, and whether `ready` passed.
```

Add an Agent Guidance section:

```md
## Agent Guidance And AGENTS.md

When initializing or updating a codebase/app or feature/change project, prefer `benjamin-docs init --agent-contract` when the user wants future agents to work from project memory.

Never overwrite an existing `AGENTS.md`.

If `AGENTS.md` already exists and does not contain a Benjamin-owned section, preserve it. Suggest adding a Benjamin Docs section, splitting long guidance into child `AGENTS.md` files, or rewriting only with explicit user approval.

Treat existing agent instructions as user-owned source material.
```

For chat-to-project, keep the original flow but let `init` be the front door:

```md
7. Run the local CLI command inside that folder with `init --mode planning`.
```

Keep this command because agents need non-interactive behavior.

- [ ] **Step 2: Update README main commands**

In `README.md`, make the quick start emphasize:

```md
benjamin-docs init
benjamin-docs ready
benjamin-docs help
```

Add:

```md
For the full command drawer:

```bash
benjamin-docs commands
```
```

Move long command lists out of the main path or shorten them to a note that advanced commands exist.

- [ ] **Step 3: Run package checks**

Run:

```bash
pnpm check
```

Expected: PASS.

- [ ] **Step 4: Run Benjamin ready on this repo**

Run:

```bash
node dist/src/cli.js ready
```

Expected: PASS or a clear existing docs-quality warning. If it fails because the newly added spec/plan docs are not in `.benjamin-docs/manifest.json`, decide whether these superpowers docs should stay outside Benjamin-managed docs or whether manifest handling needs updating. Do not hide a real readiness regression.

- [ ] **Step 5: Commit**

```bash
git add README.md skills/benjamin-docs/SKILL.md test/info.test.ts
git commit -m "docs: simplify benjamin docs workflow"
```

## Task 6: Final Verification And Release-Readiness Pass

**Files:**
- Modify: only files needed to fix verification failures.

- [ ] **Step 1: Run full checks**

Run:

```bash
pnpm check
```

Expected: PASS.

- [ ] **Step 2: Run CLI smoke commands**

Run:

```bash
node dist/src/cli.js help
node dist/src/cli.js commands
node dist/src/cli.js init --mode codebase --agent-contract
node dist/src/cli.js ready
```

For the `init` smoke command, run in a temporary directory:

```bash
tmpdir=$(mktemp -d)
(cd "$tmpdir" && node /Users/marty/Important/benjamin-docs/dist/src/cli.js init --mode codebase --agent-contract --children)
```

Expected:

- help is concise
- commands lists advanced commands
- init creates Benjamin docs and root `AGENTS.md`
- ready reports starter-doc warnings until docs are captured, not a crash

- [ ] **Step 3: Run Benjamin ready on this repo**

Run:

```bash
node dist/src/cli.js ready
```

Expected: PASS, or a known pre-existing warning that is documented in the final response. If new 0.3.0 changes create a failure, fix it before finalizing.

- [ ] **Step 4: Inspect git diff**

Run:

```bash
git status --short
git diff --stat
git diff -- src/agent-contracts.ts src/cli.ts src/ready.ts src/info.ts README.md skills/benjamin-docs/SKILL.md
```

Expected: changes match this plan; no unrelated files modified.

- [ ] **Step 5: Final commit**

If any fixes were made after the previous task commits:

```bash
git add .
git commit -m "chore: finalize simple agent-ready setup"
```

## Self-Review Checklist

- Spec coverage:
  - `init`, `ready`, and `help` are the main surface: Tasks 1, 2, 4, 5.
  - `commands` drawer exists: Task 1.
  - `bd` alias exists: Task 2.
  - guided init wording covers project/idea, codebase/app, feature/change: Task 2.
  - agent contracts live inside `init`, not a top-level `agents` family: Task 3.
  - existing `AGENTS.md` is preserved: Task 3.
  - `ready` includes agent guidance when present: Task 4.
  - skill and README keep chat-to-project alive: Task 5.
- Placeholder scan: no placeholder markers or vague implementation steps remain.
- Type consistency:
  - `agentContract` and `childContracts` are the planned `InitProjectOptions` names.
  - `installAgentContracts` and `checkAgentContracts` are the planned module API names.
  - `getCommandsText` is the planned command drawer API name.
