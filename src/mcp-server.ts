import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getPackageVersion } from "./info.js";
import { memoryContext, memoryStatus, readMemoryDoc, recordDecision, searchMemory, updateMemoryDoc } from "./memory-tools.js";

interface ToolText {
  [key: string]: unknown;
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

export async function serveMcp(root: string): Promise<void> {
  const server = buildServer(root);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  await waitForStdinEnd();
}

export function buildServer(root: string): McpServer {
  const server = new McpServer({ name: "benjamin-docs", version: getPackageVersion() });

  server.registerTool(
    "memory_context",
    {
      description:
        "Compact Benjamin Docs project-memory context: memory location, read-first docs, drift summary, and update contract. Pass a task description to also get the memory sections most relevant to that task. Call this at the start of work instead of reading the whole memory tree.",
      inputSchema: { task: z.string().optional().describe("What you are about to work on, in a sentence") },
    },
    async ({ task }) => run(() => memoryContext(root, task)),
  );

  server.registerTool(
    "memory_search",
    {
      description: "Search Benjamin Docs project memory. Returns scored doc sections (path, heading, snippet). Use before reading whole docs.",
      inputSchema: {
        query: z.string().describe("Search terms, e.g. feature name, decision topic, file path"),
        limit: z.number().int().min(1).max(25).optional().describe("Max sections to return (default 8)"),
      },
    },
    async ({ query, limit }) =>
      run(() => {
        const sections = searchMemory(root, query, limit);
        if (sections.length === 0) return `No memory sections matched "${query}".`;
        return sections.map((section) => `### ${section.path} — ${section.heading} (score ${section.score})\n${section.snippet}`).join("\n\n");
      }),
  );

  server.registerTool(
    "memory_read",
    {
      description: "Read one manifest-managed Benjamin Docs memory doc in full, including frontmatter.",
      inputSchema: { path: z.string().describe("Repo-relative doc path, e.g. benjamin-docs/handoff/agent-brief.md") },
    },
    async ({ path }) => run(() => readMemoryDoc(root, path)),
  );

  server.registerTool(
    "memory_update",
    {
      description:
        "Replace the body of a manifest-managed memory doc. Frontmatter is preserved, the updated date is stamped, and the write is validated — updates that introduce validation errors are rolled back. Memory Views regenerate automatically. Not for generated views.",
      inputSchema: {
        path: z.string().describe("Repo-relative doc path"),
        body: z.string().describe("Full new Markdown body (everything after the frontmatter)"),
        status: z.string().optional().describe("Optional new doc status: draft, review, approved, stale, or archived"),
      },
    },
    async ({ path, body, status }) =>
      run(() => {
        const result = updateMemoryDoc(root, path, body, status);
        return `Updated ${result.path}.${result.viewsRegenerated > 0 ? ` Regenerated ${result.viewsRegenerated} Memory Views.` : ""}`;
      }),
  );

  server.registerTool(
    "memory_record_decision",
    {
      description: "Append a durable decision (with its why) to a feature's decisions doc. Use for settled choices, rejected options, and reasoning worth preserving.",
      inputSchema: {
        feature: z.string().describe("Feature scope slug, e.g. checkout-redesign"),
        decision: z.string().describe("One decision including the reasoning, e.g. 'Use X over Y because Z'"),
      },
    },
    async ({ feature, decision }) =>
      run(() => {
        const result = recordDecision(root, feature, decision);
        return `Recorded decision in ${result.path}.${result.viewsRegenerated > 0 ? ` Regenerated ${result.viewsRegenerated} Memory Views.` : ""}`;
      }),
  );

  server.registerTool(
    "memory_status",
    {
      description: "Benjamin Docs project-memory status: mode, doc/scope counts, and drift summary (docs behind the code they describe).",
      inputSchema: {},
    },
    async () => run(() => memoryStatus(root)),
  );

  return server;
}

function run(action: () => string): ToolText {
  try {
    return { content: [{ type: "text", text: action() }] };
  } catch (error) {
    return { content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }], isError: true };
  }
}

function waitForStdinEnd(): Promise<void> {
  return new Promise((resolve) => {
    process.stdin.on("end", resolve);
    process.stdin.on("close", resolve);
  });
}
