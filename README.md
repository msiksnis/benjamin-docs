# agent-docs

Repo-local project memory for humans and AI agents.

`agent-docs` turns planning and build conversations into structured Markdown docs that live inside your project. It works before code exists, inside existing codebases, and for individual feature scopes.

## Package Name

The package name is provisional. An unrelated package named `agent-docs` already exists on npm, so do not install `agent-docs` from the public registry until the package name is resolved.

## Local Development

```bash
pnpm install
pnpm build
node dist/src/cli.js introduce
```

After this repo's package is installed or linked locally into a project, use `pnpm exec agent-docs ...` to run that local package. Do not run the public npm package via `npx`.

## Common Commands

```bash
node dist/src/cli.js introduce
node dist/src/cli.js help
node dist/src/cli.js --version
node dist/src/cli.js init
node dist/src/cli.js status
node dist/src/cli.js validate
node dist/src/cli.js scope create feature booking-capacity
node dist/src/cli.js anchor add booking-capacity-rules src/features/booking/capacity.ts
node dist/src/cli.js export --audience developer
node dist/src/cli.js promote --to codebase
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
