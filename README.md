# benjamin-docs

Local project memory for humans and AI agents.

[npm package](https://www.npmjs.com/package/benjamin-docs)

`benjamin-docs` turns useful chats into project docs.

It keeps decisions, plans, open questions, and handoff notes in Markdown files inside your project.

No cloud. No dashboard. No transcript dump.

## What It Solves

AI work gets lost in chat history.

You explain the same context again.

Future agents miss decisions.

Projects drift.

`benjamin-docs` gives the project a small local notebook that agents can keep up to date.

## Install

```bash
pnpm add -g benjamin-docs
benjamin-docs install-skill
benjamin-docs introduce
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

## Use It From Any Chat

If you only have a chat and no project folder yet, ask your agent:

```text
Use the benjamin-docs skill to create a project from this chat.
```

The agent should suggest:

```text
~/Documents/Benjamin Docs/<Project Name>
```

After you confirm, it creates a local project with:

```text
README.md
benjamin-docs/
.benjamin-docs/
```

## Use It In An Existing Project

From the project folder:

```bash
benjamin-docs init
benjamin-docs validate
```

Then ask your agent:

```text
Capture the current project baseline with benjamin-docs.
```

For an existing codebase:

```bash
benjamin-docs init --mode codebase
```

For one feature:

```bash
benjamin-docs init --mode feature --feature billing-reminders
```

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

## Useful Commands

```bash
benjamin-docs introduce
benjamin-docs install-skill
benjamin-docs doctor
benjamin-docs package-skill
benjamin-docs init
benjamin-docs next
benjamin-docs status
benjamin-docs validate
benjamin-docs scope create feature <slug>
benjamin-docs export --audience developer
```

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
