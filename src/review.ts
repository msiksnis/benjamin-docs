import { existsSync, lstatSync, readFileSync } from "node:fs";
import { CONFIG_DIR } from "./constants.js";
import { parseMarkdown } from "./frontmatter.js";
import { readGeneratedJson, rootPath } from "./fsx.js";
import { readConfig } from "./project-config.js";
import type { ManifestFile } from "./types.js";
import { validateProject } from "./validate.js";

export interface ReviewResult {
  ok: boolean;
  output: string;
  docsChecked: number;
  errors: ReviewIssue[];
  warnings: ReviewIssue[];
}

export interface ReviewIssue {
  path?: string;
  message: string;
}

const STARTER_PHRASES = [
  "Capture what this project is, who it serves, and why it matters.",
  "Capture the current MVP, near-term next steps, and deferred ideas.",
  "Track decisions that are not settled yet.",
  "Use this for a concise handoff to another person.",
  "Use this to orient future AI agents quickly.",
  "Capture the planned or current system shape, major boundaries, and important constraints.",
  "Capture important files, modules, routes, schemas, and tests when code exists.",
  "Track feature scopes that are planned, in progress, shipped, or deferred.",
  "Track notable changes.",
  "Capture what this feature is meant to accomplish.",
  "Capture the implementation or execution plan.",
  "Capture durable decisions, rejected options, and reasoning.",
  "Capture status, open questions, and next actions for this feature.",
];

const MIN_WORDS_BY_BASENAME: Record<string, number> = {
  "brief.md": 60,
  "roadmap.md": 50,
  "open-questions.md": 25,
  "human-brief.md": 45,
  "agent-brief.md": 60,
  "architecture.md": 50,
  "code-map.md": 50,
  "plan.md": 45,
  "decisions.md": 35,
  "handoff.md": 45,
};

const AGENT_BRIEF_CONTINUATION_CHECKS = [
  {
    label: "read-first docs",
    headings: ["read first", "read first docs", "read before changing"],
    terms: ["read first", "read these", "start with", "before changing", "before editing"],
  },
  {
    label: "current state",
    headings: ["current state", "current status", "status"],
    terms: ["current state", "current status", "status", "baseline", "done so far"],
  },
  {
    label: "commands/checks",
    headings: ["commands and checks", "commands checks", "checks", "validation"],
    terms: ["bd ", "benjamin-docs", "command", "commands", "check", "checks", "test", "validate", "ready"],
  },
  {
    label: "risks/hazards",
    headings: ["risks hazards", "risks", "hazards", "risks open questions"],
    terms: ["risk", "risks", "hazard", "hazards", "avoid", "do not", "watch out"],
  },
  {
    label: "next actions",
    headings: ["next actions", "next action", "next steps"],
    terms: ["next action", "next actions", "next step", "next steps", "continue", "remaining"],
  },
];

const AGENT_BRIEF_TEMPLATE_LINES = [
  "use this to orient future ai agents quickly",
  "fill this in so a future agent can continue without asking the owner to repeat the project",
  "list the docs and files to read before changing behavior",
  "summarize what exists now what is done and what is still uncertain",
  "list commands tests validation steps or manual checks to run before handoff",
  "list assumptions fragile areas or things future agents should avoid",
  "list the next concrete actions for a human or agent",
];

export function reviewProject(root: string): ReviewResult {
  const errors: ReviewIssue[] = [];
  const warnings: ReviewIssue[] = [];

  if (!existsSync(rootPath(root, CONFIG_DIR, "config.json"))) {
    errors.push({ message: "benjamin-docs is not initialized. Run: benjamin-docs init" });
    return formatReview({ docsChecked: 0, errors, warnings });
  }

  const validation = validateProject(root);
  for (const error of validation.errors) errors.push({ message: error });
  for (const warning of validation.warnings) warnings.push({ message: warning });

  let docsRoot = "benjamin-docs";
  let mode = "planning";
  let manifestDocs: string[] = [];

  try {
    const config = readConfig(root);
    docsRoot = config.docsRoot;
    mode = config.mode;
    const manifest = readGeneratedJson<ManifestFile>(root, `${CONFIG_DIR}/manifest.json`, "Metadata path");
    manifestDocs = manifest.docs;
  } catch (error) {
    errors.push({ message: `Cannot read project metadata: ${error instanceof Error ? error.message : String(error)}` });
  }

  const expected = expectedDocs(docsRoot, mode);
  for (const doc of expected) {
    if (!manifestDocs.includes(doc)) {
      warnings.push({ path: doc, message: "Expected baseline doc is not listed in the manifest." });
    }
  }

  let docsChecked = 0;
  for (const doc of manifestDocs) {
    if (!doc.endsWith(".md")) continue;

    let fullPath;
    try {
      fullPath = rootPath(root, doc);
    } catch (error) {
      errors.push({ path: doc, message: `Cannot review unsafe manifest doc: ${error instanceof Error ? error.message : String(error)}` });
      continue;
    }

    if (!existsSync(fullPath) || !lstatSync(fullPath).isFile()) continue;
    docsChecked += 1;
    reviewDoc(fullPath, doc, warnings);
  }

  if (mode === "codebase") {
    reviewCodebaseDocs(docsRoot, manifestDocs, warnings);
  }

  return formatReview({ docsChecked, errors, warnings });
}

function reviewDoc(fullPath: string, relativePath: string, warnings: ReviewIssue[]): void {
  let body = "";
  try {
    body = parseMarkdown(readFileSync(fullPath, "utf8")).body;
  } catch {
    return;
  }

  if (STARTER_PHRASES.some((phrase) => body.includes(phrase))) {
    warnings.push({ path: relativePath, message: "Still looks like a starter template. Capture real project context." });
  }

  const basename = relativePath.split("/").at(-1) ?? relativePath;
  const minWords = MIN_WORDS_BY_BASENAME[basename];
  if (minWords && wordCount(body) < minWords) {
    warnings.push({ path: relativePath, message: `Looks thin for a baseline doc (${wordCount(body)} words). Add concrete context.` });
  }

  if (basename === "open-questions.md" && !body.includes("?")) {
    warnings.push({ path: relativePath, message: "Open questions doc has no question marks. Add concrete unresolved decisions." });
  }

  reviewContinuationSignals(body, relativePath, basename, warnings);
}

function reviewContinuationSignals(body: string, relativePath: string, basename: string, warnings: ReviewIssue[]): void {
  if (basename === "agent-brief.md") {
    const missing = AGENT_BRIEF_CONTINUATION_CHECKS.filter((check) => !hasAgentBriefContinuationSignal(body, check)).map((check) => check.label);
    if (missing.length > 0) {
      warnings.push({
        path: relativePath,
        message: `Agent brief should include continuation proof: read-first docs, current state, commands/checks, risks/hazards, and next actions. Missing: ${missing.join(", ")}.`,
      });
    }
  }

  if (basename === "code-map.md" && !hasPathLikeReference(body)) {
    warnings.push({ path: relativePath, message: "Code map should include concrete file or directory paths." });
  }

  if (basename === "architecture.md" && countMatches(body, ["runtime", "node", "browser", "server", "client", "boundary", "boundaries", "service", "data", "database", "api", "constraint", "metadata"]) < 2) {
    warnings.push({ path: relativePath, message: "Architecture should mention runtime, boundaries, services/data, or constraints." });
  }

  if (basename === "roadmap.md" && countMatches(body, ["now", "next", "later", "deferred", "non-goal", "out of scope", "risk"]) < 2) {
    warnings.push({ path: relativePath, message: "Roadmap should include now/next/later, deferred work, non-goals, or risks." });
  }

  if (isFeatureDoc(relativePath, "plan.md") && !hasAny(body, ["test", "check", "validate", "review", "verify", "manual", "acceptance"])) {
    warnings.push({ path: relativePath, message: "Feature plan should include validation, checks, or acceptance criteria." });
  }

  if (isFeatureDoc(relativePath, "decisions.md") && !hasAny(body, ["decision", "decided", "rejected", "option", "because", "reason"])) {
    warnings.push({ path: relativePath, message: "Feature decisions should include decisions, rejected options, or reasoning." });
  }

  if (isFeatureDoc(relativePath, "handoff.md") && !hasAny(body, ["status", "next", "open question", "risk", "todo", "remaining"])) {
    warnings.push({ path: relativePath, message: "Feature handoff should include status, risks/open questions, or next actions." });
  }
}

function reviewCodebaseDocs(docsRoot: string, manifestDocs: string[], warnings: ReviewIssue[]): void {
  const architecture = `${docsRoot}/engineering/architecture.md`;
  const codeMap = `${docsRoot}/engineering/code-map.md`;
  const humanBrief = `${docsRoot}/handoff/human-brief.md`;
  const agentBrief = `${docsRoot}/handoff/agent-brief.md`;

  for (const doc of [architecture, codeMap, humanBrief, agentBrief]) {
    if (!manifestDocs.includes(doc)) {
      warnings.push({ path: doc, message: "Codebase baseline should include this doc." });
    }
  }
}

function expectedDocs(docsRoot: string, mode: string): string[] {
  const base = [
    `${docsRoot}/project/brief.md`,
    `${docsRoot}/project/roadmap.md`,
    `${docsRoot}/project/open-questions.md`,
    `${docsRoot}/handoff/human-brief.md`,
    `${docsRoot}/handoff/agent-brief.md`,
  ];

  if (mode !== "codebase") return base;

  return [...base, `${docsRoot}/engineering/architecture.md`, `${docsRoot}/engineering/code-map.md`];
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasAny(text: string, terms: string[]): boolean {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function hasAgentBriefContinuationSignal(body: string, check: { headings: string[]; terms: string[] }): boolean {
  const sections = markdownSections(body);
  const section = sections.find((candidate) => check.headings.includes(normalizePhrase(candidate.heading)));
  if (section && hasConcreteContinuationContent(section.content)) return true;

  return hasAny(stripAgentBriefTemplateText(body), check.terms);
}

function markdownSections(text: string): Array<{ heading: string; content: string }> {
  const sections: Array<{ heading: string; content: string }> = [];
  let current: { heading: string; lines: string[] } | undefined;

  for (const line of text.split(/\r?\n/)) {
    const heading = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    if (heading) {
      if (current) sections.push({ heading: current.heading, content: current.lines.join("\n") });
      current = { heading: heading[1] ?? "", lines: [] };
      continue;
    }

    current?.lines.push(line);
  }

  if (current) sections.push({ heading: current.heading, content: current.lines.join("\n") });
  return sections;
}

function hasConcreteContinuationContent(content: string): boolean {
  return content
    .split(/\r?\n/)
    .map(cleanContinuationLine)
    .filter(Boolean)
    .filter((line) => !isAgentBriefTemplateLine(line))
    .some((line) => wordCount(line) >= 4 || hasPathLikeReference(line) || /`[^`]+`/.test(line) || /\b(bd|benjamin-docs|pnpm|npm|node|test|validate|ready)\b/i.test(line));
}

function stripAgentBriefTemplateText(text: string): string {
  return text
    .split(/\r?\n/)
    .filter((line) => !/^\s{0,3}#{1,6}\s+/.test(line))
    .map(cleanContinuationLine)
    .filter(Boolean)
    .filter((line) => !isAgentBriefTemplateLine(line))
    .join("\n");
}

function cleanContinuationLine(line: string): string {
  return line.trim().replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "");
}

function isAgentBriefTemplateLine(line: string): boolean {
  return AGENT_BRIEF_TEMPLATE_LINES.includes(normalizePhrase(line));
}

function normalizePhrase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function countMatches(text: string, terms: string[]): number {
  const normalized = text.toLowerCase();
  return terms.filter((term) => normalized.includes(term)).length;
}

function hasPathLikeReference(text: string): boolean {
  return /(^|\s)([\w.-]+\/[\w./-]+|[\w.-]+\.(ts|tsx|js|jsx|json|md|css|html|py|rb|go|rs|java|php|sql|yml|yaml))(\s|$|[,:.)])/m.test(text);
}

function isFeatureDoc(relativePath: string, basename: string): boolean {
  return relativePath.includes("/features/") && relativePath.endsWith(`/${basename}`);
}

function formatReview(result: { docsChecked: number; errors: ReviewIssue[]; warnings: ReviewIssue[] }): ReviewResult {
  const ok = result.errors.length === 0;
  const status = result.errors.length > 0 ? "failed" : result.warnings.length > 0 ? "passed with warnings" : "passed";
  const lines = [
    "benjamin-docs review",
    "",
    `status: ${status}`,
    `docs checked: ${result.docsChecked}`,
    `errors: ${result.errors.length}`,
    `warnings: ${result.warnings.length}`,
  ];

  if (result.errors.length > 0) {
    lines.push("");
    lines.push("Errors");
    for (const issue of result.errors) lines.push(formatIssue(issue));
  }

  if (result.warnings.length > 0) {
    lines.push("");
    lines.push("Warnings");
    for (const issue of result.warnings) lines.push(formatIssue(issue));
  }

  if (result.errors.length === 0 && result.warnings.length === 0) {
    lines.push("");
    lines.push("No obvious structural or starter-template issues found.");
  } else {
    lines.push("");
    lines.push("Next");
    lines.push("  Update weak docs, then run: benjamin-docs validate && benjamin-docs review");
  }

  return { ok, output: lines.join("\n"), docsChecked: result.docsChecked, errors: result.errors, warnings: result.warnings };
}

function formatIssue(issue: ReviewIssue): string {
  return issue.path ? `  - ${issue.path}: ${issue.message}` : `  - ${issue.message}`;
}
