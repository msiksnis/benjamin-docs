---
title: Project Brief
scope: project
scope_id: project
audience: [developer, designer, business, agent]
status: review
visibility: private
updated: 2026-07-12
source: session-capture
freshness: status
---

# Project Brief

## Dependable Standard Direction

The maintainer accepted the 2026-07-10 launch-audit verdict and trust-first program. Version 0.11.1 is not yet a dependable standard. The immediate target is 0.12.0, implemented through `docs/superpowers/plans/2026-07-10-dependable-standard-trust-foundation.md`.

The agent workflow now has explicit product budgets. Session-start context stays under 400 characters / 100 estimated tokens; task-scoped memory context stays under 2,400 characters / 600 estimated tokens; the core skill stays under 1,200 words; and session-boundary commands have p95 latency gates. BD maintenance must never suppress, replace, delay, or materially rewrite the substantive answer to the user. Reading memory needs no mention; after a durable update, an agent may append one sentence of at most 120 characters.

The program ships in stages: trust foundation; impact evidence; canonical state, typed views, bounded continuation, and mode-specific minimal schemas; agent/MCP interfaces; then a vendor-neutral protocol and conformance suite. Unrelated feature expansion, hosted publishing, dashboards, and additional export types remain deferred until the trust gates pass.

Trust-foundation Tasks 1-10 and Release Train A are complete and published as 0.12.0. The repository has explicit context and latency budgets, session-start-only integrations, bounded retrieval, truthful structured readiness, target-specific doctor checks, complete Git change accounting, fail-closed customer/public export policy, cross-platform CI, installed-package smoke, and enforced benchmark gates. Public copy states those exact limits, and release automation generates and verifies the complete temporary skill bundle instead of tracking a stale ZIP. Release Train B, Impact Evidence, is next.

Final whole-branch review hardening preserves those boundaries under large and hostile inputs: committed filename enumeration is explicitly bounded; locale-stable real Git failures block both freshness dimensions while non-Git and unborn-HEAD planning stay usable; publication path scanning is Markdown-, platform-, and Windows-case-aware; user-facing project and home-relative paths stay slash-normalized across operating systems; repository-only strict checks never inspect integration state; and structural target validation/reinstall repairs stale or malformed Benjamin hooks at entry/property granularity while preserving unrelated group data and nested user hooks exactly. `upgrade` remains advanced so the primary human surface is still exactly four commands.

For 0.12.0, package migration has one public instruction: update the package, then run `bd upgrade` once in each initialized repository. That command refreshes Benjamin-owned project metadata, agent guidance, the current skill bundle, existing Memory Views, and session-start hooks for Claude Code, Codex, and Cursor. It removes legacy Benjamin stop hooks while preserving user-owned configuration. No separate hook command is required; `bd upgrade --no-hooks` is only for environments that must opt out.

The version stamp is completion evidence: required skill or hook failure leaves the prior `bdVersion` intact, and incompatible parseable user hook structures are preserved unchanged while upgrade fails truthfully.

Legacy stop migration is equally narrow: a top-level Benjamin stop command is removed as one property from a mixed group, preserving unrelated metadata and nested user hooks.

That property-level rule is limited to shared Claude/Codex groups; flat Cursor Benjamin entries are removed whole so repair cannot leave invalid commandless objects.

Skill refresh is fail-closed at the filesystem boundary: every selected bundle destination is preflighted before bundle I/O, and symlinked, non-directory, or escaping paths abort the all-target migration without external or partial target writes. Hook ownership is likewise conservative: only command-start Benjamin session commands in each target's direct start/stop schema locations are repaired or removed; wrapper, prefix, logging, nested custom metadata, and unrelated event names stay user-owned. Within those direct locations, Stop/stop permits no Benjamin session command, while SessionStart/sessionStart permits only the exact healthy target start command.

Final hook review requires exactly one canonical start command and applies one structural preflight to health, install, and uninstall. Leading whitespace remains directly executable ownership; wrappers do not. Unsupported Cursor versions, primitive relevant-event entries, incompatible shared groups, and symlinked hook ancestors are skipped unchanged. Existing hook files use flushed same-directory temporary files, atomic rename, POSIX mode/owner preservation, and a best-effort final stale-read guard.

Final export review also moved publication scanning to the fully rendered in-memory artifact before any write. Typed `Checked:`/`Result:` evidence, parsed local `file:` URLs, single-line scope titles, and safely quoted generated frontmatter close the remaining customer-export bypasses without claiming semantic verification.

`benjamin-docs` is a persistent repo-local project memory system for AI coding agents and humans. It turns a repo into living project knowledge that agents read, follow, and update while they work, so a new coding session starts with context: what the project is, where work stopped, what decisions and conventions matter, what is risky, and what should happen next.

The public positioning must make that clear in the first few sentences. BD is not a generic documentation package or Markdown helper. Markdown is the storage format; the product is continuity across agent sessions, human handoffs, and implementation work.

V1 is an open-source npm CLI plus Codex/Claude skill. The CLI owns structure, validation, scopes, anchors, guided local exports, and approachable commands. The skill owns synthesis from chat context and should challenge weak plans instead of acting as a passive note taker.

The human-facing command surface is intentionally small: `bd init`, `bd ready`, `bd export`, and `bd help`. Advanced flags and diagnostics remain available through `bd commands` and agent guidance.

The core product model is asymmetric: humans should see a calm, tiny surface and feel safe that project memory is being maintained, while agents carry the richer operating contract. After `bd init`, users should not need to remember refresh, freshness, verification, scope lifecycle, or export-preparation details; agents should know and use those workflows through repo-local guidance, deterministic checks, and advanced commands.

Public entry points now work for both humans and agents. The GitHub README, npm description, CLI `introduce` and help text, command drawer, and bundled skill use the same project-memory framing without claiming that hooks load the whole memory or deterministic checks prove semantic truth. Preserve that exact boundary.

The 0.9.3 release packaged that public positioning for npmjs. Version 0.10.0 added `bd drift` and consent-based session hooks. Drift measures watched docs against committed Git history. Session-start hooks provide compact orientation and pointers; they do not semantically verify or fully load every project fact. Version 0.12.0 will remove blocking/follow-up stop behavior so memory maintenance happens during normal agent work and cannot distort the final answer.

The 0.11.0 release candidate adds the MCP memory server: `bd mcp` exposes the memory as native tools (context, search, read, validated writes, decisions, status) over stdio, registered per project with `bd mcp install` for Claude Code, Cursor, and Codex. Hooks push context into sessions; MCP lets agents pull exactly the sections they need and write back safely. This introduces bd's first runtime dependencies (the official MCP SDK plus zod), an accepted exception to the dependency-light posture.

The 0.11.1 hotfix reduced stop-hook failures by fingerprinting the dirty tree at session start and preserving the user's requested answer during a continuation. The audit found that any blocking stop continuation still cannot guarantee an unchanged final answer. The approved 0.12.0 direction therefore removes blocking and auto-follow-up behavior instead of trying to make it less intrusive.

Agent Reliability now includes clearer handling for local prerequisites. When agents record that project checks are blocked by missing tools or services, such as a command that is not installed or a database that is not listening, `bd ready` surfaces those notes under a dedicated environment/tooling category instead of blending them into generic project failure language.

Release hygiene is now part of that agent-owned operating contract. After npm publish, maintainers/agents should run `pnpm run release:github` and `pnpm run release:verify-public` so the public npm version, git tag, and GitHub Release stay aligned.

Because this repo is public, private commercial strategy, pricing, and future paid SaaS planning should not be captured in tracked Benjamin docs unless the user explicitly marks the content public-safe. Keep that material outside the repo or in ignored local folders.
