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
    "  benjamin-docs export Open guided export.",
    "  benjamin-docs help   Show this guide.",
    "",
    "If you are starting from a chat, ask your agent:",
    "  Use the benjamin-docs skill to create a project from this chat.",
    "",
    "If you are inside a project, run:",
    "  benjamin-docs init",
    "",
    "In an app or codebase, init auto-detects codebase memory and installs agent guidance.",
    "",
    "After docs are captured, refresh derived views and check readiness:",
    "  benjamin-docs views",
    "  benjamin-docs ready",
    "",
    "To create a local feature, app, or handoff export:",
    "  benjamin-docs export",
    "",
    "Then ask your agent:",
    "  Capture the current project baseline with benjamin-docs in plain language.",
    "",
    "For Claude.ai or Claude Desktop skill upload:",
    "  benjamin-docs package-skill",
    "",
    "For every command, run the interactive drawer:",
    "  benjamin-docs commands",
  ].join("\n");
}

export function getIntroductionText(): string {
  return [
    "benjamin-docs keeps project memory on disk.",
    "",
    "It turns messy chats and projects into local Markdown docs:",
    "- decisions",
    "- plans",
    "- open questions",
    "- handoff notes",
    "- code maps and agent guidance when code exists",
    "",
    "No cloud. No dashboard. No transcript dump.",
    "",
    "Inside a project, run:",
    "  benjamin-docs init",
    "",
    "In an app or codebase, init auto-detects codebase memory and installs agent guidance.",
    "",
    "After useful docs exist, generate Memory Views:",
    "  benjamin-docs views",
    "",
    "Then check handoff readiness:",
    "  benjamin-docs ready",
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
    "  benjamin-docs export",
    "  benjamin-docs help",
    "",
    "Useful project-memory refresh flow:",
    "  benjamin-docs init",
    "  benjamin-docs views",
    "  benjamin-docs ready",
    "",
    "For the full interactive command drawer, run:",
    "  benjamin-docs commands",
    "",
    "Then ask your agent:",
    "  Capture the current project baseline with benjamin-docs.",
  ].join("\n");
}

export function getInitHelpText(): string {
  return [
    "benjamin-docs init",
    "",
    "Set up local project memory.",
    "",
    "For most people:",
    "  benjamin-docs init",
    "",
    "What it does:",
    "- In an interactive terminal, asks what you are setting up.",
    "- In an obvious codebase, defaults to codebase memory and agent guidance.",
    "- Preserves existing docs and existing AGENTS.md content.",
    "",
    "Automation flags:",
    "  benjamin-docs init --mode planning",
    "  benjamin-docs init --mode codebase",
    "  benjamin-docs init --mode feature --feature <slug>",
    "  benjamin-docs init --agent-contract",
    "  benjamin-docs init --agent-contract --children",
    "  benjamin-docs init --no-agent-contract",
    "",
    "Tip: teach humans `benjamin-docs init`; use flags for scripts and agents.",
  ].join("\n");
}

export function getAnchorHelpText(): string {
  return [
    "benjamin-docs anchor",
    "",
    "Link stable names to important code files.",
    "",
    "Commands:",
    "  benjamin-docs anchor add <id> <file>",
    "  benjamin-docs anchor list",
    "",
    "Examples:",
    "  benjamin-docs anchor add homepage pages/index.js",
    "  benjamin-docs anchor list",
  ].join("\n");
}

export function getScopeHelpText(): string {
  return [
    "benjamin-docs scope",
    "",
    "Create focused docs for a feature, change, or plan.",
    "",
    "Commands:",
    "  benjamin-docs scope create feature <slug>",
    "  benjamin-docs scope status <id> <status>",
    "",
    "Statuses: draft, review, approved, stale, archived.",
    "Archived and stale scopes drop out of generated Memory Views.",
    "",
    "Examples:",
    "  benjamin-docs scope create feature checkout-redesign",
    "  benjamin-docs scope status checkout-redesign archived",
  ].join("\n");
}
