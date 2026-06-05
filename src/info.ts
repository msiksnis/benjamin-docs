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
    "     A good default is ~/Documents/Benjamin Docs/<Project Name>.",
    "  3. Otherwise run: benjamin-docs init",
    "  4. Ask: Capture the current project baseline with benjamin-docs in plain language.",
    "",
    "Common commands:",
    "  benjamin-docs --version",
    "  benjamin-docs introduce",
    "  benjamin-docs install-skill",
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
    "  benjamin-docs install-skill",
    "  benjamin-docs init",
    "  benjamin-docs next",
  ].join("\n");
}

export function getIntroductionText(): string {
  return [
    "benjamin-docs turns planning and build conversations into durable project memory.",
    "",
    "In plain language: it gives your project a local notebook that both humans and AI agents can read later.",
    "",
    "Your agent can use that notebook to capture what the project is, what was decided, what was rejected, what is still unclear, and what should happen next.",
    "",
    "The docs live inside your project, close to the work, so they can be versioned, reviewed, and reused by future sessions.",
    "",
    "Your docs are not uploaded or published by the CLI. The repo-local docs are the source of truth.",
    "",
    "The CLI creates and validates the local docs workspace. The benjamin-docs skill teaches your agent how to turn chat context into useful docs.",
    "",
    "Install or update the skill for Codex, Cursor, and Claude Code with:",
    "",
    "benjamin-docs install-skill",
    "",
    "If you only have a chat, paste this into your AI chat:",
    "",
    "Use the benjamin-docs skill to create a project from this chat.",
    "Suggest ~/Documents/Benjamin Docs/<Project Name> unless I choose a different place.",
    "",
    "A good default location is ~/Documents/Benjamin Docs/<Project Name>.",
    "",
    "If you already have a project folder, ask your AI agent to run `benjamin-docs init`, then capture the current project baseline in plain language.",
  ].join("\n");
}
