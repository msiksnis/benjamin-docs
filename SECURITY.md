# Security Policy

## Supported Versions

`benjamin-docs` is pre-1.0. Security fixes will target the latest commit on `main` until versioned releases begin.

## Reporting A Vulnerability

Please do not open a public issue for a vulnerability.

Report security concerns privately through GitHub Security Advisories once the public repository is available:

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

The CLI should remain conservative: no network calls during ordinary local documentation commands, no runtime dependencies unless justified, and no writes outside the project root.
