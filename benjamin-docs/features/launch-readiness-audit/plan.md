---
title: launch-readiness-audit Plan
scope: feature
scope_id: launch-readiness-audit
audience: [developer, agent]
status: approved
visibility: public
updated: 2026-07-11
source: manual
freshness: status
---

# Dependable Standard Program Plan

## Objective

Make Benjamin Docs dependable enough to position as an open project-memory standard while preserving its current low-friction agent workflow.

The maintainer accepted the 2026-07-10 audit direction. Trust work now has priority over unrelated feature expansion.

The first executable implementation plan is:

- docs/superpowers/plans/2026-07-10-dependable-standard-trust-foundation.md

That plan is the source of truth for the first release train. This document owns program sequence and release gates.

Implementation status on the dependable-standard branch: Tasks 1-8 are complete through exact public claims and generated distribution artifacts. The next executable step is Task 9, adding cross-platform CI, installed-tarball smoke, and performance gates.

## Product Invariants

### User-facing response

- Benjamin Docs must never suppress, replace, delay, or materially rewrite the substantive answer to the user's task.
- Installed stop hooks must not block completion, auto-submit follow-up messages, or request another model turn.
- Agents complete necessary memory maintenance during their normal work, before composing the final answer.
- Reading project memory alone needs no user-facing mention.
- After a durable memory update, the agent may append one sentence of at most 120 characters, for example: Benjamin Docs updated: checkout handoff.
- BD failures are mentioned only when they actually block the requested task or make the handoff unsafe.

### Latency and process overhead

Reference measurement on 2026-07-10 in this 58-doc repository:

- session-start p50: 327.8 ms
- session-start p95: 349.9 ms
- ready p50: 431.2 ms
- ready p95: 452.5 ms
- session-start output: 255 characters, about 64 estimated tokens

Release budgets:

- session-start p95 at or below 400 ms on the maintainer reference machine;
- no-op session-stop p95 at or below 400 ms on the maintainer reference machine;
- CI allowance at or below 750 ms p95 for either command;
- at most one automatic start process and one silent end process per task/session;
- full ready, views, review, or export checks only when durable work or an explicit request requires them.

### Token and context overhead

- Session-start plain context: at most 400 characters and 100 estimated tokens.
- Task-scoped memory_context: at most 2,400 characters and 600 estimated tokens.
- Memory-search snippet: at most 300 characters.
- Memory-search results: default 5, hard maximum 8.
- Core Benjamin skill: at most 1,200 words; detailed workflows load from references only when relevant.
- Agents search before reading complete docs and do not automatically load the whole memory tree.
- One canonical continuation packet replaces duplicate read-first summaries in the canonical-state release train.

### Truth and safety

- Structural validity, content heuristics, committed freshness, working-tree impact, integration health, and export safety are separate states.
- Deterministic checks never claim semantic proof.
- Repository readiness is independent from unused global tools or package artifacts.
- Customer/public export is a publication boundary and fails closed.
- Publication metadata does not provide Git confidentiality.
- Historical and generated material must not outrank current canonical sources.

## Release Train A — Trust Foundation

Detailed plan:

- docs/superpowers/plans/2026-07-10-dependable-standard-trust-foundation.md

Target release: 0.12.0.

Deliverables:

1. Lock context, token, latency, and completion-note budgets in tests and a benchmark command.
2. Install session-start-only hooks; remove legacy Benjamin stop/follow-up hooks during upgrade; make legacy session-stop output silent.
3. Split the 4,264-word core skill into a compact router plus on-demand capture, export, and integration references.
4. Introduce structured readiness dimensions and ready --json.
5. Make known committed drift and unresolved working-tree impact block the relevant readiness dimension.
6. Separate project doctor checks from selected optional integration checks.
7. Include deleted files and every repository stack in changed-work accounting.
8. Put every customer/public export behind one preflight; temporarily disable unsafe app, handoff, summary, and public/user audience paths.
9. Correct README, package, CLI, contributor, and security claims; remove the stale tracked skill ZIP.
10. Add cross-platform CI, installed-tarball smoke, and performance gates.
11. Dogfood every audit reproduction before preparing 0.12.0.

Exit gates:

- No installed hook can trigger another agent turn after the final answer.
- All numerical overhead budgets pass.
- False-ready reproductions exit non-zero with a precise dimension.
- Clean repository readiness passes with an empty home directory.
- Untouched starter content cannot create a customer/public export.
- Verified customer feature export still works.
- Linux, macOS, Windows, Node 22, and Node 24 checks pass.
- Public copy describes exact deterministic guarantees.

## Release Train B — Impact Evidence

Write the detailed implementation plan after Release Train A interfaces are proven.

Deliverables:

- One repository analysis snapshot per command.
- Durable impact records for doc-updated, verified-no-doc-impact, deferred, and blocked outcomes.
- Evidence keyed to commit/content/file identity.
- Targeted watch relationships that reduce broad false positives.
- Deletions, renames, untracked changes, and commits created during a session represented consistently.
- Expiry/review semantics for no-impact evidence.
- Agent-only repair flow; no new primary human command.

Exit gates:

- Strict readiness does not require meaningless documentation edits.
- A no-impact acknowledgement cannot clear a later different source change.
- Agents receive one bounded repair instruction.
- Analysis stays inside the Release Train A budgets.

## Release Train C — Canonical State and Agent Interface

Write separate canonical-state and agent-interface implementation plans after Release Train B.

Deliverables:

- Versioned canonical records for current state, releases, lifecycle, decisions, supersession, questions, risks, actions, verification, and publication policy.
- One lifecycle status source instead of frontmatter/scopes duplication.
- Typed views with stable IDs, provenance, deduplication, and archive/supersession filtering.
- One bounded continuation packet.
- Mode-specific minimal schemas for planning, codebase, chat, and small features.
- MCP resources for memory/status, prompts for capture/handoff, and tools for search/mutation.
- Structured MCP output, schemas, annotations, canonical/status filters, and pagination.
- Equivalent stable CLI JSON.

Exit gates:

- The repository cannot represent contradictory canonical release or scope state.
- Every active question/risk appears exactly once in its view.
- Archived/generated duplicates are excluded from default retrieval.
- Every supported init mode can follow next and reach ready without invented architecture.
- Context stays within the Release Train A budgets.

## Release Train D — Protocol and Conformance

Write the protocol/conformance plan after canonical-state behavior is stable.

Deliverables:

- Vendor-neutral Project Memory Protocol name and scope.
- Versioned JSON Schema and Markdown mapping.
- Migration and backward-compatibility policy.
- Evidence, lifecycle, supersession, and publication semantics.
- Reference fixtures and third-party conformance runner.
- Fresh-agent benchmarks across at least five repositories, three stack families, and three agent products.
- Governance, maintainership, Code of Conduct, PR template, security boundaries, npm provenance, and supply-chain pinning.
- One-minute product proof and external design-partner validation.

Exit gates:

- A third-party implementation passes conformance without importing Benjamin Docs internals.
- Fresh agents recover the correct goal, decision, risk, and next action within the context budget.
- Cross-agent agreement and stale-fact thresholds are declared and met.
- External projects demonstrate continued use, not only installation.
- Only after these gates may public copy call Benjamin Docs a dependable standard.

## Deferred Until Trust Gates Pass

- Hosted publishing.
- Dashboards.
- Additional export formats or deliverable types.
- New primary human commands.
- IDE UI beyond evidence surfaces.
- More agent integrations.
- Automatic AI rewriting.
- Marketing that describes semantic verification or standard status as already achieved.

## Validation Across Every Release Train

- Test-first implementation.
- pnpm check.
- Installed package smoke.
- Agent-overhead benchmark.
- Benjamin Docs views, changed-work review, drift, and readiness.
- Production dependency audit.
- Git diff check.
- Durable project-memory update before handoff.
