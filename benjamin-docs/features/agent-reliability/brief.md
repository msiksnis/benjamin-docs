---
title: Agent Reliability Brief
scope: feature
scope_id: agent-reliability
audience: [developer, designer, agent]
status: review
visibility: private
updated: 2026-06-20
source: manual
freshness: status
---

# Agent Reliability Brief

Agent Reliability is the next BD product arc after guided export. The goal is to keep the human-facing command surface tiny while making agents more dependable at maintaining, verifying, repairing, and exporting project memory in the background.

## Outcome

Human users should feel that after `bd init`, their agents know how to keep project memory useful without constant reminders. Agents should use advanced commands and repo guidance for freshness checks, view regeneration, implementation verification, scope lifecycle cleanup, and customer-safe exports.

## Scope

In scope:

- Record feature export verification with evidence through an agent-facing command.
- Improve readiness and freshness repair guidance so agents know what to fix.
- Dogfood fresh-agent continuation from only repo-local BD artifacts.
- Polish feature lifecycle cleanup after shipped or abandoned work.
- Keep these workflows advanced or agent-led rather than expanding the main human command list.

Out of scope:

- Hosted publishing, dashboards, background daemons, or SaaS sync.
- Requiring humans to learn more commands.
- Pretending the CLI can semantically verify implementation by itself.
