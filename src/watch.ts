import type { BenjaminDocsConfig, WatchRule } from "./types.js";

export function defaultWatchRules(docsRoot: string): WatchRule[] {
  const projectBrief = `${docsRoot}/project/brief.md`;
  const roadmap = `${docsRoot}/project/roadmap.md`;
  const openQuestions = `${docsRoot}/project/open-questions.md`;
  const humanBrief = `${docsRoot}/handoff/human-brief.md`;
  const architecture = `${docsRoot}/engineering/architecture.md`;
  const codeMap = `${docsRoot}/engineering/code-map.md`;
  const featuresIndex = `${docsRoot}/features/index.md`;
  const changelog = `${docsRoot}/releases/changelog.md`;
  const agentBrief = `${docsRoot}/handoff/agent-brief.md`;

  return [
    {
      label: "database/schema",
      paths: ["**/*.sql", "**/migrations/**", "**/*.prisma", "db/schema.rb", "**/database.types.*"],
      docs: [projectBrief, roadmap, humanBrief, agentBrief, architecture, codeMap, changelog],
    },
    {
      label: "application code",
      paths: [
        "src/**",
        "app/**",
        "apps/**",
        "lib/**",
        "pages/**",
        "components/**",
        "server/**",
        "api/**",
        "cmd/**",
        "internal/**",
        "pkg/**",
      ],
      docs: [projectBrief, roadmap, humanBrief, agentBrief, architecture, codeMap, changelog],
    },
    {
      label: "tests",
      paths: ["test/**", "tests/**", "spec/**", "**/*.test.*", "**/*.spec.*", "**/*_test.go", "**/*_test.py"],
      docs: [agentBrief, codeMap],
    },
    {
      label: "configuration/workflow",
      paths: [
        "package.json",
        "*.config.*",
        "tsconfig*.json",
        ".github/workflows/**",
        "Dockerfile",
        "docker-compose*",
        "pyproject.toml",
        "Cargo.toml",
        "go.mod",
        "pom.xml",
        "Gemfile",
        "composer.json",
      ],
      docs: [roadmap, agentBrief, architecture, codeMap, changelog],
    },
    {
      label: "project memory/status",
      paths: ["README.md", "docs/**", "tasks/**", ".claude/**", ".cursor/**", "AGENTS.md"],
      docs: [projectBrief, roadmap, openQuestions, humanBrief, agentBrief, featuresIndex],
    },
  ];
}

export function resolveWatchRules(config: BenjaminDocsConfig): WatchRule[] {
  if (config.watch !== undefined && Array.isArray(config.watch)) {
    return config.watch.filter(isUsableWatchRule);
  }

  return defaultWatchRules(config.docsRoot);
}

export function matchesAnyGlob(patterns: string[], path: string): boolean {
  return patterns.some((pattern) => matchesGlob(pattern, path));
}

export function matchesGlob(pattern: string, path: string): boolean {
  return globToRegExp(pattern).test(path);
}

function isUsableWatchRule(rule: WatchRule): boolean {
  return (
    typeof rule === "object" &&
    rule !== null &&
    Array.isArray(rule.paths) &&
    rule.paths.length > 0 &&
    rule.paths.every((path) => typeof path === "string" && path.length > 0) &&
    Array.isArray(rule.docs) &&
    rule.docs.length > 0 &&
    rule.docs.every((doc) => typeof doc === "string" && doc.length > 0)
  );
}

function globToRegExp(pattern: string): RegExp {
  let regex = "";
  let index = 0;

  while (index < pattern.length) {
    const char = pattern[index];

    if (char === "*") {
      if (pattern[index + 1] === "*") {
        if (pattern[index + 2] === "/") {
          regex += "(?:[^/]+/)*";
          index += 3;
          continue;
        }

        regex += ".*";
        index += 2;
        continue;
      }

      regex += "[^/]*";
      index += 1;
      continue;
    }

    if (char === "?") {
      regex += "[^/]";
      index += 1;
      continue;
    }

    regex += escapeRegExpChar(char ?? "");
    index += 1;
  }

  return new RegExp(`^${regex}$`);
}

function escapeRegExpChar(char: string): string {
  return char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
