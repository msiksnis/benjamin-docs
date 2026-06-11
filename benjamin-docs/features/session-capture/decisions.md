---
title: session-capture Decisions
scope: feature
scope_id: session-capture
audience: [developer, agent]
status: archived
visibility: private
updated: 2026-06-11
source: manual
---

# session-capture Decisions

- Markdown under the configured docs root, currently `benjamin-docs/`, is the source of truth; JSON metadata exists for validation, indexing, scopes, anchors, exports, and future SaaS sync.
- The CLI owns deterministic structure and integrity. It does not attempt judgment-heavy synthesis from conversation context.
- The Codex/Claude skill owns conversation synthesis and should challenge weak plans, missing context, and risky assumptions.
- V1 stays small: TypeScript CLI, no runtime dependencies, pnpm development workflow, and local exports before any hosted SaaS.
