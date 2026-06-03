import { ANCHORS_FILE, CONFIG_DIR, CONFIG_FILE, DOCS_DIR, MANIFEST_FILE, SCOPES_FILE } from "./constants.js";
import { ensureDir, pathExists, rootPath, writeJson, writeText } from "./fsx.js";
import { starterDocs } from "./templates.js";
import type { AgentDocsConfig, AnchorsFile, ManifestFile, ScopesFile } from "./types.js";

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

function writeJsonIfMissing(root: string, parts: string[], value: unknown, written: string[]): void {
  const path = rootPath(root, ...parts);
  if (pathExists(path)) return;

  writeJson(path, value);
  written.push(parts.join("/"));
}
