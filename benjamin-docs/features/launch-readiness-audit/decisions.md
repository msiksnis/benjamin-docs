---
title: launch-readiness-audit Decisions
scope: feature
scope_id: launch-readiness-audit
audience: [developer, agent]
status: approved
visibility: public
updated: 2026-07-11
source: manual
freshness: status
---

# Launch Readiness Audit Conclusions

## Audit Conclusions

### Conclusion 1 — Version 0.11.1 is not launch-ready as a dependable standard

Reason: the central readiness, currency, automatic-context, privacy, and export claims are not consistently enforced by the implementation. The failures are reproducible and affect the product's defining trust boundary.

This is an audit conclusion, not a decision to stop the project.

### Conclusion 2 — The valuable category is project memory, not documentation generation

Reason: Benjamin Docs is strongest at preserving intent, decisions, risks, progress, and continuation state that cannot be derived from code. Documentation publishers, repository wikis, and source-context packers are stronger in their own categories.

### Conclusion 3 — Trust work has priority over feature expansion

Reason: more integrations, exports, views, or UI would amplify unreliable state. The next milestone should make existing claims truthful and measurable.

### Conclusion 4 — A standard must be independent from the reference CLI

Reason: the current format is encoded through internal TypeScript, prose, templates, and heuristics. External tools need a versioned protocol, schema, lifecycle rules, and conformance suite.

### Conclusion 5 — Structural validation and semantic evidence must be separate

Reason: word counts, headings, starter-phrase checks, and frontmatter validation are useful but cannot establish factual currency or consistency. Product language and status output must expose this distinction.

### Conclusion 6 — Export is a publication/security boundary

Reason: a successful customer export can currently contain untouched placeholders, fallback text, private-marked sources, or local paths depending on the export type. Every public/customer export needs one shared strict policy engine.

### Conclusion 7 — Repository readiness cannot depend on optional global tools

Reason: the state of a Claude Desktop ZIP or unused agent skill copy says nothing about the repository's project memory. Integration readiness should be target-specific and advisory to project readiness.

### Conclusion 8 — One canonical state model is required

Reason: scope status, doc status, release state, next actions, questions, and risks are duplicated or inferred from prose. This creates contradictions that generated views amplify.

### Conclusion 9 — “Private” must not imply confidentiality

Reason: frontmatter does not change Git visibility. The field should represent publication/export policy, with explicit warnings that repository access controls confidentiality.

### Conclusion 10 — Historical material must be retrievable but not active by default

Reason: archived scopes, superseded plans, and generated duplicates can currently appear in search and continuation context. Agents need canonical, current results by default and explicit historical retrieval.

## Implemented Trust Decisions

- Readiness is a versioned structured report, not a semantic proof claim.
- Known committed drift blocks `committed_freshness`; unresolved changed-work warnings block `working_tree_impact` and are excluded from baseline `content_heuristics`.
- Git unavailability is non-blocking only for planning mode.
- Enabled broken Benjamin guidance blocks `agent_guidance`; absent guidance is reported as not configured.
- Optional global setup remains in doctor diagnostics and does not determine repository readiness. Recorded environment blockers are visible but non-blocking.
- Validation findings belong only to `structure`; `content_heuristics` consumes review-specific baseline findings.
- Only a returned Git-unavailable result may be non-blocking for planning. A thrown drift-analysis error fails `committed_freshness` with evidence and a repair command.
- `working_tree_impact` uses changed review's own `changedWorkStatus`, never the committed drift result, so both dimensions can fail with their own evidence in the same report.
- Doctor diagnostics are target-specific and outside repository readiness; changed-work accounting includes deletions and repositories without a recognized stack.
- Every customer/public export uses one fail-closed preflight; temporarily unsupported publication paths write nothing.
- Public surfaces state the exact bounded-context, deterministic-readiness, visibility, and final-answer guarantees. The Claude upload ZIP is generated and verified from package sources rather than tracked.
- Release gates now exercise Linux, macOS, and Windows on Node 22 and 24; a separate trust job runs the packed-CLI smoke, repository readiness, and agent-overhead assertion.
- The 0.12.0 audit reproductions passed against temporary repositories: starter publication is blocked; committed drift, untracked cross-stack work, and deletions fail the correct dimensions; empty-home readiness stays healthy; target doctor output stays isolated; upgraded hooks are start-only; stop is silent; both context paths stay bounded; and verified customer feature export still succeeds.
- Final whole-branch review: committed filename enumeration is explicitly bounded at 64 MiB and propagates typed failure into fail-closed readiness. Git child processes force stable `C` diagnostics without dropping the caller environment. Only non-Git and unborn-HEAD states are legitimate planning-mode unavailability; real Git execution/enumeration failures block both freshness dimensions. Publication scanning covers punctuation-delimited macOS/Linux/Windows homes with case-insensitive Windows matching; repository-only strict doctor never reads integration paths; and shared-schema hook health/reinstall requires the supported matcher plus an exact executable command inside `SessionStart[].hooks[]`. Repair removes a malformed top-level Benjamin command as one property, preserves unrelated group data and nested user hooks exactly, and reuses an existing valid nested entry.
- Final whole-branch review: the primary human catalog is exactly `init`, `ready`, `export`, and `help`; `upgrade` remains advanced. Consent and upgrade copy describe only the compact session-start pointer/context packet and agent-led maintenance during normal work.
- The superseding 0.12.0 package-migration contract is one plain `bd upgrade` per initialized repository after the package update. It refreshes Benjamin-owned metadata, guidance, skills, existing views, and all supported session-start hooks; removes legacy Benjamin stop hooks; preserves user-owned configuration; and requires no separate hook command. `--no-hooks` is the explicit environment opt-out.
- Final migration review: incomplete required skill/hook work never advances `bdVersion`, so version-skew repair remains visible. Parseable hook files with incompatible user-owned container/event shapes are skipped unchanged and fail upgrade rather than being destructively normalized.
- Final migration re-review: legacy top-level Benjamin stop commands are removed property-by-property, preserving unrelated fields and nested user hooks in the same group exactly.
- Hook removal is schema-aware: property-level preservation applies to Claude/Codex shared groups; Benjamin-owned flat Cursor entries are removed whole to avoid malformed commandless remnants.

## Accepted Product Direction

The maintainer accepted these recommendations on 2026-07-10. Detailed sequencing and release gates live in `plan.md`:

- Define a vendor-neutral Project Memory Protocol.
- Keep Benjamin Docs as the reference implementation.
- Pair or replace the public brand with “open project memory protocol.”
- Restrict the human command surface to init, ready, export, and help.
- Remove or defer weak export types, anchors, dashboards, hosted publishing, and additional integrations until trust is proven.
- Use external fresh-agent benchmarks as release gates for agent-reliability claims.

## Rejected Directions

### Compete primarily with documentation publishing platforms

Rejected because Benjamin Docs lacks the presentation, hosting, search, versioning, analytics, collaboration, and publishing maturity of established platforms, while its differentiated asset is continuity evidence.

### Treat more generated Markdown as the solution to context

Rejected because the repository already demonstrates that additional files and views can increase contradiction and cognitive load.

### Claim semantic verification from heuristic linting

Rejected because the implementation has no model capable of proving factual correctness. Honest layered evidence is more valuable than an absolute label.

### Make every integration mandatory

Rejected because teams use different agents and CI environments. Target-specific adapters should not contaminate core project health.

### Launch first and repair trust later

Rejected because a single unsafe customer export or false-ready handoff attacks the product's primary reason to exist.

## Decisions

- 2026-07-10: Accept the launch audit's trust-first direction. Freeze unrelated feature expansion until readiness truth, export safety, repository-local health, bounded agent context, and response-safe integrations are implemented and verified.
- 2026-07-10: Treat agent overhead as a release contract: session-start stays at or below 400 characters and 100 estimated tokens; task-scoped memory_context stays at or below 2,400 characters and 600 estimated tokens; the core skill stays at or below 1,200 words; session-start and no-op session-stop p95 stay at or below 400 ms on the maintainer reference machine and 750 ms in CI.
- 2026-07-10: Benjamin Docs must never suppress, replace, delay, or materially rewrite the user's substantive final answer. Installed stop hooks will not block or auto-submit follow-ups. Reading memory needs no mention; after a durable update, an agent may append one sentence of at most 120 characters.
- 2026-07-10: Execute the dependable-standard work as staged plans. Start with docs/superpowers/plans/2026-07-10-dependable-standard-trust-foundation.md; follow with separate impact-evidence, canonical-state, agent-interface, and protocol/conformance plans after the preceding interfaces are proven.
- 2026-07-11: Prepare 0.12.0 as the implemented trust foundation, not as proof that Benjamin Docs is already a dependable standard. Sequence follow-on work strictly as B, impact evidence; C, canonical state, typed views, bounded continuation, and mode-specific minimal schemas; D, agent/MCP interfaces; E, public protocol and conformance.
- 2026-07-11: Make `bd upgrade` the complete post-package-update migration path in every initialized repository. Default to installing or repairing session-start hooks, preserve user configuration, remove legacy Benjamin stop hooks, keep `--no-hooks` as the opt-out, and never require `bd hooks install` as a follow-up.
- 2026-07-11: Treat the repository version stamp as completion evidence, not an attempted-upgrade marker. Preserve it on any required skill/hook failure, and fail closed without rewriting incompatible user-owned hook structures.
