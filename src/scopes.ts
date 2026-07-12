import { existsSync, readFileSync } from "node:fs";
import { CONFIG_DIR, CONFIG_FILE, KNOWN_STATUSES, MANIFEST_FILE, SCOPES_FILE } from "./constants.js";
import { parseMarkdown, serializeMarkdown } from "./frontmatter.js";
import { readGeneratedJson, rootPath, writeGeneratedJson, writeGeneratedText, writeGeneratedTextIfMissing } from "./fsx.js";
import { readConfig } from "./project-config.js";
import { featureDocs, today } from "./templates.js";
import type { BenjaminDocsConfig, DocStatus, ManifestFile, ScopeRecord, ScopesFile, WatchRule } from "./types.js";
import { defaultWatchRules } from "./watch.js";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const METADATA_LABEL = "Metadata path";

export function createScope(root: string, kind: string, id: string): string[] {
  if (kind !== "feature") {
    throw new Error("V1 scope creation supports feature scopes");
  }

  if (!SLUG_PATTERN.test(id)) {
    throw new Error(`Invalid feature slug: ${id}`);
  }

  const scopesPath = `${CONFIG_DIR}/${SCOPES_FILE}`;
  const scopes = readGeneratedJson<ScopesFile>(root, scopesPath, METADATA_LABEL);
  const manifestPath = `${CONFIG_DIR}/${MANIFEST_FILE}`;
  const manifest = readGeneratedJson<ManifestFile>(root, manifestPath, METADATA_LABEL);
  const config = readConfig(root);
  if (scopes.scopes.some((scope) => scope.id === id)) {
    throw new Error(`Scope already exists: ${id}`);
  }

  const written: string[] = [];
  const docs = featureDocs(id, config.docsRoot);
  for (const file of docs) {
    if (writeGeneratedTextIfMissing(root, file.path, file.content)) {
      written.push(file.path);
    }
  }

  const record: ScopeRecord = {
    id,
    kind: "feature",
    title: titleFromSlug(id),
    path: `${config.docsRoot}/features/${id}`,
    status: "draft",
  };
  scopes.scopes.push(record);
  writeGeneratedJson(root, scopesPath, scopes, METADATA_LABEL);

  for (const file of docs) {
    if (!manifest.docs.includes(file.path)) manifest.docs.push(file.path);
  }
  writeGeneratedJson(root, manifestPath, manifest, METADATA_LABEL);
  addFeatureWatchRule(root, config, id, docs.map((file) => file.path));
  return written;
}

export interface ScopeStatusResult {
  scope: ScopeRecord;
  updatedDocs: string[];
}

export function setScopeStatus(root: string, id: string, status: string): ScopeStatusResult {
  if (!(KNOWN_STATUSES as readonly string[]).includes(status)) {
    throw new Error(`Unknown scope status: ${status}. Expected one of: ${KNOWN_STATUSES.join(", ")}`);
  }

  const docStatus = status as DocStatus;
  const scopesPath = `${CONFIG_DIR}/${SCOPES_FILE}`;
  const scopes = readGeneratedJson<ScopesFile>(root, scopesPath, METADATA_LABEL);
  const scope = scopes.scopes.find((record) => record.id === id);
  if (!scope) {
    throw new Error(`Unknown scope: ${id}. Known scopes: ${scopes.scopes.map((record) => record.id).join(", ")}`);
  }

  scope.status = docStatus;
  writeGeneratedJson(root, scopesPath, scopes, METADATA_LABEL);

  if (docStatus === "archived") {
    const config = readConfig(root);
    const label = `feature/${scope.id}`;
    if (config.watch?.some((rule) => rule.label === label)) {
      writeGeneratedJson(root, `${CONFIG_DIR}/${CONFIG_FILE}`, { ...config, watch: config.watch.filter((rule) => rule.label !== label) }, METADATA_LABEL);
    }
  }

  const manifest = readGeneratedJson<ManifestFile>(root, `${CONFIG_DIR}/${MANIFEST_FILE}`, METADATA_LABEL);
  const scopeDocs = manifest.docs
    .filter((docPath) => docPath === scope.path || docPath.startsWith(`${scope.path}/`))
    .filter((docPath) => docPath.endsWith(".md"));
  const updatedDocs: string[] = [];

  for (const docPath of scopeDocs) {
    let fullPath;
    try {
      fullPath = rootPath(root, docPath);
    } catch {
      continue;
    }

    if (!existsSync(fullPath)) continue;

    let parsed;
    try {
      parsed = parseMarkdown(readFileSync(fullPath, "utf8"));
    } catch {
      continue;
    }

    if (parsed.frontmatter.status === docStatus) continue;

    writeGeneratedText(root, docPath, serializeMarkdown({ ...parsed.frontmatter, status: docStatus, updated: today() }, parsed.body));
    updatedDocs.push(docPath);
  }

  return { scope, updatedDocs };
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function addFeatureWatchRule(root: string, config: BenjaminDocsConfig, id: string, docs: string[]): void {
  const label = `feature/${id}`;
  const watch = config.watch ?? defaultWatchRules(config.docsRoot);
  if (watch.some((rule) => rule.label === label)) return;

  const nextConfig: BenjaminDocsConfig = {
    ...config,
    watch: [
      ...watch,
      {
        label,
        paths: featureWatchPaths(),
        docs,
      },
    ],
  };
  writeGeneratedJson(root, `${CONFIG_DIR}/${CONFIG_FILE}`, nextConfig, METADATA_LABEL);
}

function featureWatchPaths(): string[] {
  return [
    "src/**",
    "app/**",
    "apps/**",
    "lib/**",
    "pages/**",
    "components/**",
    "server/**",
    "api/**",
    "**/*.sql",
    "**/migrations/**",
    "README.md",
    "docs/**",
    ".claude/**",
    ".cursor/**",
  ];
}
