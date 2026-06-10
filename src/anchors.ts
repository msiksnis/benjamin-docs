import { realpathSync, statSync } from "node:fs";
import { isAbsolute, relative, sep, win32 } from "node:path";
import { ANCHORS_FILE, CONFIG_DIR } from "./constants.js";
import { pathExists, readGeneratedJson, rootPath, writeGeneratedJson } from "./fsx.js";
import type { AnchorsFile } from "./types.js";

const ANCHOR_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const METADATA_LABEL = "Metadata path";

export function addAnchor(root: string, id: string, file: string, docs: string[] = []): void {
  if (!ANCHOR_ID_PATTERN.test(id)) {
    throw new Error(`Invalid anchor id: ${id}`);
  }

  const filePath = validateRelativePath(root, file, "anchor file");
  const safeDocs = docs.map((doc) => validateRelativePath(root, doc, "anchor docs path"));

  if (!pathExists(filePath.full)) {
    throw new Error(`Anchor file does not exist: ${file}`);
  }
  assertRegularFileInsideRoot(root, filePath.full, file);

  const anchorsPath = `${CONFIG_DIR}/${ANCHORS_FILE}`;
  const anchors = readGeneratedJson<AnchorsFile>(root, anchorsPath, METADATA_LABEL);
  anchors.anchors[id] = { file, docs: safeDocs.map((doc) => doc.relative) };
  writeGeneratedJson(root, anchorsPath, anchors, METADATA_LABEL);
}

export function listAnchors(root: string): string {
  const anchorsPath = `${CONFIG_DIR}/${ANCHORS_FILE}`;
  const anchors = readGeneratedJson<AnchorsFile>(root, anchorsPath, METADATA_LABEL);
  const entries = Object.entries(anchors.anchors).sort(([left], [right]) => left.localeCompare(right));

  if (entries.length === 0) {
    return ["benjamin-docs anchors", "", "No anchors yet.", "", "Add one with:", "  benjamin-docs anchor add <id> <file>"].join("\n");
  }

  const lines = ["benjamin-docs anchors", ""];
  for (const [id, anchor] of entries) {
    lines.push(`- ${id}: ${anchor.file}`);
    if (anchor.docs.length > 0) lines.push(`  docs: ${anchor.docs.join(", ")}`);
  }

  return lines.join("\n");
}

interface SafePath {
  full: string;
  relative: string;
}

function validateRelativePath(root: string, path: string, label: string): SafePath {
  if (!path || path.includes("\\") || win32.isAbsolute(path) || hasDotSegment(path)) {
    throw new Error(`Invalid ${label}: ${path}`);
  }

  try {
    return { full: rootPath(root, path), relative: path };
  } catch {
    throw new Error(`Invalid ${label}: ${path}`);
  }
}

function hasDotSegment(path: string): boolean {
  return path.split("/").some((part) => part === "." || part === ".." || part === "");
}

function assertRegularFileInsideRoot(root: string, fullPath: string, originalPath: string): void {
  if (!statSync(fullPath).isFile()) {
    throw new Error(`Anchor target must be a regular file: ${originalPath}`);
  }

  const realRoot = realpathSync(root);
  const realTarget = realpathSync(fullPath);
  if (!isInsideRoot(realRoot, realTarget)) {
    throw new Error(`Anchor target must remain inside project root: ${originalPath}`);
  }
}

function isInsideRoot(root: string, target: string): boolean {
  const relativePath = relative(root, target);
  return relativePath === "" || (!relativePath.startsWith(`..${sep}`) && relativePath !== ".." && !isAbsolute(relativePath));
}
