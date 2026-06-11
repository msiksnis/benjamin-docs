---
title: Next Actions View
scope: project
scope_id: project
audience: [developer, business, agent]
status: draft
visibility: private
updated: 2026-06-11
source: manual
---

# Next Actions View

Derived from next-action and near-term work sections across managed Benjamin docs.

## [Agent-Ready Project Memory Handoff](../features/agent-ready-project-memory/handoff.md)

Source: `benjamin-docs/features/agent-ready-project-memory/handoff.md`

### Immediate Next Actions

1. Decide whether to tackle the higher-risk agent guidance requested-but-preserved state.
2. Run a fresh-agent continuation test that only exposes `README.md`, `AGENTS.md`, `.benjamin-docs/`, and `benjamin-docs/`.
3. Run:
   ```bash
   pnpm check
   bd ready
   ```
4. Update this handoff with dogfooding results before publishing 0.4.0.

## [Memory Views Handoff](../features/memory-views/handoff.md)

Source: `benjamin-docs/features/memory-views/handoff.md`

### Next Actions

- Run the release gate and publish 0.5.1 if npm already has 0.5.0.
- Dogfood `bd views` on more existing Benjamin Docs projects.
- Watch whether users expect a feature-board view; add it only if it proves useful.
- Consider whether generated docs should eventually use a dedicated source value such as `generated`.

## [Roadmap](../project/roadmap.md)

Source: `benjamin-docs/project/roadmap.md`

### Immediate Next Work

- Keep the CLI command surface stable. Do not add more top-level commands unless a repeated real workflow proves the need.
- Polish the 0.4.x simple path so `bd init` is enough in normal codebase use.
- Dogfood 0.4.x on more real projects and record where the skill produces weak, vague, or overconfident docs.
- Implement 0.5.0 as a continuation-quality milestone: prove that a future human or agent can continue from the docs without the original chat.
- Keep the public README short, direct, and non-enterprise.
- Treat the interactive `commands` drawer as the place for advanced workflows, not as a reason to promote more commands.
- Make the visible project-memory refresh flow `bd init`, `bd views`, then `bd ready`, while keeping `views` out of the primary command list until dogfooding proves it should graduate.
