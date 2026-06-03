import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

export function pathExists(path: string): boolean {
  return existsSync(path);
}

export function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

export function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function writeJson(path: string, value: unknown): void {
  ensureDir(dirname(path));
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function writeText(path: string, value: string): void {
  ensureDir(dirname(path));
  writeFileSync(path, value, "utf8");
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
