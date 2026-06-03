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

export const starterDocs: Array<{ path: string; content: string }> = [
  {
    path: "docs/project/brief.md",
    content: doc(
      "Project Brief",
      "project",
      "project",
      ["developer", "designer", "business", "agent"],
      "# Project Brief\n\nCapture what this project is, who it serves, and why it matters.\n",
    ),
  },
  {
    path: "docs/project/roadmap.md",
    content: doc(
      "Roadmap",
      "project",
      "project",
      ["developer", "business", "agent"],
      "# Roadmap\n\nCapture the current MVP, near-term next steps, and deferred ideas.\n",
    ),
  },
  {
    path: "docs/project/open-questions.md",
    content: doc(
      "Open Questions",
      "project",
      "project",
      ["developer", "designer", "business", "agent"],
      "# Open Questions\n\nTrack decisions that are not settled yet.\n",
    ),
  },
  {
    path: "docs/handoff/human-brief.md",
    content: doc(
      "Human Brief",
      "handoff",
      "human-brief",
      ["developer", "designer", "business", "advisor"],
      "# Human Brief\n\nUse this for a concise handoff to another person.\n",
    ),
  },
  {
    path: "docs/handoff/agent-brief.md",
    content: doc(
      "Agent Brief",
      "handoff",
      "agent-brief",
      ["agent"],
      "# Agent Brief\n\nUse this to orient future AI agents quickly.\n",
    ),
  },
];
