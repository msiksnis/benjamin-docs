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
];

export function parseMarkdown(markdown: string): ParsedMarkdown {
  if (!markdown.startsWith("---\n")) {
    throw new Error("Markdown file is missing frontmatter");
  }

  const end = markdown.indexOf("\n---\n", 4);
  if (end === -1) {
    throw new Error("Markdown frontmatter is not closed");
  }

  const raw = markdown.slice(4, end);
  const body = markdown.slice(end + 5);
  const frontmatter: Record<string, unknown> = {};

  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    const colon = line.indexOf(":");
    if (colon === -1) throw new Error(`Invalid frontmatter line: ${line}`);

    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    frontmatter[key] = parseValue(value);
  }

  return { frontmatter: frontmatter as unknown as DocFrontmatter, body };
}

export function serializeMarkdown(frontmatter: DocFrontmatter, body: string): string {
  const lines = ORDER.map((key) => `${key}: ${serializeValue(frontmatter[key])}`);
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
