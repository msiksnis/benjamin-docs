# benjamin-docs

Repo-local project memory for humans and AI agents.

`benjamin-docs` turns planning and build conversations into structured Markdown docs that live inside your project. It works before code exists, inside existing codebases, and for individual feature scopes.

## Status

Early MVP. The CLI is prepared for its first public `0.1.0` package release as `benjamin-docs`.

The current goal is to make the open-source repo useful, understandable, and safe to try before adding hosted publishing or SaaS features.

## Why It Exists

Long agent sessions create valuable project context: product decisions, rejected options, feature plans, user-facing notes, handoff context, and code references. That context is easy to lose.

`benjamin-docs` keeps that memory close to the work:

- human-readable Markdown in `benjamin-docs/`
- machine-readable metadata in `.benjamin-docs/`
- local validation before docs are shared or exported
- agent skill guidance so future sessions can update docs without drifting

## Try It From Any Chat

If a conversation already contains a useful project idea, ask your agent:

```text
Use benjamin-docs to create a project from this chat.
```

The agent should suggest a local folder like:

```text
~/Documents/Benjamin Docs/Atelier Edits
```

After you confirm, it creates:

```text
README.md
benjamin-docs/
.benjamin-docs/
```

The top-level `README.md` explains the project in plain language. The `benjamin-docs/` folder captures the project brief, roadmap, open questions, and handoff notes. Nothing is uploaded by the CLI.

## For Non-Programmers

You can use `benjamin-docs` even if you are planning an app, product, service, or creative project before any code exists.

Think of it as a project notebook that your AI agent keeps inside your project folder. The agent does the writing; the CLI creates the folders, checks that the notes are valid, and gives the next prompt to use.

You need:

- a place on your computer where the agent can create a project folder, such as `~/Documents/Benjamin Docs/Project Name`
- an AI coding agent that can run terminal commands and edit files
- the `benjamin-docs` CLI installed with pnpm, or a local source checkout while developing

If all you have is the current chat, start by asking your agent:

```text
Use benjamin-docs to create a project from this chat.
Suggest ~/Documents/Benjamin Docs/<Project Name> as the folder,
initialize it as a planning-only project, write a simple top-level README.md,
then capture the current context in plain language.
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
Suggest ~/Documents/Benjamin Docs/<Project Name> unless I choose a different place.
Create the folder, initialize benjamin-docs there, add a simple README.md,
and turn this conversation into a project brief, roadmap, open questions,
and handoff.
```

The agent should:

- infer a human-readable project name when the chat makes one obvious
- suggest `~/Documents/Benjamin Docs/<Project Name>` as the default location
- ask for confirmation before creating files
- summarize what it will capture in short bullets
- create the project folder
- run `benjamin-docs init --mode planning` inside that folder
- write a top-level `README.md` that explains what the project is and where to start
- update the Benjamin docs under `benjamin-docs/` from the chat context
- run `benjamin-docs validate`
- show you what was created and what is still uncertain

The CLI creates and validates the docs workspace. The agent turns the chat into useful project memory.

## Install The CLI

Install globally with pnpm:

```bash
pnpm add -g benjamin-docs
benjamin-docs introduce
```

Initialize docs in the current project folder:

```bash
benjamin-docs init
benjamin-docs status
benjamin-docs validate
```

`init` prints the recommended agent prompt. Run `next` later if you want to see that prompt again.

```bash
benjamin-docs next
```

In an interactive terminal, `init` asks what you are setting up. In scripts or agent workflows, pass a mode explicitly.

For an existing codebase:

```bash
benjamin-docs init --mode codebase
benjamin-docs validate
```

For a single feature:

```bash
benjamin-docs init --mode feature --feature billing-reminders
benjamin-docs validate
```

If you prefer a project-local dev dependency:

```bash
cd /path/to/your-project
pnpm add -D benjamin-docs
pnpm exec benjamin-docs init
pnpm exec benjamin-docs validate
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

For a first planning session, a clearer prompt is:

```text
Use the benjamin-docs skill.
If there is no project folder yet, ask me where to create one.
Suggest ~/Documents/Benjamin Docs/<Project Name> by default.
Initialize it as a planning-only project, add a simple README.md,
and capture what we know, what we decided, what is still unclear,
and what I should do next. Keep it understandable for a non-technical reader.
```

## Local Development

```bash
git clone https://github.com/msiksnis/benjamin-docs.git
cd benjamin-docs
pnpm install
pnpm build
node dist/src/cli.js introduce
```

To test the source CLI inside another local project without installing the package:

```bash
cd /path/to/your-project
node /path/to/benjamin-docs/dist/src/cli.js init
```

## Checks

```bash
pnpm check
node dist/src/cli.js validate
npm pack --dry-run
```

Before publishing:

```bash
pnpm run release:check
pnpm publish
```

## Common Commands

```bash
benjamin-docs introduce
benjamin-docs help
benjamin-docs --version
benjamin-docs init
benjamin-docs init --mode codebase
benjamin-docs init --mode feature --feature booking-capacity
benjamin-docs next
benjamin-docs status
benjamin-docs validate
benjamin-docs scope create feature booking-capacity
benjamin-docs anchor add booking-capacity-rules src/features/booking/capacity.ts
benjamin-docs export --audience developer
benjamin-docs promote --to codebase
```

In a source checkout, use `node dist/src/cli.js ...` after `pnpm build`.

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
Suggest ~/Documents/Benjamin Docs/<Project Name>, then initialize it and capture the project.
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
