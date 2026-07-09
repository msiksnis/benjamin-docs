---
title: Agent Reliability Plan
scope: feature
scope_id: agent-reliability
audience: [developer, agent]
status: review
visibility: private
updated: 2026-07-09
source: manual
freshness: status
---

# Agent Reliability Plan

2026-07-09 update: session hooks and drift detection moved to the Drift And Session Hooks scope and shipped in 0.10.0; remove them from this plan's open items.

This plan turns the user's product direction into small agent-led improvements. The human path remains `bd init`, `bd ready`, `bd export`, and `bd help`; deeper work belongs in advanced commands, generated guidance, and the bundled skill.

## Steps

1. Add an advanced export verification command so agents can record implementation evidence before customer-facing feature export. Done in the first slice.
2. Skip archived/stale docs during changed-work watch warnings so inactive feature memory does not create agent busywork. Done in the first slice.
3. Update command drawer, tests, public docs, project memory, and the bundled skill so agents discover the verification workflow.
4. Improve `bd ready` output with grouped repair hints. First slice done: `ready` now surfaces recorded environment/tooling blockers from source docs without failing readiness when the BD checks themselves are otherwise clean.
5. Add release-hygiene guardrails so npm publishes are followed by matching git tags, GitHub Releases, and a public verification check. Done for this repo with `release:github`, `release:verify-public`, and the tag-push release workflow.
6. Align public first-contact surfaces so README, npm metadata, CLI intro/help, and the bundled skill all say "persistent project memory for AI coding agents" and explain living project knowledge that agents update while they work. Done for the public-positioning slice and prepared as the 0.9.3 npm publish candidate.
7. Add a guided freshness repair path for agents covering stale views, uncovered status docs, missing paths, and lifecycle cleanup.
8. Polish feature lifecycle closeout so agents archive shipped/abandoned scopes and refresh views/handoff/changelog context.
9. Run a fresh-agent dogfood exercise that starts from only `README.md`, `AGENTS.md`, `.benjamin-docs/`, and `benjamin-docs/`.
10. Run a first-contact dogfood exercise where a fresh human or agent sees only the GitHub README or npm package page and must identify BD as persistent project memory, not a generic docs helper.

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
