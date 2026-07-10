---
title: launch-readiness-audit Brief
scope: feature
scope_id: launch-readiness-audit
audience: [developer, designer, agent]
status: approved
visibility: public
updated: 2026-07-10
source: manual
freshness: status
---

# Benjamin Docs — Complete Product, Architecture, and Adoption Audit

## Trust-Foundation Progress

Tasks 1-4 are implemented on the dependable-standard branch. The work locks context/token/latency budgets, removes installed stop-hook continuations, bounds task retrieval and the core skill, batches drift history queries, and introduces truthful structured readiness. `bd ready` and `bd ready --json` now report separate structure, content-heuristic, committed-freshness, working-tree-impact, and agent-guidance dimensions. Known committed drift and unresolved changed work block independently; non-Git planning stays usable; optional doctor setup and recorded environment blockers do not determine repository readiness.

Audit date: 2026-07-10
Audited version: 0.11.1 at commit 3705444
Verdict: not ready for public positioning as a dependable standard

## Executive Summary

Benjamin Docs has a genuinely valuable core idea: repositories need durable, human-readable project memory that records intent, decisions, current state, risks, and continuation context for both humans and coding agents. Git records what changed. Source code records what exists. Neither reliably records why a decision was made, what remains uncertain, or what the next agent must do. Benjamin Docs is strongest when it treats that missing layer as a first-class repository artifact.

The project does not yet deserve to be called a widely adoptable developer standard. Its central trust claims are not upheld by its present behavior:

- ready can report that project memory is ready for handoff when watched documentation is known to be behind committed code.
- ready ignores working-tree source changes unless the caller separately remembers to use review --changed.
- customer exports can be produced from untouched starter placeholders while ready correctly reports the project is not ready.
- visibility: private does not make tracked Markdown private, yet the terminology invites that interpretation.
- hooks described as automatically loading memory only insert a pointer telling the agent to read two files.
- a clean repository can fail readiness because a global Claude Desktop ZIP is absent from Downloads.
- generated views infer meaning from heading text and can omit the repository's actual project open questions.
- the repository's own generated continuation view simultaneously carries stale 0.9.x release state and current 0.11.1 state while ready passes.

This is not a collection of cosmetic issues. They undermine the product's defining promise: trusted continuity. Benjamin Docs currently verifies the shape and minimum substance of a documentation set; it does not verify that the set is semantically current, internally consistent, or safe to export. The product copy repeatedly blurs those distinctions.

The recommendation is to pause new feature expansion and broad launch marketing. Run a trust milestone first. The milestone should make readiness truthful, disable unsafe export paths, separate repository readiness from optional global integrations, establish one canonical structured state model, and prove fresh-agent continuation across multiple repositories and stacks.

If those changes are made, Benjamin Docs could own a useful category: a vendor-neutral project memory protocol with a reference CLI, conformance suite, and adapters for coding agents. If they are not made, Benjamin Docs will remain a thoughtful Markdown scaffold competing against native agent memories, AGENTS.md conventions, repository maps, and mature documentation platforms without a defensible reliability advantage.

## Project Understanding

Benjamin Docs is not primarily a documentation generator.

It is a local-first repository memory system composed of five layers:

1. A prescribed Markdown information architecture for project, engineering, feature, release, and handoff knowledge.
2. A CLI that initializes, validates, reviews, searches, exports, and derives views from that knowledge.
3. Agent guidance distributed through AGENTS.md and a global skill.
4. session hooks intended to orient agents at session start and prompt documentation review at session end.
5. An MCP server that exposes project memory to compatible agents.

The intended workflow is:

1. Install the npm package and agent skill.
2. Run init in a repository or planning workspace.
3. Have an agent populate the starter files.
4. Let project work and project memory evolve together.
5. Use views, changed-work review, drift, and ready to determine whether the memory is suitable for continuation.
6. Export selected knowledge for a customer, developer, app, feature, or handoff use case.
7. Use hooks, AGENTS.md, the skill, or MCP to make later agents discover and maintain the memory.

The philosophy is stronger than the current product execution. It recognizes that:

- code-derived documentation cannot recover product intent;
- chat history is not an adequate system of record;
- agents require concise continuation state as well as deep reference material;
- source memory and generated outputs should be distinct;
- human-facing interaction should remain simple while agents perform verification and repair;
- local files and Git provide ownership, portability, and auditability.

The implementation, however, is closer to a convention-enforcing CLI than a verified memory system. Its validators reason mostly about frontmatter, headings, starter phrases, word counts, filenames, and Git timestamps. They cannot establish semantic truth. That limitation would be acceptable if the product described the checks precisely. It becomes a launch blocker because the public copy calls the result current, useful, and handoff-ready.

## Audit Method

This audit did not rely on README claims alone. It covered:

- every major documentation family;
- package metadata and packed npm contents;
- CLI routing and command implementations;
- initialization, readiness, review, drift, hooks, views, MCP, export, update, and release paths;
- tests and coverage;
- temporary clean-install and fresh-project scenarios;
- modified and committed-code drift scenarios;
- customer and developer export scenarios;
- the repository's own generated views and status metadata;
- current official competitor and ecosystem documentation.

Verification performed:

- pnpm check: 204 tests in 23 suites passed.
- Node test coverage: 87.43% line, 72.93% branch, and 94.05% function coverage.
- pnpm audit --prod: no known production dependency vulnerabilities.
- npm pack --json --dry-run: 112 package entries, about 128 KB compressed and 646 KB unpacked.
- ready, review, drift, doctor, status, hooks status, MCP registration, export, and init behavior exercised directly.
- Temporary clones were used for uncommitted source changes, committed source changes, empty home directories, and untouched starter exports.

## Strengths

### 1. The problem is real and the core mental model is excellent

“Git remembers what changed; Benjamin Docs remembers why” is the strongest product statement in the repository. It identifies information that source code, Git history, issue trackers, and model context windows routinely lose: intent, rejected alternatives, current risks, and the continuation state of unfinished work.

The separation between source memory and generated snapshots is also correct. The code and docs consistently state that exports and views are derived outputs and should not replace canonical project memory.

### 2. Local-first, plain Markdown is the right foundation

The project does not require an account, hosted service, proprietary database, or background synchronization service. That improves ownership, portability, offline use, diffability, and long-term durability. It also makes the format inspectable by humans and usable by agents that do not support MCP.

This is a stronger foundation for an open standard than a cloud-first knowledge product.

### 3. Conservative filesystem behavior is unusually good

Path handling, symlink safety, repository-root detection, manifest scoping, non-destructive initialization, and preservation of user-owned AGENTS.md content receive serious attention. The test suite covers many boundary cases that young CLIs normally ignore.

The project also distinguishes managed source docs from generated views and exports, which is essential for deterministic regeneration.

### 4. The implementation is dependency-light and test-conscious

The package has only two runtime dependencies, strict TypeScript, no known production audit findings, and meaningful unit/integration coverage. The test suite is not superficial: it covers initialization, validation, review, hooks, MCP installation, export, lifecycle behavior, views, drift, update checking, and safety boundaries.

For a one-maintainer pre-launch CLI, 204 passing tests and 87% line coverage are a real strength.

### 5. The agent/human asymmetry is strategically correct

Humans should not have to learn a large operational command surface. Agents can use verbose commands, structured checks, repair flows, and detailed guidance. The current project understands this, even though onboarding still exposes too much machinery and automation does not yet deliver the promise.

### 6. Provenance and evidence are treated as product concepts

Feature verification records, export provenance, changed-work review, continuation proof, and explicit handoff artifacts are more rigorous than ordinary “AI writes docs” products. This is where Benjamin Docs can differentiate from documentation publishers and automatic repository wikis.

### 7. Dogfooding has exposed hard problems early

The repository uses Benjamin Docs extensively and has accumulated real failure cases around stale releases, hooks, views, exports, skills, and lifecycle state. The self-use is currently embarrassing in places, but it is also valuable evidence. The right response is to turn those failures into conformance tests, not hide them.

## Weaknesses

### 1. The project overclaims trust

The highest-severity weakness is the gap between wording and proof.

README.md:128-134 says ready determines whether project memory is valid, current, and handoff-ready. src/ready.ts:21-38 determines the main result from validation, heuristic review, strict doctor, and the agent contract. Drift is added at src/ready.ts:88-96 as a non-blocking advisory. src/review.ts:175-177 only performs changed-work review when --changed is explicitly supplied.

In a temporary clone with an untracked source file, drift reported “Project memory is current with watched code,” ready returned ready, and review --changed reported 12 warnings. After committing the same source change, drift found 11 stale docs, but ready still ended with “Project memory is ready for handoff.”

A standard cannot use “current” or “ready for handoff” for this behavior.

### 2. Structural validation is presented as semantic validation

src/review.ts primarily checks starter phrases, minimum body length, implementation-related keywords, verification wording, and known section patterns. These are useful lint rules. They cannot tell whether a version number is current, two files contradict each other, a claimed feature exists, or an important architectural change was omitted.

The repository proves the limitation:

- project/roadmap.md:61-74 still calls 0.4.x polish and 0.5.0 the immediate next work while the same file records 0.11.1 as current.
- features/agent-reliability/handoff.md:74-76 still describes 0.9.2 verification and 0.9.3 preparation.
- views/agent-continuation.md combines that stale release state with current 0.11.1 state.
- handoff/human-brief.md contains conflicting current-release statements.
- scopes.json labels project, release, and handoff scopes draft while their corresponding docs use review.

All current checks still pass.

### 3. The product creates a large memory surface before proving value

The repository contains more than 55,000 Markdown words and over 400 KB of Markdown. The main read-first documentation is thousands of words. Initialization creates nine starter docs plus metadata, agent guidance, and optional generated views. Every feature scope adds four more files.

This structure can preserve knowledge, but it also creates maintenance pressure and cognitive load. The current system responds to this with more generated summaries, which themselves become another contradictory surface.

Benjamin Docs needs a strict information budget. A new agent should receive a compact canonical packet first and retrieve deeper material only when needed.

### 4. The state model is duplicated and weakly enforced

Status exists in document frontmatter and again in scopes.json. Those values can disagree. “Current release” exists in several prose files. Risks and questions are headings rather than typed records. Generated views infer categories from heading text.

The absence of canonical typed facts is the root cause of much of the project's semantic drift.

### 5. Extensibility is mostly aspirational

The public format is hardcoded across templates, validators, reviews, views, exports, the skill, AGENTS.md generation, README examples, and command help. There is no versioned JSON Schema, extension API, renderer interface, rule plugin system, or conformance suite.

A standard must let other tools implement and validate the format without importing Benjamin Docs' internal TypeScript assumptions.

## Documentation Review

### README

What works:

- The first screen establishes persistent project memory, the Git-versus-why distinction, local ownership, and cross-agent intent.
- Installation commands are concrete.
- Source memory versus generated outputs is explained.
- Advanced commands are discoverable.
- Local-first and no-cloud properties are clear.

What fails:

- At about 405 lines, the README tries to be category pitch, tutorial, command reference, integration manual, export manual, lifecycle guide, and release history.
- It claims hooks “load” or “inject” project memory even though the hook inserts only a short pointer.
- It calls ready a current/handoff gate even though known drift is advisory.
- It does not warn that visibility: private offers no Git confidentiality.
- The onboarding sequence does not disclose that ready requires global skill copies and a Claude Desktop ZIP.
- No 60-second end-to-end example shows the actual files created, the agent prompt, a code change, a memory update, and the next agent's recovered context.
- There is no screenshot, terminal transcript, or small before/after demonstration.
- Embedded release history duplicates the changelog and increases drift.

Recommendation: reduce README to category, proof, 60-second workflow, core commands, and links. Generate the command reference from a single command catalog. Move release history to releases.

### Project docs

The project brief contains the best philosophical material in the repository, but it has grown chronologically rather than editorially. The roadmap mixes present state, shipped history, old “immediate” work, and future ideas. Open questions are detailed but are not represented in the generated open-questions view because their section headings do not match the view heuristic.

These files should become canonical, compact, and structured:

- brief: stable product definition, user, problem, principles, boundaries;
- current state: version, milestone, confidence, launch status;
- roadmap: now, next, later, explicitly ordered;
- questions: typed records with ID, status, owner, opened date, decision link;
- decisions: typed records with supersession relationships.

### Handoff docs

The human/agent distinction is useful. The agent brief and continuation view, however, overlap heavily and can contradict. The start hook points agents to both, multiplying the ambiguity.

There should be one generated compact continuation packet, derived from canonical data, with a fixed token or character budget. The human brief should be a separate editorial view, not another source of release truth.

### Engineering docs

architecture.md and code-map.md are useful for this repository because Benjamin Docs is an implementation-heavy codebase. Making equivalent files mandatory for planning and chat workspaces is inappropriate. A product concept does not need invented modules or runtime boundaries to satisfy readiness.

The engineering docs should be optional capabilities activated by mode or stack, not universal template obligations.

### Feature docs

Brief, plan, decisions, and handoff form a reasonable feature lifecycle. Four files for every feature is expensive for small changes. Status is duplicated between the files and scopes.json, and archived material still appears in search unless callers remember to filter it.

Use a single feature file for small work and a directory only after a complexity threshold. Store lifecycle status canonically once. Search should exclude archived or superseded content by default.

### Generated views

src/views.ts:27-64 maps view categories to heading substrings. This causes both false omissions and duplicates. The current project open questions are absent from views/open-questions.md. Risks and questions can both match “Risks / Open Questions.” The result looks authoritative because it is generated, but generation only guarantees deterministic extraction, not semantic completeness.

Generated views need typed source records, stable IDs, canonicality, deduplication, status filters, and provenance. Until then they should be labeled convenience indexes, not trusted summaries.

### Plans and historical specifications

The repository retains long implementation plans and specification documents in the active documentation tree. They are valuable history but harmful default context. An agent can mistake an old plan for current intent.

Move historical plans into an explicitly archived area, add superseded-by metadata, and exclude them from default search and continuation context.

### CONTRIBUTING

CONTRIBUTING.md is too small for the project's complexity and incorrectly says documentation lives in docs/ rather than benjamin-docs/ at line 29. It does not explain the architecture, test taxonomy, fixture strategy, generated-file rules, decision process, or how an external contributor should add a command or schema field.

### SECURITY

SECURITY.md:32 says the project should not write outside the project root. That is false: skill installation, packaging, session state, and update caching use home-directory locations. The policy should enumerate every external write, its trigger, and its sensitivity.

### Agent skill and AGENTS contracts

The skill is comprehensive but long and operationally dense. It partly compensates for weaknesses in the product by telling agents how to interpret and repair them. This makes correct behavior depend on installing and updating a global prompt artifact.

The repository contract is valuable but should be generated from a smaller versioned policy schema. The most important rules should fit in a short repo-local section. Tool-specific details belong in adapters.

## AI Agent Review

### Would an autonomous agent understand Benjamin Docs immediately?

Not reliably.

An agent reading only the README is likely to understand the category after the opening section. An agent encountering the generated directory without prior context may interpret it as a large documentation scaffold. A fresh agent must reconcile AGENTS.md, a global skill, the agent brief, the continuation view, source docs, views, scope metadata, CLI output, and possibly MCP search results.

The system has no formal precedence rules for contradictory semantic facts beyond “source docs are canonical.” That is insufficient when multiple source docs disagree.

### Ambiguities that can lead to incorrect implementation

1. Ready versus current
   The docs say ready means current. The implementation permits known drift. One agent may proceed; another may stop and repair.

2. Private versus confidential
   One agent may treat private frontmatter as an export label. Another may assume the content is safe in a public repository.

3. Loaded memory versus pointer
   One agent may assume the session hook supplied the relevant context. Another may follow the pointer and read thousands of words.

4. Source versus generated authority
   The docs call sources canonical, but generated continuation views are explicitly read-first and can contain stale source excerpts.

5. Scope status versus document status
   A feature can be draft in scopes.json and review in every source file. There is no invariant telling an agent which controls lifecycle.

6. Changed code with no documentation impact
   Broad watches mark many docs stale. There is no durable “reviewed, no docs impact” acknowledgement. Agents either churn docs or ignore warnings.

7. Planning mode completeness
   next instructs the agent to update a small subset of files while review evaluates all starter docs. An agent following the prompt exactly still fails readiness.

8. Export correctness
   Successful export is easily interpreted as approval to share. The implementation permits low-quality starter content in several customer paths.

9. Search result authority
   MCP lexical search can return source docs, derived views, and archived feature docs without strong canonical/status ranking. Two agents can receive different plausible histories.

10. Verification meaning
    “Validated write” means no new structural errors, not that content is accurate or sufficiently complete. A one-line replacement can pass memory_update validation and only fail a later heuristic review.

11. Global versus repo-local readiness
    An agent may spend time repairing global skill copies and a Desktop ZIP even though the repository itself is healthy.

12. Automatic maintenance
    Product copy suggests agents maintain memory in the background. Actual behavior depends on optional hooks, agent compliance, and the contents of external tool configuration.

### Information missing for dependable autonomy

- A machine-readable readiness result with separate structure, semantic-evidence, freshness, integration, and export-safety fields.
- A canonical current-state record.
- Stable IDs for questions, risks, decisions, tasks, and verification evidence.
- Explicit precedence and supersession rules.
- A no-doc-impact acknowledgement mechanism tied to a code change.
- A compact context budget and retrieval policy.
- Stack-aware change classification.
- Structured CLI and MCP outputs.
- Conformance fixtures showing exactly how different agents should behave.
- Failure recovery for interrupted writes and conflicting concurrent updates.
- A privacy model that distinguishes repository access from publication/export policy.

## Developer Experience Review

### Installation and setup

The advertised workflow appears small, but the actual system involves:

- Node 22 or newer;
- a global or npx-installed CLI;
- global skill installation in multiple agent-specific locations;
- project initialization;
- optional AGENTS.md edits;
- optional hooks per supported agent;
- separate MCP registration;
- tool-specific trust or config behavior;
- filling nine starter docs;
- generating views;
- review and readiness repair.

That is too much ceremony before the first clear payoff.

The clean-home test exposed a severe coupling: after the documented install-skill command installed all four skill copies, ready still failed because a Claude Desktop skill ZIP was not present in Downloads. A collaborator using only Codex or CI should not be blocked by an unrelated optional distribution artifact.

### First run

The interactive init prompts are among the better UX surfaces. The mode choice and consent before modifying agent files are understandable. The output, however, creates a substantial empty information architecture and leaves the user dependent on an agent prompt to complete it.

A fresh codebase initialization produced 18 readiness warnings. That is defensible if the next command gives a complete repair workflow. It currently does not: planning mode's next prompt omits files that review later requires.

### Day-to-day use

The command set is broad and internally coherent for an expert, but too many concepts are user-visible: validate, review, ready, drift, views, doctor, next, anchors, verify, scope, hooks, MCP, export, upgrade, install-skill, package-skill, and chat-project.

The human surface should be:

- init;
- status;
- export.

Everything else should remain agent/API-oriented or appear as repairs behind status.

### Export experience

The guided interaction is a good product concept. The implementation is not safe enough to expose.

In a fresh project, an untouched private starter scaffold that failed ready successfully produced a detailed customer app export containing placeholder and generic fallback text. Customer app, handoff, summary, and audience exports do not receive the same quality/privacy/verification gates as feature export.

The repository's developer app export produced only two short sections because extractSection requires exact H2 headings that do not match the source documents. It also copied a local absolute filesystem path.

Export should be treated as a publication compiler with strict inputs, not a text slicer.

### Update experience

The cached, opt-out update check is appropriately conservative. The global skill and integration upgrade story is not. Hook status and MCP status accept any recognizable registration rather than verifying an exact current command. Existing marked hooks are not necessarily refreshed. Version compatibility across CLI, repo schema, global skill, and MCP registration is not modeled clearly.

## Architecture Review

### Overall assessment

The architecture is understandable and productive for the current repository size. It is not yet suitable for a long-lived standard implementation.

### What is good

- Clear source modules for major commands.
- Small runtime dependency set.
- Synchronous local behavior that is easy to reason about.
- Strong path and symlink safety.
- Deterministic generated files.
- Tests close to product behavior.
- Conservative handling of existing user files.
- Explicit metadata directory and manifest.
- Rollback behavior for MCP-managed writes that introduce validation errors.
- Network use limited to cached, non-blocking update checks.

### Major architectural problems

#### Monolithic command modules

src/cli.ts is roughly 1,159 lines and combines routing, argument parsing, interactive terminal behavior, orchestration, formatting, and error policy. src/export.ts is roughly 889 lines, review.ts 713, and validate.ts 662.

This makes it difficult to expose a stable library API, test domain behavior without terminal coupling, or add integrations without copying CLI semantics.

Recommended boundaries:

- domain model and schemas;
- repository/storage adapter;
- analyzers and evidence engine;
- command application services;
- renderers;
- terminal adapter;
- MCP adapter;
- integration installers.

#### No public domain API

package.json exposes a bin, not a supported JavaScript API. Integrations must shell out or use the MCP process. A standard needs reusable parsers, validators, query APIs, and schemas.

#### Hardcoded schema and behavior

Statuses, audiences, document families, views, headings, templates, watches, export extractors, and command descriptions are repeated in code and documentation. There is no versioned schema contract or migration layer sufficient for third-party implementers.

#### Duplicate state

scopes.json and document frontmatter duplicate lifecycle status. Release state is prose. Verification and visibility are inconsistently enforced by export type.

#### Git model is incomplete

src/git.ts uses a source-extension allowlist and a diff filter that excludes deletions. The allowlist omits major ecosystems such as Swift, Kotlin, C#, C++, Dart, Vue, Svelte, shell, and TOML. Drift is based primarily on committed history and can miss working-tree and deletion cases.

The default watch is simultaneously too broad for meaningful signal and too narrow for the “any stack” promise.

#### Inefficient repeated analysis

ready invokes validation directly and indirectly through review and doctor. Drift performs repeated Git work per document. Search reparses all managed Markdown. This is acceptable at 54 docs but not for a large monorepo.

Create one repository snapshot and analysis graph per invocation. Cache parsed frontmatter, headings, Git state, and dependency/watch relationships.

#### Weak machine interfaces

Most CLI commands emit prose and exit codes. Agents need JSON output with stable schemas. MCP tools return text without outputSchema or structuredContent. This forces brittle parsing.

#### MCP does not use the protocol's full information architecture

All capabilities are tools. Official MCP concepts distinguish tools for model-controlled actions, resources for application-controlled read-only context, and prompts for user-controlled templates. Benjamin Docs memory and status are natural resources; capture and handoff workflows are natural prompts; search and mutation remain tools.

The server should add structured output and annotations such as read-only, destructive, idempotent, and open-world hints. See the official [MCP TypeScript SDK server guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.29.0/docs/server.md), [MCP server specification](https://modelcontextprotocol.io/specification/2025-06-18/server/index), and [server concepts](https://modelcontextprotocol.io/docs/learn/server-concepts).

### Maintainability verdict

Experienced engineers could maintain the current project, but they would spend increasing effort preserving duplicated contracts. The code is cleaner than the product semantics. Before adding features, refactor around a single versioned domain model and evidence graph.

## Open Source Readiness

Benjamin Docs is not ready for large-scale community adoption.

### Positive signals

- MIT license.
- Security policy.
- Contribution instructions.
- Automated CI.
- Strict TypeScript and broad tests.
- Release checklist and release:check.
- Deterministic local development.
- No known production dependency vulnerabilities.
- Small package footprint.
- Public roadmap and extensive self-documentation.

### Missing or weak signals

- CI covers Ubuntu and Node 22 only. A cross-platform CLI should test Windows, macOS, Node 22, and the current supported major.
- No enforced coverage floor.
- No formatter/linter gate visible in the primary CI workflow.
- No installed-tarball smoke test.
- No conformance fixtures across codebase, planning, and chat modes.
- No fresh-agent behavior test.
- No Code of Conduct.
- No pull request template.
- No governance or maintainer succession model.
- No architecture/contributor guide proportionate to the codebase.
- Mutable GitHub Action tags are not supply-chain pinned.
- npm release is manual and does not advertise provenance/attestation.
- The package lacks a concise public changelog surface.
- CONTRIBUTING points contributors to the wrong documentation directory.
- SECURITY makes an incorrect no-writes-outside-root claim.
- The tracked benjamin-docs-skill.zip is stale: its SKILL.md differs from the current source skill.
- Release frequency and package downloads do not yet demonstrate sustained user adoption.

Current public activity is small, so the project should not treat its present behavior as market-validated. Rapid internal releases are evidence of iteration, not retention.

## Competitive Position

Benjamin Docs competes across several categories, each with different user expectations.

### Native coding-agent memory and instructions

[Claude Code](https://code.claude.com/docs/en/memory) supports project memory and auto memory that load into sessions. [Cursor Memories](https://docs.cursor.com/en/context/memories) creates project-scoped memories from chats, while [Cursor Rules](https://docs.cursor.com/context/rules) supports scoped instruction files. [GitHub Copilot](https://docs.github.com/en/copilot/reference/custom-instructions-support) supports repository and path-specific instructions, including AGENTS.md-style files across surfaces.

These products beat Benjamin Docs on zero-install discovery and native automatic context. Benjamin Docs can beat them on vendor neutrality, Git-owned memory, explicit evidence, human readability, and shared continuity across agents—but only if its gates are more trustworthy than native memory.

### Agent instruction standards

[AGENTS.md](https://agents.md/) already provides a simple open convention for agent instructions and is used by tens of thousands of projects. It is much easier to adopt.

Benjamin Docs should treat AGENTS.md as an adapter and discovery surface, not compete with it. Its standard must describe project memory data, evidence, lifecycle, and retrieval—not merely another instruction file.

### Repository understanding and context packing

[DeepWiki](https://docs.devin.ai/work-with-devin/deepwiki) automatically indexes repositories and generates navigable wikis with diagrams and source links. [Aider's repository map](https://aider.chat/docs/repomap.html) ranks repository structure into a token budget. [Repomix](https://repomix.com/guide/) packages repository context across models and offers MCP/skill integrations.

These tools beat Benjamin Docs on automatic topology, source-derived understanding, and low-effort first contact. Benjamin Docs' opportunity is the information code cannot derive: rationale, product intent, current uncertainty, human decisions, and verified continuation.

### Repository-local agent memory

[Serena](https://oraios.github.io/serena/02-usage/045_memories.html) is the closest conceptual competitor. It uses repository-local memories, onboarding, MCP, and CLI workflows. Benjamin Docs needs a crisper distinction: typed project continuity, human/agent co-ownership, evidence-based freshness, and portable conformance.

### Documentation publishing and AI documentation

[GitBook Agent](https://gitbook.com/docs/gitbook-agent) and [Mintlify Agent](https://www.mintlify.com/docs/agent) research repositories, write and maintain documentation, validate content, and integrate with Git or pull requests. GitBook additionally exposes published docs through MCP. [Docusaurus](https://docusaurus.io/docs/next) and [MkDocs](https://www.mkdocs.org/) provide mature public publishing, navigation, versioning, search ecosystems, and presentation.

These products are much better documentation platforms. Benjamin Docs should not position around prettier docs, generic AI writing, or publishing. “Docs” in the name currently pulls perception toward a category where the product is weaker.

### Genuine differentiation

Benjamin Docs is genuinely differentiated when all of these are combined:

- vendor-neutral;
- repository-local and Git-readable;
- built for both humans and agents;
- focused on intent, decisions, risks, progress, and handoff;
- capable of linking code change to documentation impact;
- able to produce safe audience-specific snapshots;
- able to prove a continuation packet meets a conformance contract.

The current product has the pieces, but not the proof.

### Expected features, not differentiators

- Markdown files;
- CLI initialization;
- AGENTS.md support;
- MCP integration;
- generated summaries;
- repository search;
- AI-written docs;
- Git synchronization;
- documentation export.

### Naming and positioning

“Benjamin Docs” is memorable but semantically opaque. “Docs” invites comparison with documentation generators and publishers. “Benjamin” provides no search or function signal.

Options:

1. Keep the brand and always pair it with a category: “Benjamin — the open project memory protocol.”
2. Rename the implementation “Benjamin Memory” while retaining the CLI/package transition.
3. Name the standard independently, such as “Project Memory Protocol,” and make Benjamin Docs the reference implementation.

The third option best supports standard adoption. Standards spread when the data contract is not perceived as vendor-specific.

## Missed Opportunities

### 1. A versioned open project-memory protocol

Publish a small schema independent of the CLI:

- canonical project status;
- decisions and supersession;
- questions and resolution;
- risks and ownership;
- work scopes and lifecycle;
- verification evidence;
- code-to-memory relationships;
- continuation packet;
- publication policy.

Provide JSON Schema, Markdown mapping, migrations, examples, and a conformance suite. This is the largest ecosystem opportunity.

### 2. Evidence acknowledgements

A changed source file should produce an impact question, not automatically imply eleven stale docs. Agents need to record one of:

- updated doc;
- verified no documentation impact, with reason;
- deferred, with owner and expiry;
- blocked, with evidence.

Tie the record to commit/file ranges so readiness can be strict without forcing meaningless edits.

### 3. Stack-aware and repository-aware adapters

Infer Git diff classes from actual repository contents, not a fixed extension allowlist. Provide adapters for web apps, mobile, infrastructure, monorepos, libraries, and non-code planning. Allow explicit watch mappings near the docs they govern.

### 4. Compact context compilation

Compile a fixed-budget continuation packet from canonical structured facts. Measure recall with fresh agents. Deep docs should be retrieved on demand through MCP resources or search rather than loaded by default.

### 5. Conformance benchmarks

Create public fixtures and score agents on:

- current goal recovery;
- decision recall;
- next-action accuracy;
- stale fact avoidance;
- privacy classification;
- changed-work documentation behavior;
- cross-agent consistency.

This would convert “agent-ready” from marketing into measurable evidence.

### 6. IDE and pull-request integration

Useful integrations would show:

- memory impact beside a changed file;
- unresolved decisions/questions relevant to the current path;
- ready dimensions in CI;
- a PR check requiring update or no-impact evidence;
- one-click opening of the continuation packet.

Do not build a dashboard before the underlying evidence model is trustworthy.

### 7. Public export compiler

A future export system should have typed source fields, policy labels, redaction, secret scanning, link/path sanitization, audience-specific schemas, AST rendering, and proof of implementation verification. Correctness matters more than the number of deliverable types.

## What Should Be Removed or Deferred

Remove or disable until redesigned:

- customer app, handoff, summary, and audience exports that bypass readiness, visibility, or verification gates;
- the Claude Desktop ZIP requirement from repository readiness;
- “current” and “ready for handoff” wording for advisory drift behavior;
- “hooks load memory automatically” wording until content is actually supplied;
- visibility: private as a confidentiality-sounding label;
- release history from the README;
- stale tracked skill ZIP, or generate and verify it in release automation;
- duplicate generated views that cannot guarantee completeness;
- mandatory engineering templates in planning/chat modes;
- old plans and superseded feature material from default search and continuation context;
- chat-project behavior that prints manual copy instructions without deterministic capture;
- anchors if user evidence does not show they improve retrieval enough to justify another concept.

Defer:

- hosted publishing;
- dashboards;
- more export types;
- additional agent integrations;
- richer UI;
- automatic AI rewriting.

Trustworthiness is the bottleneck, not feature count.

## Top Improvements

### 1. Make readiness truthful

Priority: P0
Complexity: Large
Expected developer benefit: agents and humans can use one result without remembering hidden caveats.
Long-term impact: foundational; every later workflow depends on this trust.

Split readiness into machine-readable dimensions:

- structure;
- content heuristics;
- freshness against committed code;
- working-tree impact;
- internal consistency;
- integration health;
- export safety.

ready should fail when required dimensions are unresolved. Optional integrations must never fail repository readiness. Add --json. Replace absolute claims with precise status until semantic evidence exists.

### 2. Stop unsafe exports and define publication policy

Priority: P0
Complexity: Medium to Large
Expected developer benefit: successful export once again means the artifact is intentionally shareable.
Long-term impact: prevents the most damaging possible failure—publishing private, placeholder, stale, or fabricated material.

Disable customer app, handoff, summary, and audience paths until they enforce:

- source visibility/publication eligibility;
- readiness;
- implementation verification where claimed;
- placeholder rejection;
- path and secret sanitization;
- typed required fields;
- no invented fallback prose.

Rename visibility to publication or export policy. State prominently that Git access controls confidentiality.

### 3. Separate repository health from global integrations

Priority: P0
Complexity: Small to Medium
Expected developer benefit: clean CI and collaborators can reach ready without installing unrelated tools.
Long-term impact: makes the product credible in teams and automation.

doctor should report optional agent targets independently. ready should use repository-local checks only. A Codex user should not need Claude/Cursor artifacts. A Desktop ZIP should be a packaging check, never a project gate.

### 4. Establish one canonical structured state model

Priority: P1
Complexity: Large
Expected developer benefit: fewer contradictory versions, statuses, tasks, risks, and questions.
Long-term impact: enables reliable views, exports, search, migrations, and third-party implementations.

Define typed records with stable IDs and supersession. Store lifecycle status once. Generate prose summaries from canonical facts instead of extracting facts from prose headings.

### 5. Redesign session automation around actual continuity

Priority: P1
Complexity: Large
Expected developer benefit: agents truly start with the right compact context and stop with complete impact accounting.
Long-term impact: turns the product's headline promise into observable behavior.

At start, supply a bounded canonical packet or MCP resource, not merely a pointer. Track baseline HEAD plus working-tree state through the session. Include commits and deletions. At stop, require update/no-impact/defer evidence for relevant changes. Keep hooks fail-open for user responses.

### 6. Make every mode capable of reaching ready

Priority: P1
Complexity: Medium
Expected developer benefit: following the generated next instruction succeeds instead of revealing hidden template obligations.
Long-term impact: reduces onboarding failure and documentation churn.

Use mode-specific minimal schemas. Planning should not require invented architecture. Chat should have a deterministic capture command. next must cover every required document or invoke an agent workflow that does.

### 7. Upgrade MCP and CLI into stable machine interfaces

Priority: P1
Complexity: Medium
Expected developer benefit: agents stop parsing prose and integrations become reliable.
Long-term impact: necessary for ecosystem adoption.

Add JSON CLI outputs. Expose memory/status as MCP resources, workflows as prompts, and mutations/search as tools. Add output schemas, structuredContent, annotations, canonical/status filters, and pagination. Exclude archived and derived duplicates by default.

### 8. Replace fixed drift heuristics with an evidence graph

Priority: P1
Complexity: Large
Expected developer benefit: high signal without documentation busywork.
Long-term impact: creates the defensible moat.

Model relationships among code paths, docs, decisions, features, tests, and verification evidence. Include every changed file type and deletion. Let adapters classify relevance. Persist no-impact decisions with expiry or commit identity.

### 9. Publish a vendor-neutral protocol and conformance suite

Priority: P2, after P0/P1 trust work
Complexity: Extra Large
Expected developer benefit: tools can interoperate without adopting one CLI.
Long-term impact: this is the path from product to standard.

Separate specification, reference implementation, fixtures, and certification. Use AGENTS.md and MCP as adapters. Establish schema governance and backward compatibility.

### 10. Rebuild onboarding and positioning around one proof

Priority: P2
Complexity: Medium
Expected developer benefit: developers understand the category and value within one minute.
Long-term impact: improves adoption and word of mouth.

Lead with a small before/after:

- agent A makes a change and records why;
- Benjamin verifies its impact;
- agent B starts later and accurately continues.

Reduce README length, add a terminal demo, show the actual continuation packet, and explain why native memory is insufficient. Pair or replace the name with “open project memory protocol.”

### 11. Raise OSS and release maturity

Priority: P2
Complexity: Medium
Expected developer benefit: contributors and teams can trust installation and releases.
Long-term impact: lowers maintainer risk and enterprise resistance.

Add cross-platform CI, supported Node matrix, tarball smoke, coverage floors, formatting/lint, pinned actions, npm provenance, Code of Conduct, PR template, governance, architecture guide, and generated asset verification.

### 12. Refactor the implementation around domain services

Priority: P2
Complexity: Large
Expected developer benefit: easier maintenance, testability, integrations, and extension.
Long-term impact: prevents the reference CLI from becoming the standard's bottleneck.

Break up cli.ts and export.ts. Create a versioned domain package, repository adapter, analysis snapshot, renderer interfaces, and separate terminal/MCP adapters. Generate docs/help from the same command and schema definitions.

## Recommended Execution Order

### Phase 0 — Stop the bleeding

- Correct public claims.
- Disable unsafe exports.
- Remove global artifacts from ready.
- Add explicit confidentiality warning.
- Fix stale self-documentation and skill ZIP.
- Add regression tests for every audit reproduction.

### Phase 1 — Trust milestone

- Introduce readiness dimensions and JSON output.
- Build canonical state records and invariants.
- Add working-tree, commit, deletion, and no-impact evidence.
- Make views/search exclude stale, archived, duplicate material.
- Prove clean init-to-ready in all modes.

### Phase 2 — Agent reliability proof

- Compile bounded continuation context.
- Implement exact session baseline accounting.
- Add MCP resources/prompts/structured outputs.
- Run fresh-agent benchmarks across at least five real repositories and three agent products.

### Phase 3 — Standardization

- Publish protocol/schema.
- Extract reference domain library.
- Release conformance fixtures.
- Recruit external adapters and design partners.
- Only then use “standard” language.

## Launch Gates

Do not publicly position Benjamin Docs as a reliable standard until all are true:

- ready never says current when known watched drift exists.
- Working-tree changes, commits during a session, and deletions are accounted for.
- A successful customer export cannot contain starter text, private-only content, absolute local paths, or unverified claims.
- Clean init can reach ready using only documented steps for the selected agent.
- Planning, chat, and codebase modes have mode-appropriate schemas.
- Canonical version/status/question/risk facts cannot contradict across source files.
- Default MCP/search results exclude archived and derived duplicates.
- The continuation packet stays within a declared budget.
- Fresh-agent tests recover the correct goal, decision, risk, and next action consistently.
- CI passes on supported macOS, Windows, and Linux environments.
- A third party can implement the memory schema from a public specification.
- At least several external projects use it continuously enough to demonstrate retention, not only installation.

## Final Product Direction

Benjamin Docs should become an open, verifiable project memory protocol for humans and AI agents.

The reference CLI should do four things exceptionally well:

1. Capture intent, decisions, risks, progress, and continuation state.
2. Relate code changes to memory impact with evidence.
3. Compile compact, trustworthy context for any compatible agent.
4. Produce policy-safe derived artifacts from verified source memory.

It should not try to win as a documentation website, generic AI writer, repository wiki, or ever-expanding CLI. Those markets already contain better products.

The strongest version of Benjamin Docs is smaller in surface area and much stricter in truth. Its adoption story is not “we generate many Markdown files.” It is “any agent can enter this repository, recover the same verified state, and continue without inventing history.”

That product could become a standard. Version 0.11.1 is not yet that product.

## Evidence Index

| Finding | Repository evidence | Reproduction |
| --- | --- | --- |
| ready does not gate drift | src/ready.ts:21-38, 88-96; src/review.ts:175-177 | committed watched source change: drift found 11 docs; ready returned ready |
| working tree can appear current | src/drift.ts:73-80; src/git.ts:11-12, 33-34 | untracked source file: drift said current; review --changed produced 12 warnings |
| deletions and stacks omitted | src/git.ts:11-12, 90-94 | diff filter excludes D; source allowlist omits major stacks |
| strict doctor requires optional artifacts | src/doctor.ts:96-109; src/ready.ts:25, 31-33 | empty HOME plus install-skill still failed on Desktop ZIP |
| hooks insert pointers | src/session.ts:27-38 | own repository hook status showed no hooks while ready passed |
| hooks can miss committed work | src/session-state.ts:85-102 | state fingerprints current working-tree changes rather than a durable baseline diff |
| starter customer export succeeds | src/export.ts:315-320, 481-527 | untouched private scaffold exported customer app while ready failed |
| app export extraction is brittle | src/export.ts:600-623, 749-755, 776-787 | self developer export contained only Overview and Feature Map and leaked a local path |
| views depend on headings | src/views.ts:27-64, 186-225, 251-281 | project open questions absent from generated open-questions view |
| MCP search is lexical | src/memory-tools.ts:51-83 | duplicate sources/views and archived results surfaced together |
| validated update can be semantically empty | src/memory-tools.ts:90-120 | rich brief replaced with one-line body; validation passed, later review failed |
| scope and doc status disagree | .benjamin-docs/scopes.json and feature frontmatter | active agent-reliability scope draft while docs are review |
| stale release state passes | project/roadmap.md:61-74; features/agent-reliability/handoff.md:74-76 | generated continuation combines old and current release state |
| CLI architecture is concentrated | src/cli.ts, src/export.ts, src/review.ts, src/validate.ts | file-size and responsibility inspection |
| package asset is stale | benjamin-docs-skill.zip and skills/benjamin-docs/SKILL.md | archive SKILL.md hash/size differs from current source |
| contributor/security docs drift | CONTRIBUTING.md:29; SECURITY.md:32 | wrong docs path and false outside-root write claim |
