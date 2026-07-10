import { isAbsolute, win32 } from "node:path";
import { CONFIG_DIR, CONFIG_FILE, DEFAULT_DOCS_ROOT } from "./constants.js";
import { readGeneratedJson } from "./fsx.js";
import { MAX_DOCS_ROOT_CHARACTERS } from "./session-context.js";
import type { BenjaminDocsConfig, FocusType } from "./types.js";

const METADATA_LABEL = "Metadata path";

export function defaultConfig(overrides: Partial<BenjaminDocsConfig> = {}): BenjaminDocsConfig {
  return {
    version: 1,
    mode: "planning",
    docsRoot: DEFAULT_DOCS_ROOT,
    focus: "project",
    ...overrides,
  };
}

export function readConfig(root: string): BenjaminDocsConfig {
  return normalizeConfig(readGeneratedJson<BenjaminDocsConfig>(root, `${CONFIG_DIR}/${CONFIG_FILE}`, METADATA_LABEL));
}

export function normalizeConfig(config: BenjaminDocsConfig): BenjaminDocsConfig {
  return {
    version: config.version,
    mode: config.mode,
    docsRoot: config.docsRoot ?? DEFAULT_DOCS_ROOT,
    focus: config.focus ?? defaultFocusForMode(config.mode),
    feature: config.feature,
    watch: config.watch,
    export: config.export,
    bdVersion: config.bdVersion,
  };
}

export function assertSafeDocsRoot(docsRoot: string): void {
  if (docsRoot.length > MAX_DOCS_ROOT_CHARACTERS) {
    throw new Error(`Invalid docs root: docs root must be at most ${MAX_DOCS_ROOT_CHARACTERS} characters to fit session-start context.`);
  }
  if (!isSafeDocsRoot(docsRoot)) {
    throw new Error(`Invalid docs root: ${docsRoot}`);
  }
}

export function isSafeDocsRoot(docsRoot: unknown): docsRoot is string {
  return isSafeRelativePath(docsRoot) && docsRoot.length <= MAX_DOCS_ROOT_CHARACTERS;
}

export function isSafeRelativePath(path: unknown): path is string {
  return (
    typeof path === "string" &&
    Boolean(path) &&
    !path.includes("\\") &&
    !isAbsolute(path) &&
    !win32.isAbsolute(path) &&
    !path.split("/").some((part) => part === "" || part === "." || part === "..")
  );
}

function defaultFocusForMode(mode: BenjaminDocsConfig["mode"]): FocusType {
  return mode === "codebase" ? "codebase" : "project";
}
