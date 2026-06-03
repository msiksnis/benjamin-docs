import { CONFIG_DIR, CONFIG_FILE, MANIFEST_FILE, SCOPES_FILE } from "./constants.js";
import { readJson, rootPath } from "./fsx.js";
import type { AgentDocsConfig, ManifestFile, ScopesFile } from "./types.js";

export function getStatus(root: string): string {
  const config = readJson<AgentDocsConfig>(rootPath(root, CONFIG_DIR, CONFIG_FILE));
  const manifest = readJson<ManifestFile>(rootPath(root, CONFIG_DIR, MANIFEST_FILE));
  const scopes = readJson<ScopesFile>(rootPath(root, CONFIG_DIR, SCOPES_FILE));

  return [
    "agent-docs status",
    `mode: ${config.mode}`,
    `docs: ${manifest.docs.length}`,
    `scopes: ${scopes.scopes.length}`,
  ].join("\n");
}
