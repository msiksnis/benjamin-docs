# agent-docs

Repo-local project memory for humans and AI agents.

`agent-docs` turns planning and build conversations into structured Markdown docs that live inside your project. It works before code exists, inside existing codebases, and for individual feature scopes.

## Install

```bash
pnpm add -D agent-docs
```

For local development in this repo:

```bash
pnpm install
pnpm build
node dist/src/cli.js introduce
```

## Common Commands

```bash
agent-docs introduce
agent-docs help
agent-docs --version
agent-docs init
agent-docs status
agent-docs validate
agent-docs scope create feature booking-capacity
agent-docs anchor add booking-capacity-rules src/features/booking/capacity.ts
agent-docs export --audience developer
agent-docs promote --to codebase
```

## What It Creates

```text
docs/
.agent-docs/
```

`docs/` contains human-readable Markdown. `.agent-docs/` contains machine metadata for validation, exports, anchors, and future publishing.

## Agent Workflow

The CLI owns structure and validation. Codex or Claude skills own synthesis from the current conversation.

Ask your agent:

```text
Capture this conversation with agent-docs.
```

The agent should update the relevant docs, run validation, and report what changed.
