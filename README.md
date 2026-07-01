# benjamin-docs

**Persistent project memory for AI coding agents and humans.**

Benjamin Docs gives your repo a local memory layer. Start a new Codex, Claude Code, Cursor, or other AI coding session and the agent can immediately read what the project is, where work stopped, what decisions were made, what conventions matter, what is risky, and what to do next.

Markdown is the storage format. The product is continuity.

No cloud. No dashboard. No transcript dump. Just project memory that lives beside the work.

[npm package](https://www.npmjs.com/package/benjamin-docs)

## Why It Exists

AI coding agents are powerful, but every new session can start cold.

Without durable memory, you repeat the same context:

- What this app is supposed to do.
- Which files, routes, services, and workflows matter.
- Which choices were already made or rejected.
- What changed last time.
- What still needs to happen.
- What the next agent should avoid breaking.

Benjamin Docs turns that context into structured repo-local memory. Agents can read it before they work, update it while they work, check whether it is still handoff-ready, and export a clean summary when someone else needs the context.

## What It Is

Benjamin Docs is a local CLI plus an installable agent skill.

- The CLI creates and checks the project-memory structure.
- The skill teaches agents how to read, maintain, and improve that memory.
- The docs stay in your repo as normal Markdown.
- The metadata stays in `.benjamin-docs/`.
- The human-facing command surface stays small.

In practice, it gives every project a memory folder:

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

## Quick Start

Install the CLI and the bundled agent skill:

```bash
pnpm add -g benjamin-docs
bd install-skill
bd help
```

`bd` is the short alias for `benjamin-docs`.

Inside a project:

```bash
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

When you need to share a clean summary or handoff:

```bash
bd export
```

Need npm or one-off runs?

```bash
npm install -g benjamin-docs
npx benjamin-docs
```

## The Core Workflow

1. `bd init` creates repo-local project memory and agent guidance.
2. Your agent captures the useful context: purpose, architecture, decisions, risks, open questions, next actions, and handoff notes.
3. During later work, agents update the relevant memory instead of leaving context trapped in chat.
4. `bd ready` checks setup, validation, docs quality, continuation proof, freshness, and agent guidance.
5. `bd export` creates concise Markdown snapshots for app docs, feature docs, customer handoffs, developer handoffs, or project summaries.

Humans should only need the simple path. Agents and scripts can use deeper commands when they need them.

## Main Commands

```bash
bd init
bd ready
bd export
bd help
```

What they do:

- `bd init` sets up project memory in the current repo.
- `bd ready` checks whether the memory is valid, current, and useful for the next person or agent.
- `bd export` opens guided local exports for clean handoffs and summaries.
- `bd help` shows the simple path.

Advanced commands stay available through:

```bash
bd commands
```

## What Agents Get From It

A future agent can open the project and know:

- What the app or project is.
- Where the important code and docs live.
- What was done in previous sessions.
- What decisions, constraints, and conventions matter.
- What is still open or risky.
- Which checks to run.
- What should happen next.
- Which work is archived, stale, or not ready to export.

That is the point: fewer cold starts, fewer repeated explanations, fewer stale handoffs.

## What Humans Get From It

You get a small set of commands and a repo that carries its own context.

Use it when:

- You work with AI coding agents across multiple sessions.
- You switch between projects and forget where each one stopped.
- You want new agents or collaborators to start with real context.
- You need customer, designer, developer, or personal handoffs without dumping raw chat.
- You want docs that agents are expected to maintain, not docs that only humans remember to update.

## Why Not Just README.md, AGENTS.md, Or CLAUDE.md?

Benjamin Docs complements those files.

- `README.md` explains the project to the outside world.
- `AGENTS.md`, `CLAUDE.md`, and similar files tell agents how to behave.
- `benjamin-docs/` stores the project memory: decisions, plans, risks, architecture notes, feature state, releases, next actions, and handoff context.

The agent guidance points agents into Benjamin Docs, and `bd ready` checks whether that memory is useful enough for continuation.

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

## Exports

`bd export` creates generated Markdown snapshots under `exports/`.

Exports are for sharing. They are not the source of truth. Keep `benjamin-docs/` current, then rerun `bd export` to regenerate a fresh snapshot with current source metadata, commit state, and export time.

Guided exports can create:

- Full app documentation.
- Feature documentation.
- Customer handoffs.
- Developer handoffs.
- Project summaries.

Agents and scripts can use direct flags when the target is clear:

```bash
bd export --list
bd export --verify checkout-redesign --evidence "Checked route, mutation, permissions, UI flow, and edge cases."
bd export --feature checkout-redesign --profile customer
bd export --type handoff --profile customer
```

Customer-facing feature exports block private, thin, unverified, or risky docs before writing output. Agents should verify implementation against the docs before exporting.

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
