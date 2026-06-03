import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, sep } from "node:path";
import { DOCS_DIR, KNOWN_AUDIENCES } from "./constants.js";
import { rootPath } from "./fsx.js";
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
  const bundleRoot = prepareCleanBundleDirectory(root, selectedAudience);
  const written: string[] = [];

  for (const docPath of docs) {
    const content = readFileSync(docPath, "utf8");
    const parsed = parseMarkdown(content);
    if (!parsed.frontmatter.audience.includes(selectedAudience)) continue;

    const relativePath = relative(docsRoot, docPath).split(sep).join("/");
    const targetPath = rootPath(bundleRoot, ...relativePath.split("/"));
    writeGeneratedText(root, targetPath, content);
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
  const bundleRoot = rootPath(root, ...parts);
  assertGeneratedPathSafe(root, parts);

  const stat = lstatIfExists(bundleRoot);
  if (stat) {
    if (stat.isSymbolicLink()) {
      throw new Error(`Generated output path must not be a symlink: ${parts.join("/")}`);
    }

    if (!stat.isDirectory()) {
      throw new Error(`Generated output path must be a directory: ${parts.join("/")}`);
    }

    rmSync(bundleRoot, { recursive: true, force: true });
  }

  mkdirSync(bundleRoot, { recursive: true });
  assertGeneratedPathSafe(root, parts);
  return bundleRoot;
}

function writeGeneratedText(root: string, targetPath: string, content: string): void {
  const relativePath = relative(root, targetPath).split(sep).join("/");
  const parts = relativePath.split("/");
  const parentPath = dirname(targetPath);

  mkdirSync(parentPath, { recursive: true });
  assertGeneratedPathSafe(root, parts.slice(0, -1));
  writeFileSync(targetPath, content, "utf8");
}

function assertGeneratedPathSafe(root: string, parts: string[]): void {
  const realRoot = realpathSync(root);
  let current = root;
  let displayPath = "";

  for (const [index, part] of parts.entries()) {
    current = rootPath(current, part);
    displayPath = displayPath ? `${displayPath}/${part}` : part;

    const stat = lstatIfExists(current);
    if (!stat) return;

    if (stat.isSymbolicLink()) {
      throw new Error(`Generated output path must not be a symlink: ${displayPath}`);
    }

    const realCurrent = realpathSync(current);
    if (!isInsideRoot(realRoot, realCurrent)) {
      throw new Error(`Generated output path must remain inside project root: ${displayPath}`);
    }

    if (index < parts.length - 1 && !stat.isDirectory()) {
      throw new Error(`Generated output parent must be a directory: ${displayPath}`);
    }
  }
}

function lstatIfExists(path: string): ReturnType<typeof lstatSync> | undefined {
  try {
    return lstatSync(path);
  } catch (error) {
    if (isNotFoundError(error)) return undefined;
    throw error;
  }
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function isInsideRoot(root: string, target: string): boolean {
  const relativePath = relative(root, target);
  return relativePath === "" || (!relativePath.startsWith(`..${sep}`) && relativePath !== ".." && !isAbsolute(relativePath));
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
