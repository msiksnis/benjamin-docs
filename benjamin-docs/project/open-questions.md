---
title: Open Questions
scope: project
scope_id: project
audience: [developer, designer, business, agent]
status: draft
visibility: private
updated: 2026-06-06
source: session-capture
---

# Open Questions

## Public Readiness

- `benjamin-docs` is now public on npm. Should the README continue showing npm/npx fallback commands, or return to a stricter pnpm-first stance?
- Should `validate` report unmanaged legacy Markdown files as skipped, or stay quiet unless there is a path/symlink safety issue?

## Skill Distribution

- Should BD keep installing the same skill into shared, Codex, Claude Code, and Cursor folders, or should app-specific installers become explicit subcommands later?
- Should Claude Desktop upload docs stay in the README, or move into `package-skill` output only?
- What is the right plugin story for Codex and Claude once plugin formats settle?

## CLI Scope

- Decision: keep `doctor --strict` as a setup/validation gate, and use `ready` as the higher-level gate that also fails on `review` warnings.
- Should release and handoff scopes get first-class create commands, or should BD keep those as starter docs only?
- Should `review` eventually understand audience quality, stale dates, and missing code anchors, or stay a simple deterministic lint?

## Dogfooding

- BD now passes its own `validate`, `review`, and `doctor --strict` checks.
- `/Users/marty/Important/kit/benjamin` was tested non-destructively through a temp-copy `init --mode codebase` and baseline capture.
- The real `/Users/marty/Important/kit/benjamin` repo is now initialized with BD and passes `ready`.
- Which project should be the next real dogfood target after Benjamin?
