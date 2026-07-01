# benjamin-docs

**Persistent project memory for AI coding agents.**

Benjamin Docs turns your repo into living project knowledge that AI agents read, follow, and update while they work.

Every new Codex, Claude Code, Cursor, or other AI coding session can start with context: what the project is, where work stopped, what decisions were made, what not to touch, which UI and architecture rules matter, and what should happen next.

Git remembers what changed. Benjamin Docs remembers why, where you stopped, and what your AI agent needs next.

Markdown is the storage format. Continuity is the product.

No cloud. No dashboard. No transcript dump. Just project memory that lives beside the work.

[npm package](https://www.npmjs.com/package/benjamin-docs)

## Why This Exists

AI coding agents are powerful, but every new session can start cold.

| Without durable project memory | With Benjamin Docs |
| --- | --- |
| New AI sessions start from scratch. | New sessions start with project memory. |
| You re-explain the same context again and again. | The agent reads the current project state first. |
| Decisions get buried in chat history. | Decisions live in structured docs. |
| `README.md`, `CLAUDE.md`, and `AGENTS.md` drift or stay too broad. | Project memory is split into purpose, architecture, features, risks, handoffs, and next actions. |
| New sessions repeat old mistakes. | Agents see what was already tried, rejected, or marked risky. |
| Handoffs become messy summaries. | `bd export` creates focused knowledge packages for the audience. |

Benjamin Docs solves this by giving the repo a maintained memory layer. Agents are instructed through the installed skill and repo guidance to use it as a source of truth and update it after meaningful changes.

It is not a background daemon. It works because your AI coding agent follows the Benjamin Docs workflow while it works in the repo.

## How The Workflow Feels

```text
install Benjamin Docs
-> initialize project memory
-> AI creates structured project knowledge
-> AI works using that knowledge
-> AI updates the docs as work changes
-> next session starts with full context
-> export focused documentation for someone else
```

In practice:

```bash
pnpm add -g benjamin-docs
bd install-skill
cd your-project
bd init
```

Then ask your agent:

```text
Read the Benjamin Docs project memory, capture the current project baseline, and keep it updated as you work.
```

Before handoff:

```bash
bd ready
```

When someone else needs context:

```bash
bd export
```

## What It Remembers

A future agent can open the project and know:

- What the app or project is.
- Where the important code, docs, routes, services, and workflows live.
- What was done in previous sessions.
- Where work stopped.
- What to continue next.
- Which architecture decisions and product goals matter.
- Which UI rules, naming conventions, or code patterns to preserve.
- What not to touch.
- What is still open, risky, stale, or archived.
- Which checks to run before handoff.

That is the point: fewer cold starts, fewer repeated explanations, fewer stale handoffs.

## What It Creates

Benjamin Docs is a local CLI plus an installable agent skill.

- The CLI creates and checks the project-memory structure.
- The skill teaches agents how to read, maintain, and improve that memory.
- The docs stay in your repo as normal Markdown.
- The metadata stays in `.benjamin-docs/`.
- The human-facing command surface stays small.

```text
benjamin-docs/
  project/
  handoff/
  engineering/
  features/
  releases/
  views/

.benjamin-docs/
```

`benjamin-docs/` is for humans and agents. `.benjamin-docs/` is for validation, scopes, anchors, freshness rules, and export metadata.

## Main Commands

```bash
bd init
bd ready
bd export
bd help
```

What they do:

| Command | Use it when |
| --- | --- |
| `bd init` | You want this repo to carry project memory. |
| `bd ready` | You want to know whether the memory is valid, current, and handoff-ready. |
| `bd export` | You need a clean knowledge package or handoff for someone else. |
| `bd help` | You want the short getting-started guide. |

Advanced commands stay available through:

```bash
bd commands
```

Humans should only need the simple path. Agents and scripts can use deeper commands when they need them.

## Exports Are Focused Knowledge Packages

`bd export` is not just a Markdown dump.

It creates focused knowledge packages for the audience or task you choose. Generated exports live under `exports/` and include source metadata, commit state, dirty state, and export time.

Use it for:

| Need | Command path |
| --- | --- |
| Full app documentation | `bd export`, then choose app documentation, or `bd export --type app --profile customer` |
| Selected feature documentation | `bd export`, then choose a feature, or `bd export --feature <slug> --profile customer` |
| Customer-friendly overview | `bd export --type summary --profile customer` |
| Developer handoff | `bd export --type handoff --profile developer` |
| Designer-focused source bundle | `bd export --audience designer` when docs are tagged for `designer` |
| Advisor, friend, or partner review bundle | `bd export --audience advisor` or another tagged audience |

Customer-facing feature exports can block private, thin, unverified, or risky docs before writing output. Agents can record implementation verification first:

```bash
bd export --verify checkout-redesign --evidence "Checked route, mutation, permissions, UI flow, and edge cases."
bd export --feature checkout-redesign --profile customer
```

Exports are snapshots for sharing. They are not the source of truth. Keep `benjamin-docs/` current, then rerun `bd export` when the project changes.

## Why Not Just README.md, CLAUDE.md, Or AGENTS.md?

Those files are useful, but they are usually single static instruction files.

Benjamin Docs is structured project memory:

- `README.md` explains the project to the outside world.
- `CLAUDE.md`, `AGENTS.md`, and similar files tell agents how to behave.
- `benjamin-docs/` stores the memory agents need to keep working: architecture, progress, decisions, features, UI rules, risks, releases, next actions, and handoff context.

The important difference is upkeep. Benjamin Docs is designed for agents to read and update continuously as part of the workflow. `bd ready` then checks whether that memory is useful enough for the next human or agent.

## Existing Codebase

For an existing app or repo:

```bash
bd init
```

In an obvious codebase, `init` sets up codebase memory and repo-local agent guidance automatically. Existing `AGENTS.md` files are preserved; Benjamin-owned sections are marked so they can be updated without rewriting the rest of the file.

Then ask your agent:

```text
Capture the current project baseline with Benjamin Docs. Read the repo first, update the Benjamin Docs source files, then run bd ready.
```

Use explicit mode flags only when automation needs them:

```bash
bd init --mode planning
bd init --mode codebase
bd init --mode feature --feature <slug>
bd init --no-agent-contract
```

## Chat-Only Project

If you only have a chat and no project folder yet, ask your agent:

```text
Use the benjamin-docs skill to create a project from this chat.
```

The agent should suggest:

```text
~/Documents/Benjamin Docs/<Project Name>
```

It should ask before creating files. After you confirm, it creates:

```text
README.md
benjamin-docs/
.benjamin-docs/
```

For the exact agent prompt:

```bash
bd chat-project
```

## Refresh And Readiness

When useful memory already exists, agents can refresh derived views before the readiness gate:

```bash
bd views
bd ready
```

`bd views` creates derived views for decisions, open questions, next actions, risks, and agent continuation. The source of truth stays in the project, feature, handoff, engineering, and release docs.

`bd ready` checks:

- Project setup.
- Managed Markdown and metadata.
- Links, anchors, and path safety.
- Docs quality and continuation proof.
- Freshness coverage for status-bearing docs.
- Stale generated views.
- Agent guidance health.
- Recorded local environment or tooling blockers.

## Skill Installation

`bd install-skill` installs the bundled skill for local agents:

```text
~/.agents/skills/benjamin-docs/
~/.codex/skills/benjamin-docs/
~/.claude/skills/benjamin-docs/
~/.cursor/skills/benjamin-docs/
```

Codex, Cursor, and Claude Code can use the shared `~/.agents/skills` install.

Claude Desktop / Claude.ai uses uploaded skills:

```bash
bd package-skill
```

Then upload `~/Downloads/benjamin-docs-skill.zip` in Claude.

## Current Version

`0.9.2` focuses on guided exports and agent reliability:

- Guided export menu for app docs, feature docs, customer handoffs, developer handoffs, and project summaries.
- Feature readiness labels before export: ready, blocked, or archived.
- Customer feature exports that block private, thin, unverified, or risky docs before writing output.
- Agent verification recording with `bd export --verify <feature> --evidence "<what was checked>"`.
- `bd ready` separates recorded environment/tooling blockers from project-memory failures.
- Brief, standard, and detailed Markdown export levels.
- Snapshot metadata for source docs, source commit, dirty state, and export time.

## Local Development

```bash
git clone https://github.com/msiksnis/benjamin-docs.git
cd benjamin-docs
pnpm install
pnpm check
```

Before publishing:

```bash
pnpm run release:check
tmpdir=$(mktemp -d)
pnpm pack --pack-destination "$tmpdir"
npm publish "$tmpdir"/benjamin-docs-*.tgz --access public
pnpm run release:github
pnpm run release:verify-public
```

`release:github` confirms the just-published npm version exists, creates or reuses the matching `vX.Y.Z` git tag, pushes it, and creates the GitHub Release. A tag-push GitHub Action also creates the release if a maintainer pushes the version tag manually.

## Contributing

Keep it local-first.

Keep docs readable by non-programmers.

Keep agent workflows explicit.

Avoid magic that writes outside the project unless the user runs a clear command.
