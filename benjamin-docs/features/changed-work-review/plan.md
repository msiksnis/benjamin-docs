---
title: Changed Work Review Plan
scope: feature
scope_id: changed-work-review
audience: [developer, agent]
status: review
visibility: private
updated: 2026-06-11
source: manual
---

# Changed Work Review Plan

This plan records the first implementation of `bd review --changed`.

## Steps

1. Extend `src/review.ts` with `ReviewOptions` so normal review behavior stays unchanged and changed-work review is opt-in.
2. Use git to collect changed files from `git diff --name-only --diff-filter=ACMRT <ref> --` plus untracked files from `git ls-files --others --exclude-standard`.
3. Ignore generated Benjamin views and metadata when deciding whether source docs were updated.
4. Classify changed files into coarse deterministic areas:
   - database/schema files such as `supabase/migrations/**`, SQL, and generated database types
   - application files such as `src/app/**`, `src/components/**`, and `src/lib/**`
   - configuration/workflow files such as `package.json`, config files, and GitHub workflows
5. Warn when source files changed but no Benjamin Docs source files changed.
6. Warn on likely missing project-level docs by mapping changed areas to `engineering/architecture.md`, `engineering/code-map.md`, `releases/changelog.md`, and `handoff/agent-brief.md`.
7. Add stale-claim checks for obvious "not implemented yet" language in project-level docs after related admin-route or schema changes.
8. Wire `review --changed` and `--since <git-ref>` through `src/cli.ts`.
9. Add the command to `src/commands.ts` as an advanced drawer item.
10. Strengthen generated `AGENTS.md` in `src/agent-contracts.ts` and the bundled skill in `skills/benjamin-docs/SKILL.md`.

## Validation

Targeted tests:

```bash
pnpm build
node --test dist/test/review.test.js dist/test/agent-contracts.test.js dist/test/commands.test.js
```

Expected full gate before release:

```bash
pnpm check
node dist/src/cli.js review --changed --since HEAD
node dist/src/cli.js views
node dist/src/cli.js ready
```

The changed-work tests create git fixture repos. They verify that untracked implementation files are included, source changes without source-doc updates produce warnings, and stale not-implemented claims are surfaced.
