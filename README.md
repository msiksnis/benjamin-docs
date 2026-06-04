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

## For Non-Programmers

You can use `benjamin-docs` even if you are planning an app, product, service, or creative project before any code exists.

Think of it as a project notebook that your AI agent keeps inside your project folder. The agent does the writing; the CLI creates the folders, checks that the notes are valid, and gives the next prompt to use.

You need:

- a place on your computer where the agent can create a project folder
- an AI coding agent that can run terminal commands and edit files
- a local checkout or installed copy of this repo while the package is unpublished

If all you have is the current chat, start by asking your agent:

```text
Use benjamin-docs to create a project from this chat.
Ask me where to create the folder, initialize it as a planning-only project,
write a simple top-level README.md, then capture the current context
in plain language.
```

After that, ask:

```text
Show me the benjamin-docs project brief, roadmap, open questions,
and handoff. Explain what each file is for.
```

Nothing is uploaded or published by the CLI. The docs stay in your project folder unless you choose to share them.

## Create A Project From A Chat

This is the simplest first use case: you do not have a repo, codebase, or project folder yet. You only have a useful conversation.

Ask your agent:

```text
Use benjamin-docs to create a project from this chat.
Ask me for the project name and where to put it.
Create the folder, initialize benjamin-docs there, add a simple README.md,
and turn this conversation into a project brief, roadmap, open questions,
and handoff.
```

The agent should:

- ask for a project name and location if they are not clear
- create the project folder
- run `benjamin-docs init --mode planning` inside that folder
- write a top-level `README.md` that explains what the project is and where to start
- update the Benjamin docs under `benjamin-docs/` from the chat context
- run `benjamin-docs validate`
- show you what was created and what is still uncertain

The CLI creates and validates the docs workspace. The agent turns the chat into useful project memory.

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
node dist/src/cli.js status
node dist/src/cli.js validate
```

`init` prints the recommended agent prompt. Run `next` later if you want to see that prompt again.

```bash
node dist/src/cli.js next
```

In an interactive terminal, `init` asks what you are setting up. In scripts or agent workflows, pass a mode explicitly.

For an existing codebase:

```bash
node dist/src/cli.js init --mode codebase
node dist/src/cli.js validate
```

For a single feature:

```bash
node dist/src/cli.js init --mode feature --feature billing-reminders
node dist/src/cli.js validate
```

## Use In Another Local Project

Until the package is published, choose the smallest CLI setup that fits the job.

If you want the CLI as a per-project dev dependency, install it from a local checkout:

```bash
cd /path/to/your-project
pnpm add -D file:/path/to/benjamin-docs
pnpm exec benjamin-docs init
pnpm exec benjamin-docs validate
```

Inside a pnpm workspace, use `-w` when installing at the workspace root:

```bash
pnpm add -Dw file:/path/to/benjamin-docs
```

If you only want to run the source CLI without installing it into the target project:

```bash
cd /path/to/your-project
node /path/to/benjamin-docs/dist/src/cli.js init
```

If you want a temporary global CLI while working from source:

```bash
cd /path/to/benjamin-docs
pnpm install
pnpm build
pnpm add -g .
benjamin-docs introduce
```

Re-run `pnpm build` after source changes. Remove the global setup once the package has a normal published install path.

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

For a first planning session, a clearer prompt is:

```text
Use the benjamin-docs skill.
If there is no project folder yet, ask me where to create one.
Initialize it as a planning-only project, add a simple README.md,
and capture what we know, what we decided, what is still unclear,
and what I should do next. Keep it understandable for a non-technical reader.
```

## Local Development

```bash
pnpm install
pnpm build
node dist/src/cli.js introduce
```

After this repo's package is installed locally into a project, use `pnpm exec benjamin-docs ...` to run that local package.

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
Use benjamin-docs to create a project from this chat.
Ask me where to create the folder, then initialize it and capture the project.
```

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

## Capture A Baseline

A baseline capture turns the current state of a project into durable docs. It is the first useful pass after `init`, and it should capture decisions, rejected options, risks, open questions, and next actions instead of saving a raw transcript.

For a new idea or planning-only project:

```bash
benjamin-docs init --mode planning
```

```text
Capture the baseline for this new idea with benjamin-docs.
Update the project brief, roadmap, open questions, and handoff docs.
Mark assumptions clearly and challenge any overbuilt V1 scope.
```

For an existing codebase:

```bash
benjamin-docs init --mode codebase
```

```text
Capture the current codebase baseline with benjamin-docs.
Read the README, package/config files, existing docs, and major source areas.
Update the project, engineering, and handoff docs under benjamin-docs/.
Include important code references, risks, and uncertain findings.
```

For one feature:

```bash
benjamin-docs init --mode feature --feature billing-reminders
```

```text
Capture the billing-reminders feature with benjamin-docs.
Update the feature brief, plan, decisions, and handoff.
Include user goals, constraints, rejected options, test ideas, and next actions.
```

After any baseline capture:

```bash
benjamin-docs validate
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
