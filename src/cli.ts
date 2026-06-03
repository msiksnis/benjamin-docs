#!/usr/bin/env node
import { addAnchor } from "./anchors.js";
import { exportAudience } from "./export.js";
import { initProject, promoteToCodebase } from "./init.js";
import { getHelpText, getIntroductionText, getPackageVersion } from "./info.js";
import { createScope } from "./scopes.js";
import { getStatus } from "./status.js";
import { validateProject } from "./validate.js";

export async function main(argv: string[] = process.argv.slice(2), cwd: string = process.cwd()): Promise<number> {
  const [command] = argv;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    console.log(getHelpText());
    return 0;
  }

  if (command === "--version" || command === "-v") {
    console.log(getPackageVersion());
    return 0;
  }

  if (command === "introduce") {
    console.log(getIntroductionText());
    return 0;
  }

  if (command === "init") {
    const written = initProject(cwd);
    console.log(`Initialized benjamin-docs. ${written.length} files created.`);
    return 0;
  }

  if (command === "status") {
    console.log(getStatus(cwd));
    return 0;
  }

  if (command === "scope") {
    if (argv[1] !== "create") {
      throw new Error("Usage: benjamin-docs scope create feature <slug>");
    }

    const kind = argv[2];
    const id = argv[3];
    if (!kind || !id) {
      throw new Error("Usage: benjamin-docs scope create feature <slug>");
    }

    const written = createScope(cwd, kind, id);
    console.log(`Created ${kind} scope ${id}. ${written.length} files created.`);
    return 0;
  }

  if (command === "anchor") {
    if (argv[1] !== "add") {
      throw new Error("Usage: benjamin-docs anchor add <id> <file>");
    }

    const id = argv[2];
    const file = argv[3];
    if (!id || !file) {
      throw new Error("Usage: benjamin-docs anchor add <id> <file>");
    }

    addAnchor(cwd, id, file);
    console.log(`Added anchor ${id}.`);
    return 0;
  }

  if (command === "validate") {
    const result = validateProject(cwd);
    for (const warning of result.warnings) console.warn(`Warning: ${warning}`);
    if (result.errors.length > 0) {
      for (const error of result.errors) console.error(`Error: ${error}`);
      return 1;
    }

    console.log("Validation passed.");
    return 0;
  }

  if (command === "export") {
    const audienceIndex = argv.indexOf("--audience");
    const audience = audienceIndex === -1 ? undefined : argv[audienceIndex + 1];
    if (!audience) {
      throw new Error("Usage: benjamin-docs export --audience <audience>");
    }

    const written = exportAudience(cwd, audience);
    console.log(`Exported ${audience} bundle. ${written.length} files written.`);
    return 0;
  }

  if (command === "promote") {
    if (argv[1] !== "--to" || argv[2] !== "codebase") {
      throw new Error("Usage: benjamin-docs promote --to codebase");
    }

    const written = promoteToCodebase(cwd);
    console.log(`Promoted benjamin-docs to codebase mode. ${written.length} files created.`);
    return 0;
  }

  console.error(`Unknown command: ${command}`);
  console.error("");
  console.error(getHelpText());
  return 1;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
