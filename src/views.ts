import { existsSync, readFileSync } from "node:fs";
import { CONFIG_DIR, CONFIG_FILE, MANIFEST_FILE } from "./constants.js";
import { readGeneratedJson, rootPath, writeGeneratedJson, writeGeneratedText } from "./fsx.js";
import { parseMarkdown } from "./frontmatter.js";
import { readConfig } from "./project-config.js";
import { doc } from "./templates.js";
import type { DocFrontmatter, ManifestFile } from "./types.js";

interface ViewDefinition {
  file: string;
  title: string;
  audience: DocFrontmatter["audience"];
  intro: string;
  matches: (heading: string) => boolean;
  agentOnly?: boolean;
}

const VIEW_DEFINITIONS: ViewDefinition[] = [
  {
    file: "decisions.md",
    title: "Decision Log",
    audience: ["developer", "agent"] as DocFrontmatter["audience"],
    intro: "Derived from decision and rejected-option sections across managed Benjamin docs.",
    matches: (heading: string) => includesAny(heading, ["decision", "rejected option"]),
  },
  {
    file: "open-questions.md",
    title: "Open Questions View",
    audience: ["developer", "designer", "business", "agent"] as DocFrontmatter["audience"],
    intro: "What unresolved questions and open risks are captured across managed Benjamin docs?",
    matches: (heading: string) => includesAny(heading, ["question"]),
  },
  {
    file: "next-actions.md",
    title: "Next Actions View",
    audience: ["developer", "business", "agent"] as DocFrontmatter["audience"],
    intro: "Derived from next-action and near-term work sections across managed Benjamin docs.",
    matches: (heading: string) => includesAny(heading, ["next action", "immediate next work"]) || normalizeHeading(heading) === "next",
  },
  {
    file: "risks.md",
    title: "Risk Register",
    audience: ["developer", "business", "agent"] as DocFrontmatter["audience"],
    intro: "Derived from risk, hazard, assumption, and open-question sections across managed Benjamin docs.",
    matches: (heading: string) => includesAny(heading, ["risk", "hazard", "assumption"]),
  },
  {
    file: "agent-continuation.md",
    title: "Agent Continuation View",
    audience: ["agent"] as DocFrontmatter["audience"],
    intro: "Derived from continuation-proof, read-first, current-state, check, risk, and next-action sections for future agents.",
    matches: (heading: string) =>
      includesAny(heading, ["continuation proof", "read first", "current state", "commands and checks", "risk", "hazard", "next action"]),
    agentOnly: true,
  },
];

interface SourceDoc {
  relativePath: string;
  title: string;
  audience: DocFrontmatter["audience"];
  sections: Section[];
}

interface Section {
  heading: string;
  content: string;
}

export function generateMemoryViews(root: string): string[] {
  if (!existsSync(rootPath(root, CONFIG_DIR, CONFIG_FILE))) {
    throw new Error("Cannot generate Memory Views before benjamin-docs is initialized. Run benjamin-docs init first.");
  }

  const config = readConfig(root);
  const manifestPath = `${CONFIG_DIR}/${MANIFEST_FILE}`;
  const manifest = readGeneratedJson<ManifestFile>(root, manifestPath, "Metadata path");
  const sourceDocs = readSourceDocs(root, config.docsRoot, manifest);
  const viewPaths = VIEW_DEFINITIONS.map((view) => `${config.docsRoot}/views/${view.file}`);
  const written: string[] = [];

  for (const view of VIEW_DEFINITIONS) {
    const entries = matchingSections(sourceDocs, view.matches, view.agentOnly ?? false);
    const relativePath = `${config.docsRoot}/views/${view.file}`;
    writeGeneratedText(root, relativePath, doc(view.title, "project", "project", view.audience, renderView(config.docsRoot, view.title, view.intro, entries)));
    written.push(rootPath(root, relativePath));
  }

  for (const viewPath of viewPaths) {
    if (!manifest.docs.includes(viewPath)) manifest.docs.push(viewPath);
  }
  writeGeneratedJson(root, manifestPath, manifest, "Metadata path");

  return written;
}

function readSourceDocs(root: string, docsRoot: string, manifest: ManifestFile): SourceDoc[] {
  const docsRootPrefix = `${docsRoot}/`;

  return manifest.docs
    .filter((relativePath) => relativePath.startsWith(docsRootPrefix))
    .filter((relativePath) => relativePath.endsWith(".md"))
    .filter((relativePath) => !relativePath.startsWith(`${docsRoot}/views/`))
    .sort((a, b) => a.localeCompare(b))
    .map((relativePath) => {
      const content = readFileSync(rootPath(root, relativePath), "utf8");
      try {
        const parsed = parseMarkdown(content);
        return {
          relativePath,
          title: parsed.frontmatter.title,
          audience: parsed.frontmatter.audience,
          sections: parseSections(parsed.body),
        };
      } catch (error) {
        throw new Error(`Cannot generate Memory Views while managed docs are invalid: ${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
}

function matchingSections(sourceDocs: SourceDoc[], matches: (heading: string) => boolean, agentOnly: boolean): Array<{ doc: SourceDoc; section: Section }> {
  const entries: Array<{ doc: SourceDoc; section: Section }> = [];

  for (const sourceDoc of sourceDocs) {
    if (agentOnly && !sourceDoc.audience.includes("agent")) continue;

    for (const section of sourceDoc.sections) {
      if (!matches(section.heading)) continue;
      if (!section.content) continue;
      entries.push({ doc: sourceDoc, section });
    }
  }

  return entries;
}

function parseSections(body: string): Section[] {
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  const sections: Section[] = [];
  let current: { heading: string; lines: string[] } | undefined;
  let inFence = false;
  let omitFence = false;

  for (const line of lines) {
    const fence = line.match(/^```([A-Za-z0-9_-]*)\s*$/);
    if (fence) {
      if (!inFence) {
        inFence = true;
        omitFence = isMarkdownFence(fence[1] ?? "");
        if (!omitFence) current?.lines.push(line);
        continue;
      }

      if (!omitFence) current?.lines.push(line);
      inFence = false;
      omitFence = false;
      continue;
    }

    if (inFence) {
      if (!omitFence) current?.lines.push(line);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      if (current) sections.push({ heading: current.heading, content: cleanSectionContent(current.lines) });
      current = heading[1] && heading[1].length > 1 ? { heading: heading[2] ?? "", lines: [] } : undefined;
      continue;
    }

    current?.lines.push(line);
  }

  if (current) sections.push({ heading: current.heading, content: cleanSectionContent(current.lines) });
  return sections;
}

function cleanSectionContent(lines: string[]): string {
  const content = lines.join("\n").trim();
  if (!content) return "";

  const meaningfulLines = content
    .split("\n")
    .filter((line) => !isStarterPlaceholder(line.trim()))
    .join("\n")
    .trim();

  return meaningfulLines;
}

function isStarterPlaceholder(line: string): boolean {
  if (!line) return false;
  return /^(Capture|Describe|Fill this in|For each question|Include|List|Record|Summarize|Track|Use this)\b/.test(line);
}

function isMarkdownFence(language: string): boolean {
  const normalized = language.toLowerCase();
  return normalized === "md" || normalized === "markdown";
}

function renderView(docsRoot: string, title: string, intro: string, entries: Array<{ doc: SourceDoc; section: Section }>): string {
  const body = [`# ${title}`, "", intro, ""];

  if (entries.length === 0) {
    body.push("_No matching sections found yet._");
    return `${body.join("\n")}\n`;
  }

  for (const entry of entries) {
    body.push(`## [${escapeLinkText(entry.doc.title)}](${sourceLink(docsRoot, entry.doc.relativePath)})`);
    body.push("");
    body.push(`Source: \`${entry.doc.relativePath}\``);
    body.push("");
    body.push(`### ${entry.section.heading}`);
    body.push("");
    body.push(entry.section.content);
    body.push("");
  }

  return `${body.join("\n").trimEnd()}\n`;
}

function sourceLink(docsRoot: string, relativePath: string): string {
  return `../${relativePath.slice(docsRoot.length + 1)}`;
}

function escapeLinkText(value: string): string {
  return value.replaceAll("[", "\\[").replaceAll("]", "\\]");
}

function includesAny(heading: string, needles: string[]): boolean {
  const normalized = normalizeHeading(heading);
  return needles.some((needle) => normalized.includes(needle));
}

function normalizeHeading(heading: string): string {
  return heading.toLowerCase().replaceAll(" / ", " ").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}
