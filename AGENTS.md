# AGENTS

<!-- benjamin-docs:start -->
## Benjamin Docs Project Memory

- Project memory lives in `benjamin-docs/`.
- Machine metadata lives in `.benjamin-docs/config.json` and sibling files.
- Before project or code changes, read the most relevant Benjamin docs first:
  - `benjamin-docs/project/brief.md`
  - `benjamin-docs/project/roadmap.md`
  - `benjamin-docs/project/open-questions.md`
  - `benjamin-docs/handoff/agent-brief.md`
- Update Benjamin docs when durable decisions, workflows, architecture, risks, or handoff context change.
- Use feature docs for distinct features or changes; use handoff docs for continuation context.
- After code, config, schema, test, workflow, or product behavior changes, review docs impact before final response.
- Feature docs are not enough when project-level memory becomes stale; update roadmap, architecture, code map, changelog, or handoff docs when those facts change.
- When a feature ships or is abandoned, run `benjamin-docs scope status <slug> archived` so derived views stay current.
- Prefer concrete evidence: code paths, commands, decisions, risks, and next actions.
- Do not dump raw transcripts unless the user explicitly asks for an archive.
- Preserve the user's intent, but call out weak assumptions, contradictions, and useful alternatives.
- Run `benjamin-docs drift` to see docs whose watched code changed after the doc last changed; re-verify and update them.
- Before claiming handoff readiness, run `benjamin-docs review --changed` when git history is available, then `benjamin-docs ready`.

### Child Agent Contract Index

- `benjamin-docs/AGENTS.md`
<!-- benjamin-docs:end -->
