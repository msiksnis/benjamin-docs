---
title: launch-readiness-audit Handoff
scope: feature
scope_id: launch-readiness-audit
audience: [developer, agent]
status: archived
visibility: public
updated: 2026-07-12
source: manual
freshness: status
---

# Dependable Standard Program Handoff

## Status

The maintainer accepted the 2026-07-10 launch-audit verdict and trust-first direction. All trust-foundation implementation tasks are complete on the dependable-standard branch, and the working package is the 0.12.0 release candidate.

The branch has locked context and latency budgets, response-safe session-start-only hooks, bounded task retrieval, a split core skill, truthful structured readiness, target-specific doctor checks, complete Git change accounting, one fail-closed publication preflight, exact public claims, cross-platform CI, installed-tarball smoke, and enforced performance gates. This prepares but does not publish, tag, or create the 0.12.0 release.

Final whole-branch review fixes are implemented: an 8,200-file committed diff no longer disappears behind Node's default child-process buffer; stable `C` Git diagnostics make legitimate unavailability classification locale-independent; valid-repository Git analysis failures block both freshness dimensions even in planning mode while non-Git and unborn-HEAD planning remain usable; quoted, backticked, linked, and punctuation-delimited user-home paths are blocked across macOS, Linux, mixed-case Windows forms, and both Windows separators; repository-only strict doctor does not touch unreadable global integration state; Claude Code and Codex repair wrong-matcher or malformed direct-command Benjamin entries at entry/property granularity, preserving unrelated group fields and nested user hooks exactly and reusing an existing valid nested Benjamin entry; consent/upgrade copy is exact; and `upgrade` is outside the four-command primary surface.

The final 0.12.0 migration path is also complete: after updating the package, run `bd upgrade` once in each initialized repository. Plain upgrade refreshes Benjamin-owned project metadata, agent guidance, the current skill bundle, existing Memory Views, and session-start hooks for Claude Code, Codex, and Cursor. It removes legacy Benjamin stop hooks while preserving user-owned configuration. No separate hook command is required; `bd upgrade --no-hooks` is the explicit environment opt-out.

Independent final review found and closed two migration-safety gaps test-first. A failed required skill or hook migration now leaves the prior `bdVersion` intact so version-skew hints remain actionable. Parseable files with incompatible user-owned hook container or event shapes are preserved byte-for-byte, reported as failed targets, and never normalized destructively.

Final re-review also closed the adjacent legacy-stop mixed-group case: upgrade removes only the top-level Benjamin-owned stop command property and retains custom fields, timeout metadata, and nested user hooks.

Final automatic-upgrade review closed the remaining destination and ownership gaps. All skill targets are preflighted before bundle I/O; symlinked or escaping destinations fail without touching external victims, earlier targets, or the prior `bdVersion`. Hook repair and uninstall recognize only command-start Benjamin session commands, preserving wrapped/prefixed start and stop mentions for Claude Code, Codex, and Cursor.

Final schema-health review narrowed that ownership boundary to executable locations. Claude/Codex inspect only direct group commands and direct `group.hooks[]` entries in `SessionStart`/`Stop`; Cursor inspects only direct entries in `sessionStart`/`stop`. Nested custom command metadata and unrelated custom events remain byte-for-byte user data, cannot satisfy hook health or trigger legacy-stop diagnosis, and do not prevent idempotent upgrade.

Final cross-event review completed the symmetry: either direct Benjamin session command under Stop/stop now makes status and strict doctor unhealthy, and a direct `session-stop` under SessionStart/sessionStart is removed as misplaced. Upgrade leaves exactly one healthy start entry, preserves nested/prefixed user content, and is current on its second run for all three targets.

The final cross-schema pass keeps that rule limited to shared Claude/Codex groups. Cursor uses flat entries, so stale Benjamin entries are removed whole; exact-array regression coverage prevents commandless remnants.

The final hook closure requires exactly one canonical start for every target and recognizes leading-whitespace commands as directly executable Benjamin ownership. Unknown Cursor versions, primitive relevant-event or nested hook entries, incompatible shared groups, and symlinked hook ancestors are preserved unchanged. Status, strict doctor, install, and uninstall now agree. Existing files are written through a flushed same-directory temporary and atomically renamed with POSIX mode/owner preservation; failures keep the original, and a changed file visible at the final stale-read check aborts mutation.

The final export closure evaluates the complete rendered customer artifact before creating directories or files. Verification evidence must name a typed target and meaningful result; local `file:` home URLs and multiline scope titles fail preflight, generated frontmatter is safely quoted, and metadata records evidence without claiming semantic implementation verification.

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

## Audit Reproduction Evidence

All ten reproductions passed against the built CLI in temporary repositories on 2026-07-11:

1. Customer app/handoff/summary paths and untouched starter customer feature content were blocked before export directories were written.
2. A committed watched source change made `committed_freshness` fail and `ready` exit 1.
3. Untracked Swift, Kotlin, C#, Dart, Vue, Svelte, shell, and TOML paths made `working_tree_impact` fail.
4. A committed watched source deletion made `committed_freshness` fail.
5. Repository readiness and project-level strict doctor passed with an empty Benjamin home.
6. Missing Codex integration failed only the Codex target check and omitted unrelated integration output.
7. Plain upgrade installed Claude Code, Codex, and Cursor hooks containing only `session-start`; no Benjamin stop or follow-up command remained, and a second run reported the integrations already current.
8. Legacy `session-stop` returned no output for every supported format.
9. The release-gate benchmark passed: session-start p95 236.515 ms at 283 characters / 71 estimated tokens; session-stop p95 171.218 ms with zero output. MCP `memory_context` stayed within 2,400 characters / 600 estimated tokens.
10. Evidence recording followed by verified customer feature export succeeded and preserved the evidence in output.

These results prove the deterministic contracts exercised; they do not prove semantic truth or protocol-level conformance.

## Release Train Sequence

A. Trust foundation: response-safe hooks, budgets, truthful structured readiness, project-local doctor, complete file-change coverage, export preflight, accurate public claims, cross-platform/package gates.

B. Impact evidence: durable update/no-impact/defer/block evidence tied to source identity so strict readiness stays useful without busywork.

C. Canonical state and typed views: typed current state, lifecycle, decisions, questions, risks, actions, verification, publication policy, bounded continuation, and mode-specific minimal schemas.

D. Agent interface: MCP resources for memory/status, capture/handoff prompts, structured output and annotations, canonical/status-aware search, pagination, and stable CLI JSON.

E. Protocol and conformance: vendor-neutral schema, Markdown mapping, migrations, fixtures, third-party runner, fresh-agent benchmarks, governance, and validated adoption.

Each later train receives a separate executable plan after the preceding interfaces are proven.

## Risks / Open Questions

- The vendor-neutral protocol name remains open; Project Memory Protocol is the working description, not a final brand decision.
- Release Train B must solve false positives before strict readiness is considered low-friction at scale.
- Target-specific hook capabilities differ. The safe common denominator is session-start context plus no blocking/follow-up at stop.
- Customer app/handoff/summary and public/user audience exports remain intentionally disabled until the publication schema exists.
- Semantic contradiction detection remains limited until canonical state is implemented; public wording must stay exact meanwhile.

## Continuation Proof

Read first:

- benjamin-docs/features/launch-readiness-audit/brief.md
- benjamin-docs/features/launch-readiness-audit/plan.md
- benjamin-docs/features/launch-readiness-audit/decisions.md
- docs/superpowers/plans/2026-07-10-dependable-standard-trust-foundation.md
- benjamin-docs/features/launch-readiness-audit/handoff.md

Before follow-on implementation:

- git status --short --branch
- pnpm check
- pnpm benchmark:agent-overhead -- --assert
- node dist/src/cli.js ready

Before every implementation handoff:

- run the focused tests named by the task;
- run pnpm check;
- run the benchmark after agent-context/hook changes;
- update the smallest durable Benjamin source docs;
- run views, review --changed, drift, and ready;
- preserve the substantive user-facing response and keep any BD note to one short sentence.

The 0.12.0 publish gate exposed Windows-only failures in CI runs `29185413723` and `29185673417`. Shared path-display, absolute fixture-path, and child-process cleanup boundaries were corrected. Two Unix filesystem stress fixtures remain enforced on Linux/macOS but are skipped on Windows, where the functional readiness and session-context cases still run. Replacement CI run `29185818026` passed the complete matrix before publication on 2026-07-12.
