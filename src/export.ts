import { existsSync, lstatSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { relative, sep } from "node:path";
import { DOCS_DIR, KNOWN_AUDIENCES } from "./constants.js";
import { assertGeneratedPathSafe, ensureGeneratedDir, lstatIfExists, rootPath, writeGeneratedText } from "./fsx.js";
import { parseMarkdown } from "./frontmatter.js";
import type { Audience } from "./types.js";
import { validateProject } from "./validate.js";

export function exportAudience(root: string, audience: string): string[] {
  const selectedAudience = parseAudience(audience);
  const validation = validateProject(root);
  if (validation.errors.length > 0) {
    throw new Error(["Cannot export while validation has errors:", ...validation.errors.map((error) => `- ${error}`)].join("\n"));
  }

  const docsRoot = rootPath(root, DOCS_DIR);
  const docs = findMarkdownFiles(docsRoot);
  const bundleRelativeRoot = `exports/${selectedAudience}`;
  prepareCleanBundleDirectory(root, selectedAudience);
  const written: string[] = [];

  for (const docPath of docs) {
    const content = readFileSync(docPath, "utf8");
    const parsed = parseMarkdown(content);
    if (!parsed.frontmatter.audience.includes(selectedAudience)) continue;

    const relativePath = relative(docsRoot, docPath).split(sep).join("/");
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

function findMarkdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];

  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = rootPath(dir, entry);
    const stat = lstatSync(fullPath);

    if (stat.isSymbolicLink()) {
      if (fullPath.endsWith(".md")) files.push(fullPath);
      continue;
    }

    if (stat.isDirectory()) files.push(...findMarkdownFiles(fullPath));
    if (stat.isFile() && fullPath.endsWith(".md")) files.push(fullPath);
  }

  return files.sort();
}
