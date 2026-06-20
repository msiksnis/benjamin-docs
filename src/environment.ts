import { existsSync, lstatSync, readFileSync } from "node:fs";
import { CONFIG_DIR } from "./constants.js";
import { parseMarkdown } from "./frontmatter.js";
import { readGeneratedJson, rootPath } from "./fsx.js";
import type { ManifestFile } from "./types.js";

export interface EnvironmentBlocker {
  path: string;
  message: string;
}

const TOOLING_BLOCKER_PATTERNS = [
  /\bcommand not found:\s*[\w+.-]+\b/i,
  /\b[\w+.-]+\s+(?:is|was)\s+(?:not installed|unavailable|not available|not on path)\b/i,
  /\b(?:not installed|unavailable|not available|not on path)\b.{0,80}\b(cargo|rustc|postgres(?:ql)?|psql|bun|uv|node|npm|pnpm|python|docker|redis|mysql)\b/i,
  /\b(docker|postgres(?:ql)?|redis|mysql)\s+(?:is|was)\s+not\s+(?:running|listening)\b/i,
  /\b(connection refused|not listening|could not connect|cannot connect|econnrefused)\b/i,
  /\bblocked because\b.{0,120}\b(cargo|rustc|postgres(?:ql)?|database|server|service|tooling|toolchain|dependency|dependencies|not installed|not running|not listening|connection refused)\b/i,
  /\bneeds?\b.{0,80}\b(postgres(?:ql)?|database|docker|server|service)\b.{0,80}\b(running|available|started|listening)\b/i,
];

export function findEnvironmentBlockers(root: string): EnvironmentBlocker[] {
  if (!existsSync(rootPath(root, CONFIG_DIR, "manifest.json"))) return [];

  let manifest: ManifestFile;
  try {
    manifest = readGeneratedJson<ManifestFile>(root, `${CONFIG_DIR}/manifest.json`, "Metadata path");
  } catch {
    return [];
  }

  const blockers: EnvironmentBlocker[] = [];
  for (const doc of manifest.docs) {
    if (!doc.endsWith(".md") || doc.includes("/views/")) continue;

    let fullPath;
    try {
      fullPath = rootPath(root, doc);
    } catch {
      continue;
    }

    if (!existsSync(fullPath) || !lstatSync(fullPath).isFile()) continue;

    let body: string;
    try {
      body = parseMarkdown(readFileSync(fullPath, "utf8")).body;
    } catch {
      continue;
    }

    for (const line of candidateLines(body)) {
      if (!isEnvironmentBlockerLine(line)) continue;
      blockers.push({ path: doc, message: compactBlocker(line) });
    }
  }

  return dedupeBlockers(blockers);
}

function candidateLines(body: string): string[] {
  return stripFencedBlocks(body)
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*]\s+/, ""))
    .filter(Boolean);
}

function stripFencedBlocks(text: string): string {
  const kept: string[] = [];
  let inFence = false;

  for (const line of text.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }

    if (!inFence) kept.push(line);
  }

  return kept.join("\n");
}

function isEnvironmentBlockerLine(line: string): boolean {
  if (/\b(such as|for example|e\.g\.|examples?)\b/i.test(line)) return false;
  return TOOLING_BLOCKER_PATTERNS.some((pattern) => pattern.test(line));
}

function compactBlocker(line: string): string {
  return line.replace(/\s+/g, " ").trim().slice(0, 180);
}

function dedupeBlockers(blockers: EnvironmentBlocker[]): EnvironmentBlocker[] {
  const seen = new Set<string>();
  const deduped: EnvironmentBlocker[] = [];

  for (const blocker of blockers) {
    const key = `${blocker.path}\0${blocker.message.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(blocker);
  }

  return deduped;
}
