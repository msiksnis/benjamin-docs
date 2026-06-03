import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { isAbsolute, relative, resolve, sep, win32 } from "node:path";

const DEFAULT_GENERATED_LABEL = "Generated output path";

type GeneratedTarget = "any" | "directory" | "file";

export function pathExists(path: string): boolean {
  return existsSync(path);
}

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function readGeneratedJson<T>(root: string, relativePath: string, label = DEFAULT_GENERATED_LABEL): T {
  const parts = generatedPathParts(relativePath, label);
  assertGeneratedPathSafe(root, parts, label, "file");
  return readJson<T>(rootPath(root, ...parts));
}

export function ensureGeneratedDir(root: string, relativePath: string, label = DEFAULT_GENERATED_LABEL): void {
  const parts = generatedPathParts(relativePath, label);
  const fullPath = rootPath(root, ...parts);

  assertGeneratedPathSafe(root, parts, label, "directory");
  mkdirSync(fullPath, { recursive: true });
  assertGeneratedPathSafe(root, parts, label, "directory");
}

export function writeGeneratedJson(root: string, relativePath: string, value: unknown, label = DEFAULT_GENERATED_LABEL): void {
  writeGeneratedText(root, relativePath, `${JSON.stringify(value, null, 2)}\n`, label);
}

export function writeGeneratedText(root: string, relativePath: string, value: string, label = DEFAULT_GENERATED_LABEL): void {
  const parts = generatedPathParts(relativePath, label);
  const fullPath = prepareGeneratedFile(root, parts, label);
  writeFileSync(fullPath, value, "utf8");
}

export function writeGeneratedJsonIfMissing(root: string, relativePath: string, value: unknown, label = DEFAULT_GENERATED_LABEL): boolean {
  return writeGeneratedTextIfMissing(root, relativePath, `${JSON.stringify(value, null, 2)}\n`, label);
}

export function writeGeneratedTextIfMissing(root: string, relativePath: string, value: string, label = DEFAULT_GENERATED_LABEL): boolean {
  const parts = generatedPathParts(relativePath, label);
  assertGeneratedPathSafe(root, parts, label, "file");

  const fullPath = rootPath(root, ...parts);
  if (lstatIfExists(fullPath)) return false;

  prepareGeneratedParent(root, parts, label);
  assertGeneratedPathSafe(root, parts, label, "file");
  writeFileSync(fullPath, value, "utf8");
  return true;
}

export function assertGeneratedPathSafe(
  root: string,
  parts: string[],
  label = DEFAULT_GENERATED_LABEL,
  target: GeneratedTarget = "any",
): void {
  const realRoot = realpathSync(root);

  for (const [index] of parts.entries()) {
    const currentParts = parts.slice(0, index + 1);
    const current = rootPath(root, ...currentParts);
    const displayPath = currentParts.join("/");

    const stat = lstatIfExists(current);
    if (!stat) return;

    if (stat.isSymbolicLink()) {
      throw new Error(`${label} must not be a symlink: ${displayPath}`);
    }

    const realCurrent = realpathSync(current);
    if (!isInsideRoot(realRoot, realCurrent)) {
      throw new Error(`${label} must remain inside project root: ${displayPath}`);
    }

    if (index < parts.length - 1 && !stat.isDirectory()) {
      throw new Error(`${label} parent must be a directory: ${displayPath}`);
    }

    if (index === parts.length - 1) {
      if (target === "directory" && !stat.isDirectory()) {
        throw new Error(`${label} must be a directory: ${displayPath}`);
      }

      if (target === "file" && !stat.isFile()) {
        throw new Error(`${label} must be a file: ${displayPath}`);
      }
    }
  }
}

export function lstatIfExists(path: string): ReturnType<typeof lstatSync> | undefined {
  try {
    return lstatSync(path);
  } catch (error) {
    if (isNotFoundError(error)) return undefined;
    throw error;
  }
}

export function rootPath(root: string, ...parts: string[]): string {
  const resolvedRoot = resolve(root);

  for (const part of parts) {
    if (isAbsolute(part)) {
      throw new Error(`Refusing absolute path segment outside root: ${part}`);
    }
  }

  const resolvedPath = resolve(resolvedRoot, ...parts);
  const relativePath = relative(resolvedRoot, resolvedPath);

  if (relativePath === ".." || relativePath.startsWith(`..${sep}`) || isAbsolute(relativePath)) {
    throw new Error(`Resolved path is outside root: ${resolvedPath}`);
  }

  return resolvedPath;
}

function prepareGeneratedFile(root: string, parts: string[], label: string): string {
  assertGeneratedPathSafe(root, parts, label, "file");
  prepareGeneratedParent(root, parts, label);
  assertGeneratedPathSafe(root, parts, label, "file");
  return rootPath(root, ...parts);
}

function prepareGeneratedParent(root: string, parts: string[], label: string): void {
  const parentParts = parts.slice(0, -1);
  if (parentParts.length === 0) return;

  const parentPath = rootPath(root, ...parentParts);
  assertGeneratedPathSafe(root, parentParts, label, "directory");
  mkdirSync(parentPath, { recursive: true });
  assertGeneratedPathSafe(root, parentParts, label, "directory");
}

function generatedPathParts(relativePath: string, label: string): string[] {
  if (!relativePath || isAbsolute(relativePath) || win32.isAbsolute(relativePath) || relativePath.includes("\\")) {
    throw new Error(`${label} must be a relative project path: ${relativePath}`);
  }

  const parts = relativePath.split("/");
  if (parts.some((part) => part === "" || part === "." || part === ".." || isAbsolute(part) || win32.isAbsolute(part))) {
    throw new Error(`${label} must be a relative project path: ${relativePath}`);
  }

  return parts;
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function isInsideRoot(root: string, target: string): boolean {
  const relativePath = relative(root, target);
  return relativePath === "" || (!relativePath.startsWith(`..${sep}`) && relativePath !== ".." && !isAbsolute(relativePath));
}
