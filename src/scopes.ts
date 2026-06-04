import { CONFIG_DIR, MANIFEST_FILE, SCOPES_FILE } from "./constants.js";
import { readGeneratedJson, writeGeneratedJson, writeGeneratedTextIfMissing } from "./fsx.js";
import { readConfig } from "./project-config.js";
import { featureDocs } from "./templates.js";
import type { ManifestFile, ScopeRecord, ScopesFile } from "./types.js";

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
  return written;
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
