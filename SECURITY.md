# Security Policy

## Supported Versions

`benjamin-docs` is pre-1.0. Security fixes target the latest published release and `main`. Older pre-1.0 releases are not guaranteed to receive backports unless the issue is severe.

## Reporting A Vulnerability

Please do not open a public issue for a vulnerability.

Report security concerns privately through GitHub Security Advisories:

https://github.com/msiksnis/benjamin-docs/security/advisories/new

If advisories are not available yet, contact the repository owner directly and include:

- affected version or commit
- reproduction steps
- expected impact
- suggested fix, if known

## Scope

Security-sensitive areas include:

- path traversal and symlink handling
- generated file writes
- validation of metadata and Markdown links
- package installation and dependency behavior
- future publishing and authentication flows

The CLI should remain conservative. Avoid new runtime dependencies unless there is a strong, reviewed reason.

## External Writes And Network Access

Ordinary managed project-memory reads and writes stay inside the selected project. Explicit, optional workflows can also write:

- skill installs under the selected home directory;
- a Claude Desktop / Claude.ai skill ZIP under `Downloads`, or another path the user selects;
- agent configuration files when the user consents to hooks or MCP registration;
- cached update and session state under the Benjamin Docs home directory.

Ordinary project-memory reads and writes make no network calls. The exception is the opt-out npm update check, which caches version state and can be disabled with `BENJAMIN_DOCS_NO_UPDATE_CHECK=1`. Release and package-manager commands are separate maintainer actions and may use their documented network services.
