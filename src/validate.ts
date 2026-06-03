import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, normalize, relative, resolve, sep, win32 } from "node:path";
import { ANCHORS_FILE, CONFIG_DIR, CONFIG_FILE, DOCS_DIR, KNOWN_SCOPES, KNOWN_STATUSES, MANIFEST_FILE, SCOPES_FILE } from "./constants.js";
import { parseMarkdown } from "./frontmatter.js";
import { readJson, rootPath } from "./fsx.js";
import type { BenjaminDocsConfig, AnchorsFile, ManifestFile, ScopeRecord, ScopesFile } from "./types.js";

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

const ANCHOR_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateProject(root: string): ValidationResult {
  const resolvedRoot = resolve(root);
  const errors: string[] = [];
  const warnings: string[] = [];
  const realRoot = resolveRealPath(resolvedRoot, "Project root", resolvedRoot, errors) ?? resolvedRoot;
  const metadataRoot = rootPath(resolvedRoot, CONFIG_DIR);
  const metadataRootIsSafe = validateMetadataRoot(realRoot, metadataRoot, errors);

  const config = metadataRootIsSafe
    ? readMetadataFile<BenjaminDocsConfig>(resolvedRoot, realRoot, join(CONFIG_DIR, CONFIG_FILE), errors)
    : undefined;
  const manifest = metadataRootIsSafe
    ? readMetadataFile<ManifestFile>(resolvedRoot, realRoot, join(CONFIG_DIR, MANIFEST_FILE), errors)
    : undefined;
  const scopes = metadataRootIsSafe
    ? readMetadataFile<ScopesFile>(resolvedRoot, realRoot, join(CONFIG_DIR, SCOPES_FILE), errors)
    : undefined;
  const anchors = metadataRootIsSafe
    ? readMetadataFile<AnchorsFile>(resolvedRoot, realRoot, join(CONFIG_DIR, ANCHORS_FILE), errors)
    : undefined;

  if (config) validateConfig(config, errors);
  if (manifest) validateManifest(resolvedRoot, realRoot, manifest, errors);
  if (scopes) validateScopes(resolvedRoot, realRoot, scopes, errors);

  const docsRoot = resolveProjectPath(resolvedRoot, DOCS_DIR, "docs/", errors);
  const docs = docsRoot && validateDocsRoot(realRoot, docsRoot, errors) ? findMarkdownFiles(resolvedRoot, realRoot, docsRoot, errors) : [];
  if (docs.length === 0) warnings.push("No Markdown docs found under docs/");

  for (const doc of docs) {
    validateMarkdownDoc(resolvedRoot, realRoot, doc, errors);
  }

  if (anchors) validateAnchors(resolvedRoot, realRoot, anchors, errors);

  return { errors, warnings };
}

function readMetadataFile<T>(root: string, realRoot: string, relativePath: string, errors: string[]): T | undefined {
  const fullPath = rootPath(root, relativePath);

  try {
    lstatSync(fullPath);
  } catch (error) {
    if (isNotFoundError(error)) {
      errors.push(`Missing required file: ${relativePath}`);
    } else {
      errors.push(`${relativePath}: could not be inspected: ${error instanceof Error ? error.message : String(error)}`);
    }
    return undefined;
  }

  const realTarget = resolveRealPath(fullPath, `${relativePath} target`, relativePath, errors);
  if (!realTarget) return undefined;

  if (!isInsideRoot(realRoot, realTarget)) {
    errors.push(`${relativePath} must remain inside project root`);
    return undefined;
  }

  if (!safeStatIsFile(realTarget)) {
    errors.push(`Required metadata path is not a file: ${relativePath}`);
    return undefined;
  }

  try {
    return readJson<T>(fullPath);
  } catch (error) {
    errors.push(`${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

function validateMetadataRoot(realRoot: string, metadataRoot: string, errors: string[]): boolean {
  let stat;
  try {
    stat = lstatSync(metadataRoot);
  } catch (error) {
    if (isNotFoundError(error)) return true;
    errors.push(`${CONFIG_DIR}/: could not be inspected: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }

  const realMetadataRoot = resolveRealPath(metadataRoot, `${CONFIG_DIR}/`, `${CONFIG_DIR}/`, errors);
  if (!realMetadataRoot) return false;

  if (!isInsideRoot(realRoot, realMetadataRoot)) {
    errors.push(`${CONFIG_DIR}/ must remain inside project root`);
    return false;
  }

  if (stat.isSymbolicLink() && !safeStatIsDirectory(realMetadataRoot)) {
    errors.push(`${CONFIG_DIR}/ symlink target must be a directory`);
    return false;
  }

  if (!stat.isSymbolicLink() && !stat.isDirectory()) {
    errors.push(`${CONFIG_DIR}/ must be a directory`);
    return false;
  }

  return true;
}

function validateConfig(config: BenjaminDocsConfig, errors: string[]): void {
  if (!isRecord(config)) {
    errors.push(`${CONFIG_DIR}/${CONFIG_FILE}: expected an object`);
    return;
  }

  if (config.version !== 1) errors.push(`${CONFIG_DIR}/${CONFIG_FILE}: version must be 1`);
  if (config.mode !== "planning" && config.mode !== "codebase") {
    errors.push(`${CONFIG_DIR}/${CONFIG_FILE}: mode must be planning or codebase`);
  }
}

function validateManifest(root: string, realRoot: string, manifest: ManifestFile, errors: string[]): void {
  if (!isRecord(manifest)) {
    errors.push(`${CONFIG_DIR}/${MANIFEST_FILE}: expected an object`);
    return;
  }

  if (manifest.version !== 1) errors.push(`${CONFIG_DIR}/${MANIFEST_FILE}: version must be 1`);
  if (!Array.isArray(manifest.docs)) {
    errors.push(`${CONFIG_DIR}/${MANIFEST_FILE}: docs must be an array`);
    return;
  }

  manifest.docs.forEach((doc, index) => {
    if (typeof doc !== "string" || doc.length === 0) {
      errors.push(`${CONFIG_DIR}/${MANIFEST_FILE}: docs[${index}] must be a non-empty string`);
      return;
    }

    const fullPath = resolveProjectPath(root, doc, `Manifest doc`, errors);
    if (!fullPath) return;

    if (!existsSync(fullPath)) {
      errors.push(`Manifest doc is missing: ${doc}`);
      return;
    }

    if (!safeStatIsFile(fullPath)) {
      errors.push(`Manifest doc is not a file: ${doc}`);
      return;
    }

    const realDoc = resolveRealPath(fullPath, `Manifest doc target`, doc, errors);
    if (realDoc && !isInsideRoot(realRoot, realDoc)) {
      errors.push(`Manifest doc must remain inside project root: ${doc}`);
    }
  });
}

function validateScopes(root: string, realRoot: string, scopes: ScopesFile, errors: string[]): void {
  if (!isRecord(scopes)) {
    errors.push(`${CONFIG_DIR}/${SCOPES_FILE}: expected an object`);
    return;
  }

  if (scopes.version !== 1) errors.push(`${CONFIG_DIR}/${SCOPES_FILE}: version must be 1`);
  if (!Array.isArray(scopes.scopes)) {
    errors.push(`${CONFIG_DIR}/${SCOPES_FILE}: scopes must be an array`);
    return;
  }

  const seenScopeIds = new Set<string>();
  scopes.scopes.forEach((scope, index) => {
    if (!isScopeRecord(scope)) {
      errors.push(`${CONFIG_DIR}/${SCOPES_FILE}: scopes[${index}] must be a scope record`);
      return;
    }

    if (seenScopeIds.has(scope.id)) errors.push(`Duplicate scope id: ${scope.id}`);
    seenScopeIds.add(scope.id);

    if (!KNOWN_SCOPES.includes(scope.kind)) {
      errors.push(`Scope ${scope.id} has unknown kind: ${scope.kind}`);
    }

    if (!KNOWN_STATUSES.includes(scope.status)) {
      errors.push(`Scope ${scope.id} has unknown status: ${scope.status}`);
    }

    const fullPath = resolveProjectPath(root, scope.path, `Scope ${scope.id} path`, errors);
    if (!fullPath) return;

    if (!existsSync(fullPath)) {
      errors.push(`Scope path is missing: ${scope.path}`);
      return;
    }

    validatePathInsideRoot(realRoot, fullPath, `Scope ${scope.id} path`, scope.path, errors);
  });
}

function validateMarkdownDoc(root: string, realRoot: string, fullPath: string, errors: string[]): void {
  const relativePath = toProjectPath(root, fullPath);

  let stat;
  try {
    stat = lstatSync(fullPath);
  } catch (error) {
    errors.push(`${relativePath}: could not be inspected: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  if (stat.isSymbolicLink()) {
    const realTarget = resolveRealPath(fullPath, `${relativePath}: symlink target`, relativePath, errors);
    if (!realTarget) return;

    if (!isInsideRoot(realRoot, realTarget)) {
      errors.push(`${relativePath}: symlink target must remain inside project root`);
      return;
    }

    if (!safeStatIsFile(realTarget)) {
      errors.push(`${relativePath}: symlink target is not a file`);
      return;
    }
  } else if (!stat.isFile()) {
    errors.push(`${relativePath}: Markdown path is not a file`);
    return;
  }

  let content: string;
  try {
    content = readFileSync(fullPath, "utf8");
  } catch (error) {
    errors.push(`${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  try {
    const parsed = parseMarkdown(content);
    validateLinks(root, realRoot, relativePath, parsed.body, errors);
  } catch (error) {
    errors.push(`${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function validateLinks(root: string, realRoot: string, docPath: string, body: string, errors: string[]): void {
  const linkPattern = /!?\[[^\]]*]\(([^)]+)\)/g;

  for (const match of body.matchAll(linkPattern)) {
    const rawTarget = match[1];
    const target = extractLinkTarget(rawTarget);
    if (!target || isNonRelativeLink(target)) continue;

    const pathPart = stripFragmentAndQuery(target);
    if (!pathPart) continue;

    const decodedPath = decodeLinkPath(pathPart);
    const targetPath = resolveProjectPath(root, join(dirname(docPath), decodedPath), `${docPath}: link`, errors);
    if (!targetPath) {
      errors.push(`${docPath}: broken link ${target}`);
      continue;
    }

    if (!existsSync(targetPath)) {
      errors.push(`${docPath}: broken link ${target}`);
      continue;
    }

    const realTarget = resolveRealPath(targetPath, `${docPath}: link target`, target, errors);
    if (!realTarget) continue;

    if (!isInsideRoot(realRoot, realTarget)) {
      errors.push(`${docPath}: link must remain inside project root: ${target}`);
    }
  }
}

function validateAnchors(root: string, realRoot: string, anchors: AnchorsFile, errors: string[]): void {
  if (!isRecord(anchors)) {
    errors.push(`${CONFIG_DIR}/${ANCHORS_FILE}: expected an object`);
    return;
  }

  if (anchors.version !== 1) errors.push(`${CONFIG_DIR}/${ANCHORS_FILE}: version must be 1`);
  if (!isRecord(anchors.anchors)) {
    errors.push(`${CONFIG_DIR}/${ANCHORS_FILE}: anchors must be an object`);
    return;
  }

  for (const [id, anchor] of Object.entries(anchors.anchors)) {
    if (!ANCHOR_ID_PATTERN.test(id)) {
      errors.push(`Invalid anchor id: ${id}`);
    }

    if (!isAnchorRecord(anchor)) {
      errors.push(`${CONFIG_DIR}/${ANCHORS_FILE}: anchor ${id} must contain a file and docs array`);
      continue;
    }

    validateAnchorFile(root, realRoot, id, anchor.file, errors);
    for (const doc of anchor.docs) validateAnchorDoc(root, realRoot, id, doc, errors);
  }
}

function validateAnchorFile(root: string, realRoot: string, id: string, file: string, errors: string[]): void {
  const fullPath = resolveAnchorPath(root, file, "anchor file", errors);
  if (!fullPath) return;

  if (!existsSync(fullPath)) {
    errors.push(`Anchor ${id} points to missing file: ${file}`);
    return;
  }

  let isRegularFile = false;
  try {
    isRegularFile = statSync(fullPath).isFile();
  } catch (error) {
    errors.push(`Anchor ${id} file could not be inspected: ${file}: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  if (!isRegularFile) {
    errors.push(`Anchor ${id} file must be a regular file: ${file}`);
    return;
  }

  let realTarget: string;
  try {
    realTarget = realpathSync(fullPath);
  } catch (error) {
    errors.push(`Anchor ${id} file could not be resolved: ${file}: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }

  if (!isInsideRoot(realRoot, realTarget)) {
    errors.push(`Anchor ${id} file must remain inside project root: ${file}`);
  }
}

function validateAnchorDoc(root: string, realRoot: string, id: string, doc: string, errors: string[]): void {
  const fullPath = resolveAnchorPath(root, doc, "anchor docs path", errors);
  if (!fullPath) return;

  if (!existsSync(fullPath)) {
    errors.push(`Anchor ${id} points to missing doc: ${doc}`);
    return;
  }

  if (!safeStatIsFile(fullPath)) {
    errors.push(`Anchor ${id} doc is not a file: ${doc}`);
    return;
  }

  validatePathInsideRoot(realRoot, fullPath, `Anchor ${id} doc`, doc, errors);
}

function resolveAnchorPath(root: string, path: string, label: string, errors: string[]): string | undefined {
  if (!path || path.includes("\\") || win32.isAbsolute(path) || hasDotSegment(path)) {
    errors.push(`Invalid ${label}: ${path}`);
    return undefined;
  }

  return resolveProjectPath(root, path, label, errors);
}

function validatePathInsideRoot(realRoot: string, fullPath: string, label: string, displayPath: string, errors: string[]): boolean {
  const realTarget = resolveRealPath(fullPath, `${label} target`, displayPath, errors);
  if (!realTarget) return false;

  if (!isInsideRoot(realRoot, realTarget)) {
    errors.push(`${label} must remain inside project root: ${displayPath}`);
    return false;
  }

  return true;
}

function resolveProjectPath(root: string, path: string, label: string, errors: string[]): string | undefined {
  if (!path || isAbsolute(path)) {
    errors.push(`${label} must be a relative project path: ${path}`);
    return undefined;
  }

  try {
    return rootPath(root, path);
  } catch {
    errors.push(`${label} must remain inside project root: ${path}`);
    return undefined;
  }
}

function validateDocsRoot(realRoot: string, docsRoot: string, errors: string[]): boolean {
  let stat;
  try {
    stat = lstatSync(docsRoot);
  } catch (error) {
    if (isNotFoundError(error)) return true;
    errors.push(`docs/: could not be inspected: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }

  const realDocsRoot = resolveRealPath(docsRoot, "docs/", "docs/", errors);
  if (!realDocsRoot) return false;

  if (!isInsideRoot(realRoot, realDocsRoot)) {
    errors.push("docs/ must remain inside project root");
    return false;
  }

  if (stat.isSymbolicLink() && !safeStatIsDirectory(realDocsRoot)) {
    errors.push("docs/ symlink target must be a directory");
    return false;
  }

  if (!stat.isSymbolicLink() && !stat.isDirectory()) {
    errors.push("docs/ must be a directory");
    return false;
  }

  return true;
}

function findMarkdownFiles(root: string, realRoot: string, dir: string, errors: string[]): string[] {
  if (!existsSync(dir)) return [];

  const files: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch (error) {
    errors.push(`${toProjectPath(root, dir)}: could not be read: ${error instanceof Error ? error.message : String(error)}`);
    return files;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    let stat;
    try {
      stat = lstatSync(fullPath);
    } catch (error) {
      errors.push(`${toProjectPath(root, fullPath)}: could not be inspected: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }

    if (stat.isSymbolicLink()) {
      if (fullPath.endsWith(".md")) files.push(fullPath);
      else validateSymlinkDirectory(root, realRoot, fullPath, errors);
      continue;
    }

    if (stat.isDirectory()) files.push(...findMarkdownFiles(root, realRoot, fullPath, errors));
    if (stat.isFile() && fullPath.endsWith(".md")) files.push(fullPath);
  }

  return files.sort();
}

function validateSymlinkDirectory(root: string, realRoot: string, fullPath: string, errors: string[]): void {
  const relativePath = toProjectPath(root, fullPath);
  const realTarget = resolveRealPath(fullPath, `${relativePath}: symlink target`, relativePath, errors);
  if (!realTarget) return;

  if (!isInsideRoot(realRoot, realTarget)) {
    errors.push(`${relativePath}: symlink target must remain inside project root`);
  }
}

function extractLinkTarget(rawTarget: string): string {
  const trimmed = rawTarget.trim();
  if (trimmed.startsWith("<")) {
    const end = trimmed.indexOf(">");
    return end === -1 ? trimmed : trimmed.slice(1, end);
  }

  const whitespace = trimmed.search(/\s/);
  return whitespace === -1 ? trimmed : trimmed.slice(0, whitespace);
}

function stripFragmentAndQuery(target: string): string {
  return target.split("#", 1)[0].split("?", 1)[0];
}

function decodeLinkPath(path: string): string {
  try {
    return decodeURI(path);
  } catch {
    return path;
  }
}

function isNonRelativeLink(target: string): boolean {
  return target.startsWith("#") || target.startsWith("/") || target.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(target);
}

function safeStatIsFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function safeStatIsDirectory(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function resolveRealPath(fullPath: string, label: string, displayPath: string, errors: string[]): string | undefined {
  try {
    return realpathSync(fullPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ENOENT")) {
      errors.push(`${label} is missing: ${displayPath}`);
      return undefined;
    }

    errors.push(`${label} could not be resolved: ${displayPath}: ${message}`);
    return undefined;
  }
}

function isNotFoundError(error: unknown): boolean {
  return isRecord(error) && error.code === "ENOENT";
}

function toProjectPath(root: string, fullPath: string): string {
  return normalize(relative(root, fullPath)).split(sep).join("/");
}

function isInsideRoot(root: string, target: string): boolean {
  const relativePath = relative(root, target);
  return relativePath === "" || (!relativePath.startsWith(`..${sep}`) && relativePath !== ".." && !isAbsolute(relativePath));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasDotSegment(path: string): boolean {
  return path.split("/").some((part) => part === "." || part === ".." || part === "");
}

function isScopeRecord(value: unknown): value is ScopeRecord {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.kind === "string" &&
    typeof value.title === "string" &&
    typeof value.path === "string" &&
    value.path.length > 0 &&
    typeof value.status === "string"
  );
}

function isAnchorRecord(value: unknown): value is AnchorsFile["anchors"][string] {
  return (
    isRecord(value) &&
    typeof value.file === "string" &&
    value.file.length > 0 &&
    Array.isArray(value.docs) &&
    value.docs.every((doc) => typeof doc === "string" && doc.length > 0)
  );
}
