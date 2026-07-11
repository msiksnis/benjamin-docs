export interface CommandEntry {
  command: string;
  description: string;
  args: string[];
}

export const mainCommands: CommandEntry[] = [
  { command: "benjamin-docs init", args: ["init"], description: "Set up local project memory and optional agent guidance." },
  { command: "benjamin-docs ready", args: ["ready"], description: "Run deterministic project-memory readiness dimensions." },
  { command: "benjamin-docs export", args: ["export"], description: "Open guided export for feature docs, app docs, and handoffs." },
  { command: "benjamin-docs help", args: ["help"], description: "Show the short getting-started guide." },
];

export const advancedCommands: CommandEntry[] = [
  { command: "benjamin-docs upgrade", args: ["upgrade"], description: "After a package update, refresh this repo's metadata, guidance, skills, views, and session-start hooks." },
  { command: "benjamin-docs status", args: ["status"], description: "Show current Benjamin Docs setup." },
  { command: "benjamin-docs next", args: ["next"], description: "Print the next recommended agent prompt." },
  { command: "benjamin-docs validate", args: ["validate"], description: "Check structure, frontmatter, links, scopes, and anchors." },
  { command: "benjamin-docs review", args: ["review"], description: "Check for thin or starter-template docs." },
  { command: "benjamin-docs review --changed", args: ["review", "--changed"], description: "Check changed work for likely project-memory updates." },
  { command: "benjamin-docs drift", args: ["drift"], description: "Flag docs whose watched code changed since the doc last changed." },
  { command: "benjamin-docs hooks install", args: ["hooks", "install"], description: "Install agent session hooks for Claude Code, Codex, and Cursor." },
  { command: "benjamin-docs hooks status", args: ["hooks", "status"], description: "Show which agent session hooks are installed." },
  { command: "benjamin-docs mcp install", args: ["mcp", "install"], description: "Register the Benjamin Docs MCP memory server for Claude Code, Cursor, and Codex." },
  { command: "benjamin-docs mcp status", args: ["mcp", "status"], description: "Show which MCP client registrations are installed." },
  { command: "benjamin-docs session-start", args: ["session-start"], description: "Print a compact session-start pointer/context packet for installed hooks." },
  { command: "benjamin-docs doctor", args: ["doctor"], description: "Check local setup and skill packaging." },
  {
    command: "benjamin-docs doctor [--strict] [--target shared|claude-code|codex|cursor|claude-desktop]",
    args: ["doctor", "--strict"],
    description: "Gate repository health, optionally for one integration target.",
  },
  { command: "benjamin-docs views", args: ["views"], description: "Generate local Memory Views from managed docs." },
  { command: "benjamin-docs export --verify <slug>", args: ["export", "--verify", "<slug>", "--evidence", "<evidence>"], description: "Record agent implementation verification before customer export." },
  { command: "benjamin-docs scope create feature <slug>", args: ["scope", "create", "feature", "<slug>"], description: "Create feature docs and metadata." },
  { command: "benjamin-docs scope status <slug> <status>", args: ["scope", "status", "<slug>", "<status>"], description: "Update a scope status, e.g. archive a shipped feature." },
  { command: "benjamin-docs anchor add <id> <file>", args: ["anchor", "add", "<id>", "<file>"], description: "Link a stable code anchor to docs." },
  { command: "benjamin-docs anchor list", args: ["anchor", "list"], description: "List stable code anchors." },
  { command: "benjamin-docs install-skill", args: ["install-skill"], description: "Install the bundled agent skill locally." },
  { command: "benjamin-docs package-skill", args: ["package-skill"], description: "Package the skill for Claude upload." },
  { command: "benjamin-docs chat-project", args: ["chat-project"], description: "Print exact guidance for chat-to-project workflows." },
];

export function allCommands(): CommandEntry[] {
  return [...mainCommands, ...advancedCommands];
}

export function getCommandsText(): string {
  const mainOffset = 0;
  const advancedOffset = mainCommands.length;

  return [
    "benjamin-docs commands",
    "",
    "Main commands",
    ...mainCommands.map((entry, index) => formatEntry(entry, mainOffset + index + 1)),
    "",
    "Advanced commands",
    ...advancedCommands.map((entry, index) => formatEntry(entry, advancedOffset + index + 1)),
    "",
    "Tip: in an interactive terminal, use Up/Down or type a number, then press Enter.",
    "Tip: use the short alias `bd` when it is installed, for example `bd init`.",
  ].join("\n");
}

function formatEntry(entry: CommandEntry, number: number): string {
  return `  ${`${number}.`.padStart(4)} ${entry.command.padEnd(48)} ${entry.description}`;
}
