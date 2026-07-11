# benjamin-docs

**Persistent project memory for AI coding agents.**

Benjamin Docs keeps the durable facts an agent needs beside the work: purpose, decisions, architecture, current state, risks, and next actions. Git records what changed; project memory records why and what should happen next.

The memory is ordinary Markdown under `benjamin-docs/`, with deterministic metadata under `.benjamin-docs/`. There is no hosted service, dashboard, or transcript store.

[npm package](https://www.npmjs.com/package/benjamin-docs)

## Why Project Memory Exists

AI coding sessions often start cold. Chat history is incomplete, root instruction files are too broad, and decisions disappear into old conversations. Benjamin Docs gives humans and agents a maintained, repo-local source of project context.

Agents maintain the project memory during normal work. The CLI provides structure, retrieval, validation, freshness evidence, generated views, and safe exports; it is not a background author and does not decide whether prose is true.

## One-Minute Start

```bash
pnpm add -g benjamin-docs
bd install-skill
cd your-project
bd init
```

`bd init` creates the project-memory structure, preserves existing docs and agent instructions, and can offer optional integrations with your consent.

Then ask your agent:

```text
Read the Benjamin Docs project memory, capture the current project baseline, and keep it updated as you work.
```

The normal human-facing flow stays small:

```bash
bd init
bd ready
bd export
```

Use `bd commands` for the complete advanced command drawer.

## What It Creates

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

`benjamin-docs/` contains managed project memory. `.benjamin-docs/` contains deterministic config, manifests, scopes, anchors, watch rules, and export metadata.

## Exact Readiness Guarantees

`bd ready` reports independent dimensions instead of collapsing different kinds of evidence into one claim:

- structure: managed files, metadata, links, anchors, and safe paths;
- content heuristics: starter text, thin docs, and continuation-proof signals;
- committed freshness: watched docs compared with complete committed Git changes;
- working-tree impact: staged, unstaged, untracked, deleted, and renamed work that may require a memory update;
- agent guidance: repository-local Benjamin-owned guidance health.

When a blocking dimension fails, `bd ready` reports the evidence and a repair command. Optional machine-wide integrations are checked separately with `bd doctor --target <target>` and do not make repository memory fail readiness.

Deterministic checks do not prove semantic truth. They prove only the configured structural, heuristic, Git-freshness, changed-work, and guidance conditions. An agent or human must still verify that the memory accurately describes the implementation.

## Session Hooks And Upgrades

After updating the package, run `bd upgrade` once in each initialized repository. It refreshes Benjamin-owned project metadata, agent guidance, the current skill bundle, existing Memory Views, and session-start hooks for Claude Code, Codex, and Cursor. It removes legacy Benjamin stop hooks while preserving user-owned configuration. No separate hook command is required. Use `bd upgrade --no-hooks` only when the environment must opt out of hooks.

`session-start` supplies a compact pointer/context packet: the memory root, read-first files, and bounded freshness hints. It does not load the whole memory tree or guarantee that the agent reads every document. Benjamin Docs never needs to alter the substantive final answer; agents maintain durable memory during normal work and answer the original request completely.

Advanced hook management remains available through `bd hooks install|status|uninstall`.

## Optional MCP Memory Tools

```bash
bd mcp install
```

MCP-capable agents can search, read, update, record decisions, and inspect status through a local stdio server. Access stays limited to manifest-managed project memory, and writes are validated transactionally. Remove registrations with `bd mcp uninstall`.

## Freshness And Derived Views

`bd drift` compares watched docs with committed Git history. `bd review --changed` accounts for the full working tree. `bd views` regenerates derived lenses for decisions, open questions, risks, next actions, and continuation context.

```bash
bd drift
bd review --changed
bd views
bd ready
```

Views are generated from managed source docs; they are not a second source of truth.

## Safe Exports And Visibility

`bd export` creates a local snapshot for a feature, app, summary, or handoff. Customer exports fail closed when source material is private, unverified, risky, or contains unsafe output. The complete rendered artifact is scanned before any write. Agents record a typed artifact or manual check plus its observed result before retrying an export; the CLI records that evidence but does not claim to prove semantic truth.

```bash
bd export --verify checkout --evidence "Checked: route:/checkout, component:CheckoutForm, test:checkout permissions; Result: matched documented success, denial, and error states."
bd export --feature checkout --profile customer
```

The `visibility` field is publication metadata for export policy. Publication metadata does not change Git repository visibility, filesystem permissions, or access control. A document marked `private` is not confidential if it is committed to a public repository. Review generated exports before sharing them.

## Skill Installation And Packaging

`bd install-skill` installs the bundled skill for supported local agents. Claude Desktop and Claude.ai can use a generated upload bundle:

```bash
bd package-skill
```

The ZIP is generated from the packaged `SKILL.md` and its three references. It is a release artifact, not tracked source.

## Updates And Network Boundary

Ordinary project-memory reads and writes make no network calls. Benjamin Docs can perform a cached, opt-out npm version check; disable it with `BENJAMIN_DOCS_NO_UPDATE_CHECK=1`. Package updates remain explicit; after updating, run `bd upgrade` once in each initialized repository to refresh its Benjamin-owned surfaces and integrations.

## Chat-Only Projects

From a chat with no project folder, ask:

```text
Use the benjamin-docs skill to create a project from this chat.
```

The agent should propose `~/Documents/Benjamin Docs/<Project Name>` and ask before creating files. Run `bd chat-project` for the exact workflow.

## Reference

- Run `bd help` for the short first-run guide.
- Run `bd commands` for all commands and automation flags.
- See [`benjamin-docs/releases/changelog.md`](benjamin-docs/releases/changelog.md) for release history.
- See [`CONTRIBUTING.md`](CONTRIBUTING.md) for development rules.
- See [`SECURITY.md`](SECURITY.md) for the exact write and network boundaries.

## Local Development

```bash
git clone https://github.com/msiksnis/benjamin-docs.git
cd benjamin-docs
pnpm install
pnpm check
npm pack --json --dry-run
```

Release automation generates and verifies the upload ZIP before creating a GitHub Release. It does not publish the npm package.
