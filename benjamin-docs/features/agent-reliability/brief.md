---
title: Agent Reliability Brief
scope: feature
scope_id: agent-reliability
audience: [developer, designer, agent]
status: review
visibility: private
updated: 2026-07-01
source: manual
freshness: status
---

# Agent Reliability Brief

Agent Reliability is the next BD product arc after guided export. The goal is to keep the human-facing command surface tiny while making agents more dependable at maintaining, verifying, repairing, and exporting project memory in the background.

## Outcome

Human users should feel that after `bd init`, their agents know how to keep project memory useful without constant reminders. Agents should use advanced commands and repo guidance for freshness checks, view regeneration, implementation verification, scope lifecycle cleanup, and customer-safe exports.

First-contact understanding is also part of Agent Reliability. If a fresh agent sees the GitHub README or npm package and mistakes BD for a generic documentation package or Markdown helper, the agent workflow starts from the wrong model. Public copy must make the memory/continuity value obvious before deeper docs are needed, including the fact that agents are instructed to keep the docs current while they work.

The 0.9.3 release candidate packages this first-contact positioning for npm. It does not add new runtime behavior; it makes the existing agent-memory model obvious on the public package surfaces.

## Scope

In scope:

- Record feature export verification with evidence through an agent-facing command.
- Improve readiness and freshness repair guidance so agents know what to fix.
- Surface recorded environment/tooling blockers in `bd ready` without treating documented local prerequisites as project-memory failures.
- Guard package release hygiene so npm publishes create and verify the matching git tag and GitHub Release.
- Keep GitHub README, npm description/keywords, CLI introduction, and bundled skill wording aligned around persistent project memory, living project knowledge, agent-maintained docs, and focused export packages.
- Dogfood fresh-agent continuation from only repo-local BD artifacts.
- Dogfood fresh human/agent understanding from only GitHub or npm first-contact surfaces.
- Polish feature lifecycle cleanup after shipped or abandoned work.
- Keep these workflows advanced or agent-led rather than expanding the main human command list.

Out of scope:

- Hosted publishing, dashboards, background daemons, or SaaS sync.
- Requiring humans to learn more commands.
- Pretending the CLI can semantically verify implementation by itself.
