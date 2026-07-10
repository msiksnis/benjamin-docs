---
name: benjamin-docs
description: Maintain persistent repo-local project memory for AI coding agents and humans.
---

# benjamin-docs

Use this skill when the user asks to capture, document, summarize, hand off, export, preserve a planning or development conversation, maintain project memory after durable work, or create a project from a chat with `benjamin-docs`.

If the user says "Use the benjamin-docs skill to create a project from this chat" or similar, read `references/capture.md` and start its Chat-To-Project Workflow directly.

## Purpose

`benjamin-docs` gives projects persistent, repo-local memory for AI coding agents and humans. Markdown is the storage format; the product is continuity across sessions, decisions, implementation, handoffs, and exports. Read the memory before relevant work and update it when durable facts change. It works before code exists, in existing codebases, and for individual feature scopes.

## Start with bounded context

- If Benjamin Docs session-start context is already present, follow its read-first pointers. Do not read the whole memory tree.
- When the `benjamin-docs` MCP server is available, start with `memory_context` and pass the task. Use `memory_search` before `memory_read`, and read a whole source doc only when its snippet is insufficient.
- Without MCP, read `.benjamin-docs/config.json`, use its `docsRoot`, and begin with the most relevant project, feature, or handoff docs.
- Reading project memory alone needs no user-facing note.

## Choose the scope

- **project**: the whole product, app, business, or codebase baseline.
- **feature**: one feature, module, redesign, migration, experiment, bug fix, or release slice. Use `scope create feature <slug>` when the scope does not exist.
- **handoff**: continuation context for another person or future agent.
- **release**: shipped state and release-relevant changes.

Use existing CLI-created docs and the configured docs root. Update the most specific existing source doc instead of creating a parallel summary or transcript. When a feature ships or is abandoned, run `scope status <slug> archived`.

## Update before the final answer

After code, config, schema, tests, workflows, user behavior, release state, or operational posture changes:

1. Review the diff and identify durable facts that changed.
2. Update the smallest relevant Benjamin source docs, including project-level docs when feature work changes the roadmap, architecture, code map, risks, release state, or handoff context.
3. Regenerate existing Memory Views with `bd views` when source docs changed.
4. Run `bd review --changed` when git history is available, and `bd drift` when prior committed changes may have outpaced watched docs.
5. Run `bd ready` before claiming a baseline or handoff is ready. Use lower-level checks to diagnose a failed gate.

If no memory update is warranted, state a concrete reason only when useful. Do not edit memory merely to satisfy bookkeeping.

## Preserve the substantive response

Benjamin Docs work must never suppress, replace, delay, or materially rewrite the answer to the user's task. Complete memory maintenance during normal work before composing the final answer. Do not mention memory reads. After a durable update, an optional note may follow the substantive answer as one sentence of at most 120 characters. Mention a Benjamin Docs failure only when it blocks the requested task or makes the handoff unsafe.

## Detailed workflows

- Read `references/capture.md` only for initialization, capture, feature planning, changed-work review, or handoff work.
- Read `references/export.md` only for exports or publication checks.
- Read `references/integrations.md` only for hooks, MCP, upgrades, skills, or AGENTS.md setup.

Preserve the user's intent, but challenge weak assumptions, contradictions, missing decisions, overbuilt scope, unclear audiences, and risks with a specific better alternative when possible.
