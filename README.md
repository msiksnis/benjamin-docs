# benjamin-docs

Local project memory for humans and AI agents.

[npm package](https://www.npmjs.com/package/benjamin-docs)

`benjamin-docs` turns useful chats and project work into project docs.

It keeps decisions, plans, open questions, and handoff notes in Markdown files inside your project.

No cloud. No dashboard. No transcript dump.

## Why It Exists

Chats are great for thinking.

They are bad at becoming project memory.

`benjamin-docs` saves the useful parts: decisions, plans, open questions, and handoff notes.

So the next person or agent can start with context instead of asking you to explain everything again.

## Install

```bash
pnpm add -g benjamin-docs
benjamin-docs install-skill
benjamin-docs help
```

Also works as a project dependency:

```bash
pnpm add benjamin-docs
```

Need npm or one-off runs?

```bash
npm install -g benjamin-docs
npx benjamin-docs
```

`install-skill` installs the bundled agent skill for local agents:

```text
~/.agents/skills/benjamin-docs/
~/.codex/skills/benjamin-docs/
~/.claude/skills/benjamin-docs/
~/.cursor/skills/benjamin-docs/
```

Codex, Cursor, and Claude Code can use the shared `~/.agents/skills` install.

Claude Desktop / Claude.ai uses uploaded skills:

```bash
benjamin-docs package-skill
```

Then upload `~/Downloads/benjamin-docs-skill.zip` in Claude.

## Main Commands

Start here:

```bash
benjamin-docs init
benjamin-docs ready
benjamin-docs help
```

`init` creates project memory. `ready` checks setup, validation, docs quality, and continuation readiness. `help` shows the simple path.

For the full command drawer:

```bash
benjamin-docs commands
```

In an interactive terminal, choose with Up/Down or type a number, then press Enter to run the selected command.

Frequent users can use the short alias:

```bash
bd ready
```

## Turn A Chat Into Project Memory

If you only have a chat and no project folder yet, ask your agent:

```text
Use the benjamin-docs skill to create a project from this chat.
```

The agent should suggest:

```text
~/Documents/Benjamin Docs/<Project Name>
```

It should ask before creating files. After you confirm, it creates a local project with:

```text
README.md
benjamin-docs/
.benjamin-docs/
```

The skill runs planning setup, writes the starter project memory, and checks whether the project is ready. For the exact agent prompt:

```bash
benjamin-docs chat-project
```

## Use It In An Existing Project

For an existing app or codebase:

```bash
benjamin-docs init
```

In an obvious codebase, `init` sets up codebase memory and repo-local agent guidance automatically. Existing `AGENTS.md` files are preserved; Benjamin-owned sections are marked so they can be updated without rewriting the rest of the file.

Then ask your agent:

```text
Capture the current project baseline with benjamin-docs.
```

When the docs are captured:

```bash
benjamin-docs ready
```

Use mode flags only when you want to be specific:

```bash
benjamin-docs init --mode planning
benjamin-docs init --mode codebase
benjamin-docs init --mode feature --feature <slug>
benjamin-docs init --no-agent-contract
benjamin-docs next
```

## Check Readiness

```bash
benjamin-docs ready
```

`ready` runs the full gate: setup, validation, docs quality, and continuation readiness.

For agent handoff, `ready` expects `agent-brief.md` to name read-first docs, current state, checks to run, risks or hazards, and next actions.

If `ready` fails, use `benjamin-docs commands` to find lower-level diagnostics such as validation, review, or doctor checks.

## Refresh Project Memory

When useful docs already exist, generate Memory Views before the readiness gate:

```bash
benjamin-docs init
benjamin-docs views
benjamin-docs ready
```

`views` creates derived Markdown views for decisions, open questions, next actions, risks, and agent continuation. The source of truth stays in the project, feature, handoff, engineering, and release docs.

## What It Creates

```text
benjamin-docs/
  project/
  handoff/
  engineering/
  features/
  releases/

.benjamin-docs/
```

`benjamin-docs/` is for people and agents.

`.benjamin-docs/` is metadata for validation, scopes, anchors, and exports.

Existing `docs/` folders are left alone unless you explicitly configure otherwise.

## More Commands

Use `benjamin-docs commands` when you need advanced setup, diagnostics, exports, scope commands, or skill packaging.

Useful advanced examples:

```bash
benjamin-docs views
benjamin-docs review --changed
benjamin-docs anchor add homepage pages/index.js
benjamin-docs anchor list
benjamin-docs scope create feature checkout-redesign
benjamin-docs init --help
```

`views` generates local Memory Views under `benjamin-docs/views/`: decision log, open questions, next actions, risks, and agent continuation. The views are derived from managed Markdown docs so they are readable, diffable, and not a second source of truth.

`review --changed` checks git-changed work for likely project-memory updates. Use `benjamin-docs review --changed --since main` in PR-style workflows.

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
```

## Contributing

Keep it local-first.

Keep docs readable by non-programmers.

Keep agent workflows explicit.

Avoid magic that writes outside the project unless the user runs a clear command.
