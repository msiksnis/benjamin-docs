import { existsSync, lstatSync, readFileSync, writeFileSync } from "node:fs";
import { CONFIG_DIR, KNOWN_STATUSES, MANIFEST_FILE } from "./constants.js";
import { CONTEXT_BUDGETS, truncateAtBoundary } from "./context-budget.js";
import { detectDrift, summarizeDrift } from "./drift.js";
import { parseMarkdown, serializeMarkdown } from "./frontmatter.js";
import { readGeneratedJson, rootPath } from "./fsx.js";
import { readConfig } from "./project-config.js";
import { getSessionStartContext } from "./session.js";
import { getStatus } from "./status.js";
import { today } from "./templates.js";
import type { DocStatus, ManifestFile } from "./types.js";
import { validateProject } from "./validate.js";
import { generateMemoryViews, renderMemoryViews } from "./views.js";

const METADATA_LABEL = "Metadata path";
const DEFAULT_SEARCH_LIMIT = CONTEXT_BUDGETS.memorySearchDefaultResults;
const MAX_SEARCH_LIMIT = CONTEXT_BUDGETS.memorySearchMaxResults;
const SNIPPET_LENGTH = CONTEXT_BUDGETS.memorySearchSnippetCharacters;

export interface MemorySection {
  path: string;
  heading: string;
  snippet: string;
  score: number;
}

export interface UpdateResult {
  path: string;
  viewsRegenerated: number;
}

export function assertInitialized(root: string): void {
  if (!existsSync(rootPath(root, CONFIG_DIR, "config.json"))) {
    throw new Error("benjamin-docs is not initialized in this project. Run: benjamin-docs init");
  }
}

export function listManagedDocs(root: string): string[] {
  assertInitialized(root);
  const manifest = readGeneratedJson<ManifestFile>(root, `${CONFIG_DIR}/${MANIFEST_FILE}`, METADATA_LABEL);
  return manifest.docs.filter((doc) => {
    if (!doc.endsWith(".md")) return false;
    try {
      const fullPath = rootPath(root, doc);
      return existsSync(fullPath) && lstatSync(fullPath).isFile();
    } catch {
      return false;
    }
  });
}

export function searchMemory(root: string, query: string, limit: number = DEFAULT_SEARCH_LIMIT): MemorySection[] {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const cappedLimit = Math.max(1, Math.min(limit, MAX_SEARCH_LIMIT));
  const results: MemorySection[] = [];

  for (const doc of listManagedDocs(root)) {
    let body: string;
    let title: string;
    try {
      const parsed = parseMarkdown(readFileSync(rootPath(root, doc), "utf8"));
      body = parsed.body;
      title = parsed.frontmatter.title;
    } catch {
      continue;
    }

    for (const section of markdownSections(body, title)) {
      const score = scoreSection(section.heading, section.content, terms);
      if (score === 0) continue;

      results.push({
        path: doc,
        heading: section.heading,
        snippet: makeSnippet(section.content),
        score,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path)).slice(0, cappedLimit);
}

export function readMemoryDoc(root: string, path: string): string {
  const doc = requireManagedDoc(root, path);
  return readFileSync(rootPath(root, doc), "utf8");
}

export function updateMemoryDoc(root: string, path: string, body: string, status?: string): UpdateResult {
  const config = readConfig(root);
  const doc = requireManagedDoc(root, path);
  if (doc.startsWith(`${config.docsRoot}/views/`)) {
    throw new Error(`Memory Views are generated; update the source docs instead of ${doc}.`);
  }

  if (status !== undefined && !(KNOWN_STATUSES as readonly string[]).includes(status)) {
    throw new Error(`Unknown status: ${status}. Expected one of: ${KNOWN_STATUSES.join(", ")}`);
  }

  const fullPath = rootPath(root, doc);
  const previousContent = readFileSync(fullPath, "utf8");
  const parsed = parseMarkdown(previousContent);
  const nextContent = serializeMarkdown(
    { ...parsed.frontmatter, status: (status as DocStatus | undefined) ?? parsed.frontmatter.status, updated: today() },
    normalizeBody(body),
  );

  const errorsBefore = validateProject(root).errors;
  writeFileSync(fullPath, nextContent, "utf8");
  const errorsAfter = validateProject(root).errors;

  const newErrors = errorsAfter.filter((error) => !errorsBefore.includes(error));
  if (newErrors.length > 0) {
    writeFileSync(fullPath, previousContent, "utf8");
    throw new Error(`Update rolled back because it introduced validation errors:\n${newErrors.map((error) => `- ${error}`).join("\n")}`);
  }

  return { path: doc, viewsRegenerated: regenerateExistingViews(root) };
}

export function recordDecision(root: string, feature: string, decision: string): UpdateResult {
  assertInitialized(root);
  const trimmed = decision.trim();
  if (!trimmed) throw new Error("Decision text is empty.");

  const config = readConfig(root);
  const doc = `${config.docsRoot}/features/${feature}/decisions.md`;
  requireManagedDoc(root, doc);

  const fullPath = rootPath(root, doc);
  const parsed = parseMarkdown(readFileSync(fullPath, "utf8"));
  const nextBody = appendDecision(parsed.body, trimmed);
  writeFileSync(fullPath, serializeMarkdown({ ...parsed.frontmatter, updated: today() }, nextBody), "utf8");

  return { path: doc, viewsRegenerated: regenerateExistingViews(root) };
}

export function memoryStatus(root: string): string {
  assertInitialized(root);
  const lines = [getStatus(root)];

  const drift = detectDrift(root);
  if (!drift.gitAvailable) {
    lines.push("drift: unavailable (needs git history)");
  } else if (drift.drifted.length === 0) {
    lines.push("drift: none");
  } else {
    lines.push(`drift: ${drift.drifted.length} ${drift.drifted.length === 1 ? "doc" : "docs"} behind watched code`);
    for (const entry of drift.drifted.slice(0, 5)) {
      lines.push(`  - ${entry.doc}: ${summarizeDrift(entry)}`);
    }
  }

  return lines.join("\n");
}

export function memoryContext(root: string, task?: string): string {
  assertInitialized(root);
  const context = getSessionStartContext(root);
  if (!task?.trim()) return context;

  const sections = searchMemory(root, task);
  let output: string;
  if (sections.length === 0) {
    output = `${context}\n\nNo memory sections matched the task "${task.trim()}". Use memory_search with different terms or memory_read on the read-first docs.`;
  } else {
    const matches = sections.map((section) => `### ${section.path} — ${section.heading}\n${section.snippet}`);
    output = `${context}\n\nMemory sections matching the task:\n\n${matches.join("\n\n")}`;
  }

  return truncateAtBoundary(
    output,
    CONTEXT_BUDGETS.memoryContextCharacters,
    "\n\nMore context: use memory_search, then memory_read only for the selected source doc.",
  );
}

function requireManagedDoc(root: string, path: string): string {
  assertInitialized(root);
  const docs = listManagedDocs(root);
  if (!docs.includes(path)) {
    throw new Error(`Not a managed memory doc: ${path}. Managed docs live in the manifest; list them with memory_search or see ${CONFIG_DIR}/${MANIFEST_FILE}.`);
  }
  return path;
}

function regenerateExistingViews(root: string): number {
  try {
    const anyViewExists = renderMemoryViews(root).some((view) => {
      try {
        return existsSync(rootPath(root, view.relativePath));
      } catch {
        return false;
      }
    });
    if (!anyViewExists) return 0;
    return generateMemoryViews(root).length;
  } catch {
    return 0;
  }
}

function appendDecision(body: string, decision: string): string {
  const bullet = `- ${decision}`;
  const lines = body.split("\n");
  const headingIndex = lines.findIndex((line) => /^##\s+Decisions\s*$/i.test(line.trim()));

  if (headingIndex === -1) {
    return `${body.replace(/\s+$/u, "")}\n\n## Decisions\n\n${bullet}\n`;
  }

  let insertIndex = lines.length;
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    if (/^#{1,6}\s+/.test(lines[index] ?? "")) {
      insertIndex = index;
      break;
    }
  }

  while (insertIndex > headingIndex + 1 && (lines[insertIndex - 1] ?? "").trim() === "") {
    insertIndex -= 1;
  }

  lines.splice(insertIndex, 0, bullet);
  return lines.join("\n");
}

function markdownSections(body: string, title: string): Array<{ heading: string; content: string }> {
  const sections: Array<{ heading: string; content: string }> = [];
  let current = { heading: title, lines: [] as string[] };

  for (const line of body.split(/\r?\n/)) {
    const heading = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    if (heading?.[1]) {
      sections.push({ heading: current.heading, content: current.lines.join("\n").trim() });
      current = { heading: heading[1], lines: [] };
      continue;
    }

    current.lines.push(line);
  }

  sections.push({ heading: current.heading, content: current.lines.join("\n").trim() });
  return sections.filter((section) => section.content.length > 0);
}

function scoreSection(heading: string, content: string, terms: string[]): number {
  const headingLower = heading.toLowerCase();
  const contentLower = content.toLowerCase();
  let score = 0;

  for (const term of terms) {
    if (headingLower.includes(term)) score += 3;
    score += countOccurrences(contentLower, term);
  }

  return score;
}

function countOccurrences(text: string, term: string): number {
  let count = 0;
  let index = text.indexOf(term);
  while (index !== -1) {
    count += 1;
    index = text.indexOf(term, index + term.length);
  }
  return count;
}

function tokenize(query: string): string[] {
  return [...new Set(
    query
      .toLowerCase()
      .split(/[^a-z0-9./_-]+/)
      .map((term) => term.trim())
      .filter((term) => term.length > 2),
  )];
}

function makeSnippet(content: string): string {
  const compact = content.replace(/\n{3,}/g, "\n\n").trim();
  return truncateAtBoundary(compact, SNIPPET_LENGTH, "…");
}

function normalizeBody(body: string): string {
  return `${body.replace(/\s+$/u, "")}\n`;
}
