import { after, describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { runCliResult, withTempDir } from "./helpers.js";

interface TextResult {
  isError?: boolean;
  content: Array<{ type: string; text: string }>;
}

async function connectClient(cwd: string): Promise<Client> {
  const transport = new StdioClientTransport({
    command: "node",
    args: [join(process.cwd(), "dist/src/cli.js"), "mcp"],
    cwd,
    env: { ...process.env, NO_COLOR: "1", BENJAMIN_DOCS_NO_UPDATE_CHECK: "1" },
  });
  const client = new Client({ name: "bd-tests", version: "0.0.1" });
  await client.connect(transport);
  return client;
}

async function callText(client: Client, name: string, args: Record<string, unknown> = {}): Promise<TextResult> {
  return (await client.callTool({ name, arguments: args })) as TextResult;
}

describe("mcp registration", () => {
  it("registers, reports, and unregisters all client targets", () => {
    withTempDir((dir) => {
      const install = runCliResult(["mcp", "install"], dir);
      assert.equal(install.status, 0);
      assert.match(install.stdout, /registered\s+Claude Code\s+\.mcp\.json/);
      assert.match(install.stdout, /registered\s+Cursor\s+\.cursor\/mcp\.json/);
      assert.match(install.stdout, /registered\s+Codex CLI\s+\.codex\/config\.toml/);

      const claude = JSON.parse(readFileSync(join(dir, ".mcp.json"), "utf8")) as {
        mcpServers: Record<string, { command: string; args: string[] }>;
      };
      assert.equal(claude.mcpServers["benjamin-docs"]?.command, "benjamin-docs");
      assert.deepEqual(claude.mcpServers["benjamin-docs"]?.args, ["mcp"]);

      const codexToml = readFileSync(join(dir, ".codex/config.toml"), "utf8");
      assert.match(codexToml, /# benjamin-docs:start/);
      assert.match(codexToml, /\[mcp_servers\.benjamin-docs\]/);

      const again = runCliResult(["mcp", "install"], dir);
      assert.match(again.stdout, /already registered\s+Claude Code/);

      const status = runCliResult(["mcp", "status"], dir);
      assert.match(status.stdout, /registered\s+Cursor/);

      const uninstall = runCliResult(["mcp", "uninstall"], dir);
      assert.equal(uninstall.status, 0);
      assert.ok(!existsSync(join(dir, ".mcp.json")));
      assert.ok(!existsSync(join(dir, ".cursor")));
      assert.ok(!existsSync(join(dir, ".codex")));
    });
  });

  it("preserves user JSON and TOML content across install and uninstall", () => {
    withTempDir((dir) => {
      writeFileSync(join(dir, ".mcp.json"), JSON.stringify({ mcpServers: { other: { command: "other", args: [] } } }, null, 2));
      mkdirSync(join(dir, ".codex"), { recursive: true });
      writeFileSync(join(dir, ".codex/config.toml"), '# my config\nmodel = "gpt-5"\n');

      runCliResult(["mcp", "install"], dir);
      runCliResult(["mcp", "uninstall"], dir);

      const claude = JSON.parse(readFileSync(join(dir, ".mcp.json"), "utf8")) as { mcpServers: Record<string, unknown> };
      assert.deepEqual(Object.keys(claude.mcpServers), ["other"]);

      const codexToml = readFileSync(join(dir, ".codex/config.toml"), "utf8");
      assert.match(codexToml, /model = "gpt-5"/);
      assert.doesNotMatch(codexToml, /benjamin-docs/);
    });
  });

  it("skips unparseable registration files and preserves them", () => {
    withTempDir((dir) => {
      writeFileSync(join(dir, ".mcp.json"), "{ not json");

      const result = runCliResult(["mcp", "install", "--target", "claude-code"], dir);

      assert.match(result.stdout, /skipped\s+Claude Code/);
      assert.equal(readFileSync(join(dir, ".mcp.json"), "utf8"), "{ not json");
    });
  });
});

describe("mcp server tools", () => {
  it("serves memory tools over stdio against an initialized project", async () => {
    await withTempDirAsync(async (dir) => {
      mkdirSync(join(dir, "src"), { recursive: true });
      writeFileSync(join(dir, "src/app.ts"), "export const a = 1;\n");
      runCliResult(["init", "--mode", "codebase", "--no-agent-contract"], dir);

      const client = await connectClient(dir);
      after(() => client.close());

      const tools = await client.listTools();
      assert.deepEqual(
        tools.tools.map((tool) => tool.name).sort(),
        ["memory_context", "memory_read", "memory_record_decision", "memory_search", "memory_status", "memory_update"],
      );

      const context = await callText(client, "memory_context");
      assert.match(context.content[0]?.text ?? "", /Benjamin Docs project memory is active/);

      const status = await callText(client, "memory_status");
      assert.match(status.content[0]?.text ?? "", /mode: codebase/);
      assert.match(status.content[0]?.text ?? "", /drift:/);

      const update = await callText(client, "memory_update", {
        path: "benjamin-docs/engineering/code-map.md",
        body: "# Code Map\n\nThe entrypoint lives in `src/app.ts`. Tests run with node --test.\n",
      });
      assert.notEqual(update.isError, true);
      assert.match(update.content[0]?.text ?? "", /Updated benjamin-docs\/engineering\/code-map\.md/);

      const read = await callText(client, "memory_read", { path: "benjamin-docs/engineering/code-map.md" });
      assert.match(read.content[0]?.text ?? "", /entrypoint lives in `src\/app\.ts`/);

      const search = await callText(client, "memory_search", { query: "entrypoint app.ts", limit: 3 });
      assert.match(search.content[0]?.text ?? "", /code-map\.md/);

      const unmanaged = await callText(client, "memory_read", { path: "package.json" });
      assert.equal(unmanaged.isError, true);
      assert.match(unmanaged.content[0]?.text ?? "", /Not a managed memory doc/);

      const viewUpdate = await callText(client, "memory_update", { path: "benjamin-docs/views/decisions.md", body: "nope" });
      assert.equal(viewUpdate.isError, true);
      assert.match(viewUpdate.content[0]?.text ?? "", /Memory Views are generated|Not a managed memory doc/);

      const badStatus = await callText(client, "memory_update", {
        path: "benjamin-docs/engineering/code-map.md",
        body: "# Code Map\n\nStill fine.\n",
        status: "not-a-status",
      });
      assert.equal(badStatus.isError, true);
      assert.match(badStatus.content[0]?.text ?? "", /Unknown status/);
    });
  });

  it("rolls back updates that introduce validation errors", async () => {
    await withTempDirAsync(async (dir) => {
      runCliResult(["init", "--mode", "codebase", "--no-agent-contract"], dir);
      const docPath = join(dir, "benjamin-docs/engineering/code-map.md");
      const before = readFileSync(docPath, "utf8");

      const client = await connectClient(dir);
      after(() => client.close());

      const result = await callText(client, "memory_update", {
        path: "benjamin-docs/engineering/code-map.md",
        body: "# Code Map\n\nSee [missing doc](./does-not-exist.md).\n",
      });

      assert.equal(result.isError, true);
      assert.match(result.content[0]?.text ?? "", /rolled back/i);
      assert.equal(readFileSync(docPath, "utf8"), before);
    });
  });

  it("records decisions under the Decisions heading", async () => {
    await withTempDirAsync(async (dir) => {
      runCliResult(["init", "--mode", "codebase", "--no-agent-contract"], dir);
      runCliResult(["scope", "create", "feature", "checkout-flow"], dir);

      const client = await connectClient(dir);
      after(() => client.close());

      const result = await callText(client, "memory_record_decision", {
        feature: "checkout-flow",
        decision: "Use Stripe Checkout over custom forms because PCI scope stays minimal.",
      });
      assert.notEqual(result.isError, true);

      const decisions = readFileSync(join(dir, "benjamin-docs/features/checkout-flow/decisions.md"), "utf8");
      assert.match(decisions, /## Decisions[\s\S]*- Use Stripe Checkout over custom forms/);

      const missing = await callText(client, "memory_record_decision", { feature: "no-such-feature", decision: "x" });
      assert.equal(missing.isError, true);
    });
  });

  it("explains initialization when the project has no memory", async () => {
    await withTempDirAsync(async (dir) => {
      const client = await connectClient(dir);
      after(() => client.close());

      const result = await callText(client, "memory_status");
      assert.equal(result.isError, true);
      assert.match(result.content[0]?.text ?? "", /benjamin-docs init/);
    });
  });
});

async function withTempDirAsync(fn: (dir: string) => Promise<void>): Promise<void> {
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const dir = mkdtempSync(join(tmpdir(), "benjamin-docs-mcp-"));
  try {
    await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
