#!/usr/bin/env node
import { initProject } from "./init.js";
import { getHelpText, getIntroductionText, getPackageVersion } from "./info.js";

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
    console.log(`Initialized agent-docs. ${written.length} files created.`);
    return 0;
  }

  console.error(`Unknown command: ${command}`);
  console.error("");
  console.error(getHelpText());
  return 1;
}

main().then((code) => {
  process.exitCode = code;
});
