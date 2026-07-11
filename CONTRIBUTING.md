# Contributing

Thanks for taking a look at `benjamin-docs`.

This project is early. The current priority is to keep the core CLI small, deterministic, and useful for repo-local project memory before adding hosted publishing or heavier integrations.

## Development

```bash
pnpm install
pnpm check
```

`pnpm check` runs typecheck, build, and tests.

## Before Opening A Pull Request

- Keep changes scoped and explain the user problem.
- Add or update tests for behavior changes.
- Run `pnpm check`.
- Run `node dist/src/cli.js validate` when docs change.
- Avoid adding runtime dependencies unless there is a strong reason.
- `main` is protected: use a feature branch and open a pull request for all changes.

## Design Principles

- The CLI owns structure, validation, exports, scopes, and anchors.
- Agent skills own synthesis, judgment, and constructive pushback.
- Managed memory in `benjamin-docs/` should stay readable without special tooling.
- Generated files under `benjamin-docs/views/` must come from `bd views`; edit the managed source docs, then regenerate views instead of editing generated output directly.
- Metadata in `.benjamin-docs/` should stay boring, deterministic, and easy to validate.
- Hosted publishing is a future layer, not the source of truth.
