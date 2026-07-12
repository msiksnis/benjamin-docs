# AGENTS

<!-- benjamin-docs:start -->
## Benjamin Docs Project Memory

- Project memory lives in `benjamin-docs/`.
- Machine metadata lives in `.benjamin-docs/config.json` and sibling files.
- Start with `benjamin-docs/project/agent-context.md` only when it is relevant; do not read the memory tree by default.
- Use task-scoped retrieval: open only documents that answer the current task, then verify against code where possible.
- Update memory only when a durable fact, constraint, decision, workflow, or active continuation state changed. Routine localized work needs no Benjamin edit.
- Keep active memory current and compact. Archive completed feature scopes; remove resolved next actions and superseded status instead of preserving narration.
- Use `benjamin-docs review --changed`, `drift`, `views`, or `ready` at handoff, release, or explicit memory-maintenance boundaries—not as routine-task ceremony.
- Benjamin Docs bookkeeping must never delay or replace the substantive user-facing answer.

### Child Agent Contract Index

- `benjamin-docs/AGENTS.md`
<!-- benjamin-docs:end -->
