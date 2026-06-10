# Continuation Proof Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `benjamin-docs@0.5.0` prove that project memory is continuable by a future human or agent, not merely structurally valid.

**Architecture:** Keep the main command surface unchanged. Add deterministic continuation checks to `review`, let `ready` inherit those checks, strengthen generated templates and `next` prompts so agents know what to capture, and update docs/skill guidance to describe the new quality bar.

**Tech Stack:** TypeScript CLI, Node test runner, Markdown templates, repo-local Benjamin docs.

---

## File Structure

- Modify `src/review.ts`: add focused continuation-proof warnings for `agent-brief.md`.
- Modify `src/templates.ts`: give `agent-brief.md` a continuation-oriented structure.
- Modify `src/next.ts`: make planning, codebase, and feature prompts explicitly ask for continuation proof.
- Modify `skills/benjamin-docs/SKILL.md`: align the bundled skill with the 0.5.0 quality bar.
- Modify `README.md`: briefly mention that `ready` checks handoff/continuation quality.
- Modify Benjamin docs under `benjamin-docs/`: record the 0.5.0 goal and current state.
- Modify tests:
  - `test/review.test.ts`
  - `test/ready.test.ts`
  - `test/init.test.ts`
  - `test/validate-export.test.ts` if template output assumptions change.

## Task 1: Strengthen Continuation Review

- [x] Add focused `agent-brief.md` continuation checks in `src/review.ts`.

The required signals are:

```ts
const AGENT_BRIEF_CONTINUATION_CHECKS = [
  { label: "read-first docs", terms: ["read first", "read these", "start with", "before changing"] },
  { label: "current state", terms: ["current state", "status", "baseline", "done so far"] },
  { label: "commands/checks", terms: ["command", "commands", "check", "checks", "test", "ready", "validate"] },
  { label: "risks/hazards", terms: ["risk", "risks", "hazard", "hazards", "avoid", "do not"] },
  { label: "next actions", terms: ["next action", "next actions", "next step", "next steps", "continue"] },
];
```

Warnings should be concrete:

```text
Agent brief should include continuation proof: read-first docs, current state, commands/checks, risks/hazards, and next actions.
```

- [x] Update `test/review.test.ts` with one failing case where agent brief has commands but misses read-first/current-state/risk/next-action structure.
- [x] Update passing review fixture text so it satisfies the stronger signal checks.

## Task 2: Update Templates And Prompts

- [x] Update `src/templates.ts` so starter `agent-brief.md` includes headings:

```markdown
## Read First
## Current State
## Commands And Checks
## Risks / Hazards
## Next Actions
```

- [x] Update `src/next.ts` prompts to tell the agent to make the agent brief a continuation proof.

For codebase mode, include:

```text
Make agent-brief.md a continuation proof: read-first docs, current state, commands/checks, risks/hazards, and next actions.
```

- [x] Update init/next tests if prompt text assertions need to include the new line.

## Task 3: Update Skill And Public Docs

- [x] Update `skills/benjamin-docs/SKILL.md` with a short “Continuation Proof” quality rule.

The rule should say future agents must be able to answer:

```text
What should I read first?
What is the current state?
What commands/checks should I run?
What is risky or should be avoided?
What are the next actions?
```

- [x] Update `README.md` so `ready` is described as checking setup, validation, docs quality, and continuation readiness.

## Task 4: Record 0.5.0 In Benjamin Docs

- [x] Add a `0.5.0` section to `benjamin-docs/releases/changelog.md`.
- [x] Add a `0.5.0 Goal` section to `benjamin-docs/project/roadmap.md`.
- [x] Update `benjamin-docs/handoff/agent-brief.md` with the current working version/goal.

## Task 5: Verify And Improve

- [x] Run focused tests:

```bash
pnpm build
node --test dist/test/review.test.js dist/test/ready.test.js dist/test/init.test.js
```

- [x] Run full release check:

```bash
pnpm run release:check
```

- [x] Run local `ready`:

```bash
node dist/src/cli.js ready
```

- [x] Smoke a fresh temp codebase:

```bash
tmpdir=$(mktemp -d)
printf '{"name":"demo"}\n' > "$tmpdir/package.json"
( cd "$tmpdir" && node /Users/marty/Important/benjamin-docs/dist/src/cli.js init && node /Users/marty/Important/benjamin-docs/dist/src/cli.js ready || true )
rm -rf "$tmpdir"
```

Expected: fresh starter docs still fail `ready`, and the warnings should include continuation-proof guidance for `agent-brief.md`.

Result: passed. Fresh codebase init creates the updated prompt and `ready` fails with starter-template warnings plus the continuation-proof warning for `agent-brief.md`.

## Self-Review

- Spec coverage: this plan covers deterministic review, generated templates, generated prompts, skill docs, public docs, project memory, and verification.
- Placeholder scan: no placeholder implementation steps remain.
- Type consistency: all functions referenced already exist except local constants added inside `src/review.ts`.
