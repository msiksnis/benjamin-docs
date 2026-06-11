import { isAbsolute, win32 } from "node:path";
import { CONFIG_DIR, CONFIG_FILE, DEFAULT_DOCS_ROOT } from "./constants.js";
import { readGeneratedJson } from "./fsx.js";
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
  };
}

export function assertSafeDocsRoot(docsRoot: string): void {
  if (!isSafeDocsRoot(docsRoot)) {
    throw new Error(`Invalid docs root: ${docsRoot}`);
  }
}

export function isSafeDocsRoot(docsRoot: string): boolean {
  return (
    Boolean(docsRoot) &&
    !docsRoot.includes("\\") &&
    !isAbsolute(docsRoot) &&
    !win32.isAbsolute(docsRoot) &&
    !docsRoot.split("/").some((part) => part === "" || part === "." || part === "..")
  );
}

function defaultFocusForMode(mode: BenjaminDocsConfig["mode"]): FocusType {
  return mode === "codebase" ? "codebase" : "project";
}
