import { DEFAULT_DOCS_ROOT } from "./constants.js";
import { serializeMarkdown } from "./frontmatter.js";
import type { DocFrontmatter } from "./types.js";

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function doc(
  title: string,
  scope: DocFrontmatter["scope"],
  scopeId: string,
  audience: DocFrontmatter["audience"],
  body: string,
): string {
  return serializeMarkdown(
    {
      title,
      scope,
      scope_id: scopeId,
      audience,
      status: "draft",
      visibility: "private",
      updated: today(),
      source: "manual",
    },
    body,
  );
}

export function workspaceDocs(docsRoot: string): Array<{ path: string; content: string }> {
  return [
    {
      path: `${docsRoot}/project/brief.md`,
      content: doc(
        "Project Brief",
        "project",
        "project",
        ["developer", "designer", "business", "agent"],
        [
          "# Project Brief",
          "",
          "Capture what this project is, who it serves, and why it matters.",
          "",
          "## Current State",
          "",
          "Summarize what exists now.",
          "",
          "## Non-Goals",
          "",
          "List important boundaries or things this project is not trying to do.",
        ].join("\n"),
      ),
    },
    {
      path: `${docsRoot}/project/roadmap.md`,
      content: doc(
        "Roadmap",
        "project",
        "project",
        ["developer", "business", "agent"],
        [
          "# Roadmap",
          "",
          "Capture the current MVP, near-term next steps, and deferred ideas.",
          "",
          "## Now",
          "",
          "List what is active or already decided.",
          "",
          "## Next",
          "",
          "List the next useful actions.",
          "",
          "## Later / Deferred",
          "",
          "List ideas that are intentionally out of scope for now.",
        ].join("\n"),
      ),
    },
    {
      path: `${docsRoot}/project/open-questions.md`,
      content: doc(
        "Open Questions",
        "project",
        "project",
        ["developer", "designer", "business", "agent"],
        [
          "# Open Questions",
          "",
          "Track decisions that are not settled yet.",
          "",
          "For each question, include the context, likely options, and what would unblock the decision.",
        ].join("\n"),
      ),
    },
    {
      path: `${docsRoot}/handoff/human-brief.md`,
      content: doc(
        "Human Brief",
        "handoff",
        "human-brief",
        ["developer", "designer", "business", "advisor"],
        [
          "# Human Brief",
          "",
          "Use this for a concise handoff to another person.",
          "",
          "Include the plain-language status, important decisions, risks, and next actions.",
        ].join("\n"),
      ),
    },
    {
      path: `${docsRoot}/handoff/agent-brief.md`,
      content: doc(
        "Agent Brief",
        "handoff",
        "agent-brief",
        ["agent"],
        [
          "# Agent Brief",
          "",
          "Use this to orient future AI agents quickly.",
          "",
          "Include read-first docs, commands to run, hazards to avoid, and next actions.",
        ].join("\n"),
      ),
    },
    {
      path: `${docsRoot}/engineering/architecture.md`,
      content: doc(
        "Architecture",
        "project",
        "project",
        ["developer", "agent"],
        [
          "# Architecture",
          "",
          "Capture the planned or current system shape, major boundaries, and important constraints.",
          "",
          "Include runtime, data/services, ownership boundaries, and constraints when known.",
        ].join("\n"),
      ),
    },
    {
      path: `${docsRoot}/engineering/code-map.md`,
      content: doc(
        "Code Map",
        "project",
        "project",
        ["developer", "agent"],
        [
          "# Code Map",
          "",
          "Capture important files, modules, routes, schemas, and tests when code exists.",
          "",
          "Use concrete paths and explain why each area matters.",
        ].join("\n"),
      ),
    },
    {
      path: `${docsRoot}/features/index.md`,
      content: doc(
        "Features Index",
        "project",
        "project",
        ["developer", "designer", "agent", "business"],
        "# Features Index\n\nTrack feature scopes that are planned, in progress, shipped, or deferred.\n",
      ),
    },
    {
      path: `${docsRoot}/releases/changelog.md`,
      content: doc(
        "Changelog",
        "release",
        "release",
        ["developer", "business", "public"],
        "# Changelog\n\nTrack notable changes.\n",
      ),
    },
  ];
}

export const starterDocs: Array<{ path: string; content: string }> = workspaceDocs(DEFAULT_DOCS_ROOT);

export function codebaseDocs(docsRoot: string): Array<{ path: string; content: string }> {
  return workspaceDocs(docsRoot).filter(
    (item) => item.path.startsWith(`${docsRoot}/engineering/`) || item.path.startsWith(`${docsRoot}/releases/`),
  );
}

export function featureDocs(slug: string, docsRoot = DEFAULT_DOCS_ROOT): Array<{ path: string; content: string }> {
  return [
    {
      path: `${docsRoot}/features/${slug}/brief.md`,
      content: doc(
        `${slug} Brief`,
        "feature",
        slug,
        ["developer", "designer", "agent"],
        [
          `# ${slug} Brief`,
          "",
          "Capture what this feature is meant to accomplish.",
          "",
          "## Outcome",
          "",
          "Describe the user-visible or project-visible outcome.",
          "",
          "## Scope",
          "",
          "List in-scope and out-of-scope work.",
        ].join("\n"),
      ),
    },
    {
      path: `${docsRoot}/features/${slug}/plan.md`,
      content: doc(
        `${slug} Plan`,
        "feature",
        slug,
        ["developer", "agent"],
        [
          `# ${slug} Plan`,
          "",
          "Capture the implementation or execution plan.",
          "",
          "## Steps",
          "",
          "List the implementation or execution sequence.",
          "",
          "## Validation",
          "",
          "List tests, checks, reviews, or manual verification required before handoff.",
        ].join("\n"),
      ),
    },
    {
      path: `${docsRoot}/features/${slug}/decisions.md`,
      content: doc(
        `${slug} Decisions`,
        "feature",
        slug,
        ["developer", "agent"],
        [
          `# ${slug} Decisions`,
          "",
          "Capture durable decisions, rejected options, and reasoning.",
          "",
          "## Decisions",
          "",
          "Record decisions and why they were made.",
          "",
          "## Rejected Options",
          "",
          "Record options that were considered but not chosen.",
        ].join("\n"),
      ),
    },
    {
      path: `${docsRoot}/features/${slug}/handoff.md`,
      content: doc(
        `${slug} Handoff`,
        "feature",
        slug,
        ["developer", "agent"],
        [
          `# ${slug} Handoff`,
          "",
          "Capture status, open questions, and next actions for this feature.",
          "",
          "## Status",
          "",
          "Summarize what is done and what remains.",
          "",
          "## Risks / Open Questions",
          "",
          "List unresolved issues or assumptions.",
          "",
          "## Next Actions",
          "",
          "List the next concrete actions for a human or agent.",
        ].join("\n"),
      ),
    },
  ];
}
