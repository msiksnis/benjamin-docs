import { existsSync } from "node:fs";
import { CONFIG_DIR, CONFIG_FILE, MANIFEST_FILE, SCOPES_FILE } from "./constants.js";
import { readJson, rootPath } from "./fsx.js";
import type { AgentDocsConfig, ManifestFile, ScopesFile } from "./types.js";

export function getStatus(root: string): string {
  const configPath = rootPath(root, CONFIG_DIR, CONFIG_FILE);
  const manifestPath = rootPath(root, CONFIG_DIR, MANIFEST_FILE);
  const scopesPath = rootPath(root, CONFIG_DIR, SCOPES_FILE);

  if (!existsSync(configPath) || !existsSync(manifestPath) || !existsSync(scopesPath)) {
    throw new Error("agent-docs is not initialized. Run agent-docs init first.");
  }

  let config: AgentDocsConfig;
  let manifest: ManifestFile;
  let scopes: ScopesFile;
  try {
    config = readJson<AgentDocsConfig>(configPath);
    manifest = readJson<ManifestFile>(manifestPath);
    scopes = readJson<ScopesFile>(scopesPath);
  } catch (error) {
    throw new Error(`Cannot read agent-docs status metadata: ${error instanceof Error ? error.message : String(error)}`);
  }

  if ((config.mode !== "planning" && config.mode !== "codebase") || !Array.isArray(manifest.docs) || !Array.isArray(scopes.scopes)) {
    throw new Error("Cannot read agent-docs status metadata: expected config, manifest, and scopes metadata.");
  }

  return [
    "agent-docs status",
    `mode: ${config.mode}`,
    `docs: ${manifest.docs.length}`,
    `scopes: ${scopes.scopes.length}`,
  ].join("\n");
}
