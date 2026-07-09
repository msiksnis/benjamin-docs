---
title: Open Questions View
scope: project
scope_id: project
audience: [developer, designer, business, agent]
status: draft
visibility: private
updated: 2026-07-09
source: manual
---

# Open Questions View

What unresolved questions and open risks are captured across managed Benjamin docs?

## [Agent Reliability Handoff](../features/agent-reliability/handoff.md)

Source: `benjamin-docs/features/agent-reliability/handoff.md` (updated 2026-07-09)

### Risks / Open Questions

- Verification quality still depends on the agent actually checking the implementation before running the command.
- The command records a single evidence line for now. Future work may need richer structured verification history.
- This should remain an advanced/agent workflow; humans should usually just run `bd export` or ask the agent for an export.
- The daycare export scenario worktree is useful as a test fixture but should not become the normal artifact location pattern.
- The environment/tooling detector is pattern-based and depends on agents recording blockers plainly in source docs.
- Release automation depends on npm and GitHub CLI credentials in local maintainer flows; the tag-push GitHub Action is the backup path.
- Public copy can drift back toward "docs helper" language if future edits over-focus on Markdown structure or chat-to-project mechanics. Keep the first screen anchored on project memory, living knowledge, continuity, and the agent-updated workflow.
- Hook integrations that omit a session/conversation ID fall back to project-and-format state, so only ID-bearing integrations have full concurrent-session isolation.

2026-07-09 (later): the memory-interface slice also moved out: the MCP Memory Server scope (`benjamin-docs/features/mcp-memory-server/`) gives agents validated write tools, which advances this arc's reliability goal — agents can no longer corrupt frontmatter or structure through hand edits when they write via MCP.

2026-07-09: the automation slice of this arc shipped separately as the Drift And Session Hooks scope (`benjamin-docs/features/drift-and-session-hooks/`). Drift detection and session hooks now enforce the read-and-update loop mechanically, which removes the biggest reliability dependency on agent discipline.
