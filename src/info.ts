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
    "Common commands:",
    "  benjamin-docs --version",
    "  benjamin-docs introduce",
    "  benjamin-docs init",
    "  benjamin-docs status",
    "  benjamin-docs validate",
    "  benjamin-docs scope create feature booking-capacity",
    "  benjamin-docs anchor add booking-capacity-rules src/features/booking/capacity.ts",
    "  benjamin-docs export --audience developer",
    "  benjamin-docs promote --to codebase",
    "",
    "With an AI agent:",
    "  Ask: Capture this conversation with benjamin-docs.",
    "",
    "Start here:",
    "  benjamin-docs introduce",
    "  benjamin-docs init",
  ].join("\n");
}

export function getIntroductionText(): string {
  return [
    "benjamin-docs turns planning and build conversations into durable project memory.",
    "",
    "The docs live inside your project, close to the work, so they can be versioned, reviewed, and reused by future sessions.",
    "",
    "The same source docs can help humans, developers, designers, advisors, and AI agents understand what the project is, what was decided, what remains open, and where the work should go next.",
    "",
    "Publishing and collaboration can come later. The repo-local docs are the source of truth.",
  ].join("\n");
}
