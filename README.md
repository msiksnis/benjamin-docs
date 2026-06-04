# benjamin-docs

Repo-local project memory for humans and AI agents.

`benjamin-docs` turns planning and build conversations into structured Markdown docs that live inside your project. It works before code exists, inside existing codebases, and for individual feature scopes.

## Status

Early MVP. The CLI is usable locally, but the package is intentionally not published to npm yet.

The current goal is to make the open-source repo useful, understandable, and safe to try before adding hosted publishing or SaaS features.

## Why It Exists

Long agent sessions create valuable project context: product decisions, rejected options, feature plans, user-facing notes, handoff context, and code references. That context is easy to lose.

`benjamin-docs` keeps that memory close to the work:

- human-readable Markdown in `benjamin-docs/`
- machine-readable metadata in `.benjamin-docs/`
- local validation before docs are shared or exported
- agent skill guidance so future sessions can update docs without drifting

## Package Name

The package and CLI are named `benjamin-docs`.

This repo's package is marked `private` in `package.json` during the MVP so it cannot be published accidentally. Use it for local build, link, and package dry-run testing until publishing is intentional.

## Quick Start From Source

```bash
git clone https://github.com/msiksnis/benjamin-docs.git
cd benjamin-docs
pnpm install
pnpm build
node dist/src/cli.js introduce
```

Initialize docs in the current repo:

```bash
node dist/src/cli.js init
node dist/src/cli.js next
node dist/src/cli.js status
node dist/src/cli.js validate
```

In an interactive terminal, `init` asks what you are setting up. In scripts or agent workflows, pass a mode explicitly.

For an existing codebase:

```bash
node dist/src/cli.js init --mode codebase
node dist/src/cli.js next
node dist/src/cli.js validate
```

For a single feature:

```bash
node dist/src/cli.js init --mode feature --feature billing-reminders
node dist/src/cli.js next
node dist/src/cli.js validate
```

## Use In Another Local Project

Until the package is published, install it from a local checkout:

```bash
cd /path/to/your-project
pnpm add -Dw file:/path/to/benjamin-docs
pnpm exec benjamin-docs init
pnpm exec benjamin-docs next
pnpm exec benjamin-docs validate
```

If you only want to run the source CLI without installing it into the target project:

```bash
cd /path/to/your-project
node /path/to/benjamin-docs/dist/src/cli.js init
```

## Install The Agent Skill Locally

The skill teaches an agent how to capture planning/build conversations into the docs created by the CLI.

For Codex local skills:

```bash
mkdir -p ~/.codex/skills/benjamin-docs
cp skills/benjamin-docs/SKILL.md ~/.codex/skills/benjamin-docs/SKILL.md
```

Then ask your agent:

```text
Capture this conversation with benjamin-docs.
```

## Local Development

```bash
pnpm install
pnpm build
node dist/src/cli.js introduce
```

After this repo's package is installed or linked locally into a project, use `pnpm exec benjamin-docs ...` to run that local package.

## Checks

```bash
pnpm check
node dist/src/cli.js validate
npm pack --dry-run
```

## Common Commands

```bash
node dist/src/cli.js introduce
node dist/src/cli.js help
node dist/src/cli.js --version
node dist/src/cli.js init
node dist/src/cli.js init --mode codebase
node dist/src/cli.js init --mode feature --feature booking-capacity
node dist/src/cli.js next
node dist/src/cli.js status
node dist/src/cli.js validate
node dist/src/cli.js scope create feature booking-capacity
node dist/src/cli.js anchor add booking-capacity-rules src/features/booking/capacity.ts
node dist/src/cli.js export --audience developer
node dist/src/cli.js promote --to codebase
```

The same commands are available as `benjamin-docs ...` when the package is installed or otherwise exposed on `PATH`.

## What It Creates

```text
benjamin-docs/
.benjamin-docs/
```

`benjamin-docs/` contains human-readable Markdown. `.benjamin-docs/` contains machine metadata for validation, exports, anchors, and future publishing.

The default workspace is:

```text
benjamin-docs/
  project/
  handoff/
  engineering/
  features/
  releases/
```

Existing project docs in `docs/` are left alone. They may be useful context, but they are not the Benjamin-managed workspace unless `.benjamin-docs/config.json` explicitly says so.

## Agent Workflow

The CLI owns structure and validation. Codex or Claude skills own synthesis from the current conversation.

Ask your agent:

```text
Capture this conversation with benjamin-docs.
```

The agent should update the relevant docs, run validation, and report what changed.

Good capture prompts:

```text
Capture this planning conversation with benjamin-docs.
```

```text
Capture the current project baseline with benjamin-docs.
Read the existing docs and codebase, then update the Benjamin docs
under benjamin-docs/. Mark uncertain items.
```

```text
Create a benjamin-docs feature scope for billing-reminders
and capture the plan, decisions, risks, and handoff.
```

## Design Boundaries

- The repo-local docs are the source of truth.
- The CLI should stay deterministic and dependency-light.
- Ordinary local commands should not make network calls.
- Existing docs in a repo should not be overwritten.
- Hosted publishing, auth, comments, and web editing are future layers.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md).
