import { readFileSync, rmSync } from "node:fs";
import { CONFIG_DIR, KNOWN_AUDIENCES, MANIFEST_FILE } from "./constants.js";
import { assertGeneratedPathSafe, ensureGeneratedDir, lstatIfExists, readGeneratedJson, rootPath, writeGeneratedText } from "./fsx.js";
import { parseMarkdown } from "./frontmatter.js";
import { readConfig } from "./project-config.js";
import type { Audience, ManifestFile } from "./types.js";
import { validateProject } from "./validate.js";

export function exportAudience(root: string, audience: string): string[] {
  const selectedAudience = parseAudience(audience);
  const validation = validateProject(root);
  if (validation.errors.length > 0) {
    throw new Error(["Cannot export while validation has errors:", ...validation.errors.map((error) => `- ${error}`)].join("\n"));
  }

  const config = readConfig(root);
  const docsRoot = rootPath(root, config.docsRoot);
  const manifest = readGeneratedJson<ManifestFile>(root, `${CONFIG_DIR}/${MANIFEST_FILE}`, "Metadata path");
  const docs = findManagedMarkdownFiles(config.docsRoot, manifest, docsRoot);
  const bundleRelativeRoot = `exports/${selectedAudience}`;
  prepareCleanBundleDirectory(root, selectedAudience);
  const written: string[] = [];

  for (const { docPath, relativePath } of docs) {
    const content = readFileSync(docPath, "utf8");
    const parsed = parseMarkdown(content);
    if (!parsed.frontmatter.audience.includes(selectedAudience)) continue;

    const targetRelativePath = `${bundleRelativeRoot}/${relativePath}`;
    const targetPath = rootPath(root, ...targetRelativePath.split("/"));
    writeGeneratedText(root, targetRelativePath, content);
    written.push(targetPath);
  }

  return written;
}

function parseAudience(audience: string): Audience {
  if (!KNOWN_AUDIENCES.includes(audience as Audience)) {
    throw new Error(`Unknown audience: ${audience}. Expected one of: ${KNOWN_AUDIENCES.join(", ")}`);
  }

  return audience as Audience;
}

function prepareCleanBundleDirectory(root: string, audience: Audience): string {
  const parts = ["exports", audience];
  const relativePath = parts.join("/");
  const bundleRoot = rootPath(root, ...parts);
  assertGeneratedPathSafe(root, parts, "Generated output path", "directory");

  const stat = lstatIfExists(bundleRoot);
  if (stat) {
    rmSync(bundleRoot, { recursive: true, force: true });
  }

  ensureGeneratedDir(root, relativePath);
  return bundleRoot;
}

function findManagedMarkdownFiles(docsRootName: string, manifest: ManifestFile, docsRoot: string): Array<{ docPath: string; relativePath: string }> {
  const docsRootPrefix = `${docsRootName}/`;

  return manifest.docs
    .filter((doc) => doc.startsWith(docsRootPrefix) && doc.endsWith(".md"))
    .map((doc) => ({
      docPath: rootPath(docsRoot, ...doc.slice(docsRootPrefix.length).split("/")),
      relativePath: doc.slice(docsRootPrefix.length),
    }))
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
