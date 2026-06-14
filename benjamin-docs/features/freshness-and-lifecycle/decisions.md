---
title: Freshness And Lifecycle Decisions
scope: feature
scope_id: freshness-and-lifecycle
audience: [developer, agent]
status: review
visibility: private
updated: 2026-06-14
source: session-capture
freshness: status
---

# Freshness And Lifecycle Decisions

## Decisions

- Watch rules live in `.benjamin-docs/config.json` as data, not code, because users must be able to adapt the mapping to their stack without a release. `init` seeds generic defaults and preserves custom rules on re-init.
- The glob matcher is hand-rolled (`*`, `**`, `?`) to keep the zero-runtime-dependency rule.
- Doc churn is measured against git history (files changed since the doc's last commit, threshold 10) because git facts are stack-agnostic and cannot be gamed by wording. A doc with uncommitted edits is treated as fresh.
- Path liveness only checks inline-code references whose first path segment exists in the repo. This avoids false positives on examples like GitHub slugs while still catching renamed or deleted files.
- Stale-claim patterns are generic ("not implemented yet", "does not exist yet") and scoped to `architecture.md` and `code-map.md` only, because those docs describe the present. Roadmaps legitimately describe unbuilt work.
- View freshness runs inside plain `review` so `ready` fails on stale views, but `views` regeneration stays an explicit command. `review` stays read-only; checks must not mutate the project.
- Views exclude both `archived` and `stale` statuses: archived means done or abandoned, stale means flagged-as-outdated, and neither belongs in a current-memory lens. The source docs keep the content either way.
- `views` only rewrites files whose body changed, so the frontmatter `updated` date stays meaningful and diffs stay clean.
- `ready` should fail on freshness blind spots through plain `review`, not through a separate command or AI review mode. The problem is coverage visibility: BD cannot prove prose true, but it can prove whether a status doc is reachable by the configured watch graph.
- `freshness: status` is intentionally narrow. It marks docs whose present-tense status can rot, without creating a broad lifecycle taxonomy in frontmatter.
- `scope create feature <slug>` appends a feature-specific watch rule. Active feature docs are volatile by default, and relying on users to hand-edit config after every feature scope would recreate the original blind spot.
- Starter handoff templates now discourage duplicated volatile facts. Exact counters, phase names, and next-item claims should have one canonical home with pointers elsewhere.

## Rejected Options

- Auto-regenerating views inside `ready`: rejected because a gate that mutates the working tree is surprising in CI and weakens the "checks are read-only" rule.
- Keeping per-stack hardcoded paths with more stacks added: rejected; data-driven rules scale, hardcoded lists do not.
- An LLM-based review mode: rejected for this milestone; the CLI's value is being the deterministic referee the LLM cannot fudge.
- A separate `bd archive` command: rejected; `scope status` covers the lifecycle with one generic verb and no new top-level command.
- A semantic prose checker: rejected for this milestone; deterministic coverage warnings are the product contract, and prose truth remains the agent/human responsibility.
