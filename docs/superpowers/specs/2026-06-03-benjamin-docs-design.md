---
title: Benjamin Docs V1 Design
scope: project
scope_id: project
audience: [developer, agent]
status: approved
visibility: private
updated: 2026-06-03
source: manual
---

# Benjamin Docs V1 Design

## Metadata

- Date: 2026-06-03
- Project: benjamin-docs
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

`benjamin-docs` is an open-source repo-local documentation system for humans and
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

- Create a repo-local `docs/` and `.benjamin-docs/` structure.
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
- Use a conservative supply-chain baseline: pnpm, pinned package manager,
  committed lockfile, frozen installs, delayed new package versions, strict
  dependency build scripts, and zero runtime dependencies for the MVP CLI.

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

## Supply-Chain Security Baseline

V1 should use pnpm as the development package manager and publish as a normal
npm package when release work begins. The package should still be installable
from the npm registry, but repository development should avoid npm installs.

The MVP CLI should have zero runtime dependencies. Development dependencies
should be limited to TypeScript and Node types unless a later approved design
change justifies more.

Repository security defaults:

```json
{
  "packageManager": "pnpm@11.5.1"
}
```

```yaml
packages:
  - "."
minimumReleaseAge: 1440
minimumReleaseAgeStrict: true
strictDepBuilds: true
onlyBuiltDependencies: []
ignoredBuiltDependencies: []
```

Install and CI commands should use frozen installs:

```bash
pnpm install --frozen-lockfile
pnpm check
```

Publishing should eventually use trusted publishing/OIDC instead of long-lived
npm tokens, but npm publishing automation is outside V1 implementation scope.

## Repo Structure

For the `benjamin-docs` project repo itself:

```text
benjamin-docs/
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

  .benjamin-docs/
    config.json
    manifest.json
    anchors.json
    scopes.json
```

When initialized inside another project, the CLI creates only:

```text
docs/
.benjamin-docs/
```

It does not nest a `benjamin-docs/` folder inside the target project.

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

`.benjamin-docs/manifest.json` tracks generated docs and known scopes.

`.benjamin-docs/scopes.json` tracks project-level and feature-level scope records.

`.benjamin-docs/anchors.json` tracks optional links between docs and code:

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
node dist/src/cli.js --version
node dist/src/cli.js help
node dist/src/cli.js introduce
node dist/src/cli.js init
node dist/src/cli.js status
node dist/src/cli.js validate
node dist/src/cli.js scope create feature booking-capacity
node dist/src/cli.js export --audience developer
node dist/src/cli.js export --audience designer
node dist/src/cli.js export --audience agent
node dist/src/cli.js promote --to codebase
node dist/src/cli.js anchor add booking-capacity-rules src/...
```

After this repo's package is installed or linked locally into another project,
the equivalent command form is `pnpm exec benjamin-docs ...`. During MVP, keep
the package private until publishing is intentional.

The CLI should:

- Provide basic discoverability through version, help, and introductory
  commands.
- Create folders, starter docs, and metadata files.
- Create project, feature, release, and handoff scopes.
- Rebuild indexes and manifests.
- Validate frontmatter, broken links, missing files, duplicate scope IDs, and
  stale anchors.
- Export audience-specific local Markdown bundles.
- Avoid doing judgment-heavy project synthesis.

### CLI Discoverability

`benjamin-docs --version` should print the installed package version.

`benjamin-docs help` should list available commands, common workflows, and short
examples in plain language.

`benjamin-docs introduce` should explain what `benjamin-docs` is in simple,
non-technical language. It should be suitable for a founder, designer, advisor,
or other non-code user who has opened a terminal or agent workspace but does not
yet understand the tool. It should explain:

- `benjamin-docs` turns planning and build conversations into durable project
  memory.
- Docs live inside the project so they stay close to the work.
- The same docs can help humans, developers, designers, and future AI agents.
- Publishing and collaboration can come later, but the repo-local docs are the
  source of truth.

## Skill Responsibilities

The Codex/Claude skill owns synthesis from conversations and code work.

The skill should:

- See the current conversation context.
- Decide whether the capture is project, feature, release, or handoff scoped.
- Synthesize durable decisions instead of dumping raw transcripts.
- Write or update the correct Markdown files.
- Preserve rejected options and open questions when they matter.
- Produce audience-specific briefs.
- Run `benjamin-docs validate` after edits.
- Report what changed and what remains unresolved.
- Challenge weak plans, missing context, risky assumptions, and likely dead ends
  with clear reasoning and constructive alternatives.

### Skill Stance

The skill should not behave like a passive note taker. It should help the user
create better projects and better documentation.

When capturing or updating docs, the skill should preserve the user's intent
while also pointing out:

- Missing decisions.
- Contradictory goals.
- Overbuilt V1 scope.
- Weak audience or positioning assumptions.
- Technical or product risks that may matter later.
- Places where a designer, developer, advisor, or future agent would likely be
  confused.

This pushback should be direct but useful. The goal is not to argue with the
user or block progress. The goal is to improve the project record so it can be
trusted by future humans and agents.

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
3. Skill initializes `benjamin-docs` if needed.
4. Skill writes project brief, MVP plan, open questions, human handoff, and
   agent handoff.
5. CLI validates structure.
6. User can commit and push the docs repo.

### Existing Codebase

1. User runs `node dist/src/cli.js init` in this repo, or `pnpm exec
   benjamin-docs init` after a local install/link into another project.
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

- A user can initialize `benjamin-docs` in an empty planning repo.
- A user can initialize `benjamin-docs` inside an existing code repo without
  nesting the project or disturbing existing files outside `docs/` and
  `.benjamin-docs/`.
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
- The repo uses pnpm with a pinned package manager, committed lockfile,
  release-age delay, strict dependency build settings, and no runtime
  dependencies.

## Open Questions

- The package and CLI name is `benjamin-docs`.
- Should generated export bundles be committed by default, or treated as build
  artifacts?
- Should planning projects require Git from the start, or allow a plain folder?
- How much code-aware validation should V1 attempt before it becomes too heavy?
- Should Codex and Claude skills share one instruction file or have separate
  host-specific wrappers?
