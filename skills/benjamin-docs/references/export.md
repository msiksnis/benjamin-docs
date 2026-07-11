# Export Workflow

Read this reference only when the user asks for a feature export, app docs, a customer or developer handoff, a project summary, or a publication check.

## Human versus agent use

Teach people `bd export` or `benjamin-docs export` as the normal guided command. Do not make ordinary users memorize feature slugs, profiles, detail levels, or advanced flags.

Agents and automation may use direct flags when the target is clear:

- `bd export --list`
- `bd export --verify <slug> --evidence "Checked: file:<repo path>, test:<name>, or manual:<workflow>; Result: <what matched, passed, failed, or was observed>."`
- `bd export --feature <slug> --profile customer`
- `bd export --feature <slug> --profile developer`
- `bd export --type app --profile customer`
- `bd export --type handoff --profile customer`
- `bd export --type summary --profile customer`
- `bd export --audience <audience>`

Treat direct flags as an API for agents and scripts, not the primary human UX. Use `--detail brief`, `--detail standard`, or `--detail detailed` only when automation must select conciseness; let the guided menu ask humans.

Generated files under `exports/` are snapshots, not maintained source docs. They do not update automatically. Keep source docs current, then rerun `bd export` to replace the artifact with current content, `exported_at`, source-doc, source-commit, and dirty-state metadata.

## Verify before customer or public export

Before a customer-facing feature export:

1. Verify the implementation against the Benjamin Docs source docs.
2. Check documented behavior, limitations, roles, UI flow, and edge cases against the actual code.
3. Record the check with `bd export --verify <slug> --evidence "Checked: file:<repo path>, route:<route>, component:<name>, test:<name>, or manual:<workflow>; Result: <what matched, passed, failed, or was observed>."`. Name at least one typed artifact or check and give an observed result; a marker or vague token is not evidence.
4. If docs are stale, thin, private-only, or missing implementation verification, update them before retrying.
5. If `bd export` blocks with a readiness prompt, follow it first. Do not bypass a blocked customer export unless the user explicitly accepts the risk.

If a feature does not exist, do not invent export content. Create or update its feature scope first. When BD suggests a close match for a misspelled feature, use it only if it matches the user's intent.

## Privacy and publication

- Customer and public exports must not leak agent-only notes, implementation risks, secrets, credentials, environment details, private internal instructions, pricing, or private commercial strategy.
- Treat `visibility` as document/export metadata, not proof that a repository or file is confidential or publicly safe.
- Do not publish content merely because a profile or audience can render it. Inspect the selected source docs and the generated artifact.
- Benjamin Docs scans the complete rendered customer artifact before writing, including generated metadata and titles. The generated snapshot records that verification evidence exists; it does not claim the CLI semantically proved the implementation.
- In a public repository, do not capture private commercial strategy, pricing, or future paid-service planning in tracked Benjamin Docs unless the user explicitly marks it public-safe.
- Use safe, audience-appropriate language and keep evidence concrete without exposing sensitive internals.
