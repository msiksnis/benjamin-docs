import { CONFIG_DIR, SCOPES_FILE } from "./constants.js";
import { pathExists, readJson, rootPath, writeJson, writeText } from "./fsx.js";
import { featureDocs } from "./templates.js";
import type { ScopeRecord, ScopesFile } from "./types.js";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createScope(root: string, kind: string, id: string): string[] {
  if (kind !== "feature") {
    throw new Error("V1 scope creation supports feature scopes");
  }

  if (!SLUG_PATTERN.test(id)) {
    throw new Error(`Invalid feature slug: ${id}`);
  }

  const scopesPath = rootPath(root, CONFIG_DIR, SCOPES_FILE);
  const scopes = readJson<ScopesFile>(scopesPath);
  if (scopes.scopes.some((scope) => scope.id === id)) {
    throw new Error(`Scope already exists: ${id}`);
  }

  const written: string[] = [];
  for (const file of featureDocs(id)) {
    const fullPath = rootPath(root, file.path);
    if (!pathExists(fullPath)) {
      writeText(fullPath, file.content);
      written.push(file.path);
    }
  }

  const record: ScopeRecord = {
    id,
    kind: "feature",
    title: titleFromSlug(id),
    path: `docs/features/${id}`,
    status: "draft",
  };
  scopes.scopes.push(record);
  writeJson(scopesPath, scopes);
  return written;
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
