---
title: launch-readiness-audit Decisions
scope: feature
scope_id: launch-readiness-audit
audience: [developer, agent]
status: approved
visibility: public
updated: 2026-07-10
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

## Accepted Product Direction

The maintainer accepted these recommendations on 2026-07-10. Detailed sequencing and release gates live in `plan.md`:

- Define a vendor-neutral Project Memory Protocol.
- Keep Benjamin Docs as the reference implementation.
- Pair or replace the public brand with “open project memory protocol.”
- Restrict the human command surface to init, status, and export.
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
