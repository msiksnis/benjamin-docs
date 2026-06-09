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
    "Main commands:",
    "  benjamin-docs init   Set up project memory.",
    "  benjamin-docs ready  Check whether memory is handoff-ready.",
    "  benjamin-docs help   Show this guide.",
    "",
    "If you are starting from a chat, ask your agent:",
    "  Use the benjamin-docs skill to create a project from this chat.",
    "",
    "If you are inside a project, run:",
    "  benjamin-docs init",
    "",
    "Then ask your agent:",
    "  Capture the current project baseline with benjamin-docs in plain language.",
    "",
    "For every command, run:",
    "  benjamin-docs commands",
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
    "Main commands:",
    "  benjamin-docs init",
    "  benjamin-docs ready",
    "  benjamin-docs help",
    "",
    "For the full command drawer, run:",
    "  benjamin-docs commands",
    "",
    "Then ask your agent:",
    "  Capture the current project baseline with benjamin-docs.",
  ].join("\n");
}
