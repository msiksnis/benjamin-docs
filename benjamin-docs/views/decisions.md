---
title: Decision Log
scope: project
scope_id: project
audience: [developer, agent]
status: draft
visibility: private
updated: 2026-06-11
source: manual
---

# Decision Log

Derived from decision and rejected-option sections across managed Benjamin docs.

## [Freshness And Lifecycle Decisions](../features/freshness-and-lifecycle/decisions.md)

Source: `benjamin-docs/features/freshness-and-lifecycle/decisions.md` (updated 2026-06-11)

### Decisions

- Watch rules live in `.benjamin-docs/config.json` as data, not code, because users must be able to adapt the mapping to their stack without a release. `init` seeds generic defaults and preserves custom rules on re-init.
- The glob matcher is hand-rolled (`*`, `**`, `?`) to keep the zero-runtime-dependency rule.
- Doc churn is measured against git history (files changed since the doc's last commit, threshold 10) because git facts are stack-agnostic and cannot be gamed by wording. A doc with uncommitted edits is treated as fresh.
- Path liveness only checks inline-code references whose first path segment exists in the repo. This avoids false positives on examples like GitHub slugs while still catching renamed or deleted files.
- Stale-claim patterns are generic ("not implemented yet", "does not exist yet") and scoped to `architecture.md` and `code-map.md` only, because those docs describe the present. Roadmaps legitimately describe unbuilt work.
- View freshness runs inside plain `review` so `ready` fails on stale views, but `views` regeneration stays an explicit command. `review` stays read-only; checks must not mutate the project.
- Views exclude both `archived` and `stale` statuses: archived means done or abandoned, stale means flagged-as-outdated, and neither belongs in a current-memory lens. The source docs keep the content either way.
- `views` only rewrites files whose body changed, so the frontmatter `updated` date stays meaningful and diffs stay clean.

### Rejected Options

- Auto-regenerating views inside `ready`: rejected because a gate that mutates the working tree is surprising in CI and weakens the "checks are read-only" rule.
- Keeping per-stack hardcoded paths with more stacks added: rejected; data-driven rules scale, hardcoded lists do not.
- An LLM-based review mode: rejected for this milestone; the CLI's value is being the deterministic referee the LLM cannot fudge.
- A separate `bd archive` command: rejected; `scope status` covers the lifecycle with one generic verb and no new top-level command.

## [Agent Brief](../handoff/agent-brief.md)

Source: `benjamin-docs/handoff/agent-brief.md` (updated 2026-06-11)

### Recent Decisions

- V1 should be a small CLI plus an agent skill.
- Repo-local docs are the source of truth; hosted publishing is future SaaS, not V1.
- The free/open-source part should help adoption; the SaaS can monetize publishing, sharing, auth, comments, and non-technical editing.
- The tool must work before code exists, after code exists, and for a single feature scope.
- Agents should not only agree with user plans. The skill should preserve intent while naming weak assumptions, unclear decisions, overbuilt V1 scope, and better alternatives.
- Public README baseline capture guidance now covers a new idea, an existing codebase, and one feature scope.
- Public README setup guidance now leads with pnpm global install and keeps source checkout details under local development.
- The second stranger test focused on a non-code person; README and CLI copy now explain `benjamin-docs` as a local project notebook an AI agent keeps in the project folder.
- Generated `next` prompts now ask for plain language or non-technical readability where appropriate.
- The chat-to-project workflow is a core V1 scenario: when the user only has a chat, the agent should ask for a project location, create the folder, run `benjamin-docs init --mode planning`, write a top-level README, and capture the chat into Benjamin docs.
- Chat-created projects should default to `~/Documents/Benjamin Docs/<Project Name>` with human-readable names, e.g. `~/Documents/Benjamin Docs/Atelier Edits`; avoid agent-specific or dated session folders unless requested.
- Chat-to-project confirmation copy should stay mobile-friendly: short sections, bullets for created files and captured content, and `Reply "yes" to create it`.
- `benjamin-docs@0.4.2` is published on npm and verified from fresh temp-project installs.
- `v0.4.2` is pushed to GitHub with release notes.
- The next milestone should focus on high-quality capture behavior, not more primary CLI commands.
- Use pnpm for this project.
- 0.4.1 polish should make `bd init` smart enough for normal codebase use: plain non-interactive init in an obvious codebase defaults to codebase memory with root and child agent guidance. Use `bd init --no-agent-contract` only when automation explicitly wants no repo-local guidance.
- `bd anchor list` was added after dogfooding showed that anchors could be created but not inspected through the CLI.
- 0.4.2 fixed older initialized projects that already have Benjamin docs but have an unmarked root `AGENTS.md`: append a Benjamin-owned section without overwriting the existing guide.
- 0.5.0 should make continuation readiness explicit: `agent-brief.md` must include read-first docs, current state, commands/checks, risks/hazards, and next actions.
- 0.5.1 added Memory Views as an advanced generated lens and documents the refresh flow as `bd init`, `bd views`, then `bd ready`.
- 0.6.0 adds `bd review --changed` after the Atelier audit showed agents may update feature docs while leaving project-level docs stale. The first implementation is deterministic and warning-only.
- 0.7.0 makes the gate trustworthy for any stack: watch rules move the changed-file-to-doc mapping into config, staleness is measured from git facts (churn since engineering docs last changed) and filesystem facts (path liveness), stale Memory Views fail `ready`, and `scope status` archives finished work out of views. All checks stay deterministic; `review` stays read-only.

## [Baseline Capture Guide](../project/baseline-capture.md)

Source: `benjamin-docs/project/baseline-capture.md` (updated 2026-06-06)

### Current Decision

The baseline guide belongs in the README for public discoverability, with this repo-local note preserving the project rationale. V1 should keep the workflow prompt-based instead of adding a new CLI command until dogfooding proves which prompts are stable enough to automate.

## [Non-Code Stranger Test](../project/non-code-stranger-test.md)

Source: `benjamin-docs/project/non-code-stranger-test.md` (updated 2026-06-04)

### Decisions

- Add a README section for non-programmers before package mechanics.
- Explain `benjamin-docs` as a local project notebook that an AI agent keeps inside the project folder.
- Make clear that the CLI does not upload or publish anything.
- Add first prompts a non-code user can ask an agent.
- Update CLI `introduce` and `help` text to explain the workflow before listing commands.
- Update generated `next` prompts to ask for plain language and non-technical readability where appropriate.
- Promote chat-to-project as the first non-code workflow: the user may have only a chat, not an existing project folder.
- Include a simple top-level `README.md` in projects created from chat.
- Use `~/Documents/Benjamin Docs/<Project Name>` as the default chat-created project location, preserving human-readable folder names such as `Atelier Edits`.
- Avoid agent-specific or dated folders unless the user asks for them.
