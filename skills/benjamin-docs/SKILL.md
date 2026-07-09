---
name: benjamin-docs
description: Maintain persistent repo-local project memory for AI coding agents and humans.
---

# benjamin-docs

Use this skill when the user asks to capture, document, summarize, hand off, export, preserve a planning or development conversation, or create a project from a chat with `benjamin-docs`.

If the user says "Use the benjamin-docs skill to create a project from this chat" or similar, start the Chat-To-Project Workflow directly.

## Purpose

`benjamin-docs` gives projects persistent, repo-local memory for AI coding agents and humans. The Markdown docs are the storage format; the real job is continuity across sessions, decisions, implementation work, handoffs, exports, and future agents. Agents should treat Benjamin Docs as project knowledge they read before work and update after meaningful changes. It is useful when the user only has a chat, before code exists, inside existing codebases, and for individual feature scopes.

## Chat-To-Project Workflow

Use this workflow when the user asks to create a project from the current chat, turn this chat into a project, start a new project with `benjamin-docs`, or similar.

Critical rules:

- Always ask before creating files. Do not create the project until the user confirms.
- Always suggest `~/Documents/Benjamin Docs/<Project Name>` as the default location unless the user already gave an explicit path.
- Never silently use the current working directory for a chat-only project.
- Never use agent-specific, app-specific, or dated session folders such as `~/Documents/Codex/<date>/...`, `Codex`, `Claude`, `Cursor`, or `YYYY-MM-DD` paths unless the user explicitly asks for that exact location.
- If the current folder is under `~/Documents/Codex/`, treat it as a temporary Codex chat workspace, not as the user's chosen project folder.
- Do not write a loose Markdown summary as a fallback. If the CLI cannot be run, stop and explain what is missing.

1. Infer a human-readable project name from the chat when one is obvious. Preserve normal title casing and spaces for the folder name, for example `Atelier Edits`.
2. When the CLI is available, run `benjamin-docs chat-project --name "<Project Name>"` to get the exact confirmation and completion guidance.
3. Suggest `~/Documents/Benjamin Docs/<Project Name>` as the default location unless the user gave a different explicit location.
4. Confirm the target project name and local folder before creating files. Ask in plain language and avoid mentioning skill internals.
   Example:
   ```text
   I can create a new local project from this chat.

   Project name: Atelier Edits
   Suggested folder: ~/Documents/Benjamin Docs/Atelier Edits

   I will create:
   - README.md
   - benjamin-docs/
   - .benjamin-docs/

   I will capture:
   - the main project idea
   - important references and constraints
   - decisions and open questions
   - roadmap and next actions
   - human and agent handoff notes

   Reply "yes" to create it, or send a different path/name.
   ```
5. Wait for the user's confirmation. Only create files after the user replies with approval or a different explicit path/name.
6. Create the project folder.
7. Run the local CLI command inside that folder with `init --mode planning`.
8. Read `.benjamin-docs/config.json` and use its `docsRoot` value, usually `benjamin-docs`.
9. Create a simple top-level `README.md` for the new project unless one already exists. Keep it plain-language and include:
   - project name
   - one-paragraph summary
   - where to start in `benjamin-docs/`
   - current status
   - next actions
10. Populate the starter Benjamin docs from the current chat context:
   - `project/brief.md`
   - `project/roadmap.md`
   - `project/open-questions.md`
   - `handoff/human-brief.md`
   - `handoff/agent-brief.md`
11. Do not invent certainty. Mark assumptions and unresolved questions clearly.
12. Run the local CLI command with `views` so derived Memory Views are refreshed after the source docs are captured.
13. Run the local CLI command with `ready` as the completion gate for the created project.
14. If `ready` fails, use lower-level checks such as `validate`, `review`, or `doctor --strict` only to diagnose the failed result, then fix weak docs or setup gaps before claiming the project is ready.
15. Report the created project path, project structure, main docs updated, generated views, key decisions captured, unresolved questions, and whether `ready` passed. Mention lower-level checks only if you ran them.

When reporting completion, do not imply the project is only a few files. Say the project structure was created:

- `README.md`
- `benjamin-docs/` with project, handoff, engineering, features, and releases docs
- `.benjamin-docs/` with config, manifest, scopes, and anchors metadata

Then list the main docs updated, usually:

- `benjamin-docs/project/brief.md`
- `benjamin-docs/project/roadmap.md`
- `benjamin-docs/project/open-questions.md`
- `benjamin-docs/handoff/human-brief.md`
- `benjamin-docs/handoff/agent-brief.md`

Do not overwrite an existing top-level `README.md` unless the user explicitly asks. If the target folder already contains a project, switch to the normal capture workflow instead of treating it as a brand-new chat-created project.

When confirming a chat-created project, keep the message mobile-friendly. Prefer short sections and bullets over dense paragraphs, especially for what will be captured.

## Workflow

1. Choose the local CLI command:
   - Prefer `benjamin-docs` when it is available on `PATH`.
   - In this repo, run `pnpm build` when needed and use `node dist/src/cli.js`.
   - In another repo, use `pnpm exec benjamin-docs` only when this repo's package has been installed or linked locally.
   - If neither command is available, ask the user whether to install/link the CLI or use the source repo directly.
   - If setup is unclear, run `benjamin-docs doctor` before changing project docs.
2. Check whether `.benjamin-docs/config.json` exists.
3. If it does not exist, run the local CLI command with `init`, then run `next` to get the recommended capture prompt.
4. Read `.benjamin-docs/config.json` and use its `docsRoot` value as the Benjamin docs workspace. The default is `benjamin-docs`.
5. Decide the capture scope:
   - project: whole project, product, app, or business
   - feature: one feature, module, redesign, experiment, or v2 plan
   - handoff: context for another person or future agent
   - release: shipped change notes
6. Use CLI-created templates when possible. Use `scope create feature <slug>` for feature scopes only; V1 does not create release or handoff scopes through `scope create`. When a feature ships or is abandoned, run `scope status <slug> archived` so it drops out of generated Memory Views.
7. For release and handoff docs, update existing docs created by `init` or `promote --to codebase` when they fit. If no suitable starter doc exists, create manual docs with valid frontmatter until CLI support exists.
8. Write durable Benjamin-managed docs only under the configured docs root, usually `benjamin-docs/`.
9. Existing `docs/` directories may be read as project context, but do not create or update Benjamin-managed docs there unless `.benjamin-docs/config.json` explicitly sets `docsRoot` to `docs`.
10. Update existing docs instead of dumping a transcript.
11. After code, config, schema, test, workflow, or product behavior changes, run a docs-impact pass before final response:
   - review the git diff
   - update the smallest relevant Benjamin source docs
   - update project-level docs when feature work changes roadmap, architecture, code map, release notes, risks, or handoff context
   - if no docs update is needed, state why the change has no durable project-memory impact
12. For a baseline capture, handoff, or any request asking whether the project is ready, run the local CLI command with `views` first when the docs have meaningful captured content so the derived Memory Views stay current.
13. Then run the local CLI command with `ready` as the primary gate.
14. Use `review --changed` when git history is available to catch source changes that probably need project-memory updates.
15. Use lower-level checks such as `validate`, `review`, or `doctor --strict` when debugging a failed `ready` result or when the user asks for that specific check.
16. When project checks are blocked by local prerequisites, record that plainly in handoff docs as an environment/tooling blocker, for example missing `cargo`, unavailable `uv`/Bun, PostgreSQL not listening, or Docker not running. Do not frame those as implementation failures unless the project itself is broken after the prerequisite is available.
17. Report changed files, generated views when refreshed, key decisions captured, unresolved questions, environment/tooling blockers, and whether `ready` passed when readiness was relevant. Mention lower-level checks only if you ran them.

## Export Workflow

Use this workflow when the user asks to export feature docs, app docs, customer handoff docs, or a concise project deliverable.

Human-facing rule:

- Teach people `bd export` or `benjamin-docs export` as the normal command.
- Do not make ordinary users memorize feature slugs, profiles, or advanced flags.

Agent/automation rule:

- Agents may use direct flags when the target is clear:
  - `bd export --list`
  - `bd export --verify <slug> --evidence "<what the agent checked>"`
  - `bd export --feature <slug> --profile customer`
  - `bd export --feature <slug> --profile developer`
  - `bd export --type app --profile customer`
  - `bd export --type handoff --profile customer`
  - `bd export --type summary --profile customer`
  - `bd export --audience <audience>`
- Treat direct flags as an API for agents and scripts, not as the primary human UX.
- Generated export files under `exports/` are snapshots. They do not update automatically while the project changes. Keep source docs current, then rerun `bd export` to overwrite the generated artifact with current content, `exported_at`, source docs, source commit, and dirty-state metadata.
- Use `--detail brief`, `--detail standard`, or `--detail detailed` only when automation needs to choose a conciseness level. For humans, let the guided menu ask.

Before customer-facing feature exports:

1. Verify the feature implementation against the Benjamin Docs source docs.
2. Check whether documented behavior, limitations, roles, UI flow, and edge cases match the actual code.
3. Record the verification with `bd export --verify <slug> --evidence "<what the agent checked>"`. Evidence should name the routes, components, mutations, RPCs, tests, workflows, or manual checks actually inspected.
4. If the docs are stale, thin, private-only, or implementation verification is missing, update the docs before retrying export.
5. Customer-facing exports should use safe language. Do not leak agent-only notes, implementation risks, secrets, environment details, or private internal instructions.

If `bd export` blocks with a readiness prompt, follow that prompt first. Do not bypass a blocked customer export unless the user explicitly accepts the risk.

When a feature does not exist, do not invent export content. Create or update the feature scope first, then make the docs export-ready.

When a feature name is misspelled and BD suggests a close match, use the suggested existing feature only if it matches the user's intent.

## Existing Project Baseline Workflow

Use this workflow when the user asks to document an existing app, capture the current project baseline, initialize Benjamin Docs in a codebase, or prepare a repo for future agents.

1. Run the local CLI command with `status`. If the project is not initialized, run `init`. In an obvious codebase, current CLI versions default plain non-interactive `init` to codebase memory with repo-local agent guidance. Use explicit flags only when automation needs to override the default, such as `init --mode planning`, `init --mode codebase`, or `init --no-agent-contract`.
2. Read `.benjamin-docs/config.json`, `.benjamin-docs/manifest.json`, root `AGENTS.md` when present, package/config files, README files, and the main source tree map. Prefer `rg --files` for discovery.
3. Identify what kind of project this is, the main runtime/framework, data sources, external services, build/test commands, and known operational risks.
4. Update the existing baseline docs instead of creating parallel summaries:
   - `project/brief.md`
   - `project/roadmap.md`
   - `project/open-questions.md`
   - `handoff/human-brief.md`
   - `handoff/agent-brief.md`
   - `engineering/architecture.md`
   - `engineering/code-map.md`
   - `features/index.md`
   - `releases/changelog.md`
5. Keep generated starter text only when it is still true. Replace placeholder content with concrete project context.
6. If code references matter, add anchors with `anchor add <id> <file>` instead of only mentioning paths in prose. Use `anchor list` when you need to inspect existing anchors.
7. Run the local CLI command with `views` to refresh derived Memory Views.
8. Run the local CLI command with `ready`. If it fails, fix the docs or setup gap before claiming the baseline is ready.
9. Summarize the baseline in terms a future maintainer can act on: what the project is, how to run it, where the important code lives, what is risky, and what should happen next.

Do not describe this as "documenting an existing codebase" when that would be misleading. A project may be new, half-built, or freshly generated. Prefer "capture the current project baseline" in user-facing summaries.

## Feature Or Change Plan Workflow

Use this workflow when the user asks to plan, document, hand off, or continue one feature, change, redesign, experiment, migration, bug fix, or release slice.

1. Check whether the project is initialized. If not, run `init --mode feature --feature <slug>` when a clear feature slug exists, otherwise run `init` and ask the user for the feature name only if it is needed.
2. If the project is already initialized, use `scope create feature <slug>` when the feature does not already have a scope.
3. Read the project brief, roadmap, open questions, agent brief, and any existing feature docs before editing.
4. Update the feature docs:
   - `features/<slug>/brief.md`: outcome, user/project value, scope, non-goals
   - `features/<slug>/plan.md`: implementation steps, validation, rollout/checks
   - `features/<slug>/decisions.md`: decisions, rejected options, reasoning
   - `features/<slug>/handoff.md`: status, risks/open questions, next actions
5. Update project-level docs when the feature changes overall roadmap, architecture, code map, release state, risks, or handoff context. Feature docs are not enough when project-level memory would otherwise become stale.
6. Use anchors for important code files when code exists.
7. Run `review --changed` when git history is available after implementation work, especially when app routes, schemas, tests, config, workflows, or release-relevant behavior changed.
8. Run `views` when the feature docs are intended for handoff so project-level Memory Views include the latest feature decisions, risks, and next actions.
9. Run `ready` when the feature docs are intended for handoff. Use lower-level checks only to diagnose failures.

Keep the user-facing summary short: feature scope created or updated, main decisions captured, risks/open questions, next action, and readiness result.

## Handoff Or Existing-Doc Update Workflow

Use this workflow when the user asks to update project memory, prepare a handoff, summarize recent work, or preserve decisions from the current conversation.

1. Read existing Benjamin docs first. Do not create a parallel summary if an existing doc fits.
2. Identify the smallest durable update:
   - project state belongs in `project/brief.md`
   - sequencing belongs in `project/roadmap.md`
   - unresolved decisions belong in `project/open-questions.md`
   - human-facing context belongs in `handoff/human-brief.md`
   - agent-facing continuation context belongs in `handoff/agent-brief.md`
   - implementation details belong in feature docs or engineering docs
3. Preserve useful historical decisions. Replace only stale starter text, duplicated summaries, or outdated claims.
4. Mark assumptions and uncertainties explicitly.
5. Run `views` if the user is relying on the handoff and the update changes decisions, open questions, risks, next actions, or continuation context.
6. Run `ready` if the user is relying on the handoff. If `ready` fails, fix the docs before claiming handoff readiness.

## Updating Existing Benjamin Docs

When Benjamin docs already exist, treat them as project memory, not disposable generated output.

- Read the current doc before editing it.
- Preserve frontmatter fields unless there is a concrete reason to change them.
- Preserve useful historical decisions, shipped notes, and open questions.
- Replace stale starter text, duplicated summaries, and outdated assumptions.
- Merge new information into the most specific existing doc.
- Create a new feature scope only when the work is actually a distinct feature, change, experiment, or plan.
- Do not make the docs look more certain than the evidence supports. Mark assumptions and unknowns clearly.
- If a doc is long or mixed-purpose, suggest a split before rewriting it wholesale.

When updating docs from a chat, capture the durable decisions and state transitions. Do not preserve conversational order unless the timeline itself is important.

## Changed Work Freshness

When project work changes code, config, schema, tests, workflows, user-facing behavior, release state, or operational posture, do not stop at feature-level notes if project-level docs became false or stale.

Use this completion loop:

1. Review the git diff and identify changed areas.
2. Update the smallest relevant Benjamin source docs.
3. Regenerate Memory Views with `views` when source docs changed.
4. Run `review --changed` when git history is available.
5. Run `drift` to catch docs whose watched code changed in earlier commits without a doc update.
6. Run `ready` before claiming handoff readiness.

`review` and `ready` also report deterministic staleness signals. Fix them by updating docs, not by weakening them:

- "Freshness blind spot": a status-bearing or active feature doc is not matched by any `watch` rule, so changed work can never flag it stale; add the doc to the relevant watch rule, add a feature-specific rule, or mark the stale/finished scope archived.
- "source files changed since this doc last changed in git": re-verify `architecture.md` or `code-map.md` against the current code and update what changed.
- "References missing path": the doc points at a file that no longer exists; fix the reference.
- "Memory View is stale": run `views` to regenerate.
- "May need update because changed source files affect ...": the warning names the watched area; update that doc or state why no update is needed. The mapping comes from `watch` rules in `.benjamin-docs/config.json`, which can be adapted per project.

For volatile project state, prefer one canonical status source and point to it from handoff docs instead of repeating exact counts, phase names, or next-item claims in many places.

Expected doc targets:

- schema, database, service boundaries, or data flow changes: `engineering/architecture.md` and `engineering/code-map.md`
- routes, modules, pages, components, or tests added: `engineering/code-map.md` and relevant feature docs
- roadmap, status, or next-action changes: `project/roadmap.md`
- unresolved decisions: `project/open-questions.md`
- continuation instructions, commands, hazards, or current state: `handoff/agent-brief.md`
- human-facing project status: `handoff/human-brief.md`
- shipped or release-relevant changes: `releases/changelog.md`

If no Benjamin Docs update is needed, say why in the final response. The reason should be concrete, for example "only reformatted code; no behavior, workflow, architecture, or handoff context changed."

For `benjamin-docs` package releases, do not stop after npm publish. After publishing the tarball, run `pnpm run release:github` to create or reuse the matching version tag and GitHub Release, then run `pnpm run release:verify-public` to confirm npm, the local tag, the origin tag, the GitHub Release, and GitHub's latest-release pointer all agree.

## Drift And Session Hooks

`benjamin-docs drift` compares each watched doc against committed git history: a doc is drifted when files matching its `watch` rules changed in commits after the doc last changed. Drift is advisory. When a session starts with drift reported, or `ready` shows a "Drift (advisory)" section, re-verify the listed docs against the current code, then update them or state why they still hold. Use `drift --json` for machine-readable results and `drift --strict` only in CI-style gates.

`benjamin-docs hooks install` wires session hooks for Claude Code (`.claude/settings.json`), Codex (`.codex/hooks.json`), and Cursor (`.cursor/hooks.json`):

- At session start, the hook injects compact project-memory context (read-first docs plus a drift summary) via `benjamin-docs session-start`.
- At stop, `benjamin-docs session-stop` nudges once when source files changed but no Benjamin doc was updated. Respond by updating the relevant docs, or state briefly why no memory update is needed, then finish.

Only install hooks when the user consents (interactive `init` asks; automation uses `init --hooks` or `hooks install`). Never edit the user's other hook entries; `hooks uninstall` removes only Benjamin-owned entries. Codex additionally needs `features.hooks = true` in `~/.codex/config.toml` and hook trust via `/hooks`; tell the user when that applies.

When a session-start hook already injected Benjamin Docs context, do not re-read the whole memory tree; read the specific docs the context names, plus whatever the task needs.

## MCP Memory Tools

When the `benjamin-docs` MCP server is registered (`benjamin-docs mcp install`), prefer its tools over raw file access:

- Start with `memory_context` (pass the task) instead of reading the whole memory tree.
- Use `memory_search` before `memory_read`; read whole docs only when the section snippets are not enough.
- Write through `memory_update` and `memory_record_decision` instead of editing managed Markdown directly: frontmatter is preserved, the updated date is stamped, validation runs on write with rollback, and Memory Views regenerate automatically.
- `memory_status` covers status plus drift; use it before suggesting `benjamin-docs drift` output to the user.

Direct file editing remains correct when the MCP server is not available, or for docs outside the manifest. Suggest `benjamin-docs mcp install` (do not run it silently) when a project has memory but no MCP registration.

## Upgrades And Update Notices

When session-start context or `ready` says the repo's Benjamin Docs setup is older than the installed CLI, run `benjamin-docs upgrade`. It is repo-local and safe: it stamps the CLI version into metadata, refreshes only the Benjamin-owned `AGENTS.md` section, refreshes skill installs, regenerates existing Memory Views, and reports hook status. It never rewrites user-authored content.

When the context says a newer `benjamin-docs` version is available on npm, suggest the update to the user rather than running it silently; updating a global package changes their machine. The command to suggest: `pnpm update -g benjamin-docs` (or `npm update -g benjamin-docs`), followed by `benjamin-docs upgrade` in the repo. Update checks are cached and can be disabled with `BENJAMIN_DOCS_NO_UPDATE_CHECK=1`; respect that choice if the user set it.

## Agent Guidance / AGENTS.md

When initializing or updating a codebase, app, feature, or change project and the user wants future agents to work from project memory, prefer:

```bash
benjamin-docs init
```

In an obvious codebase, current CLI versions default `init` to codebase memory with agent guidance. Use `benjamin-docs init --no-agent-contract` only when the user explicitly does not want repo-local agent guidance.

Never overwrite an existing `AGENTS.md`.

Treat existing agent instructions as user-owned source material. Current CLI versions may append a clearly marked Benjamin-owned section, but all existing content must be preserved.

If `AGENTS.md` is long or complex, still consider and suggest one of these paths:

- add a Benjamin Docs section
- split long guidance into child `AGENTS.md` files
- rewrite existing guidance only with explicit user approval

If `AGENTS.md` is already long, contradictory, outdated, or mixes global rules with project-specific details, do not silently rewrite it. Report the issue and propose the smallest useful improvement:

- add a short Benjamin-owned section that points to `benjamin-docs/`
- move docs-specific guidance into `benjamin-docs/AGENTS.md`
- split area-specific guidance into child `AGENTS.md` files near the relevant subtree
- rewrite the file only after the user explicitly approves the rewrite

After changing or installing agent guidance, run `ready` or `doctor --strict` so broken root/child guidance is caught before handoff.

## Capture Quality

Capture:

- agreed decisions
- rejected options
- open questions
- current plan
- audience-specific summaries
- relevant code references when code exists
- recommended next actions
- evidence behind risky claims

Do not capture raw transcript unless the user explicitly asks for an archive.

Before calling a capture done, check that a future person or agent can answer:

- What is this project or feature?
- What changed or was decided?
- What should happen next?
- What is still unknown?
- Where should I look in the repo?
- What should I avoid breaking?

If those answers are missing, keep editing the docs before running the final readiness gate.

## Continuation Proof

Before claiming that project memory is ready, make `handoff/agent-brief.md` prove that a future agent can continue without the original chat.

Include:

- read-first docs or files
- current state or status
- commands, tests, validation steps, or manual checks to run
- risks, hazards, assumptions, or things to avoid
- exact next actions

Equivalent wording is fine, but the evidence must be concrete. If one of these pieces is missing, update the handoff before running `ready`.

## Agent-Ready Memory Checklist

Use this checklist before claiming that a capture is complete.

- `project/brief.md`: purpose, audience, current state, non-goals, and why the project matters.
- `project/roadmap.md`: now, next, later/deferred work, risks, and explicit non-goals when relevant.
- `project/open-questions.md`: unresolved decisions as questions, with context and likely options.
- `handoff/human-brief.md`: plain-language status, important decisions, risks, and next actions.
- `handoff/agent-brief.md`: read-first docs, commands/checks to run, hazards to avoid, current status, and next actions.
- `engineering/architecture.md`: runtime, boundaries, services/data, constraints, and important architectural decisions when code exists.
- `engineering/code-map.md`: concrete file paths, modules, routes, schemas, tests, and why each matters when code exists.
- feature `brief.md`: outcome, value, scope, and non-goals.
- feature `plan.md`: implementation steps, validation/checks, and rollout or handoff criteria.
- feature `decisions.md`: decisions, rejected options, and reasoning.
- feature `handoff.md`: status, risks/open questions, and next actions.

For planning-only projects with no code yet, do not invent architecture or code paths. State that code does not exist yet and describe the intended shape only when the user has provided it.

## Doc Format

Every Benjamin-managed Markdown file under the configured docs root must validate. Preserve existing frontmatter when updating docs, including fields you are not changing.

For new feature docs, prefer files created by `scope create feature <slug>`. For project, release, and handoff docs, prefer existing files created by `init` or `promote --to codebase`. If you must create a Markdown file manually, include all required frontmatter fields:

```yaml
---
title: Booking Capacity Plan
scope: feature
scope_id: booking-capacity
audience: [developer, agent]
status: draft
visibility: private
updated: 2026-06-03
source: session-capture
---
```

Allowed `scope` values are `project`, `feature`, `release`, and `handoff`. Allowed `audience` values are `developer`, `designer`, `agent`, `business`, `public`, `user`, and `advisor`. Allowed `status` values are `draft`, `review`, `approved`, `stale`, and `archived`. Allowed `visibility` values are `private`, `unlisted`, and `public`. Allowed `source` values are `session-capture`, `manual`, `codebase-scan`, and `release-sync`.

Use `source: session-capture` for docs synthesized from the current conversation. Keep `updated` as an ISO date in `YYYY-MM-DD` format.

## Constructive Challenge

Do not act as a passive note taker. Preserve the user's intent, but speak up when the plan has weak assumptions, missing decisions, contradictory goals, overbuilt V1 scope, unclear audiences, or risks that future humans and agents need to know.

Pushback should be direct, specific, and useful. Offer a better alternative when possible.
