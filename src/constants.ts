export const DOCS_DIR = "docs";
export const CONFIG_DIR = ".benjamin-docs";
export const MANIFEST_FILE = "manifest.json";
export const SCOPES_FILE = "scopes.json";
export const ANCHORS_FILE = "anchors.json";
export const CONFIG_FILE = "config.json";

export const KNOWN_SCOPES = ["project", "feature", "release", "handoff"] as const;
export const KNOWN_AUDIENCES = ["developer", "designer", "agent", "business", "public", "user", "advisor"] as const;
export const KNOWN_STATUSES = ["draft", "review", "approved", "stale", "archived"] as const;
export const KNOWN_VISIBILITIES = ["private", "unlisted", "public"] as const;
export const KNOWN_SOURCES = ["session-capture", "manual", "codebase-scan", "release-sync"] as const;
