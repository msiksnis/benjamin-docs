# Guided Export Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a task-based `bd export` workflow that keeps `bd export` as the human UX while giving agents direct feature-export flags, readiness checks, and concise Markdown output.

**Architecture:** Keep source docs under `benjamin-docs/` as the truth and generated deliverables under `exports/`. Extend `src/export.ts` from audience-copy bundles into a small export engine with feature discovery, matching, profile-specific rendering, readiness checks, and output writing. Keep `src/cli.ts` responsible only for argument parsing, interactive selection, and printing formatted results.

**Tech Stack:** TypeScript CLI, Node built-ins, repo-local JSON metadata, Markdown frontmatter parser, Node test runner.

---

## File Structure

- Modify `src/export.ts`: add feature export APIs while preserving `exportAudience`.
- Modify `src/cli.ts`: route `bd export`, parse advanced export flags, and add an interactive export menu.
- Modify `src/commands.ts`: make the advanced export command point to guided `benjamin-docs export`.
- Modify `src/info.ts`: mention the human-facing `bd export` path without promoting every flag.
- Modify `skills/benjamin-docs/SKILL.md`: teach agents the direct flags and verification prompt loop.
- Modify `benjamin-docs/project/roadmap.md`, `benjamin-docs/engineering/code-map.md`, and `benjamin-docs/handoff/agent-brief.md`: record the new export workflow.
- Modify `test/validate-export.test.ts`: cover direct feature export success, typo suggestions, missing feature prompts, readiness blocks, and existing audience export behavior.

## Task 1: Add Feature Export Tests

**Files:**
- Modify: `test/validate-export.test.ts`

- [ ] **Step 1: Add test helpers near the top of `test/validate-export.test.ts`**

```ts
function customerFeatureBrief(slug: string, title: string): string {
  return [
    "---",
    `title: ${title} Brief`,
    "scope: feature",
    `scope_id: ${slug}`,
    "audience: [developer, designer, agent, user]",
    "status: review",
    "visibility: unlisted",
    "updated: 2026-06-19",
    "source: manual",
    "freshness: status",
    "---",
    "",
    `# ${title}`,
    "",
    "## What It Is",
    "",
    "This feature lets an operator safely remove an owner from active operations.",
    "",
    "## When To Use It",
    "",
    "Use it when an owner account should no longer be active.",
    "",
    "## How To Use It",
    "",
    "Open Owners, select the owner, choose Delete, and confirm.",
  ].join("\n");
}

function customerFeatureHandoff(slug: string, title: string): string {
  return [
    "---",
    `title: ${title} Handoff`,
    "scope: feature",
    `scope_id: ${slug}`,
    "audience: [developer, agent, user]",
    "status: review",
    "visibility: unlisted",
    "updated: 2026-06-19",
    "source: manual",
    "---",
    "",
    `# ${title} Handoff`,
    "",
    "## Implementation Verification",
    "",
    "Implementation verified: yes",
    "",
    "## Known Limits",
    "",
    "Deletion may be unavailable when historical records must be preserved.",
    "",
    "## Support Notes",
    "",
    "Contact support if deletion is blocked.",
  ].join("\n");
}
```

- [ ] **Step 2: Add direct customer feature export success test**

```ts
it("exports concise customer feature documentation", () => {
  withTempDir((dir) => {
    runCli(["init"], dir);
    runCli(["scope", "create", "feature", "owner-delete"], dir);
    writeFileSync(join(dir, "benjamin-docs/features/owner-delete/brief.md"), customerFeatureBrief("owner-delete", "Owner Delete"), "utf8");
    writeFileSync(join(dir, "benjamin-docs/features/owner-delete/handoff.md"), customerFeatureHandoff("owner-delete", "Owner Delete"), "utf8");

    const result = runCliResult(["export", "--feature", "owner-delete", "--profile", "customer"], dir);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Exported feature documentation/);
    const outputPath = join(dir, "exports/features/owner-delete-customer.md");
    assert.equal(existsSync(outputPath), true);
    const output = readFileSync(outputPath, "utf8");
    assert.match(output, /# Owner Delete/);
    assert.match(output, /## What It Is/);
    assert.match(output, /## How To Use It/);
    assert.match(output, /implementation_verified: true/);
    assert.doesNotMatch(output, /Agent Brief|Commands And Checks/);
  });
});
```

- [ ] **Step 3: Add typo suggestion and missing feature tests**

```ts
it("suggests a close feature match instead of exporting the wrong feature", () => {
  withTempDir((dir) => {
    runCli(["init"], dir);
    runCli(["scope", "create", "feature", "owner-delete"], dir);

    const result = runCliResult(["export", "--feature", "owener-delete"], dir);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Feature "owener-delete" was not found/);
    assert.match(result.stderr, /Did you mean "owner-delete"/);
    assert.match(result.stderr, /bd export --feature owner-delete/);
  });
});

it("prints an agent prompt when a feature does not exist", () => {
  withTempDir((dir) => {
    runCli(["init"], dir);

    const result = runCliResult(["export", "--feature", "staff-payroll"], dir);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Feature "staff-payroll" does not exist/);
    assert.match(result.stderr, /Next prompt:/);
    assert.match(result.stderr, /Create a Benjamin Docs feature scope for staff-payroll/);
  });
});
```

- [ ] **Step 4: Add readiness block test**

```ts
it("blocks customer feature export when docs need agent verification", () => {
  withTempDir((dir) => {
    runCli(["init"], dir);
    runCli(["scope", "create", "feature", "owner-delete"], dir);

    const result = runCliResult(["export", "--feature", "owner-delete", "--profile", "customer"], dir);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Feature export readiness: blocked/);
    assert.match(result.stderr, /Customer-facing feature export should be verified against implementation first/);
    assert.match(result.stderr, /Verify the owner-delete feature implementation against its Benjamin Docs/);
    assert.equal(existsSync(join(dir, "exports/features/owner-delete-customer.md")), false);
  });
});
```

- [ ] **Step 5: Run the new tests and verify they fail for missing behavior**

Run:

```bash
pnpm build && node --test dist/test/validate-export.test.js
```

Expected: tests fail because feature export flags are not implemented.

## Task 2: Implement Feature Export Engine

**Files:**
- Modify: `src/export.ts`

- [ ] **Step 1: Add export types and feature metadata helpers**

Add these exported types near the top of `src/export.ts`:

```ts
export type ExportProfile = "customer" | "developer";

export interface ExportFeatureOptions {
  profile?: ExportProfile;
  includeArchived?: boolean;
}

export interface ExportResult {
  written: string[];
  output: string;
}
```

Add helpers that read `.benjamin-docs/scopes.json`, find feature records, normalize slugs/titles, compute a simple edit distance, and return exact or suggested matches.

- [ ] **Step 2: Add customer readiness checks**

Implement a readiness function that blocks customer exports when:

- the feature is archived and `includeArchived` is not true
- `brief.md` or `handoff.md` is missing
- customer profile docs are private-only
- combined feature docs do not include "what it is" and "how to use"
- combined feature docs do not include `Implementation verified: yes`
- combined feature docs contain obvious leak-risk terms such as `AGENTS.md`, `process.env`, `secret`, `API key`, or `internal only`

The blocked output must include:

```text
Feature export readiness: blocked
```

and a `Next prompt:` block.

- [ ] **Step 3: Add Markdown renderers**

Implement customer feature rendering with this shape:

```md
---
title: Owner Delete
export_type: feature
export_profile: customer
source_scope: owner-delete
source_docs: [benjamin-docs/features/owner-delete/brief.md, benjamin-docs/features/owner-delete/handoff.md]
exported_at: 2026-06-19
implementation_verified: true
---

# Owner Delete

## What It Is

...
```

Implement developer feature rendering as a concise source bundle with source doc
sections and no customer readiness block.

- [ ] **Step 4: Export `exportFeature`**

Add:

```ts
export function exportFeature(root: string, query: string, options: ExportFeatureOptions = {}): ExportResult
```

It should validate the project first, resolve the feature by slug/title, run
profile-specific readiness checks, write to
`exports/features/<slug>-<profile>.md`, and return a printable output message.

## Task 3: Wire CLI Flags And Guided Menu

**Files:**
- Modify: `src/cli.ts`

- [ ] **Step 1: Import feature export APIs**

Change:

```ts
import { exportAudience } from "./export.js";
```

to:

```ts
import { exportAudience, exportFeature, type ExportProfile } from "./export.js";
```

- [ ] **Step 2: Add export arg parsing**

Add:

```ts
interface ExportArgs {
  audience?: string;
  feature?: string;
  profile?: ExportProfile;
  includeArchived?: boolean;
}
```

Implement `parseExportArgs(args: string[]): ExportArgs` supporting
`--audience <audience>`, `--feature <name-or-slug>`, `--profile <customer|developer>`,
and `--include-archived`.

- [ ] **Step 3: Route direct feature exports**

Replace the existing `if (command === "export")` block so:

- direct `--audience` preserves current behavior
- direct `--feature` calls `exportFeature`
- no args in a TTY opens guided export
- no args outside a TTY prints a short message that `bd export` is interactive

- [ ] **Step 4: Add guided export prompts**

Add `runExportDrawer(cwd)` that uses `selectChoice` with:

```ts
[
  "Full app documentation",
  "Feature documentation",
  "Customer handoff",
  "Developer handoff",
  "Project summary",
]
```

For the first implementation, feature documentation should list feature scopes
and export the selected feature with `profile: "customer"`. Other menu options
may print a concise "not implemented in this version" message and return 0.

## Task 4: Update Command Discovery And Agent Guidance

**Files:**
- Modify: `src/commands.ts`
- Modify: `src/info.ts`
- Modify: `skills/benjamin-docs/SKILL.md`

- [ ] **Step 1: Update `src/commands.ts`**

Change the advanced export command entry to:

```ts
{ command: "benjamin-docs export", args: ["export"], description: "Open guided export for feature docs, app docs, and handoffs." },
```

- [ ] **Step 2: Update `src/info.ts`**

Mention `bd export` as the simple export path. Do not list every advanced flag
in the short help.

- [ ] **Step 3: Update skill guidance**

Add an "Export Workflow" section telling agents:

- humans should use `bd export`
- agents may use direct flags
- customer exports should be verified against implementation first
- if blocked, update docs before retrying export

## Task 5: Update Benjamin Docs

**Files:**
- Modify: `benjamin-docs/project/roadmap.md`
- Modify: `benjamin-docs/engineering/code-map.md`
- Modify: `benjamin-docs/handoff/agent-brief.md`

- [ ] **Step 1: Update roadmap**

Record guided export workflow as the next version goal and note Markdown-only
customer/developer feature exports as the initial scope.

- [ ] **Step 2: Update code map**

Document that `src/export.ts` now owns task-based export rendering and readiness
checks.

- [ ] **Step 3: Update agent brief**

Add the current state and next checks for guided export.

## Task 6: Verify

**Files:**
- No new files.

- [ ] **Step 1: Run focused checks**

```bash
pnpm build
node --test dist/test/validate-export.test.js
```

Expected: pass.

- [ ] **Step 2: Run full project check**

```bash
pnpm check
```

Expected: pass.

- [ ] **Step 3: Run Benjamin readiness**

```bash
node dist/src/cli.js review --changed --since HEAD
node dist/src/cli.js ready
```

Expected: pass or report only pre-existing warnings unrelated to this change.

## Self-Review

- Spec coverage: this plan covers guided `bd export`, advanced direct flags, feature matching, feature-not-found prompts, readiness blocks, implementation-verification prompts, Markdown output, traceability metadata, docs, and tests.
- Deliberate deferrals: PDF, hosted publishing, screenshots, app/handoff/summary renderers, and last-export metadata are deferred from the first implementation.
- Placeholder scan: no task depends on unspecified files or unnamed checks.
- Type consistency: export profiles are `customer` and `developer` in both tests and implementation tasks.
