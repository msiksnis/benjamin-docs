---
title: session-capture Plan
scope: feature
scope_id: session-capture
audience: [developer, agent]
status: draft
visibility: private
updated: 2026-06-03
source: manual
---

# session-capture Plan

Session capture is the first wedge. A user should be able to chat with an agent about an idea or feature, then ask the agent to capture the conversation into durable docs.

The CLI cannot read chat context by itself. The skill reads the conversation, writes Markdown docs, and then uses the CLI to validate the result.
