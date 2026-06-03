import { ANCHORS_FILE, CONFIG_DIR, CONFIG_FILE, DOCS_DIR, MANIFEST_FILE, SCOPES_FILE } from "./constants.js";
import {
  ensureGeneratedDir,
  readGeneratedJson,
  writeGeneratedJson,
  writeGeneratedJsonIfMissing,
  writeGeneratedTextIfMissing,
} from "./fsx.js";
import { codebaseDocs, starterDocs } from "./templates.js";
import type { AgentDocsConfig, AnchorsFile, ManifestFile, ScopeRecord, ScopesFile } from "./types.js";

const METADATA_LABEL = "Metadata path";

export function initProject(root: string): string[] {
  const written: string[] = [];

  ensureGeneratedDir(root, DOCS_DIR);
  ensureGeneratedDir(root, CONFIG_DIR, METADATA_LABEL);

  for (const starter of starterDocs) {
    if (writeGeneratedTextIfMissing(root, starter.path, starter.content)) {
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
    if (writeGeneratedTextIfMissing(root, codebaseDoc.path, codebaseDoc.content)) {
      written.push(codebaseDoc.path);
    }
  }

  const config = readGeneratedJson<AgentDocsConfig>(root, `${CONFIG_DIR}/${CONFIG_FILE}`, METADATA_LABEL);
  config.mode = "codebase";
  writeGeneratedJson(root, `${CONFIG_DIR}/${CONFIG_FILE}`, config, METADATA_LABEL);

  updateManifest(root);
  updateScopes(root);

  return written;
}

function writeJsonIfMissing(root: string, parts: string[], value: unknown, written: string[]): void {
  const path = parts.join("/");
  if (writeGeneratedJsonIfMissing(root, path, value, METADATA_LABEL)) {
    written.push(path);
  }
}

function updateManifest(root: string): void {
  const manifest = readGeneratedJson<ManifestFile>(root, `${CONFIG_DIR}/${MANIFEST_FILE}`, METADATA_LABEL);

  for (const codebaseDoc of codebaseDocs) {
    if (!manifest.docs.includes(codebaseDoc.path)) manifest.docs.push(codebaseDoc.path);
  }

  writeGeneratedJson(root, `${CONFIG_DIR}/${MANIFEST_FILE}`, manifest, METADATA_LABEL);
}

function updateScopes(root: string): void {
  const scopes = readGeneratedJson<ScopesFile>(root, `${CONFIG_DIR}/${SCOPES_FILE}`, METADATA_LABEL);
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
  writeGeneratedJson(root, `${CONFIG_DIR}/${SCOPES_FILE}`, scopes, METADATA_LABEL);
}
