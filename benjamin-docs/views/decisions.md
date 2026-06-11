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

## [Agent-Ready Project Memory Decisions](../features/agent-ready-project-memory/decisions.md)

Source: `benjamin-docs/features/agent-ready-project-memory/decisions.md`

### Decisions

- 0.4.0 will focus on agent-ready project memory, not on adding more primary CLI commands.
- The primary user-facing command set remains `init`, `ready`, and `help`.
- `bd commands` remains the advanced command drawer.
- The skill owns messy-context synthesis. The CLI owns deterministic scaffolding, validation, review, readiness, packaging, and exports.
- `bd ready` remains the completion gate.
- Generated docs should optimize for continuation quality: a future agent should know what this is, where to look, what matters, what is risky, and what to do next.
- Existing `AGENTS.md` files remain user-owned. Benjamin Docs may add or update Benjamin-owned sections only, unless the user explicitly approves broader rewrites.
- Deterministic review should catch obvious weak docs, not attempt full semantic judgment.
- After dogfooding, `bd init` in obvious non-interactive codebases should default to codebase memory with agent guidance. The simple human command stays the main path; flags are for automation and opt-out.
- `bd anchor list` is acceptable as an advanced drawer command because it completes the existing anchor workflow without expanding the primary command surface.

## [Agent-Ready Project Memory Decisions](../features/agent-ready-project-memory/decisions.md)

Source: `benjamin-docs/features/agent-ready-project-memory/decisions.md`

### Rejected Options

- Add more top-level commands for 0.4.0.
  - Reason: the user explicitly wants Benjamin Docs to stay simple.
- Make `review` depend on an LLM.
  - Reason: V1/V0.x should stay local, deterministic, and dependency-light.
- Treat raw chat transcript as project memory.
  - Reason: transcripts are too noisy for future agents and humans.
- Automatically rewrite complex `AGENTS.md`.
  - Reason: agent instructions are user-owned operational policy.
- Require normal users to learn `--mode codebase --agent-contract --children`.
  - Reason: those flags are useful for scripts and tests, but the product promise is that `bd init` should be enough.

## [Agent-Ready Project Memory Decisions](../features/agent-ready-project-memory/decisions.md)

Source: `benjamin-docs/features/agent-ready-project-memory/decisions.md`

### Open Decisions

- How strict should deterministic continuation checks be before they become annoying?
- Should a fixture-based dogfood harness live under `test/fixtures`, `docs/`, or `benjamin-docs/features/agent-ready-project-memory/`?
- Should future versions expose anchor docs links in `anchor add`, or keep anchors as file-only shortcuts for now?

## [Memory Views Decisions](../features/memory-views/decisions.md)

Source: `benjamin-docs/features/memory-views/decisions.md`

### Decisions

- Add `bd views` as a direct command so agents, scripts, and CI can run it deterministically.
- Keep `bd views` in the advanced command drawer instead of promoting it to the main command list.
- Generate Markdown files under `benjamin-docs/views/` so humans can read them and Git can diff them.
- Treat generated views as derived lenses. The source of truth remains the project, handoff, engineering, feature, and release docs.
- Register generated view files in the manifest so validation catches broken frontmatter and links.
- Make the normal refresh sequence explicit as `bd init`, `bd views`, then `bd ready`.
- Keep that sequence as guidance, not automatic `init` behavior. `init` creates source-of-truth docs and agent guidance; `views` generates derived docs only when the user or agent asks for them.

## [Memory Views Decisions](../features/memory-views/decisions.md)

Source: `benjamin-docs/features/memory-views/decisions.md`

### Rejected Options

- Do not make Memory Views drawer-only; automation should not depend on an interactive selector.
- Do not add a hosted dashboard or database backend for this feature.
- Do not promote `views` next to `init`, `ready`, and `help` until repeated real use proves it belongs there.
- Do not make `bd init` generate views automatically. Fresh starter docs do not yet have enough signal, and generated views should remain an explicit refresh step.

## [Agent Brief](../handoff/agent-brief.md)

Source: `benjamin-docs/handoff/agent-brief.md`

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
- 0.5.1 adds Memory Views as an advanced generated lens and documents the refresh flow as `bd init`, `bd views`, then `bd ready`.

## [Baseline Capture Guide](../project/baseline-capture.md)

Source: `benjamin-docs/project/baseline-capture.md`

### Current Decision

The baseline guide belongs in the README for public discoverability, with this repo-local note preserving the project rationale. V1 should keep the workflow prompt-based instead of adding a new CLI command until dogfooding proves which prompts are stable enough to automate.

## [Non-Code Stranger Test](../project/non-code-stranger-test.md)

Source: `benjamin-docs/project/non-code-stranger-test.md`

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
