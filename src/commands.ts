export interface CommandEntry {
  command: string;
  description: string;
}

export const mainCommands: CommandEntry[] = [
  { command: "benjamin-docs init", description: "Set up local project memory and optional agent guidance." },
  { command: "benjamin-docs ready", description: "Check whether project memory is handoff-ready." },
  { command: "benjamin-docs help", description: "Show the short getting-started guide." },
];

export const advancedCommands: CommandEntry[] = [
  { command: "benjamin-docs status", description: "Show current Benjamin Docs setup." },
  { command: "benjamin-docs next", description: "Print the next recommended agent prompt." },
  { command: "benjamin-docs validate", description: "Check structure, frontmatter, links, scopes, and anchors." },
  { command: "benjamin-docs review", description: "Check for thin or starter-template docs." },
  { command: "benjamin-docs doctor", description: "Check local setup and skill packaging." },
  { command: "benjamin-docs doctor --strict", description: "Run setup checks as a strict gate." },
  { command: "benjamin-docs export --audience developer", description: "Build a local audience-specific Markdown bundle." },
  { command: "benjamin-docs scope create feature <slug>", description: "Create feature docs and metadata." },
  { command: "benjamin-docs anchor add <id> <file>", description: "Link a stable code anchor to docs." },
  { command: "benjamin-docs install-skill", description: "Install the bundled agent skill locally." },
  { command: "benjamin-docs package-skill", description: "Package the skill for Claude upload." },
  { command: "benjamin-docs chat-project", description: "Print exact guidance for chat-to-project workflows." },
];

export function getCommandsText(): string {
  return [
    "benjamin-docs commands",
    "",
    "Main commands",
    ...mainCommands.map(formatEntry),
    "",
    "Advanced commands",
    ...advancedCommands.map(formatEntry),
    "",
    "Tip: use the short alias `bd` when it is installed, for example `bd init`.",
  ].join("\n");
}

function formatEntry(entry: CommandEntry): string {
  return `  ${entry.command.padEnd(48)} ${entry.description}`;
}
