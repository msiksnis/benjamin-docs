---
title: Agent Reliability Decisions
scope: feature
scope_id: agent-reliability
audience: [developer, agent]
status: review
visibility: private
updated: 2026-07-01
source: manual
freshness: status
---

# Agent Reliability Decisions

## Decisions

- Keep the user-facing BD surface very small. New reliability work should be agent-facing, advanced, or automatic through repo-local guidance.
- Customer-facing feature export verification should require explicit evidence recorded by an agent, not just a hidden phrase.
- `bd export --verify <feature> --evidence "<what the agent checked>"` is an advanced command for agents and scripts. It updates the feature handoff's Implementation Verification section so later customer exports can pass readiness.
- The CLI records verification evidence but does not claim to semantically inspect the product. Agents still own the actual implementation-vs-docs comparison.
- Changed-work review should not warn on archived or stale docs, even when an old watch rule still matches changed source files.
- Keep generated exports under `exports/` as disposable snapshots inside the active project root.
- `bd ready` should distinguish recorded local prerequisites from BD setup/doc failures. Missing tools or services such as `cargo` or PostgreSQL should appear under a dedicated environment/tooling category when agents documented them in project memory.
- BD should not run arbitrary project build/test commands by itself in this slice; agents still own executing project checks and recording blockers in handoff docs.
- Package release hygiene should be scripted and verified instead of relying on agent memory. After npm publish, `release:github` owns tag/GitHub Release creation and `release:verify-public` confirms npm, tags, release object, and latest-release state.
- Public first-contact surfaces must lead with persistent project memory for AI coding agents, living project knowledge, and agent-maintained docs. README, npm metadata, CLI intro/help, and the bundled skill should not make people or agents infer the core value from lower-level Markdown/doc mechanics.
- Treat 0.9.3 as a patch release because behavior is unchanged. Its job is to publish the public README/npm metadata clarity already prepared in the repo.

## Rejected Options

- Do not make export verification another primary human command.
- Do not let customer-facing export silently pass because the docs look polished; implementation evidence is required.
- Do not build a background daemon in this slice. BD can strengthen the agent contract and deterministic checks without pretending it runs autonomously.
- Do not treat every documented blocked project check as a readiness failure. A project can be handoff-ready when the blocker is clearly recorded as local environment state.
- Do not leave GitHub Releases as a manual afterthought separate from the npm publish flow.
- Do not headline BD as a documentation package, Markdown helper, or chat-to-docs converter. Those are implementation details or workflows, not the value proposition. Also do not imply BD is an autonomous daemon; the update loop comes from agent guidance and the installed skill.
