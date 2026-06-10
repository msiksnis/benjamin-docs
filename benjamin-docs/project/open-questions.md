---
title: Open Questions
scope: project
scope_id: project
audience: [developer, designer, business, agent]
status: review
visibility: private
updated: 2026-06-10
source: session-capture
---

# Open Questions

## 0.4.0 Capture Quality

- How strict should deterministic `review` become before it feels like documentation busywork?
- Which continuation signals should be required for `codebase` mode but optional for planning-only projects with no code yet?
- Should feature scopes require validation/check sections before `bd ready` can pass?
- How should BD prove that a fresh agent can continue from docs without reading the original chat?

## Agent Guidance

- If a user requested agent guidance but an existing unmarked `AGENTS.md` was preserved, should `bd ready` fail or report a stronger warning?
- Should generated `AGENTS.md` remain short, or include a slightly stronger operating contract for scope choice, evidence, and closeout?

## Templates And Review

- Decision: keep `doctor --strict` as a setup/validation gate, and use `ready` as the higher-level gate that also fails on `review` warnings.
- Decision: do not add new primary commands for 0.4.0 unless dogfooding proves a repeated workflow cannot fit under `init`, `ready`, `help`, or `commands`.
- Should starter-template detection be centralized with template definitions to avoid drift?
- Should release and handoff scopes get first-class create commands later, or should BD keep those as starter docs only?

## Dogfooding

- BD now passes its own `bd ready` checks on the published 0.3.1 workflow.
- `/Users/marty/Important/atelier-beaute` was used as a disposable real-project test for 0.3.x.
- Which second real project should be the 0.4.0 dogfood target after `atelier-beaute`?
- Should dogfooding include a fresh-agent exercise that only sees `README.md`, `AGENTS.md`, `.benjamin-docs/`, and `benjamin-docs/`?
