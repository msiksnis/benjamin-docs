import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function getPackageVersion(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const packagePath = join(currentDir, "..", "..", "package.json");
  const pkg = JSON.parse(readFileSync(packagePath, "utf8")) as { version: string };
  return pkg.version;
}

export function getHelpText(): string {
  return [
    "benjamin-docs",
    "",
    "Repo-local project memory for humans and AI agents.",
    "",
    "What it does:",
    "  Creates a small docs workspace in your project.",
    "  Gives your AI agent a clear place to capture decisions, plans, open questions, and handoffs.",
    "  Keeps those docs local unless you choose to share them.",
    "",
    "If you are here with an AI agent:",
    "  1. Run: benjamin-docs introduce",
    "  2. If you only have a chat, ask: Use the benjamin-docs skill to create a project from this chat.",
    "     The agent should ask before writing and suggest ~/Documents/Benjamin Docs/<Project Name>.",
    "  3. Otherwise run: benjamin-docs init",
    "  4. Ask: Capture the current project baseline with benjamin-docs in plain language.",
    "",
    "Common commands:",
    "  benjamin-docs --version",
    "  benjamin-docs introduce",
    "  benjamin-docs chat-project",
    "  benjamin-docs install-skill",
    "  benjamin-docs doctor",
    "  benjamin-docs doctor --strict",
    "  benjamin-docs review",
    "  benjamin-docs package-skill",
    "  benjamin-docs init",
    "  benjamin-docs init --mode codebase",
    "  benjamin-docs init --mode feature --feature booking-capacity",
    "  benjamin-docs next",
    "  benjamin-docs status",
    "  benjamin-docs validate",
    "  benjamin-docs scope create feature booking-capacity",
    "  benjamin-docs anchor add booking-capacity-rules src/features/booking/capacity.ts",
    "  benjamin-docs export --audience developer",
    "  benjamin-docs promote --to codebase",
    "",
    "Start here:",
    "  benjamin-docs introduce",
    "  benjamin-docs chat-project",
    "  benjamin-docs install-skill",
    "  benjamin-docs doctor",
    "  benjamin-docs review",
    "  benjamin-docs package-skill",
    "  benjamin-docs init",
    "  benjamin-docs next",
  ].join("\n");
}

export function getIntroductionText(): string {
  return [
    "benjamin-docs keeps project memory on disk.",
    "",
    "It turns chats into local Markdown docs:",
    "- decisions",
    "- plans",
    "- open questions",
    "- handoff notes",
    "",
    "No cloud. No dashboard. No transcript dump.",
    "",
    "In terminal, run:",
    "  benjamin-docs install-skill",
    "",
    "From any chat, ask your agent:",
    "  Use the benjamin-docs skill to create a project from this chat.",
    "",
    "The agent should ask before writing files and suggest:",
    "  ~/Documents/Benjamin Docs/<Project Name>",
    "",
    "For the exact chat-to-project prompt, run:",
    "  benjamin-docs chat-project",
    "",
    "In an existing project, run:",
    "  benjamin-docs init",
    "  benjamin-docs validate",
    "",
    "Then ask your agent:",
    "  Capture the current project baseline with benjamin-docs.",
  ].join("\n");
}
