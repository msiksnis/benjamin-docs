---
title: Open Questions
scope: project
scope_id: project
audience: [developer, designer, business, agent]
status: draft
visibility: private
updated: 2026-06-04
source: session-capture
---

# Open Questions

## Public Readiness

- When should the package stop being `private` and become publishable to npm?
- Should the first public npm version be `0.1.0`, or should the repo stay source-only until the install story is cleaner?
- Should the README document a global CLI workaround while unpublished, or avoid it because it is local-environment-specific?
- Should `validate` report unmanaged legacy Markdown files as skipped, or stay quiet unless there is a path/symlink safety issue?

## Skill Distribution

- What is the cleanest way to install the `benjamin-docs` skill for Codex users?
- Should the repo include install instructions for Claude skills too, or keep V1 focused on Codex until the format is verified?
- Should skill installation eventually be automated by the CLI?

## CLI Scope

- Should V1 add `doctor` for local setup checks before publishing?
- Should release and handoff scopes get first-class create commands, or should V1 keep those as starter docs only?

## Dogfooding

- `pup-base` should be used as the first real baseline-capture test.
- At least one planning-only project should be tested before publishing, so the tool is not biased toward existing codebases only.
