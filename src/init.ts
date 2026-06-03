import { lstatSync, mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, sep } from "node:path";
import { ANCHORS_FILE, CONFIG_DIR, CONFIG_FILE, DOCS_DIR, MANIFEST_FILE, SCOPES_FILE } from "./constants.js";
import { ensureDir, pathExists, readJson, rootPath, writeJson, writeText } from "./fsx.js";
import { codebaseDocs, starterDocs } from "./templates.js";
import type { AgentDocsConfig, AnchorsFile, ManifestFile, ScopeRecord, ScopesFile } from "./types.js";

export function initProject(root: string): string[] {
  const written: string[] = [];

  ensureDir(rootPath(root, DOCS_DIR));
  ensureDir(rootPath(root, CONFIG_DIR));

  for (const starter of starterDocs) {
    const fullPath = rootPath(root, starter.path);
    if (!pathExists(fullPath)) {
      writeText(fullPath, starter.content);
      written.push(starter.path);
    }
  }

  writeJsonIfMissing(
    root,
    [CONFIG_DIR, CONFIG_FILE],
    { version: 1, mode: "planning" } satisfies AgentDocsConfig,
    written,
  );
  writeJsonIfMissing(
    root,
    [CONFIG_DIR, MANIFEST_FILE],
    { version: 1, docs: starterDocs.map((item) => item.path) } satisfies ManifestFile,
    written,
  );
  writeJsonIfMissing(
    root,
    [CONFIG_DIR, SCOPES_FILE],
    {
      version: 1,
      scopes: [
        { id: "project", kind: "project", title: "Project", path: "docs/project", status: "draft" },
        { id: "human-brief", kind: "handoff", title: "Human Brief", path: "docs/handoff/human-brief.md", status: "draft" },
        { id: "agent-brief", kind: "handoff", title: "Agent Brief", path: "docs/handoff/agent-brief.md", status: "draft" },
      ],
    } satisfies ScopesFile,
    written,
  );
  writeJsonIfMissing(root, [CONFIG_DIR, ANCHORS_FILE], { version: 1, anchors: {} } satisfies AnchorsFile, written);

  return written;
}

export function promoteToCodebase(root: string): string[] {
  const written: string[] = [];

  assertGeneratedPathSafe(root, [CONFIG_DIR, CONFIG_FILE], "Metadata path");
  assertGeneratedPathSafe(root, [CONFIG_DIR, MANIFEST_FILE], "Metadata path");
  assertGeneratedPathSafe(root, [CONFIG_DIR, SCOPES_FILE], "Metadata path");
  for (const codebaseDoc of codebaseDocs) {
    assertGeneratedPathSafe(root, codebaseDoc.path.split("/"), "Generated output path");
  }

  for (const codebaseDoc of codebaseDocs) {
    writeGeneratedTextIfMissing(root, codebaseDoc.path, codebaseDoc.content, written);
  }

  const configPath = rootPath(root, CONFIG_DIR, CONFIG_FILE);
  const config = readJson<AgentDocsConfig>(configPath);
  config.mode = "codebase";
  writeJson(configPath, config);

  updateManifest(root);
  updateScopes(root);

  return written;
}

function writeJsonIfMissing(root: string, parts: string[], value: unknown, written: string[]): void {
  const path = rootPath(root, ...parts);
  if (pathExists(path)) return;

  writeJson(path, value);
  written.push(parts.join("/"));
}

function writeGeneratedTextIfMissing(root: string, path: string, content: string, written: string[]): void {
  const parts = path.split("/");
  assertGeneratedPathSafe(root, parts, "Generated output path");

  const fullPath = rootPath(root, ...parts);
  const stat = lstatIfExists(fullPath);
  if (stat) {
    if (!stat.isFile()) {
      throw new Error(`Generated output path must be a file: ${path}`);
    }

    return;
  }

  const parentPath = dirname(fullPath);
  mkdirSync(parentPath, { recursive: true });
  assertGeneratedPathSafe(root, parts.slice(0, -1), "Generated output path");
  writeFileSync(fullPath, content, "utf8");
  written.push(path);
}

function assertGeneratedPathSafe(root: string, parts: string[], label: string): void {
  const realRoot = realpathSync(root);
  let current = root;
  let displayPath = "";

  for (const [index, part] of parts.entries()) {
    current = rootPath(current, part);
    displayPath = displayPath ? `${displayPath}/${part}` : part;

    const stat = lstatIfExists(current);
    if (!stat) return;

    if (stat.isSymbolicLink()) {
      throw new Error(`${label} must not be a symlink: ${displayPath}`);
    }

    const realCurrent = realpathSync(current);
    if (!isInsideRoot(realRoot, realCurrent)) {
      throw new Error(`${label} must remain inside project root: ${displayPath}`);
    }

    if (index < parts.length - 1 && !stat.isDirectory()) {
      throw new Error(`${label} parent must be a directory: ${displayPath}`);
    }
  }
}

function lstatIfExists(path: string): ReturnType<typeof lstatSync> | undefined {
  try {
    return lstatSync(path);
  } catch (error) {
    if (isNotFoundError(error)) return undefined;
    throw error;
  }
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function isInsideRoot(root: string, target: string): boolean {
  const relativePath = relative(root, target);
  return relativePath === "" || (!relativePath.startsWith(`..${sep}`) && relativePath !== ".." && !isAbsolute(relativePath));
}

function updateManifest(root: string): void {
  const manifestPath = rootPath(root, CONFIG_DIR, MANIFEST_FILE);
  const manifest = readJson<ManifestFile>(manifestPath);

  for (const codebaseDoc of codebaseDocs) {
    if (!manifest.docs.includes(codebaseDoc.path)) manifest.docs.push(codebaseDoc.path);
  }

  writeJson(manifestPath, manifest);
}

function updateScopes(root: string): void {
  const scopesPath = rootPath(root, CONFIG_DIR, SCOPES_FILE);
  const scopes = readJson<ScopesFile>(scopesPath);
  if (scopes.scopes.some((scope) => scope.id === "release")) {
    return;
  }

  const releaseScope: ScopeRecord = {
    id: "release",
    kind: "release",
    title: "Release",
    path: "docs/releases/changelog.md",
    status: "draft",
  };
  scopes.scopes.push(releaseScope);
  writeJson(scopesPath, scopes);
}
