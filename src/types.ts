import type { KNOWN_AUDIENCES, KNOWN_SCOPES, KNOWN_SOURCES, KNOWN_STATUSES, KNOWN_VISIBILITIES } from "./constants.js";

export type ScopeKind = (typeof KNOWN_SCOPES)[number];
export type Audience = (typeof KNOWN_AUDIENCES)[number];
export type DocStatus = (typeof KNOWN_STATUSES)[number];
export type Visibility = (typeof KNOWN_VISIBILITIES)[number];
export type DocSource = (typeof KNOWN_SOURCES)[number];

export interface DocFrontmatter {
  title: string;
  scope: ScopeKind;
  scope_id: string;
  audience: Audience[];
  status: DocStatus;
  visibility: Visibility;
  updated: string;
  source: DocSource;
}

export interface ParsedMarkdown {
  frontmatter: DocFrontmatter;
  body: string;
}

export interface AgentDocsConfig {
  version: 1;
  mode: "planning" | "codebase";
}

export interface ScopeRecord {
  id: string;
  kind: ScopeKind;
  title: string;
  path: string;
  status: DocStatus;
}

export interface ScopesFile {
  version: 1;
  scopes: ScopeRecord[];
}

export interface AnchorRecord {
  file: string;
  docs: string[];
}

export interface AnchorsFile {
  version: 1;
  anchors: Record<string, AnchorRecord>;
}

export interface ManifestFile {
  version: 1;
  docs: string[];
}
