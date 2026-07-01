---
title: Risk Register
scope: project
scope_id: project
audience: [developer, business, agent]
status: draft
visibility: private
updated: 2026-07-01
source: manual
---

# Risk Register

Derived from risk, hazard, assumption, and open-question sections across managed Benjamin docs.

## [Agent Reliability Handoff](../features/agent-reliability/handoff.md)

Source: `benjamin-docs/features/agent-reliability/handoff.md` (updated 2026-07-01)

### Risks / Open Questions

- Verification quality still depends on the agent actually checking the implementation before running the command.
- The command records a single evidence line for now. Future work may need richer structured verification history.
- This should remain an advanced/agent workflow; humans should usually just run `bd export` or ask the agent for an export.
- The daycare export scenario worktree is useful as a test fixture but should not become the normal artifact location pattern.
- The environment/tooling detector is pattern-based and depends on agents recording blockers plainly in source docs.
- Release automation depends on npm and GitHub CLI credentials in local maintainer flows; the tag-push GitHub Action is the backup path.
- Public copy can drift back toward "docs helper" language if future edits over-focus on Markdown structure or chat-to-project mechanics. Keep the first screen anchored on project memory, living knowledge, continuity, and the agent-updated workflow.
