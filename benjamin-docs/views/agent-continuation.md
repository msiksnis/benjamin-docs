---
title: Agent Continuation View
scope: project
scope_id: project
audience: [agent]
status: draft
visibility: private
updated: 2026-06-14
source: manual
---

# Agent Continuation View

Derived from continuation-proof, read-first, current-state, check, risk, and next-action sections for future agents.

## [Freshness And Lifecycle Handoff](../features/freshness-and-lifecycle/handoff.md)

Source: `benjamin-docs/features/freshness-and-lifecycle/handoff.md` (updated 2026-06-14)

### Risks / Open Questions

- The churn threshold (10 source files) is a first guess; dogfooding on active projects should tune it.
- The generic default watch globs may over-warn in monorepos where `src/**` is huge; per-project `watch` customization is the escape hatch.
- Existing projects will see a one-time "Memory View is stale" warning after upgrading because the renderer changed; `bd views` resolves it.
- Path liveness skips references whose first segment does not exist in the repo, so fully deleted top-level directories silently stop being checked.
- Older projects with custom `watch` rules will not be silently migrated; `review` / `ready` surface blind spots so humans or agents can update config deliberately.

### Next Actions

- Authenticate npm, publish 0.8.0 from a freshly packed tarball, smoke-test a fresh install, update the installed/uploadable skill artifacts if needed, and tag the release.
- Dogfood the freshness blind-spot warnings on older initialized projects and tune the default watch graph.
- Consider `--json` output for `ready`/`review` plus a GitHub Action as the next milestone.

### Continuation Proof

Read first: `benjamin-docs/features/freshness-and-lifecycle/brief.md`, `src/watch.ts`, `src/review.ts`, `src/views.ts`.

Current status: code, docs, installed skills, Claude upload zip, `bd ready`, and `pnpm run release:check` are done on this machine; npm publish is blocked by authentication.

Checks to run:

```bash
pnpm check
node dist/src/cli.js review --changed --since HEAD
node dist/src/cli.js ready
```

Risks: keep all new checks warning-only inside `review`; keep `review` read-only; do not add primary commands.

Exact next action: run `npm login`, then publish `benjamin-docs@0.8.0` from a freshly packed tarball.

## [Agent Brief](../handoff/agent-brief.md)

Source: `benjamin-docs/handoff/agent-brief.md` (updated 2026-06-14)

### Current State

`benjamin-docs` is a published npm CLI and bundled agent skill for repo-local project memory. It turns planning/build conversations into structured Markdown docs in `benjamin-docs/` plus deterministic metadata in `.benjamin-docs/`.

The source repo is:

- Local path: `/Users/marty/Important/benjamin-docs`
- GitHub repo: `msiksnis/benjamin-docs`
- Main branch: `main`
- Package/CLI name: `benjamin-docs`
- Package status: `0.7.0` published on npm.
- Working package version: `0.8.0` for freshness coverage / staleness blind-spot protection.

The project has been renamed fully from the earlier working name `agent-docs`; do not reintroduce that name.

### Continuation Proof

Read first:

- `README.md`
- `benjamin-docs/project/brief.md`
- `benjamin-docs/project/roadmap.md`
- `benjamin-docs/project/open-questions.md`
- `benjamin-docs/handoff/human-brief.md`
- `docs/superpowers/plans/2026-06-10-continuation-proof.md`

Current state: 0.7.0 is published. The 0.8.0 work is implemented and release checks pass locally: freshness coverage warnings for status-bearing and active feature docs, `freshness: status` frontmatter, broader default watch rules, feature-scope watch registration, and templates that separate durable handoff context from volatile status facts. `npm publish` was attempted on 2026-06-14 but blocked because the local npm session is unauthenticated (`npm whoami` returns E401); `npm view benjamin-docs version` still reports 0.7.0.

Commands/checks to run before handoff:

```bash
pnpm check
node dist/src/cli.js review --changed --since HEAD
pnpm run release:check
node dist/src/cli.js ready
```

Risks/hazards: do not add more primary commands, keep all review checks deterministic and warning-only inside `review` (only `ready` escalates), keep `review` read-only (checks must not mutate the project), do not overwrite user-owned `AGENTS.md`, do not require exact headings when equivalent continuation evidence exists, and avoid making planning-only projects invent code paths. Freshness coverage warnings should reveal blind spots, not force every tiny code edit to rewrite every doc.

Next actions: authenticate npm, publish 0.8.0 from a freshly packed tarball, smoke-test a fresh npm install, tag the release, then dogfood the blind-spot warnings on older initialized projects.
