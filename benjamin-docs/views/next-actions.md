---
title: Next Actions View
scope: project
scope_id: project
audience: [developer, business, agent]
status: draft
visibility: private
updated: 2026-07-09
source: manual
---

# Next Actions View

Derived from next-action and near-term work sections across managed Benjamin docs.

## [Agent Reliability Handoff](../features/agent-reliability/handoff.md)

Source: `benjamin-docs/features/agent-reliability/handoff.md` (updated 2026-07-09)

### Next Actions

- Continue grouped `bd ready` repair hints beyond environment/tooling blockers, especially stale views, watch coverage, missing paths, and setup repair prompts.
- Add a guided freshness repair path for agents.
- Add lifecycle closeout polish for shipped or abandoned scopes.
- Run the fresh-agent continuation dogfood exercise.
- After the next publish, run a fresh first-contact dogfood read of GitHub and npm; passing means the reader describes BD as persistent project memory or living project knowledge for AI coding agents, not a generic docs generator.

## [Drift And Session Hooks Handoff](../features/drift-and-session-hooks/handoff.md)

Source: `benjamin-docs/features/drift-and-session-hooks/handoff.md` (updated 2026-07-09)

### Next Actions

- Publish 0.10.0 following `benjamin-docs/releases/npm-publish-checklist.md` (npm publish, then `pnpm run release:github`, then `pnpm run release:verify-public`).
- Start the MCP server release (`bd mcp`): stdio server exposing memory read/search/write tools via `@modelcontextprotocol/sdk`, with writes validated by the existing `validate.ts` logic.

## [Roadmap](../project/roadmap.md)

Source: `benjamin-docs/project/roadmap.md` (updated 2026-07-09)

### Immediate Next Work

- Keep the CLI command surface stable. `bd export` is the only new human-facing command promoted for the customer-handoff workflow; keep detailed export flags in advanced/agent guidance.
- Treat the next product arc as agent reliability, not more user workflow. Humans should know only a few obvious commands while agents handle refresh, changed-work review, readiness repair, export verification, scope lifecycle, and customer-safe export preparation.
- Keep private commercial strategy, pricing, and future paid SaaS planning out of tracked public-repo docs unless the user explicitly says the content is public-safe; use ignored local folders for private planning notes.
- Polish the 0.4.x simple path so `bd init` is enough in normal codebase use.
- Dogfood 0.4.x on more real projects and record where the skill produces weak, vague, or overconfident docs.
- Implement 0.5.0 as a continuation-quality milestone: prove that a future human or agent can continue from the docs without the original chat.
- Keep the public README, npm description, package keywords, CLI intro text, and bundled skill aligned around persistent project memory, living project knowledge, agent-maintained docs, and focused export packages.
- Treat the interactive `commands` drawer as the place for advanced workflows, not as a reason to promote more commands.
- Make the visible project-memory refresh flow `bd init`, `bd views`, then `bd ready`, while keeping `views` out of the primary command list until dogfooding proves it should graduate.
- Publish `0.10.0`, then run the release guardrails so npm, the git tag, and GitHub Release match.
- Dogfood drift detection and session hooks on real projects; watch for stop-nudge nagging and hook PATH issues.
- Implement the next release as an MCP server arc (`bd mcp`): stdio server exposing memory read/search/write tools via the official `@modelcontextprotocol/sdk`, with writes validated by the existing validation logic. Owner-approved staged plan from the 2026-07-09 session.
