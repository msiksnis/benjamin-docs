---
title: Guided Export Workflow Design
scope: project
scope_id: guided-export-workflow
audience: [developer, agent]
status: approved
visibility: private
updated: 2026-06-19
source: manual
---

# Guided Export Workflow Design

## Problem

Benjamin Docs can already preserve project and feature memory, and the existing
`export --audience` command can copy audience-filtered Markdown bundles. That is
useful for agents and scripts, but it is not yet a strong human workflow for
creating concise deliverables such as feature docs, app docs, customer handoffs,
or developer handoffs.

The next version should make exports task-based. A normal person should only
need to know one command:

```bash
bd export
```

Advanced flags can still exist for agents, automation, and scripts, but they
should be explained in deeper help and agent guidance rather than taught as the
primary user experience.

## Goals

- Make `bd export` an interactive guided menu in real terminals.
- Let humans choose export type and feature from lists instead of memorizing
  slugs or flags.
- Keep direct advanced commands available for agents and automation.
- Generate concise Markdown deliverables, not raw copies of internal docs.
- Add deterministic export-readiness checks before customer-facing output.
- Give precise next agent prompts when export is blocked or weak.
- Avoid leaking internal or private docs into customer-facing exports.
- Keep Markdown as the only required output format for this version.

## Non-Goals

- PDF rendering.
- Hosted publishing.
- Static site generation.
- Automatic deep code understanding inside the CLI.
- Creating or planning new feature scopes during export.
- Promoting many export flags as customer-facing commands.

## Product Principle

Flags are an API. `bd export` is the UX.

The human-facing flow stays small:

```bash
bd export
```

The advanced/agent surface can include direct commands such as:

```bash
bd export --feature owner-delete --profile customer
bd export --app --profile owner
bd export --handoff customer
```

Those direct commands should be documented in `bd commands`, advanced help, and
the bundled skill. They should not become the main README path for ordinary
users.

## Export Types

The first guided menu should offer:

1. Full app documentation
2. Feature documentation
3. Customer handoff
4. Developer handoff
5. Project summary

Feature documentation should then list known feature scopes from
`.benjamin-docs/scopes.json`. The user should be able to pick from the list
without typing the slug.

## Export Profiles

Export profiles describe the intended reader and allowed content:

- `customer`: short user-facing docs; no implementation notes or internal risks.
- `owner`: business/admin handoff; includes responsibilities, limitations, and
  operational notes in safe language.
- `developer`: technical continuation; implementation notes and code references
  are allowed.
- `agent`: future-agent continuation; commands, risks, source docs, and file
  references are allowed.
- `public`: marketing-safe or open-source-safe summary.

The first implementation should support at least `customer` and `developer` for
feature exports. Other profiles can be listed as future-compatible concepts
without requiring all renderers immediately.

## Feature Export Shape

A customer feature export should be concise and skimmable:

```markdown
# Owner Delete Flow

## What It Is

## When To Use It

## How To Use It

## What Happens

## Known Limits

## Support Notes
```

A developer feature export may include source docs, implementation notes,
checks, risks, and code anchors where available.

## Full App Documentation Shape

Full app documentation should be an owner/operator manual rather than a dump of
every internal doc:

```markdown
# App Documentation

## What This App Does

## Main Areas

## User Roles

## Core Workflows

## Admin Tasks

## Data And Records

## Known Limits

## Support Notes
```

Each feature should receive a short summary. Detailed feature docs can be
exported separately.

## Customer Handoff Shape

Customer handoff is delivery-oriented:

```markdown
# Customer Handoff

## Delivered

## How To Start Using It

## Important Workflows

## Admin Responsibilities

## Known Limitations

## Maintenance Notes

## Open Decisions
```

This document may mention limitations and future work, but only in
customer-safe language.

## Feature Matching

Direct advanced commands should search both slugs and titles.

If the requested feature has a close match, the CLI should not auto-export it.
It should suggest the match:

```text
Feature "owener-delete" was not found.

Did you mean "owner-delete"?

Run:
  bd export --feature owner-delete
```

Interactive mode can show a numbered list of close matches and let the user
choose. If there is no reasonable match, the CLI should explain that the feature
does not exist yet and provide an agent prompt:

```text
Feature "staff-payroll" does not exist in Benjamin Docs yet.

Next prompt:
  Create a Benjamin Docs feature scope for staff-payroll, plan the feature,
  and make it export-ready for concise customer documentation.
```

The export command should not create or plan the feature itself.

## Export Readiness

Before generating customer-facing exports, the CLI should run deterministic
readiness checks. It should report one of:

- `ready`
- `ready with warnings`
- `blocked`

Checks for feature customer exports should include:

- Feature scope exists and is not archived unless explicitly included.
- Expected feature docs exist.
- Feature docs contain enough customer-facing content to explain what the
  feature is and how to use it.
- Private/internal-only docs are not used directly for customer output.
- Source docs do not contain obvious leak-risk terms in customer-visible
  sections, such as internal-only instructions, raw TODOs, secret/env language,
  or agent-only notes.
- Source docs have a current status that is appropriate for customer export.

When blocked, the CLI should print a precise next agent prompt.

## Implementation Verification

Customer-facing exports should be implementation-verified, not only
documentation-derived.

The CLI should not attempt deep semantic code verification itself. Instead, when
a customer-facing export is requested and no verification marker exists, it
should warn or block with an agent prompt:

```text
Customer-facing feature export should be verified against implementation first.

Next prompt:
  Verify the owner-delete feature implementation against its Benjamin Docs.
  Check whether the documented behavior, limitations, roles, UI flow, and edge
  cases match the actual code. If anything is stale or missing, update the docs
  before export.
```

The agent should compare docs to implementation, update docs if needed, and
record the verification in the relevant feature handoff or metadata. The exact
verification marker can be simple in the first version, such as a required
phrase or section in the feature handoff.

## Output Location

Generated files should live under `exports/` and be treated as disposable build
artifacts. Source docs under `benjamin-docs/` remain the maintained truth.

Suggested paths:

```text
exports/features/<feature-slug>-customer.md
exports/features/<feature-slug>-developer.md
exports/app/customer.md
exports/handoff/customer.md
exports/summary/project.md
```

Direct mode can replace existing generated export files and print the path. In
interactive mode, replacing can be explicit if the file already exists.

## Traceability

Every generated export should include machine-readable source metadata in
frontmatter or a final internal metadata block:

```yaml
export_type: feature
export_profile: customer
source_scope: owner-delete
source_docs:
  - benjamin-docs/features/owner-delete/brief.md
  - benjamin-docs/features/owner-delete/handoff.md
exported_at: 2026-06-19
implementation_verified: false
```

For customer-facing Markdown, the visible prose should stay clean. Traceability
exists for future agents, future export comparisons, and later SaaS publishing.

## Future Extensions

- PDF rendering from the generated Markdown.
- Screenshot-aware exports.
- Last-export metadata and "changed since last export" warnings.
- Hosted publishing with private, unlisted, or public access.
- Branded customer portals.
- Comments and review workflows.
