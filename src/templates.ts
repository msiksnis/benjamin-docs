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
        "# Project Brief\n\nCapture what this project is, who it serves, and why it matters.\n",
      ),
    },
    {
      path: `${docsRoot}/project/roadmap.md`,
      content: doc(
        "Roadmap",
        "project",
        "project",
        ["developer", "business", "agent"],
        "# Roadmap\n\nCapture the current MVP, near-term next steps, and deferred ideas.\n",
      ),
    },
    {
      path: `${docsRoot}/project/open-questions.md`,
      content: doc(
        "Open Questions",
        "project",
        "project",
        ["developer", "designer", "business", "agent"],
        "# Open Questions\n\nTrack decisions that are not settled yet.\n",
      ),
    },
    {
      path: `${docsRoot}/handoff/human-brief.md`,
      content: doc(
        "Human Brief",
        "handoff",
        "human-brief",
        ["developer", "designer", "business", "advisor"],
        "# Human Brief\n\nUse this for a concise handoff to another person.\n",
      ),
    },
    {
      path: `${docsRoot}/handoff/agent-brief.md`,
      content: doc(
        "Agent Brief",
        "handoff",
        "agent-brief",
        ["agent"],
        "# Agent Brief\n\nUse this to orient future AI agents quickly.\n",
      ),
    },
    {
      path: `${docsRoot}/engineering/architecture.md`,
      content: doc(
        "Architecture",
        "project",
        "project",
        ["developer", "agent"],
        "# Architecture\n\nCapture the planned or current system shape, major boundaries, and important constraints.\n",
      ),
    },
    {
      path: `${docsRoot}/engineering/code-map.md`,
      content: doc(
        "Code Map",
        "project",
        "project",
        ["developer", "agent"],
        "# Code Map\n\nCapture important files, modules, routes, schemas, and tests when code exists.\n",
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
        `# ${slug} Brief\n\nCapture what this feature is meant to accomplish.\n`,
      ),
    },
    {
      path: `${docsRoot}/features/${slug}/plan.md`,
      content: doc(
        `${slug} Plan`,
        "feature",
        slug,
        ["developer", "agent"],
        `# ${slug} Plan\n\nCapture the implementation or execution plan.\n`,
      ),
    },
    {
      path: `${docsRoot}/features/${slug}/decisions.md`,
      content: doc(
        `${slug} Decisions`,
        "feature",
        slug,
        ["developer", "agent"],
        `# ${slug} Decisions\n\nCapture durable decisions, rejected options, and reasoning.\n`,
      ),
    },
    {
      path: `${docsRoot}/features/${slug}/handoff.md`,
      content: doc(
        `${slug} Handoff`,
        "feature",
        slug,
        ["developer", "agent"],
        `# ${slug} Handoff\n\nCapture status, open questions, and next actions for this feature.\n`,
      ),
    },
  ];
}
