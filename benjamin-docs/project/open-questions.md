---
title: Open Questions
scope: project
scope_id: project
audience: [developer, designer, business, agent]
status: review
visibility: private
updated: 2026-07-10
source: session-capture
---

# Open Questions

## Dependable Standard Program

- Decision: accept the audit verdict, freeze unrelated feature expansion, and execute the trust-first release trains.
- Decision: first ship structured readiness dimensions; known committed drift and unresolved working-tree impact block their dimensions.
- Decision: temporarily disable unsafe customer app/handoff/summary and public/user audience exports instead of preserving unsafe behavior.
- Decision: default installed hooks must not block completion or auto-submit follow-ups; memory maintenance happens before the final answer.
- Decision: preserve the accepted latency, token, skill-size, and one-sentence completion-note budgets in tests and release gates.
- Should the open specification use a vendor-neutral name such as Project Memory Protocol, with Benjamin Docs as the reference implementation?
- Which five repositories, three stack families, and three agent products should form the first conformance benchmark?
- What false-positive rate is acceptable for strict changed-work readiness after the impact-evidence ledger exists?
- The program plan is `benjamin-docs/features/launch-readiness-audit/plan.md`; the first executable plan is `docs/superpowers/plans/2026-07-10-dependable-standard-trust-foundation.md`.

## 0.7.0 Freshness And Lifecycle

- Decision: changed-work mapping is data-driven through `watch` rules in config, with generic defaults; stack-specific hardcoded paths were removed.
- Decision: `ready` does not auto-regenerate views; `review` warns when views are stale and stays read-only.
- Decision: views exclude archived and stale docs and scopes; `scope status` is the lifecycle lever.
- Is the doc-churn threshold of 10 source files right for active repos, or should it scale with repo size?
- Do the default watch globs over-warn in monorepos where `src/**` is very large?
- Should the path liveness check expand beyond `architecture.md`, `code-map.md`, and `agent-brief.md`?

## 0.8.0 Freshness Coverage

- Decision: `review` and `ready` should warn when status-bearing docs or active feature docs have zero watch-rule coverage.
- Decision: use optional `freshness: status` frontmatter for volatile current-state docs.
- Decision: feature scope creation should append watch coverage for the docs it creates.
- Deferred: detecting duplicated volatile facts such as repeated counts, exact next-item claims, or phase names.
- Deferred: cross-repo freshness expectations for projects split across sibling repos.

## 0.4.0 Capture Quality

- How strict should deterministic `review` become before it feels like documentation busywork?
- Which continuation signals should be required for `codebase` mode but optional for planning-only projects with no code yet?
- Should feature scopes require validation/check sections before `bd ready` can pass?
- Decision for 0.5.0: BD proves fresh-agent continuation through `handoff/agent-brief.md`. The brief must include read-first docs, current state, commands/checks, risks/hazards, and next actions; `review` warns and `ready` fails when those pieces are missing.

## Agent Guidance

- Decision: BD should keep the human command surface very small and put the real operational burden on agents through advanced commands, generated guidance, and deterministic gates.
- Decision: users should be able to trust that after `bd init`, agents will maintain and use project memory as part of normal work instead of asking the user to remember every refresh or verification step.
- Decision for 0.9.2: `bd ready` should surface plainly recorded local environment/tooling blockers separately from BD setup or docs failures, while keeping those blockers non-failing when readiness checks are otherwise clean.
- Decision: because this repo is public, private commercial strategy, pricing, and future paid SaaS planning should stay outside tracked docs unless explicitly marked public-safe by the user.
- Decision: release hygiene should be scripted and verified after npm publish so agents do not forget GitHub tags or Releases for public package versions.
- Decision: public first-contact surfaces should describe BD as persistent project memory for AI coding agents and living project knowledge that agents update while they work, not as a generic documentation package, Markdown helper, or chat-to-docs converter.
- Decision for 0.9.3: publish the public-positioning update as a patch release with no runtime behavior change.
- If a user requested agent guidance but an existing unmarked `AGENTS.md` was preserved, should `bd ready` fail or report a stronger warning?
- Should generated `AGENTS.md` remain short, or include a slightly stronger operating contract for scope choice, evidence, and closeout?
- Decision for 0.10.0: yes to automation hooks. `bd hooks install` wires consent-based session hooks for Claude Code, Codex, and Cursor; `bd session-start` injects memory context and `bd session-stop` nudges updates once per turn chain. Freshness no longer depends only on agent discipline.
- Superseded for 0.12.0: known committed-history drift now blocks the `committed_freshness` readiness dimension. Broad watch rules must be made dependable rather than hidden behind advisory ready output.
- Decision for 0.11.1: stop nudges compare content against a per-session start baseline, acknowledge identical dirty state after one continuation, fail open without reliable state, and explicitly preserve the original user-facing answer. Repeated whole-working-tree warnings are not acceptable agent-side noise because Codex can surface the continuation as the final answer.
- Decision for 0.11.0: the MCP server ships as six stdio tools with manifest-scoped access and transactional validated writes; session-start context stays in hooks for now (resource form deferred until tool-based consumption dominates).
- Is lexical section search good enough for large memories, or will retrieval quality force smarter scoring?
- Should `bd init` eventually offer MCP registration alongside the hooks consent prompt, or does that overload one consent moment?
- How should BD explain the boundary between "agents should keep this updated" and "there is no background daemon unless the user's agent environment invokes one"?

## Templates And Review

- Decision for 0.12.0: keep `doctor --strict` as an explicit machine/setup diagnostic, but remove it from repository readiness. `ready` evaluates only repository-local deterministic dimensions and reports recorded environment blockers without treating them as BD setup failures.
- Decision: do not add new primary commands for 0.4.0 unless dogfooding proves a repeated workflow cannot fit under `init`, `ready`, `help`, or `commands`.
- Should starter-template detection be centralized with template definitions to avoid drift?
- Should release and handoff scopes get first-class create commands later, or should BD keep those as starter docs only?

## Guided Export

- Decision: `bd export` is the only human-facing export command; detailed flags remain an agent/script API.
- Decision: customer-facing feature exports should require implementation-verification evidence before writing output.
- Decision: generated exports are snapshots. They do not auto-update; rerunning `bd export` regenerates them from current source docs with fresh metadata.
- Decision: `bd export` now covers feature docs, full app docs, customer handoff, developer handoff, project summary, readiness listing, and brief/standard/detailed output levels.
- Decision: Markdown is the first export format; PDF and hosted publishing stay deferred.
- Should readiness checks eventually support a user-approved `--force` path, or should customer-facing exports stay blocked until docs are fixed?
- What is the right source format for future screenshot-backed exports?

## Dogfooding

- BD now passes its own `bd ready` checks on the published 0.4.x workflow.
- `/Users/marty/Important/atelier-beaute` was used as a disposable real-project test for 0.3.x.
- `/Users/marty/Important/daycare-platform-cloudflare-bd-export-scenarios` is a sibling Git worktree used for guided-export scenarios. It is useful as an isolated fixture, but confusing in the user's project folder because it resembles a second real app checkout.
- Which second real project should be the 0.4.0 dogfood target after `atelier-beaute`?
- Should dogfooding include a fresh-agent exercise that only sees `README.md`, `AGENTS.md`, `.benjamin-docs/`, and `benjamin-docs/`?
- Should the first-contact dogfood exercise become part of release prep before the next npm publish, or stay as an occasional product-positioning check?
- Should dogfood worktrees be created under a dedicated scratch/worktrees folder instead of beside real projects in `~/Important`?
