import { KNOWN_AUDIENCES, KNOWN_FRESHNESS, KNOWN_SCOPES, KNOWN_SOURCES, KNOWN_STATUSES, KNOWN_VISIBILITIES } from "./constants.js";
import type { DocFrontmatter, ParsedMarkdown } from "./types.js";

const ORDER: Array<keyof DocFrontmatter> = [
  "title",
  "scope",
  "scope_id",
  "audience",
  "status",
  "visibility",
  "updated",
  "source",
  "freshness",
];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseMarkdown(markdown: string): ParsedMarkdown {
  const normalized = normalizeMarkdown(markdown);

  if (!normalized.startsWith("---\n")) {
    throw new Error("Markdown file is missing frontmatter");
  }

  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) {
    throw new Error("Markdown frontmatter is not closed");
  }

  const raw = normalized.slice(4, end);
  const body = normalized.slice(end + 5);
  const frontmatter: Record<string, unknown> = {};

  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    const colon = line.indexOf(":");
    if (colon === -1) throw new Error(`Invalid frontmatter line: ${line}`);

    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    frontmatter[key] = parseValue(value);
  }

  return { frontmatter: validateFrontmatter(frontmatter), body };
}

export function serializeMarkdown(frontmatter: DocFrontmatter, body: string): string {
  const lines = ORDER.flatMap((key) => {
    const value = frontmatter[key];
    return value === undefined ? [] : [`${key}: ${serializeValue(value)}`];
  });
  return `---\n${lines.join("\n")}\n---\n\n${body.replace(/^\n+/, "")}`;
}

function parseValue(value: string): string | string[] {
  if (value.startsWith("[") && value.endsWith("]")) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((item) => item.trim());
  }
  return value;
}

function serializeValue(value: string | string[]): string {
  if (Array.isArray(value)) return `[${value.join(", ")}]`;
  return value;
}

function normalizeMarkdown(markdown: string): string {
  return markdown.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
}

function validateFrontmatter(frontmatter: Record<string, unknown>): DocFrontmatter {
  const scope = knownValue("scope", requiredString(frontmatter, "scope"), KNOWN_SCOPES);
  const status = knownValue("status", requiredString(frontmatter, "status"), KNOWN_STATUSES);
  const visibility = knownValue("visibility", requiredString(frontmatter, "visibility"), KNOWN_VISIBILITIES);
  const source = knownValue("source", requiredString(frontmatter, "source"), KNOWN_SOURCES);
  const audience = requiredAudience(frontmatter);
  const freshness = optionalKnownValue("freshness", frontmatter.freshness, KNOWN_FRESHNESS);

  return {
    title: requiredString(frontmatter, "title"),
    scope,
    scope_id: requiredString(frontmatter, "scope_id"),
    audience,
    status,
    visibility,
    updated: requiredDate(frontmatter),
    source,
    ...(freshness ? { freshness } : {}),
  };
}

function requiredString(frontmatter: Record<string, unknown>, key: keyof DocFrontmatter): string {
  const value = frontmatter[key];

  if (value === undefined) {
    throw new Error(`Missing required frontmatter field: ${key}`);
  }

  if (typeof value !== "string") {
    throw new Error(`Frontmatter field ${key} must be a string`);
  }

  return value;
}

function requiredAudience(frontmatter: Record<string, unknown>): DocFrontmatter["audience"] {
  const value = frontmatter.audience;

  if (value === undefined) {
    throw new Error("Missing required frontmatter field: audience");
  }

  if (!Array.isArray(value)) {
    throw new Error("Frontmatter field audience must be an array");
  }

  const audiences: DocFrontmatter["audience"] = [];

  for (const audience of value) {
    if (typeof audience !== "string") {
      throw new Error("Frontmatter field audience must contain only strings");
    }

    audiences.push(knownValue("audience", audience, KNOWN_AUDIENCES));
  }

  if (audiences.length === 0) {
    throw new Error("Frontmatter field audience must include at least one value");
  }

  return audiences;
}

function requiredDate(frontmatter: Record<string, unknown>): string {
  const value = requiredString(frontmatter, "updated");
  const date = new Date(`${value}T00:00:00.000Z`);

  if (!DATE_PATTERN.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("Frontmatter field updated must be YYYY-MM-DD");
  }

  return value;
}

function knownValue<const T extends readonly string[]>(field: string, value: string, knownValues: T): T[number] {
  if (!knownValues.includes(value)) {
    throw new Error(`Unknown frontmatter ${field}: ${value}`);
  }

  return value as T[number];
}

function optionalKnownValue<const T extends readonly string[]>(field: string, value: unknown, knownValues: T): T[number] | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new Error(`Frontmatter field ${field} must be a string`);
  }

  return knownValue(field, value, knownValues);
}
