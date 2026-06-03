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

  for (const codebaseDoc of codebaseDocs) {
    const fullPath = rootPath(root, codebaseDoc.path);
    if (!pathExists(fullPath)) {
      writeText(fullPath, codebaseDoc.content);
      written.push(codebaseDoc.path);
    }
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
