---
title: launch-readiness-audit Handoff
scope: feature
scope_id: launch-readiness-audit
audience: [developer, agent]
status: approved
visibility: public
updated: 2026-07-10
source: manual
freshness: status
---

# Dependable Standard Program Handoff

## Status

The maintainer accepted the 2026-07-10 launch-audit verdict and trust-first direction. Trust-foundation Tasks 1-4 are implemented on the dependable-standard branch.

The current branch now has locked context and latency budgets, response-safe session-start-only hooks, bounded task retrieval, a split core skill, batched drift history lookup, and truthful structured readiness. Task 4 adds `src/readiness.ts`, `bd ready --json`, separate baseline and changed-work warnings, blocking committed drift and working-tree impact, non-blocking non-Git planning behavior, and repository readiness without doctor setup. Review follow-up adds validation-only, thrown-drift, and combined drift/changed-work regressions. `ReviewResult.changedWorkStatus` now keeps working-tree evidence independent. Continue with Task 5 after the Task 4 follow-up commit.

Executable plan:

- docs/superpowers/plans/2026-07-10-dependable-standard-trust-foundation.md

The plan contains ten test-first tasks with exact files, interfaces, code/test examples, commands, commits, and release gates. Target release is 0.12.0 because readiness semantics, hooks, export availability, and doctor behavior change materially.

## Accepted Product Constraints

### Agent response

- BD must never suppress, replace, delay, or materially rewrite the substantive user-facing answer.
- Default installed stop hooks will not block or auto-submit follow-ups.
- Agents maintain memory during normal work before the final answer.
- Reading memory alone needs no mention.
- After a durable update, an optional BD note is one sentence and at most 120 characters.

### Performance

Reference baseline measured 2026-07-10:

- session-start p95: 349.9 ms over 20 runs;
- ready p95: 452.5 ms;
- session-start output: 255 characters, about 64 estimated tokens.

Release budgets:

- session-start and no-op session-stop p95 at or below 400 ms on the maintainer reference machine and 750 ms in CI;
- session-start at or below 400 characters / 100 estimated tokens;
- task memory_context at or below 2,400 characters / 600 estimated tokens;
- search snippets at or below 300 characters, default 5 and max 8 results;
- core skill at or below 1,200 words;
- at most one automatic start process and one silent end process.

## Release Train Sequence

A. Trust foundation: response-safe hooks, budgets, truthful structured readiness, project-local doctor, complete file-change coverage, export preflight, accurate public claims, cross-platform/package gates.

B. Impact evidence: durable update/no-impact/defer/block evidence tied to source identity so strict readiness stays useful without busywork.

C. Canonical state and agent interface: typed current state, lifecycle, decisions, questions, risks, views, bounded continuation, mode-specific schemas, MCP resources/prompts/structured output.

D. Protocol and conformance: vendor-neutral schema, Markdown mapping, migrations, fixtures, third-party runner, fresh-agent benchmarks, governance, and validated adoption.

Each later train receives a separate executable plan after the preceding interfaces are proven.

## First Implementation Task

Task 1 in the executable plan:

- create src/context-budget.ts;
- add deterministic token/character tests;
- create scripts/benchmark-agent-overhead.mjs;
- add pnpm benchmark:agent-overhead;
- record the current performance baseline before behavior changes.

Implementation should begin in an isolated worktree using the execution skill selected by the maintainer.

## Risks / Open Questions

- The vendor-neutral protocol name remains open; Project Memory Protocol is the working description, not a final brand decision.
- Release Train B must solve false positives before strict readiness is considered low-friction at scale.
- The current 4,264-word skill is a material token cost when activated; the first release train must split it.
- Current task-scoped memory_context measured about 776 estimated tokens in this repo, above the accepted 600-token target.
- Target-specific hook capabilities differ. The safe common denominator is session-start context plus no blocking/follow-up at stop.
- Customer app/handoff/summary and public/user audience exports will be temporarily disabled rather than left unsafe.
- Semantic contradiction detection remains limited until canonical state is implemented; public wording must stay exact meanwhile.

## Continuation Proof

Read first:

- benjamin-docs/features/launch-readiness-audit/brief.md
- benjamin-docs/features/launch-readiness-audit/plan.md
- benjamin-docs/features/launch-readiness-audit/decisions.md
- docs/superpowers/plans/2026-07-10-dependable-standard-trust-foundation.md
- benjamin-docs/features/launch-readiness-audit/handoff.md

Before implementation:

- git status --short --branch
- pnpm check
- pnpm benchmark:agent-overhead after Task 1 creates it
- node dist/src/cli.js ready

Before every implementation handoff:

- run the focused tests named by the task;
- run pnpm check;
- run the benchmark after agent-context/hook changes;
- update the smallest durable Benjamin source docs;
- run views, review --changed, drift, and ready;
- preserve the substantive user-facing response and keep any BD note to one short sentence.
