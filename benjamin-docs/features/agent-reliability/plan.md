---
title: Agent Reliability Plan
scope: feature
scope_id: agent-reliability
audience: [developer, agent]
status: review
visibility: private
updated: 2026-06-25
source: manual
freshness: status
---

# Agent Reliability Plan

This plan turns the user's product direction into small agent-led improvements. The human path remains `bd init`, `bd ready`, `bd export`, and `bd help`; deeper work belongs in advanced commands, generated guidance, and the bundled skill.

## Steps

1. Add an advanced export verification command so agents can record implementation evidence before customer-facing feature export. Done in the first slice.
2. Skip archived/stale docs during changed-work watch warnings so inactive feature memory does not create agent busywork. Done in the first slice.
3. Update command drawer, tests, public docs, project memory, and the bundled skill so agents discover the verification workflow.
4. Improve `bd ready` output with grouped repair hints. First slice done: `ready` now surfaces recorded environment/tooling blockers from source docs without failing readiness when the BD checks themselves are otherwise clean.
5. Add release-hygiene guardrails so npm publishes are followed by matching git tags, GitHub Releases, and a public verification check. Done for this repo with `release:github`, `release:verify-public`, and the tag-push release workflow.
6. Add a guided freshness repair path for agents covering stale views, uncovered status docs, missing paths, and lifecycle cleanup.
7. Polish feature lifecycle closeout so agents archive shipped/abandoned scopes and refresh views/handoff/changelog context.
8. Run a fresh-agent dogfood exercise that starts from only `README.md`, `AGENTS.md`, `.benjamin-docs/`, and `benjamin-docs/`.

## Validation

- `pnpm build`
- `node --test dist/test/ready.test.js`
- `node --test dist/test/validate-export.test.js`
- `node --test dist/test/commands.test.js`
- `pnpm check`
- `node dist/src/cli.js views`
- `pnpm run release:verify-public`
- `node dist/src/cli.js review --changed --since HEAD`
- `node dist/src/cli.js ready`
