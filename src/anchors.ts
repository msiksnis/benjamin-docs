import { win32 } from "node:path";
import { ANCHORS_FILE, CONFIG_DIR } from "./constants.js";
import { pathExists, readJson, rootPath, writeJson } from "./fsx.js";
import type { AnchorsFile } from "./types.js";

const ANCHOR_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function addAnchor(root: string, id: string, file: string, docs: string[] = []): void {
  if (!ANCHOR_ID_PATTERN.test(id)) {
    throw new Error(`Invalid anchor id: ${id}`);
  }

  const filePath = validateRelativePath(root, file, "anchor file");
  const safeDocs = docs.map((doc) => validateRelativePath(root, doc, "anchor docs path"));

  if (!pathExists(filePath.full)) {
    throw new Error(`Anchor file does not exist: ${file}`);
  }

  const anchorsPath = rootPath(root, CONFIG_DIR, ANCHORS_FILE);
  const anchors = readJson<AnchorsFile>(anchorsPath);
  anchors.anchors[id] = { file, docs: safeDocs.map((doc) => doc.relative) };
  writeJson(anchorsPath, anchors);
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
