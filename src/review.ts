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
];

const MIN_WORDS_BY_BASENAME: Record<string, number> = {
  "brief.md": 60,
  "roadmap.md": 50,
  "open-questions.md": 25,
  "human-brief.md": 45,
  "agent-brief.md": 60,
  "architecture.md": 50,
  "code-map.md": 50,
};

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
