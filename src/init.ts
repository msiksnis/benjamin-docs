import { existsSync } from "node:fs";
import { ANCHORS_FILE, CONFIG_DIR, CONFIG_FILE, DEFAULT_DOCS_ROOT, MANIFEST_FILE, SCOPES_FILE } from "./constants.js";
import {
  ensureGeneratedDir,
  readGeneratedJson,
  writeGeneratedJson,
  writeGeneratedJsonIfMissing,
  writeGeneratedTextIfMissing,
} from "./fsx.js";
import { codebaseDocs, featureDocs, workspaceDocs } from "./templates.js";
import { assertSafeDocsRoot, defaultConfig, normalizeConfig } from "./project-config.js";
import type { BenjaminDocsConfig, AnchorsFile, FocusType, ManifestFile, ScopeRecord, ScopesFile } from "./types.js";

const METADATA_LABEL = "Metadata path";
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface InitProjectOptions {
  setup?: FocusType;
  feature?: string;
  docsRoot?: string;
  agentContract?: boolean;
  childContracts?: boolean;
}

export interface InitProjectResult {
  written: string[];
  config: BenjaminDocsConfig;
}

export function initProject(root: string, options: InitProjectOptions = {}): InitProjectResult {
  const written: string[] = [];
  const docsRoot = options.docsRoot ?? DEFAULT_DOCS_ROOT;
  assertSafeDocsRoot(docsRoot);

  const setup = options.setup ?? "project";
  const feature = options.feature;
  if (setup === "feature" && (!feature || !SLUG_PATTERN.test(feature))) {
    throw new Error("Usage: benjamin-docs init --mode feature --feature <slug>");
  }

  const mode: BenjaminDocsConfig["mode"] = setup === "codebase" || (setup === "feature" && looksLikeCodebase(root)) ? "codebase" : "planning";
  const config = defaultConfig({ mode, docsRoot, focus: setup, feature });

  ensureGeneratedDir(root, docsRoot);
  ensureGeneratedDir(root, CONFIG_DIR, METADATA_LABEL);

  const docs = workspaceDocs(docsRoot);
  const featureFiles = setup === "feature" && feature ? featureDocs(feature, docsRoot) : [];
  for (const doc of [...docs, ...featureFiles]) {
    if (writeGeneratedTextIfMissing(root, doc.path, doc.content)) {
      written.push(doc.path);
    }
  }

  writeConfig(root, config, written);
  writeManifest(root, [...docs, ...featureFiles].map((item) => item.path), written);
  writeScopes(root, docsRoot, feature, written);
  writeJsonIfMissing(root, [CONFIG_DIR, ANCHORS_FILE], { version: 1, anchors: {} } satisfies AnchorsFile, written);

  return { written, config };
}

export function promoteToCodebase(root: string): string[] {
  const written: string[] = [];
  const config = normalizeConfig(readGeneratedJson<BenjaminDocsConfig>(root, `${CONFIG_DIR}/${CONFIG_FILE}`, METADATA_LABEL));
  assertSafeDocsRoot(config.docsRoot);

  for (const codebaseDoc of codebaseDocs(config.docsRoot)) {
    if (writeGeneratedTextIfMissing(root, codebaseDoc.path, codebaseDoc.content)) {
      written.push(codebaseDoc.path);
    }
  }

  config.mode = "codebase";
  config.focus = "codebase";
  writeGeneratedJson(root, `${CONFIG_DIR}/${CONFIG_FILE}`, config, METADATA_LABEL);

  updateManifest(root, config.docsRoot);
  updateScopes(root, config.docsRoot);

  return written;
}

function writeConfig(root: string, config: BenjaminDocsConfig, written: string[]): void {
  const path = `${CONFIG_DIR}/${CONFIG_FILE}`;
  if (writeGeneratedJsonIfMissing(root, path, config, METADATA_LABEL)) {
    written.push(path);
    return;
  }

  const existing = normalizeConfig(readGeneratedJson<BenjaminDocsConfig>(root, path, METADATA_LABEL));
  const next: BenjaminDocsConfig = {
    ...existing,
    docsRoot: existing.docsRoot || config.docsRoot,
    mode: config.mode,
    focus: config.focus,
    feature: config.feature,
  };
  writeGeneratedJson(root, path, next, METADATA_LABEL);
}

function writeManifest(root: string, docs: string[], written: string[]): void {
  const path = `${CONFIG_DIR}/${MANIFEST_FILE}`;
  const initial = { version: 1, docs } satisfies ManifestFile;
  if (writeGeneratedJsonIfMissing(root, path, initial, METADATA_LABEL)) {
    written.push(path);
    return;
  }

  const manifest = readGeneratedJson<ManifestFile>(root, path, METADATA_LABEL);
  for (const doc of docs) {
    if (!manifest.docs.includes(doc)) manifest.docs.push(doc);
  }
  writeGeneratedJson(root, path, manifest, METADATA_LABEL);
}

function writeScopes(root: string, docsRoot: string, feature: string | undefined, written: string[]): void {
  const path = `${CONFIG_DIR}/${SCOPES_FILE}`;
  const records = baseScopes(docsRoot, feature);
  const initial = { version: 1, scopes: records } satisfies ScopesFile;
  if (writeGeneratedJsonIfMissing(root, path, initial, METADATA_LABEL)) {
    written.push(path);
    return;
  }

  const scopes = readGeneratedJson<ScopesFile>(root, path, METADATA_LABEL);
  for (const record of records) {
    if (!scopes.scopes.some((scope) => scope.id === record.id)) scopes.scopes.push(record);
  }
  writeGeneratedJson(root, path, scopes, METADATA_LABEL);
}

function baseScopes(docsRoot: string, feature: string | undefined): ScopeRecord[] {
  return [
    { id: "project", kind: "project", title: "Project", path: `${docsRoot}/project`, status: "draft" },
    { id: "human-brief", kind: "handoff", title: "Human Brief", path: `${docsRoot}/handoff/human-brief.md`, status: "draft" },
    { id: "agent-brief", kind: "handoff", title: "Agent Brief", path: `${docsRoot}/handoff/agent-brief.md`, status: "draft" },
    { id: "release", kind: "release", title: "Release", path: `${docsRoot}/releases/changelog.md`, status: "draft" },
    ...(feature
      ? [{ id: feature, kind: "feature" as const, title: titleFromSlug(feature), path: `${docsRoot}/features/${feature}`, status: "draft" as const }]
      : []),
  ];
}

function writeJsonIfMissing(root: string, parts: string[], value: unknown, written: string[]): void {
  const path = parts.join("/");
  if (writeGeneratedJsonIfMissing(root, path, value, METADATA_LABEL)) {
    written.push(path);
  }
}

function updateManifest(root: string, docsRoot: string): void {
  const manifest = readGeneratedJson<ManifestFile>(root, `${CONFIG_DIR}/${MANIFEST_FILE}`, METADATA_LABEL);

  for (const codebaseDoc of codebaseDocs(docsRoot)) {
    if (!manifest.docs.includes(codebaseDoc.path)) manifest.docs.push(codebaseDoc.path);
  }

  writeGeneratedJson(root, `${CONFIG_DIR}/${MANIFEST_FILE}`, manifest, METADATA_LABEL);
}

function updateScopes(root: string, docsRoot: string): void {
  const scopes = readGeneratedJson<ScopesFile>(root, `${CONFIG_DIR}/${SCOPES_FILE}`, METADATA_LABEL);
  if (scopes.scopes.some((scope) => scope.id === "release")) {
    return;
  }

  const releaseScope: ScopeRecord = {
    id: "release",
    kind: "release",
    title: "Release",
    path: `${docsRoot}/releases/changelog.md`,
    status: "draft",
  };
  scopes.scopes.push(releaseScope);
  writeGeneratedJson(root, `${CONFIG_DIR}/${SCOPES_FILE}`, scopes, METADATA_LABEL);
}

function looksLikeCodebase(root: string): boolean {
  return ["package.json", "src", "app", "pages", "pyproject.toml", "Cargo.toml", "go.mod", "pom.xml"].some((path) => existsSync(`${root}/${path}`));
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
