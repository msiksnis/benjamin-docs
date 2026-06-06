---
title: Baseline Capture Guide
scope: project
scope_id: project
audience: [developer, business, agent]
status: draft
visibility: private
updated: 2026-06-06
source: session-capture
---

# Baseline Capture Guide

## Purpose

Baseline capture is the first useful documentation pass after `benjamin-docs init`. It turns the current state of a project into durable Markdown that a human or future agent can use without reading the original chat.

The public README now documents three baseline entry points:

- New idea or planning-only project.
- Existing codebase.
- One feature scope.

## Capture Standard

A good baseline should include:

- What the project or feature is trying to accomplish.
- Decisions already made.
- Rejected options and why they were rejected.
- Risks, weak assumptions, and unresolved questions.
- Relevant code references when code exists.
- Recommended next actions.

It should not preserve a raw transcript unless the user explicitly asks for archival output.

## Current Decision

The baseline guide belongs in the README for public discoverability, with this repo-local note preserving the project rationale. V1 should keep the workflow prompt-based instead of adding a new CLI command until dogfooding proves which prompts are stable enough to automate.

## Follow-Up

- Done: dogfooded the existing-codebase prompt in `/Users/marty/Important/kit/benjamin`, initialized the real repo, and made it pass `benjamin-docs ready`.
- Test at least one planning-only baseline after public install, so the tool is not biased toward existing codebases only.
- Revisit whether `benjamin-docs next` should expose these baseline prompt variants.
- Decision: `doctor --strict` stays focused on setup/validation. `ready` is the command that means docs are genuinely ready.
