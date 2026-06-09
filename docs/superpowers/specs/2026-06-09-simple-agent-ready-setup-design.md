---
title: Benjamin Docs 0.3.0 Simple Agent-Ready Setup Design
scope: project
scope_id: project
audience: [developer, agent]
status: draft
visibility: private
updated: 2026-06-09
source: session-capture
---

# Benjamin Docs 0.3.0 Simple Agent-Ready Setup Design

## Decision

Benjamin Docs 0.3.0 should make project memory operational for future AI agents while keeping the public product surface small.

The release theme is:

```text
Simple Agent-Ready Setup
```

The core promise:

```text
Benjamin Docs keeps project memory local and readable, then helps a future agent enter the project, find that memory, follow the local working contract, and leave the project better documented than it found it.
```

0.3.0 should not become a DOX clone or a broad agent framework. It should absorb the strongest DOX-inspired idea: local agent operating contracts that are close to the project and kept current.

## Product Shape

The main user-facing command surface should be:

```bash
benjamin-docs init
benjamin-docs ready
benjamin-docs help
```

Power-user and agent-support commands may continue to exist, but they should be discoverable through a command drawer rather than presented as the primary path:

```bash
benjamin-docs commands
```

The package may also expose a short alias:

```bash
bd init
bd ready
bd commands
```

The full `benjamin-docs` binary remains the canonical brand and documentation path. `bd` is only a convenience alias.

## What Stays True From The Original Idea

Benjamin Docs is still first a local project-memory tool.

It must continue to work for:

- turning a chat into a new local project
- planning a project before code exists
- documenting a newly created app or an existing codebase
- planning or documenting one feature, change, redesign, or release-adjacent effort
- creating handoff notes for future humans and AI agents

The chat-to-project workflow remains skill-owned because the CLI cannot see the chat. The bundled skill should keep asking before creating files, suggest `~/Documents/Benjamin Docs/<Project Name>` for chat-only projects, create the folder, run `benjamin-docs init`, and synthesize the chat into Benjamin-managed docs.

## Guided Init

`benjamin-docs init` is the front door.

When run interactively, it should ask what the user is setting up. Final wording can be polished later, but the choices should cover:

```text
1. A new project or idea
2. A codebase or app
3. One feature, change, or plan
```

These map to existing internal concepts:

- new project or idea: planning/project mode
- codebase or app: codebase mode
- one feature, change, or plan: feature mode

The naming should avoid implying that codebase mode is only for old or already-documented code. A user may run Benjamin Docs immediately after creating a new app repo.

For codebase/app and feature/change flows, `init` should offer agent-ready setup:

```text
Add AI agent guidance for this project? Recommended.
```

If accepted, Benjamin Docs sets up or updates repo-local agent guidance through careful AGENTS.md stewardship.

Non-interactive flags should remain for agents, scripts, and docs:

```bash
benjamin-docs init --mode planning
benjamin-docs init --mode codebase
benjamin-docs init --mode feature --feature billing-reminders
benjamin-docs init --agent-contract
benjamin-docs init --agent-contract --children
```

Exact flag names can change during implementation if a clearer shape emerges, but the concept should stay inside `init` rather than becoming a new top-level `agents` command family.

## Agent Contracts

Agent Contracts are repo-local operating guidance for future AI agents.

In 0.3.0, the root `AGENTS.md` is the core agent-contract artifact. Optional child `AGENTS.md` files may be created for durable boundaries, but child generation should be explicit and conservative.

The root contract should tell agents:

- where `.benjamin-docs/config.json` lives
- which configured docs root contains Benjamin-managed project memory
- which Benjamin docs to read first
- how to choose between planning, codebase, feature, handoff, and release scopes
- when durable knowledge should be captured in Benjamin docs
- that raw transcript dumps are not acceptable unless explicitly requested
- that the agent should preserve user intent while challenging weak assumptions
- which closeout checks matter before claiming work is ready

Agent Contracts do not replace Benjamin docs. They connect agents to the docs and define how to work with them.

## AGENTS.md Stewardship

Benjamin Docs must never blindly overwrite an existing `AGENTS.md`.

Rules:

- If no root `AGENTS.md` exists, `init` may create one.
- If a clearly Benjamin-generated section exists, `init` may update only that section.
- If a user-authored or complex `AGENTS.md` exists, Benjamin Docs must preserve it.
- If safe, Benjamin Docs may add a marked section such as:

  ```html
  <!-- benjamin-docs:start -->
  ...
  <!-- benjamin-docs:end -->
  ```

- If the existing file is long, contradictory, stale, or overloaded, Benjamin Docs should suggest improvements instead of rewriting it.
- Suggested improvements may include adding a Benjamin section, splitting guidance into child `AGENTS.md` files, moving local rules closer to owning folders, or rewriting with explicit user approval.

The default behavior should be protective. Existing agent instructions are user-owned source material.

## Optional Child Contracts

Child contracts are useful when a folder has durable local rules, ownership, workflows, or quality standards.

0.3.0 may support explicit child generation:

```bash
benjamin-docs init --agent-contract --children
```

Possible generated child contracts include:

- `src/AGENTS.md`
- `test/AGENTS.md`
- `skills/AGENTS.md`
- `benjamin-docs/AGENTS.md`
- `.github/AGENTS.md`

Child generation should be conservative. Benjamin Docs should not pretend to deeply understand a repo from filenames alone. Generated child contracts should be short, editable, and clearly framed as starting points.

The root `AGENTS.md` may include a child index when child contracts exist.

## Ready Gate

`benjamin-docs ready` should remain the single high-level gate.

It should answer:

```text
Is this project memory ready for handoff to a future human or agent?
```

In 0.3.0, `ready` should continue to combine setup, validation, and docs-quality checks. It should also include agent-contract health when agent guidance exists or has been enabled.

Agent-contract health should stay deterministic:

- root `AGENTS.md` exists when expected
- Benjamin-managed section markers are balanced when used
- configured docs root referenced by the contract exists
- referenced child `AGENTS.md` files exist
- child index entries are not obviously stale
- checks do not require LLM judgment

Advanced commands such as `validate`, `review`, `doctor`, and future contract checks can remain available, but `ready` is the command users should remember.

## Command Drawer

`benjamin-docs commands` should expose the power-user drawer.

When run in a terminal, it may show an interactive list that supports arrow keys or number selection. When run outside a TTY, it should print a plain command list.

The command drawer can include:

- `init`
- `ready`
- `status`
- `next`
- `validate`
- `review`
- `doctor`
- `export`
- `install-skill`
- `package-skill`
- `scope`
- `anchor`
- `chat-project`

This keeps power available without making the main product feel large.

## Help

`benjamin-docs help` should stay simple and opinionated.

It should present:

- what Benjamin Docs does
- the three main commands
- the chat-to-project phrase for users working with an agent
- a pointer to `benjamin-docs commands` for the full command list

It should not list every advanced command inline.

## Non-Goals For 0.3.0

0.3.0 should not include:

- a new top-level `agents` command family as the primary UX
- deep automatic repo analysis
- LLM-generated contract rewrites without explicit user review
- hosted docs portals
- team collaboration features
- prompt memory or behavior include systems
- full Space Agent-style prompt evaluation harnesses
- automatic destructive rewrites of existing `AGENTS.md`

## Success Criteria

0.3.0 is successful when:

- a new user can understand the product through `init`, `ready`, and `help`
- a chat-only project can still be created through the bundled skill
- a newly created app repo can be initialized without awkward "existing codebase" wording
- agent-ready guidance can be added from the `init` flow
- existing `AGENTS.md` files are preserved by default
- `ready` reports whether docs and agent guidance are handoff-ready
- advanced commands are still available without dominating the main help text

## Open Design Details

These can be resolved during implementation planning:

- final wording for the three interactive `init` choices
- exact non-interactive flag names for enabling agent contracts
- whether `bd` should be shipped immediately or held until collision risk is checked
- exact shape of the interactive `commands` menu
- whether child contract generation should be included in the first 0.3.0 implementation or land after root-contract support
