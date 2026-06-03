# Agent Docs V1 Design

## Metadata

- Date: 2026-06-03
- Project: agent-docs
- Status: Approved design draft
- Scope: New standalone repo

## Problem Statement

Long-running project conversations produce important decisions, plans, tradeoffs,
and handoff context, but that context often stays trapped in chat. It becomes
hard for humans, developers, designers, and future AI agents to understand what
was decided, what remains open, and how a project should continue.

This is painful before code exists, while code is being built, and when a single
feature or version needs to be handed off. Existing documentation tools focus on
publishing or static docs, but they do not give AI agents a durable repo-local
contract for turning planning and build sessions into structured project memory.

## Product Shape

`agent-docs` is an open-source repo-local documentation system for humans and
AI agents. V1 is a small npm CLI package plus Codex/Claude skills.

The product should work in three situations:

1. Before code exists, as a planning and documentation tool for an idea,
   business, product, app, or future feature.
2. Inside an existing codebase, initialized at any time to document current
   architecture, decisions, feature plans, handoffs, and releases.
3. For one scoped feature, module, redesign, experiment, or v2 plan without
   requiring the whole project to be documented.

Planning mode and codebase mode are capabilities, not rigid project types. A
project can begin as planning-only and later be promoted into a code-connected
project.

The SaaS product is intentionally deferred. V1 creates the portable repo-local
source format that a later SaaS can publish with access control, branded
portals, comments, non-technical editing, and cross-project dashboards.

## Target Users

- A founder or non-technical user planning an app, business, or product with an
  AI agent before code exists.
- A developer using an AI coding agent who needs durable project memory across
  sessions and features.
- A designer receiving a concise brief from planning conversations.
- A friend, advisor, or stakeholder reviewing the project direction.
- A future AI agent that needs a dense context pack instead of a raw chat log.

## V1 Goals

- Create a repo-local `docs/` and `.agent-docs/` structure.
- Support project, feature, release, and handoff scopes.
- Support planning-only projects and existing codebases.
- Capture current agent sessions into structured Markdown docs.
- Keep human-readable Markdown as the source of truth.
- Use machine metadata only for validation, indexing, export, and future SaaS
  sync.
- Export audience-specific local bundles for developers, designers, agents,
  business readers, and public summaries.
- Validate required files, frontmatter, broken relative links, missing scopes,
  and stale code anchors.

## V1 Non-Goals

- Hosted SaaS.
- Authentication or access control.
- Browser editor.
- Comments and suggestion workflows.
- GitHub App integration.
- Automatic reading of Codex/Claude chat by the CLI without an agent skill.
- Full static docs website generation.
- Wrapping `create-next-app` or other project generators.
- Deep automatic code understanding.

## Repo Structure

For the `agent-docs` project repo itself:

```text
agent-docs/
  docs/
    project/
      brief.md
      roadmap.md
      open-questions.md
    features/
      <feature-slug>/
        brief.md
        plan.md
        decisions.md
        handoff.md
    design/
      designer-brief.md
      flows.md
    engineering/
      architecture.md
      code-map.md
      decisions/
    business/
      positioning.md
      funding-brief.md
    users/
      manual.md
      faq.md
    handoff/
      human-brief.md
      agent-brief.md
    releases/
      changelog.md

  .agent-docs/
    config.json
    manifest.json
    anchors.json
    scopes.json
```

When initialized inside another project, the CLI creates only:

```text
docs/
.agent-docs/
```

It does not nest an `agent-docs/` folder inside the target project.

## Markdown Frontmatter

Docs use lightweight frontmatter so the CLI, agent skills, and future SaaS can
understand scope and audience without making docs hard to read.

```yaml
title: Booking Capacity Plan
scope: feature
scope_id: booking-capacity
audience: [developer, designer, agent]
status: draft
visibility: private
updated: 2026-06-03
source: session-capture
```

Core fields:

- `title`: human-readable document title.
- `scope`: `project`, `feature`, `release`, or `handoff`.
- `scope_id`: stable identifier for the scope.
- `audience`: one or more of `developer`, `designer`, `agent`, `business`,
  `public`, `user`, or `advisor`.
- `status`: `draft`, `review`, `approved`, `stale`, or `archived`.
- `visibility`: `private`, `unlisted`, or `public`.
- `updated`: ISO date.
- `source`: `session-capture`, `manual`, `codebase-scan`, or `release-sync`.

## Machine Metadata

`.agent-docs/manifest.json` tracks generated docs and known scopes.

`.agent-docs/scopes.json` tracks project-level and feature-level scope records.

`.agent-docs/anchors.json` tracks optional links between docs and code:

```json
{
  "booking-capacity-rules": {
    "file": "src/features/booking/capacity.ts",
    "docs": ["docs/features/booking-capacity/decisions.md"]
  }
}
```

Anchors are optional in planning-only projects and become useful after code
exists.

## CLI Responsibilities

The CLI owns deterministic structure and integrity.

Initial command surface:

```bash
npx agent-docs init
npx agent-docs status
npx agent-docs validate
npx agent-docs scope create feature booking-capacity
npx agent-docs export --audience developer
npx agent-docs export --audience designer
npx agent-docs export --audience agent
npx agent-docs promote --to codebase
npx agent-docs anchor add booking-capacity-rules src/...
```

The CLI should:

- Create folders, starter docs, and metadata files.
- Create project, feature, release, and handoff scopes.
- Rebuild indexes and manifests.
- Validate frontmatter, broken links, missing files, duplicate scope IDs, and
  stale anchors.
- Export audience-specific local Markdown bundles.
- Avoid doing judgment-heavy project synthesis.

## Skill Responsibilities

The Codex/Claude skill owns synthesis from conversations and code work.

The skill should:

- See the current conversation context.
- Decide whether the capture is project, feature, release, or handoff scoped.
- Synthesize durable decisions instead of dumping raw transcripts.
- Write or update the correct Markdown files.
- Preserve rejected options and open questions when they matter.
- Produce audience-specific briefs.
- Run `agent-docs validate` after edits.
- Report what changed and what remains unresolved.

Initial capture intents:

```text
capture idea
capture mvp
capture feature <slug>
capture handoff
capture developer-brief
capture designer-brief
capture agent-brief
```

Future capture intents:

```text
capture release
capture ADR
capture user-manual
capture funding-brief
publish preview
sync to SaaS
```

## Core Workflows

### Planning-Only Project

1. User starts with an idea in Codex or Claude.
2. User asks the skill to capture the conversation.
3. Skill initializes `agent-docs` if needed.
4. Skill writes project brief, MVP plan, open questions, human handoff, and
   agent handoff.
5. CLI validates structure.
6. User can commit and push the docs repo.

### Existing Codebase

1. User runs `npx agent-docs init` inside an existing project.
2. Skill captures current project state or a current feature conversation.
3. CLI creates or updates scopes and validates docs.
4. Optional code anchors link docs to files.
5. Future agents use `docs/handoff/agent-brief.md` and related docs before
   changing code.

### Feature Scope

1. User starts planning or building one feature.
2. Skill captures `docs/features/<feature-slug>/brief.md`, `plan.md`,
   `decisions.md`, and `handoff.md`.
3. If code exists, anchors can link the feature docs to components, routes,
   RPCs, migrations, or tests.

### Audience Export

1. User runs an export command.
2. CLI filters docs by `audience` frontmatter.
3. CLI writes local export bundles such as:

```text
exports/developer/
exports/designer/
exports/agent/
exports/business/
```

These exports are local V1 artifacts. The later SaaS can provide hosted access,
auth, branding, comments, and editing.

## Agent Brief

`docs/handoff/agent-brief.md` is a first-class V1 artifact.

It should contain:

- What the project is.
- Current status.
- Durable decisions.
- Constraints.
- Open questions.
- What not to change.
- Important docs.
- Important files when code exists.
- Recommended next actions.

This document is optimized for future AI agents, not casual human reading.

## Validation Rules

V1 validation should check:

- Required docs exist for initialized scopes.
- Frontmatter parses and uses known values.
- Relative Markdown links resolve.
- Scope IDs are unique.
- Referenced docs in metadata exist.
- Code anchor files exist when anchors are enabled.
- Export bundles can be generated without missing required docs.

Validation should warn rather than fail for optional docs in early planning
projects.

## Future SaaS Path

The SaaS should read the same repo-local source format.

Potential paid features:

- Public, private, and unlisted hosted docs portals.
- Auth and team permissions.
- Branded publishing.
- Comments, suggestions, and review workflows.
- Non-technical editing UI.
- GitHub sync.
- Cross-project dashboards.
- Search and analytics.
- Version history.
- Shareable designer, developer, advisor, public, and agent views.

The open-source repo tool should remain valuable without the SaaS.

## First Test Plan

The first real test should use this conversation as the source context.

Expected output:

```text
docs/project/brief.md
docs/project/roadmap.md
docs/features/session-capture/plan.md
docs/handoff/human-brief.md
docs/handoff/agent-brief.md
```

Then test the same package in:

- PupBase.
- One planning-only project.
- One other fresh or existing project.

The goal is to improve the format through real use before building the SaaS.

## V1 Acceptance Criteria

V1 is successful when:

- A user can initialize `agent-docs` in an empty planning repo.
- A user can initialize `agent-docs` inside an existing code repo without
  nesting the project or disturbing existing files outside `docs/` and
  `.agent-docs/`.
- A feature scope can be created and documented independently of the whole
  project.
- An agent skill can capture the current conversation into project, feature,
  human handoff, and agent handoff docs.
- The CLI can validate the generated docs and report actionable issues.
- The CLI can export at least developer, designer, and agent bundles.
- A future agent can read `docs/handoff/agent-brief.md` and understand the
  current project direction without needing the full chat transcript.
- The repo-local format is clear enough that a later SaaS can ingest it without
  changing the source docs.

## Open Questions

- Should the package name be `agent-docs`, `project-memory`, or something more
  distinctive?
- Should generated export bundles be committed by default, or treated as build
  artifacts?
- Should planning projects require Git from the start, or allow a plain folder?
- How much code-aware validation should V1 attempt before it becomes too heavy?
- Should Codex and Claude skills share one instruction file or have separate
  host-specific wrappers?
