export interface ChatProjectGuideOptions {
  name?: string;
  path?: string;
}

const DEFAULT_PROJECT_NAME = "<Project Name>";

export function getChatProjectGuide(options: ChatProjectGuideOptions = {}): string {
  const projectName = options.name?.trim() || DEFAULT_PROJECT_NAME;
  const projectPath = options.path?.trim() || `~/Documents/Benjamin Docs/${projectName}`;

  return [
    "benjamin-docs chat-project",
    "",
    "Use this when turning a chat into a new local project.",
    "",
    "Before writing files, ask the user:",
    "",
    "I can create a new local project from this chat.",
    "",
    `Project name: ${projectName}`,
    `Suggested folder: ${projectPath}`,
    "",
    "I will create:",
    "- README.md",
    "- benjamin-docs/",
    "- .benjamin-docs/",
    "",
    "I will capture:",
    "- the main project idea",
    "- important references and constraints",
    "- decisions and open questions",
    "- roadmap and next actions",
    "- human and agent handoff notes",
    "",
    "Reply \"yes\" to create it, or send a different project name/path.",
    "",
    "After the user confirms:",
    "1. Create the project folder.",
    "2. Run: benjamin-docs init --mode planning",
    "3. Create a top-level README.md.",
    "4. Update the project and handoff docs from the chat.",
    "5. Run: benjamin-docs views",
    "6. Run: benjamin-docs ready",
    "",
    "If ready fails, use lower-level diagnostics such as validate, review, or doctor --strict to find the gap.",
    "",
    "Completion summary should mention the structure:",
    "- README.md",
    "- benjamin-docs/ with project, handoff, engineering, features, releases, and views docs",
    "- .benjamin-docs/ with config, manifest, scopes, and anchors metadata",
    "",
    "Then list the main docs updated, key decisions captured, and unresolved questions.",
    "",
    "Do not use temporary chat workspaces such as ~/Documents/Codex/<date>/... unless the user explicitly asks.",
  ].join("\n");
}
