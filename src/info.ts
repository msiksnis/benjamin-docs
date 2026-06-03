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
    "agent-docs",
    "",
    "Repo-local project memory for humans and AI agents.",
    "",
    "Common commands:",
    "  agent-docs introduce",
    "  agent-docs init",
    "  agent-docs status",
    "  agent-docs validate",
    "  agent-docs scope create feature booking-capacity",
    "  agent-docs anchor add booking-capacity-rules src/features/booking/capacity.ts",
    "  agent-docs export --audience developer",
    "",
    "Start here:",
    "  agent-docs introduce",
    "  agent-docs init",
  ].join("\n");
}

export function getIntroductionText(): string {
  return [
    "agent-docs turns planning and build conversations into durable project memory.",
    "",
    "The docs live inside your project, close to the work, so they can be versioned, reviewed, and reused by future sessions.",
    "",
    "The same source docs can help humans, developers, designers, advisors, and AI agents understand what the project is, what was decided, what remains open, and where the work should go next.",
    "",
    "Publishing and collaboration can come later. The repo-local docs are the source of truth.",
  ].join("\n");
}
