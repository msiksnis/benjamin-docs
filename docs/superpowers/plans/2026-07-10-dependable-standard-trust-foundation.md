# Dependable Standard Trust Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Benjamin Docs 0.12.0 with truthful readiness, safe exports, repository-local health checks, response-safe agent integrations, and enforced latency/token budgets.

**Architecture:** Introduce small domain modules for context budgets, readiness analysis, and export policy while keeping terminal formatting in the existing command adapters. Session-start remains the compact push path; MCP search remains the on-demand pull path; stop hooks stop requesting model continuations. This release establishes trustworthy boundaries without attempting the later canonical-state schema or public protocol.

**Tech Stack:** Node.js 22+, TypeScript 6, node:test, pnpm 11, Git, MCP TypeScript SDK 1.29, Markdown/YAML-like frontmatter.

## Global Constraints

- Benjamin Docs remains local-first and dependency-light; add no runtime dependency in this release.
- The normal human surface remains `bd init`, `bd status`, and `bd export`; new diagnostic flags are agent/CI interfaces.
- BD bookkeeping must never suppress, replace, delay, or materially rewrite the answer to the user's task.
- Reading Benjamin Docs alone produces no user-facing note. When durable memory changes, an agent may append one sentence of at most 120 characters after the substantive answer, for example: `Benjamin Docs updated: trust-foundation plan.`
- Installed stop hooks must never block completion, auto-submit a follow-up, or request another model turn.
- Session-start plain context stays at or below 400 characters and 100 estimated tokens, using `ceil(characters / 4)` as the deterministic estimate.
- Task-scoped `memory_context` stays at or below 2,400 characters and 600 estimated tokens.
- A memory-search snippet stays at or below 300 characters; default result count is 5 and hard maximum is 8.
- The core `skills/benjamin-docs/SKILL.md` stays at or below 1,200 words; detailed workflows move to references loaded only when relevant.
- Reference benchmark on 2026-07-10: `session-start` p95 349.9 ms over 20 runs and 255 output characters; `ready` p95 452.5 ms. Release targets are session-start and no-op session-stop p95 at or below 400 ms on the maintainer reference machine and at or below 750 ms in CI.
- A normal task may incur at most one automatic process at session start and one silent process at session end. Full `ready`, views, or export checks run only when the task creates durable changes or explicitly requests them.
- Structural validity, content heuristics, code freshness, integration health, and export safety remain distinct states. Never label heuristic checks as semantic verification.
- Existing user-authored `AGENTS.md`, hook entries, MCP configuration, and Markdown content must be preserved.
- Use test-first implementation and commit after every task.

---

## File and Responsibility Map

**Create:**

- `src/context-budget.ts` — shared character/token budgets and boundary-safe truncation.
- `src/readiness.ts` — structured, repository-local readiness analysis with independent dimensions.
- `src/export-policy.ts` — one preflight policy for customer/public export operations.
- `scripts/benchmark-agent-overhead.mjs` — repeatable latency and output-size benchmark.
- `test/context-budget.test.ts` — deterministic budget and truncation tests.
- `test/readiness-report.test.ts` — JSON/readiness dimension and false-ready regressions.
- `test/export-policy.test.ts` — publication-policy unit tests.
- `skills/benjamin-docs/references/capture.md` — baseline, feature, handoff, and changed-work workflow details.
- `skills/benjamin-docs/references/export.md` — export verification and publication workflow.
- `skills/benjamin-docs/references/integrations.md` — hooks, MCP, upgrades, and agent-specific setup.

**Modify:**

- `src/session.ts` — apply context budgets and make stop output non-blocking/silent.
- `src/session-state.ts` — retain safe baseline tracking while representing deletions.
- `src/hooks.ts` — install session-start only and remove legacy Benjamin stop hooks during upgrade.
- `src/memory-tools.ts` — bounded retrieval, smaller snippets, and canonical default limits.
- `src/mcp-server.ts` — publish the smaller limits and structured budget metadata.
- `src/review.ts` — expose changed-work warnings separately from baseline quality warnings.
- `src/ready.ts` — format structured readiness instead of combining global setup with repository health.
- `src/cli.ts` — add `ready --json` and target-specific doctor parsing.
- `src/git.ts` — include deletions and classify every repository file type conservatively.
- `src/doctor.ts` — separate project health from optional integration health.
- `src/export.ts` — route every export through the shared preflight and disable unsafe customer deliverables.
- `src/agent-contracts.ts` — encode the response-preservation and optional one-sentence note contract.
- `src/info.ts`, `src/commands.ts`, `package.json`, `README.md` — truthful public language.
- `test/drift-hooks.test.ts`, `test/mcp.test.ts`, `test/ready.test.ts`, `test/doctor.test.ts`, `test/validate-export.test.ts`, `test/agent-contracts.test.ts`, `test/info.test.ts` — behavior regressions.
- `.github/workflows/ci.yml` — supported platform matrix, tarball smoke, and budget checks.
- `CONTRIBUTING.md`, `SECURITY.md` — correct repository paths and external-write boundaries.
- `skills/benjamin-docs/SKILL.md` — compact router skill.
- `benjamin-docs/releases/changelog.md` and the launch-audit/project handoff docs — release truth and continuation state.

**Remove:**

- `benjamin-docs-skill.zip` — stale tracked binary; packaging remains generated by `bd package-skill` and release automation.

---

### Task 1: Lock Context, Token, and Latency Budgets

**Files:**

- Create: `src/context-budget.ts`
- Create: `test/context-budget.test.ts`
- Create: `scripts/benchmark-agent-overhead.mjs`
- Modify: `package.json`

**Interfaces:**

- Produces: `CONTEXT_BUDGETS`, `estimatedTokens(text)`, and `truncateAtBoundary(text, maxCharacters, suffix?)`.
- Produces package command: `pnpm benchmark:agent-overhead` and assertion form `pnpm benchmark:agent-overhead -- --assert`.
- Consumed by Tasks 2 and 3.

- [ ] **Step 1: Write the failing deterministic budget tests**

Create `test/context-budget.test.ts`:

```ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CONTEXT_BUDGETS, estimatedTokens, truncateAtBoundary } from "../src/context-budget.js";

describe("context budgets", () => {
  it("keeps the public budgets explicit", () => {
    assert.deepEqual(CONTEXT_BUDGETS, {
      sessionStartCharacters: 400,
      sessionStartEstimatedTokens: 100,
      memoryContextCharacters: 2400,
      memoryContextEstimatedTokens: 600,
      memorySearchSnippetCharacters: 300,
      memorySearchDefaultResults: 5,
      memorySearchMaxResults: 8,
      agentCompletionNoteCharacters: 120,
    });
  });

  it("uses a deterministic conservative token estimate", () => {
    assert.equal(estimatedTokens("a".repeat(401)), 101);
  });

  it("truncates at a word boundary and includes a retrieval hint", () => {
    const result = truncateAtBoundary("alpha beta gamma delta", 20, " Use search.");
    assert.equal(result, "alpha Use search.");
    assert.ok(result.length <= 20);
  });
});
```

- [ ] **Step 2: Run the test and verify the module is missing**

Run: `pnpm build && node --test dist/test/context-budget.test.js`

Expected: TypeScript fails because `src/context-budget.ts` does not exist.

- [ ] **Step 3: Implement the budget module**

Create `src/context-budget.ts`:

```ts
export const CONTEXT_BUDGETS = {
  sessionStartCharacters: 400,
  sessionStartEstimatedTokens: 100,
  memoryContextCharacters: 2400,
  memoryContextEstimatedTokens: 600,
  memorySearchSnippetCharacters: 300,
  memorySearchDefaultResults: 5,
  memorySearchMaxResults: 8,
  agentCompletionNoteCharacters: 120,
} as const;

export function estimatedTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function truncateAtBoundary(text: string, maxCharacters: number, suffix = ""): string {
  if (text.length <= maxCharacters) return text;
  if (suffix.length >= maxCharacters) return suffix.slice(0, maxCharacters);

  const available = maxCharacters - suffix.length;
  const prefix = text.slice(0, available + 1);
  const boundary = prefix.lastIndexOf(" ");
  const trimmed = prefix.slice(0, boundary > 0 ? boundary : available).trimEnd();
  return `${trimmed}${suffix}`;
}
```

- [ ] **Step 4: Add the benchmark command**

Create `scripts/benchmark-agent-overhead.mjs` with 20 warm process runs for `session-start` and `session-stop`, sorted p50/p95 calculation, character and estimated-token output, and these assertion thresholds:

```js
const limits = {
  sessionStartP95Ms: process.env.CI ? 750 : 400,
  sessionStopP95Ms: process.env.CI ? 750 : 400,
  sessionStartCharacters: 400,
  sessionStartEstimatedTokens: 100,
  silentStopCharacters: 0,
};
```

The script must exit 1 only when `--assert` is present and a limit is exceeded. It must set `BENJAMIN_DOCS_NO_UPDATE_CHECK=1`, use the repository root as cwd, and print one JSON object so CI can retain the measurement.

- [ ] **Step 5: Wire package scripts and run the checks**

Add to `package.json`:

```json
"benchmark:agent-overhead": "node scripts/benchmark-agent-overhead.mjs"
```

Run:

```bash
pnpm check
pnpm benchmark:agent-overhead
```

Expected: all tests pass and the benchmark prints both p95 measurements plus output budgets. The assertion form is added to CI only after Task 2 makes stop output silent.

- [ ] **Step 6: Commit**

```bash
git add src/context-budget.ts test/context-budget.test.ts scripts/benchmark-agent-overhead.mjs package.json
git commit -m "test: lock agent overhead budgets"
```

### Task 2: Make Agent Integrations Preserve the Final Response

**Files:**

- Modify: `src/hooks.ts`
- Modify: `src/session.ts`
- Modify: `src/agent-contracts.ts`
- Modify: `test/drift-hooks.test.ts`
- Modify: `test/agent-contracts.test.ts`

**Interfaces:**

- Consumes: `CONTEXT_BUDGETS` from Task 1.
- Produces: session-start-only hook installation for Claude Code, Codex, and Cursor.
- Produces: a silent `formatSessionStop()` compatibility path for existing installations.
- Produces agent completion policy: substantive answer first; optional one-sentence BD note only after a durable update.

Current adapter evidence: [Claude Code Stop hooks](https://code.claude.com/docs/en/hooks) use `decision: "block"` or additional context to continue the conversation; the official [Codex Stop output schema](https://github.com/openai/codex/blob/main/codex-rs/hooks/schema/generated/stop.command.output.schema.json) exposes blocking/continuation controls and treats empty stdout as no continuation; [Cursor stop hooks](https://cursor.com/docs/hooks) auto-submit `followup_message`. The safe cross-agent default is therefore session-start context plus no stop output.

- [ ] **Step 1: Replace blocking/follow-up expectations with response-safety tests**

In `test/drift-hooks.test.ts`, replace tests expecting `decision: "block"` or Cursor `followup_message` with assertions that:

```ts
assert.equal(runCodexSessionCommand(dir, "session-stop", payload).trim(), "");
assert.equal(runCliResult(["session-stop", "--format", "claude"], dir).stdout, "");
assert.equal(runCliResult(["session-stop", "--format", "cursor"], dir).stdout, "");
```

In the hook installation test, assert the installed files contain SessionStart/sessionStart and no Benjamin-owned Stop/stop command:

```ts
assert.match(claudeSettings.hooks.SessionStart[0]?.hooks[0]?.command ?? "", /session-start --format claude/);
assert.equal(claudeSettings.hooks.Stop, undefined);
assert.match(codexSettings.hooks.SessionStart[0]?.hooks[0]?.command ?? "", /session-start --format codex/);
assert.equal(codexSettings.hooks.Stop, undefined);
assert.match(cursorSettings.hooks.sessionStart[0]?.command ?? "", /session-start --format cursor/);
assert.equal(cursorSettings.hooks.stop, undefined);
```

Add a migration fixture containing the old Benjamin stop hook beside a user stop hook. After `hooks install`, assert only the Benjamin stop entry is removed.

- [ ] **Step 2: Run focused tests and observe the old blocking behavior**

Run: `pnpm build && node --test dist/test/drift-hooks.test.js dist/test/agent-contracts.test.js`

Expected: failures show Benjamin stop hooks are still installed and `formatSessionStop` still returns blocking JSON.

- [ ] **Step 3: Install only session-start hooks and migrate old entries**

In `src/hooks.ts`:

- Remove `sessionStopCommand` from new installations.
- Before adding SessionStart, remove only entries whose command contains `benjamin-docs session-stop`.
- Preserve every other Stop/stop hook and every non-Benjamin field.
- For Cursor, do not add `followup_message` or a stop hook; official Cursor stop output auto-submits a user message, which violates the response contract.
- For Claude Code and Codex, do not emit `decision: "block"`; both contracts use blocking output to create continuation work.

The shared installation core should have this shape:

```ts
function addSharedSchemaHooks(content: JsonObject, targetId: HookTargetId): boolean {
  const format = targetId === "codex" ? "codex" : "claude";
  const hooks = ensureObject(content, "hooks");
  const removedLegacyStop = removeBenjaminEntriesFromEvent(hooks, "Stop", "session-stop");
  const addedStart = addSharedSchemaEntry(hooks, "SessionStart", "startup|resume|clear", sessionStartCommand(format));
  return removedLegacyStop || addedStart;
}
```

- [ ] **Step 4: Make the legacy session-stop command silent**

Keep `getSessionStopNudge` available for a future explicit diagnostic, but make the installed-hook adapter safe:

```ts
export function formatSessionStop(
  _root: string,
  _format: SessionHookFormat | undefined,
  _hookInput: SessionHookInput | boolean,
): string {
  return "";
}
```

Do not print a warning to stdout or stderr. Existing hook installations must fail open without changing the agent loop.

- [ ] **Step 5: Encode the completion-note contract in generated AGENTS.md**

Add these exact rules to the Benjamin-owned root section in `src/agent-contracts.ts`:

```md
- Complete Benjamin Docs maintenance before writing the final user-facing answer.
- Never let Benjamin Docs bookkeeping replace, delay, or materially change that answer.
- Reading memory alone needs no mention. After a durable memory update, an optional final note must be one short sentence, for example: `Benjamin Docs updated: checkout handoff.`
```

Add tests for all three sentences and assert the generated Benjamin-owned section stays below 2,000 characters.

- [ ] **Step 6: Verify response safety and performance**

Run:

```bash
pnpm build
node --test dist/test/drift-hooks.test.js dist/test/agent-contracts.test.js
pnpm benchmark:agent-overhead -- --assert
```

Expected: focused tests pass; session-stop output is zero characters; no benchmark budget fails.

- [ ] **Step 7: Commit**

```bash
git add src/hooks.ts src/session.ts src/agent-contracts.ts test/drift-hooks.test.ts test/agent-contracts.test.ts
git commit -m "fix: preserve agent final responses"
```

### Task 3: Bound Context Retrieval and Split the Skill

**Files:**

- Modify: `src/session.ts`
- Modify: `src/memory-tools.ts`
- Modify: `src/mcp-server.ts`
- Modify: `test/drift-hooks.test.ts`
- Modify: `test/mcp.test.ts`
- Modify: `skills/benjamin-docs/SKILL.md`
- Create: `skills/benjamin-docs/references/capture.md`
- Create: `skills/benjamin-docs/references/export.md`
- Create: `skills/benjamin-docs/references/integrations.md`
- Modify: `test/install-skill.test.ts`
- Modify: `test/package-skill.test.ts`

**Interfaces:**

- Consumes: context budget helpers from Task 1.
- Produces bounded `memoryContext`, `searchMemory`, and session-start output.
- Produces a router skill whose detailed references are loaded on demand.

- [ ] **Step 1: Add failing output-budget tests**

Add these deterministic assertions:

```ts
const plainContext = runCliResult(["session-start"], dir).stdout.trim();
assert.ok(plainContext.length <= 400);
assert.ok(Math.ceil(plainContext.length / 4) <= 100);
```

In `test/mcp.test.ts`, call `memory_context` with a task that matches many docs and assert:

```ts
const text = context.content[0]?.text ?? "";
assert.ok(text.length <= 2400);
assert.ok(Math.ceil(text.length / 4) <= 600);
```

Call `memory_search` with `limit: 25` and expect an input-schema failure because the new hard maximum is 8. Call it with 8 and assert every snippet body is at most 300 characters.

- [ ] **Step 2: Apply the shared budgets**

In `src/memory-tools.ts`:

```ts
const DEFAULT_SEARCH_LIMIT = CONTEXT_BUDGETS.memorySearchDefaultResults;
const MAX_SEARCH_LIMIT = CONTEXT_BUDGETS.memorySearchMaxResults;
const SNIPPET_LENGTH = CONTEXT_BUDGETS.memorySearchSnippetCharacters;
```

After composing task context, call:

```ts
return truncateAtBoundary(
  output,
  CONTEXT_BUDGETS.memoryContextCharacters,
  "\n\nMore context: use memory_search, then memory_read only for the selected source doc.",
);
```

In `src/session.ts`, apply the 400-character limit with the suffix ` Run bd status for details.` only when optional drift/update lines would exceed the budget. Never truncate the docs-root or read-first line.

Update the MCP `limit` schema from `.max(25)` to `.max(8)` and change its description to `Max sections to return (default 5, maximum 8)`.

- [ ] **Step 3: Convert SKILL.md into a compact router**

Keep these sections in the core skill:

- purpose and trigger;
- start-with-context/search/read rule;
- scope selection;
- update-before-final rule;
- response-preservation note;
- views/review/ready closeout;
- links to the three reference files.

Move the complete existing workflows without losing behavior:

- capture.md: chat-to-project, baseline, feature, handoff, freshness, doc format, continuation proof;
- export.md: human versus agent export, verification, privacy/publication rules;
- integrations.md: hooks, MCP, upgrades, AGENTS.md, install/package details.

The core file must contain routing text such as:

```md
## Detailed workflows

- Read `references/capture.md` only for initialization, capture, feature planning, changed-work review, or handoff work.
- Read `references/export.md` only for exports or publication checks.
- Read `references/integrations.md` only for hooks, MCP, upgrades, skills, or AGENTS.md setup.
```

- [ ] **Step 4: Add packaging assertions**

In install/package tests, assert all three references are installed and included in the ZIP. Add:

```ts
const skillWords = readFileSync(join(process.cwd(), "skills/benjamin-docs/SKILL.md"), "utf8")
  .trim()
  .split(/\s+/)
  .filter(Boolean).length;
assert.ok(skillWords <= 1200);
```

- [ ] **Step 5: Run retrieval, packaging, and benchmark checks**

Run:

```bash
pnpm build
node --test dist/test/mcp.test.js dist/test/drift-hooks.test.js dist/test/install-skill.test.js dist/test/package-skill.test.js
pnpm benchmark:agent-overhead -- --assert
```

Expected: all tests pass; session start is at most 100 estimated tokens; task context is at most 600; the core skill is at most 1,200 words.

- [ ] **Step 6: Commit**

```bash
git add src/session.ts src/memory-tools.ts src/mcp-server.ts test/drift-hooks.test.ts test/mcp.test.ts test/install-skill.test.ts test/package-skill.test.ts skills/benjamin-docs
git commit -m "perf: bound agent context consumption"
```

### Task 4: Introduce Truthful Structured Readiness

**Files:**

- Create: `src/readiness.ts`
- Create: `test/readiness-report.test.ts`
- Modify: `src/review.ts`
- Modify: `src/ready.ts`
- Modify: `src/cli.ts`
- Modify: `test/ready.test.ts`

**Interfaces:**

- Produces: `analyzeReadiness(options): ReadinessReport`.
- Produces CLI: `bd ready` for humans and `bd ready --json` for agents/CI.
- Consumed by Task 7 export preflight.

- [ ] **Step 1: Define and test the report contract**

Create `test/readiness-report.test.ts` around this public type:

```ts
export type ReadinessDimensionId =
  | "structure"
  | "content_heuristics"
  | "committed_freshness"
  | "working_tree_impact"
  | "agent_guidance";

export interface ReadinessDimension {
  id: ReadinessDimensionId;
  status: "pass" | "fail" | "unavailable" | "not_configured";
  blocking: boolean;
  summary: string;
  evidence: string[];
  repair?: string;
}

export interface ReadinessReport {
  schemaVersion: 1;
  status: "ready" | "not_ready";
  dimensions: ReadinessDimension[];
  recordedEnvironmentBlockers: Array<{ path: string; message: string }>;
}
```

Tests must cover:

- pristine captured repository: ready;
- committed watched source change after docs: committed_freshness fails and exit code is 1;
- untracked source file without a memory update: working_tree_impact fails and exit code is 1;
- non-Git planning folder: freshness is unavailable but non-blocking;
- broken configured AGENTS.md: agent_guidance fails;
- `--json`: exact schemaVersion/status/dimension IDs and no ANSI text.

- [ ] **Step 2: Expose changed-work warnings separately**

Extend `ReviewResult`:

```ts
export interface ReviewResult {
  ok: boolean;
  output: string;
  docsChecked: number;
  errors: ReviewIssue[];
  warnings: ReviewIssue[];
  changedWarnings: ReviewIssue[];
}
```

In `reviewProject`, capture `const changedWarningsStart = warnings.length` immediately before `reviewChangedWork`, then return `warnings.slice(changedWarningsStart)` as `changedWarnings`. `analyzeReadiness` must calculate baseline content warnings as `warnings.slice(0, warnings.length - changedWarnings.length)` so changed-work findings do not masquerade as content-quality failures. Existing review output may continue to display the combined warning list.

- [ ] **Step 3: Implement repository-local analysis**

Create `src/readiness.ts` so it calls validation once, review once with `{ changed: true, since: "HEAD" }`, drift once, and agent-contract inspection once. Do not call `runDoctor`.

Blocking rules:

- validation errors or warnings fail structure;
- review errors or baseline warnings fail content_heuristics;
- known committed drift fails committed_freshness;
- changed-work warnings fail working_tree_impact;
- unavailable Git is non-blocking only for planning mode;
- enabled but broken Benjamin agent guidance fails agent_guidance;
- recorded environment blockers are reported but do not change readiness.

The final status is ready only when every blocking dimension passes.

- [ ] **Step 4: Format precise human output**

Replace “docs useful” and unconditional “ready for handoff” language. Passing output ends with:

```text
Repository memory passes the configured structural, heuristic, freshness, and guidance checks.
These deterministic checks do not prove semantic truth; implementation verification remains an agent responsibility.
```

Failing output names the dimension and its repair command. `--json` prints only `JSON.stringify(report, null, 2)`.

- [ ] **Step 5: Run focused tests**

Run:

```bash
pnpm build
node --test dist/test/readiness-report.test.js dist/test/ready.test.js dist/test/review.test.js
```

Expected: false-ready reproductions now exit 1; non-Git planning remains usable; output no longer claims semantic proof.

- [ ] **Step 6: Commit**

```bash
git add src/readiness.ts src/review.ts src/ready.ts src/cli.ts test/readiness-report.test.ts test/ready.test.ts
git commit -m "feat: make readiness truthful"
```

### Task 5: Separate Repository Health from Optional Integrations

**Files:**

- Modify: `src/doctor.ts`
- Modify: `src/cli.ts`
- Modify: `test/doctor.test.ts`
- Modify: `test/ready.test.ts`

**Interfaces:**

- Produces: repository-only `doctor --strict` by default.
- Produces: target-specific `doctor --strict --target <shared|claude-code|codex|cursor|claude-desktop>`.
- Readiness remains independent from every global target.

- [ ] **Step 1: Write clean-HOME and target-isolation tests**

Add tests proving:

```ts
const ready = runCliResult(["ready"], dir, { BENJAMIN_DOCS_HOME: emptyHome });
assert.equal(ready.status, 0);

const projectDoctor = runCliResult(["doctor", "--strict"], dir, { BENJAMIN_DOCS_HOME: emptyHome });
assert.equal(projectDoctor.status, 0);

const codexDoctor = runCliResult(["doctor", "--strict", "--target", "codex"], dir, { BENJAMIN_DOCS_HOME: emptyHome });
assert.equal(codexDoctor.status, 1);
assert.match(codexDoctor.stdout, /Codex/);
assert.doesNotMatch(codexDoctor.stdout, /Claude Desktop upload zip/);
```

Add a Claude Desktop target test that fails only on the missing ZIP.

- [ ] **Step 2: Refactor doctor result dimensions**

Use:

```ts
export type DoctorTarget = "shared" | "claude-code" | "codex" | "cursor" | "claude-desktop";

export interface DoctorOptions {
  cwd?: string;
  commandPath?: string;
  homeDir?: string;
  strict?: boolean;
  target?: DoctorTarget;
}
```

Without a target, strict errors come only from project initialization and validation. With a target, add only that target's skill/hook/package requirements. Keep the full non-strict doctor display informational.

- [ ] **Step 3: Parse and document the target flag**

Add exact usage:

```text
benjamin-docs doctor [--strict] [--target shared|claude-code|codex|cursor|claude-desktop]
```

Reject unknown targets with exit 1 and the same allowed-value list.

- [ ] **Step 4: Run focused tests and benchmark**

Run:

```bash
pnpm build
node --test dist/test/doctor.test.js dist/test/ready.test.js
pnpm benchmark:agent-overhead -- --assert
```

Expected: clean repository health no longer depends on any home-directory artifact.

- [ ] **Step 5: Commit**

```bash
git add src/doctor.ts src/cli.ts test/doctor.test.ts test/ready.test.ts
git commit -m "fix: isolate optional integration health"
```

### Task 6: Account for Deletions and Every Repository Stack

**Files:**

- Modify: `src/git.ts`
- Modify: `src/session-state.ts`
- Modify: `test/review.test.ts`
- Modify: `test/drift-hooks.test.ts`
- Modify: `test/readiness-report.test.ts`

**Interfaces:**

- Produces: changed-file discovery including A, C, M, R, T, and D states plus untracked files.
- Produces: conservative source classification by excluded directories rather than language extension.
- Produces: deletion fingerprints in session baselines.

- [ ] **Step 1: Add cross-stack and deletion regressions**

Create source changes with these paths and assert working_tree_impact fails for each:

```ts
const crossStackPaths = [
  "Sources/App.swift",
  "app/src/main/Main.kt",
  "src/App.cs",
  "lib/main.dart",
  "src/App.vue",
  "src/App.svelte",
  "scripts/deploy.sh",
  "config/runtime.toml",
];
```

Add a committed file deletion under `src/` and assert committed_freshness fails. Add a session test that deletes an existing source file after session start and confirms the internal diagnostic detects one change even though installed stop output remains silent.

- [ ] **Step 2: Include deletions in Git commands**

Change both diff filters in `src/git.ts` from `ACMRT` to `ACMRTD`.

Replace the extension allowlist with exclusions:

```ts
const IGNORED_SOURCE_PREFIXES = [
  ".git/",
  "node_modules/",
  "dist/",
  "coverage/",
  "exports/",
];

export function isReviewableSourceChange(file: string, docsRoot: string): boolean {
  if (file.startsWith(`${docsRoot}/`) || file.startsWith(`${CONFIG_DIR}/`)) return false;
  return !IGNORED_SOURCE_PREFIXES.some((prefix) => file.startsWith(prefix));
}
```

Do not exclude lockfiles or assets in this release; dependency and user-visible asset changes can create durable project facts.

- [ ] **Step 3: Represent deleted files in session snapshots**

Change the fingerprint type from a bare hash to:

```ts
export type FileFingerprint =
  | { state: "present"; hash: string; size: number; modifiedMs: number }
  | { state: "deleted" };
```

When Git reports a changed path that no longer exists, store `{ state: "deleted" }` instead of dropping it. Equality must compare the discriminated union.

- [ ] **Step 4: Run cross-stack tests**

Run:

```bash
pnpm build
node --test dist/test/review.test.js dist/test/drift-hooks.test.js dist/test/readiness-report.test.js
```

Expected: every listed stack and deletions participate in impact/freshness checks.

- [ ] **Step 5: Commit**

```bash
git add src/git.ts src/session-state.ts test/review.test.ts test/drift-hooks.test.ts test/readiness-report.test.ts
git commit -m "fix: cover all repository changes"
```

### Task 7: Put Every Public Export Behind One Policy

**Files:**

- Create: `src/export-policy.ts`
- Create: `test/export-policy.test.ts`
- Modify: `src/export.ts`
- Modify: `test/validate-export.test.ts`
- Modify: `src/cli.ts`

**Interfaces:**

- Consumes: `ReadinessReport` from Task 4.
- Produces: `preflightExport(request): ExportPreflightResult`.
- Produces a temporary explicit block for customer app, handoff, and summary exports and public/user audience bundles.
- Keeps verified customer feature export and internal developer/agent snapshots available.

- [ ] **Step 1: Define policy tests**

Use this contract:

```ts
export type ExportOperation =
  | { kind: "feature"; profile: "customer" | "developer" }
  | { kind: "app" | "handoff" | "summary"; profile: "customer" | "developer" }
  | { kind: "audience"; audience: Audience };

export interface ExportPreflightResult {
  allowed: boolean;
  reasons: string[];
  requiredRepairs: string[];
}
```

Unit tests must prove:

- customer app/handoff/summary return blocked with reason `Customer <type> export is disabled until the publication schema is implemented.`;
- public and user audience bundles are blocked;
- customer feature export requires project readiness, non-private sources, required headings, and implementation evidence;
- developer/agent internal exports remain allowed after structural validation;
- any source containing an absolute macOS, Linux home, or Windows user path is blocked for customer/public output;
- untouched starter content is blocked before any output directory is created.

- [ ] **Step 2: Run tests and observe current unsafe success**

Run: `pnpm build && node --test dist/test/export-policy.test.js dist/test/validate-export.test.js`

Expected: fresh customer app export and public/user audience cases fail the assertions because current code writes output.

- [ ] **Step 3: Implement a side-effect-free preflight**

`preflightExport` must inspect and return reasons without writing files. Add absolute-path detection:

```ts
const ABSOLUTE_PATH_PATTERNS = [
  /(?:^|[\s(])\/Users\/[^\s)]+/m,
  /(?:^|[\s(])\/home\/[^\s)]+/m,
  /(?:^|[\s(])[A-Za-z]:\\Users\\[^\s)]+/m,
];
```

Call preflight before `prepareCleanBundleDirectory`, `ensureGeneratedDir`, or any write. Error output must list every reason and a concrete repair command or document path.

- [ ] **Step 4: Remove invented fallback text from allowed customer feature output**

For customer feature rendering, required `What It Is` and `How To Use It` sections are already enforced. Remove `|| firstParagraph(combined)` and any generic fallback sentence. A missing required section must fail preflight rather than synthesize prose.

- [ ] **Step 5: Run export tests**

Run:

```bash
pnpm build
node --test dist/test/export-policy.test.js dist/test/validate-export.test.js
```

Expected: no blocked operation creates or cleans an export directory; verified feature export still passes.

- [ ] **Step 6: Commit**

```bash
git add src/export-policy.ts src/export.ts src/cli.ts test/export-policy.test.ts test/validate-export.test.ts
git commit -m "fix: enforce export publication policy"
```

### Task 8: Correct Public Claims and Distribution Artifacts

**Files:**

- Modify: `README.md`
- Modify: `package.json`
- Modify: `src/info.ts`
- Modify: `src/commands.ts`
- Modify: `CONTRIBUTING.md`
- Modify: `SECURITY.md`
- Modify: `test/info.test.ts`
- Modify: `test/commands.test.ts`
- Remove: `benjamin-docs-skill.zip`
- Modify: `scripts/release-github.mjs`

**Interfaces:**

- Public terminology matches Task 4 readiness dimensions and Task 2 response-safe hooks.
- Distribution ZIP is generated and verified, never tracked.

- [ ] **Step 1: Add public-copy parity tests**

Assert README, package description, CLI introduction, and help all contain `project memory` and do not contain these unsupported claims:

```ts
const forbiddenClaims = [
  "hooks load it automatically",
  "ready means current",
  "ready for handoff",
  "private docs are confidential",
  "self-updating documentation",
];
```

Add assertions that README states:

- session-start supplies a compact pointer/context packet;
- agents maintain memory during normal work;
- deterministic checks do not prove semantic truth;
- publication metadata does not change Git repository visibility;
- BD never needs to alter the substantive final answer.

- [ ] **Step 2: Rewrite the first-run explanation and readiness section**

Keep README focused on:

1. why project memory exists;
2. one-minute init/use flow;
3. exact deterministic guarantees;
4. optional integrations;
5. safe export status;
6. links to advanced command/reference material.

Remove embedded release history and link to `benjamin-docs/releases/changelog.md`.

- [ ] **Step 3: Correct contributor and security boundaries**

In CONTRIBUTING, replace `Markdown in docs/` with `managed memory in benjamin-docs/` and list the generated-view rule.

In SECURITY, replace the false no-outside-root claim with an exact external-write inventory:

- optional skill installs under the selected home directory;
- optional Claude Desktop ZIP under Downloads;
- optional agent configuration files when the user consents;
- cached update/session state under Benjamin Docs home;
- no network calls for ordinary project-memory reads/writes except the opt-out cached update check.

- [ ] **Step 4: Remove and release-generate the ZIP**

Run:

```bash
git rm benjamin-docs-skill.zip
```

Update release automation to run `node dist/src/cli.js package-skill --output <release-temp-dir>` and compare the archived SKILL.md plus references against the package sources before creating a release. The generated ZIP remains an artifact, not a tracked source file.

- [ ] **Step 5: Run copy and package tests**

Run:

```bash
pnpm check
npm pack --json --dry-run
```

Expected: parity tests pass; tarball includes the compact skill and three references; tracked ZIP is absent.

- [ ] **Step 6: Commit**

```bash
git add README.md package.json src/info.ts src/commands.ts CONTRIBUTING.md SECURITY.md test/info.test.ts test/commands.test.ts scripts/release-github.mjs
git add -u benjamin-docs-skill.zip
git commit -m "docs: align public claims with guarantees"
```

### Task 9: Add Cross-Platform and Installed-Package Gates

**Files:**

- Modify: `.github/workflows/ci.yml`
- Create: `scripts/smoke-packed-cli.mjs`
- Modify: `package.json`

**Interfaces:**

- Produces package command `pnpm smoke:pack`.
- CI covers Ubuntu, macOS, Windows, Node 22 and 24, plus one dedicated budget job.

- [ ] **Step 1: Create the installed-tarball smoke script**

The script must:

1. run `npm pack --json` into a temporary directory;
2. create a second temporary project;
3. install the tarball without global state;
4. run packaged `bd --version`, `bd init --mode planning --no-agent-contract`, `bd validate`, and `bd session-start`;
5. assert session-start output is within the Task 1 budget;
6. remove both temporary directories in `finally`.

Add:

```json
"smoke:pack": "node scripts/smoke-packed-cli.mjs"
```

- [ ] **Step 2: Expand CI without multiplying expensive work unnecessarily**

Use a platform job matrix:

```yaml
strategy:
  fail-fast: false
  matrix:
    os: [ubuntu-latest, macos-latest, windows-latest]
    node: [22, 24]
```

Run `pnpm check` on all six combinations. Run `pnpm smoke:pack`, `node dist/src/cli.js ready --json`, and `pnpm benchmark:agent-overhead -- --assert` once on Ubuntu/Node 22 in a separate `trust-gates` job to avoid six package/benchmark repetitions.

- [ ] **Step 3: Verify the workflow locally where possible**

Run:

```bash
pnpm check
pnpm smoke:pack
pnpm benchmark:agent-overhead -- --assert
```

Expected: all commands exit 0. Inspect `.github/workflows/ci.yml` with `git diff --check`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml scripts/smoke-packed-cli.mjs package.json
git commit -m "ci: add trust and package gates"
```

### Task 10: Dogfood, Update Memory, and Prepare 0.12.0

**Files:**

- Modify: `benjamin-docs/features/launch-readiness-audit/plan.md`
- Modify: `benjamin-docs/features/launch-readiness-audit/decisions.md`
- Modify: `benjamin-docs/features/launch-readiness-audit/handoff.md`
- Modify: `benjamin-docs/project/roadmap.md`
- Modify: `benjamin-docs/project/open-questions.md`
- Modify: `benjamin-docs/handoff/human-brief.md`
- Modify: `benjamin-docs/handoff/agent-brief.md`
- Modify: `benjamin-docs/engineering/architecture.md`
- Modify: `benjamin-docs/engineering/code-map.md`
- Modify: `benjamin-docs/releases/changelog.md`
- Modify: `package.json`

**Interfaces:**

- Produces a release candidate whose claims are backed by the new gates.
- Leaves later evidence-ledger, canonical-state, MCP-resource, and protocol work explicitly sequenced, not implied complete.

- [ ] **Step 1: Run the audit reproductions against the built CLI**

In temporary Git repositories, verify:

1. untouched starter customer app export is blocked;
2. committed watched source drift makes ready exit 1;
3. untracked Swift/Kotlin/Vue files make working_tree_impact fail;
4. deleted source files are detected;
5. empty HOME does not break repository readiness;
6. optional target doctor fails only for the selected missing target;
7. upgraded hooks contain no Benjamin stop/follow-up command;
8. session-stop prints nothing;
9. session-start and MCP context stay within budgets;
10. verified customer feature export still succeeds.

Record command output summaries in the launch-audit handoff, not raw transcripts.

- [ ] **Step 2: Update architecture and code map**

Document:

- context-budget module and numeric limits;
- readiness domain versus terminal formatter;
- export preflight as the only publication boundary;
- session-start-only default integration;
- project doctor versus target-specific integration doctor;
- supported Git change classification;
- test and benchmark entrypoints.

- [ ] **Step 3: Update the roadmap and handoffs**

Mark the trust foundation implemented but do not call the standard complete. Set exact next work:

1. impact-evidence ledger and no-doc-impact acknowledgement;
2. canonical structured state and typed views;
3. MCP resources/prompts/structured output;
4. mode-specific minimal schemas;
5. public protocol and conformance suite.

- [ ] **Step 4: Bump and verify the release candidate**

Set package version to `0.12.0`. Run:

```bash
pnpm check
pnpm smoke:pack
pnpm benchmark:agent-overhead -- --assert
node dist/src/cli.js views
node dist/src/cli.js review --changed --since HEAD
node dist/src/cli.js drift --strict
node dist/src/cli.js ready --json
pnpm audit --prod
pnpm run release:check
git diff --check
```

Expected:

- all tests and package smoke pass;
- benchmark stays inside all budgets;
- review, drift, and readiness report no blocking dimensions;
- production audit reports no known vulnerabilities;
- no generated view is stale.

- [ ] **Step 5: Commit the release candidate**

```bash
git add package.json benjamin-docs docs/superpowers/plans/2026-07-10-dependable-standard-trust-foundation.md
git commit -m "release: prepare 0.12.0 trust foundation"
```

Do not publish, push, or create the GitHub Release unless the user explicitly requests the release operation.

---

## Deferred Follow-On Plans

Write these as separate implementation plans after 0.12.0 interfaces are proven:

1. **Impact Evidence Plan:** durable no-doc-impact/deferred/blocker acknowledgements keyed to commit and content identity, reducing strict-readiness false positives without weakening it.
2. **Canonical State Plan:** one versioned state model for releases, scope lifecycle, decisions, questions, risks, actions, verification, and publication policy; typed views replace heading inference.
3. **Agent Interface Plan:** MCP resources for memory/status, prompts for capture/handoff, structured tool output and annotations, canonical/status-aware search, and mode-specific initialization.
4. **Protocol and Conformance Plan:** Project Memory Protocol schema, Markdown mapping, migrations, cross-agent fixtures, benchmark thresholds, governance, and third-party implementation tests.

Each plan must preserve the global response, latency, token, and human-surface constraints from this document.
