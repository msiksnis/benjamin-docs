import { existsSync, lstatSync, readFileSync } from "node:fs";
import { CONFIG_DIR } from "./constants.js";
import { parseMarkdown } from "./frontmatter.js";
import { getChangedFiles, gitLastCommit, isReviewableSourceChange } from "./git.js";
import { readGeneratedJson, rootPath } from "./fsx.js";
import { readConfig } from "./project-config.js";
import type { ManifestFile, WatchRule } from "./types.js";
import { validateProject } from "./validate.js";
import { renderMemoryViews, type RenderedMemoryView } from "./views.js";
import { defaultWatchRules, matchesAnyGlob, resolveWatchRules } from "./watch.js";

export interface ReviewResult {
  ok: boolean;
  output: string;
  docsChecked: number;
  errors: ReviewIssue[];
  warnings: ReviewIssue[];
  changedWarnings: ReviewIssue[];
  changedWorkStatus: "available" | "unavailable" | "not_requested";
}

export interface ReviewIssue {
  path?: string;
  message: string;
}

export interface ReviewOptions {
  changed?: boolean;
  since?: string;
  includeValidation?: boolean;
}

interface ChangedReviewResult {
  filesChecked: number;
  status: "available" | "unavailable";
}

const STARTER_PHRASES = [
  "Capture what this project is, who it serves, and why it matters.",
  "Capture the current MVP, near-term next steps, and deferred ideas.",
  "Track decisions that are not settled yet.",
  "Use this for a concise handoff to another person.",
  "Use this to orient future AI agents quickly.",
  "Capture the planned or current system shape, major boundaries, and important constraints.",
  "Capture important files, modules, routes, schemas, and tests when code exists.",
  "Track feature scopes that are planned, in progress, shipped, or deferred.",
  "Track notable changes.",
  "Capture what this feature is meant to accomplish.",
  "Capture the implementation or execution plan.",
  "Capture durable decisions, rejected options, and reasoning.",
  "Capture status, open questions, and next actions for this feature.",
];

const MIN_WORDS_BY_BASENAME: Record<string, number> = {
  "brief.md": 60,
  "roadmap.md": 50,
  "open-questions.md": 25,
  "human-brief.md": 45,
  "agent-brief.md": 60,
  "architecture.md": 50,
  "code-map.md": 50,
  "plan.md": 45,
  "decisions.md": 35,
  "handoff.md": 45,
};

const AGENT_BRIEF_CONTINUATION_CHECKS = [
  {
    label: "read-first docs",
    headings: ["read first", "read first docs", "read before changing"],
    terms: ["read first", "read these", "start with", "before changing", "before editing"],
  },
  {
    label: "current state",
    headings: ["current state", "current status", "status"],
    terms: ["current state", "current status", "status", "baseline", "done so far"],
  },
  {
    label: "commands/checks",
    headings: ["commands and checks", "commands checks", "checks", "validation"],
    terms: ["bd ", "benjamin-docs", "command", "commands", "check", "checks", "test", "validate", "ready"],
  },
  {
    label: "risks/hazards",
    headings: ["risks hazards", "risks", "hazards", "risks open questions"],
    terms: ["risk", "risks", "hazard", "hazards", "avoid", "do not", "watch out"],
  },
  {
    label: "next actions",
    headings: ["next actions", "next action", "next steps"],
    terms: ["next action", "next actions", "next step", "next steps", "continue", "remaining"],
  },
];

const AGENT_BRIEF_TEMPLATE_LINES = [
  "use this to orient future ai agents quickly",
  "fill this in so a future agent can continue without asking the owner to repeat the project",
  "list the docs and files to read before changing behavior",
  "summarize what exists now what is done and what is still uncertain",
  "list commands tests validation steps or manual checks to run before handoff",
  "list assumptions fragile areas or things future agents should avoid",
  "list the next concrete actions for a human or agent",
];

const STALE_CLAIM_PATTERNS = [
  /\bnot (?:implemented|built|created|added|wired up) yet\b/i,
  /\bdo(?:es)? not exist yet\b/i,
  /\bno (?:code|schema|tests?|migrations?) exists? yet\b/i,
  /\bonce the\b[^.\n]{0,80}\b(?:exists|is implemented|is built|is created)\b/i,
  /\bplanned but not (?:started|implemented|built)\b/i,
];

const PATH_LIVENESS_BASENAMES = ["architecture.md", "code-map.md", "agent-brief.md"];

const DOC_CHURN_THRESHOLD = 10;

export function reviewProject(root: string, options: ReviewOptions = {}): ReviewResult {
  const errors: ReviewIssue[] = [];
  const warnings: ReviewIssue[] = [];
  let changedWarnings: ReviewIssue[] = [];
  let changedReview: ChangedReviewResult | undefined;

  if (!existsSync(rootPath(root, CONFIG_DIR, "config.json"))) {
    errors.push({ message: "benjamin-docs is not initialized. Run: benjamin-docs init" });
    return formatReview({
      docsChecked: 0,
      errors,
      warnings,
      changedWarnings: [],
      changedWorkStatus: options.changed ? "unavailable" : "not_requested",
    });
  }

  if (options.includeValidation !== false) {
    const validation = validateProject(root);
    for (const error of validation.errors) errors.push({ message: error });
    for (const warning of validation.warnings) warnings.push({ message: warning });
  }

  let docsRoot = "benjamin-docs";
  let mode = "planning";
  let manifestDocs: string[] = [];
  let watchRules: WatchRule[] = defaultWatchRules(docsRoot);

  try {
    const config = readConfig(root);
    docsRoot = config.docsRoot;
    mode = config.mode;
    watchRules = resolveWatchRules(config);
    const manifest = readGeneratedJson<ManifestFile>(root, `${CONFIG_DIR}/manifest.json`, "Metadata path");
    manifestDocs = manifest.docs;
  } catch (error) {
    errors.push({ message: `Cannot read project metadata: ${error instanceof Error ? error.message : String(error)}` });
  }

  const expected = expectedDocs(docsRoot, mode);
  for (const doc of expected) {
    if (!manifestDocs.includes(doc)) {
      warnings.push({ path: doc, message: "Expected baseline doc is not listed in the manifest." });
    }
  }

  let docsChecked = 0;
  for (const doc of manifestDocs) {
    if (!doc.endsWith(".md")) continue;

    let fullPath;
    try {
      fullPath = rootPath(root, doc);
    } catch (error) {
      errors.push({ path: doc, message: `Cannot review unsafe manifest doc: ${error instanceof Error ? error.message : String(error)}` });
      continue;
    }

    if (!existsSync(fullPath) || !lstatSync(fullPath).isFile()) continue;
    docsChecked += 1;
    reviewDoc(root, fullPath, doc, warnings);
  }

  if (mode === "codebase") {
    reviewCodebaseDocs(docsRoot, manifestDocs, warnings);
  }

  reviewFreshnessCoverage(root, docsRoot, manifestDocs, watchRules, warnings);
  reviewDocChurn(root, docsRoot, warnings);
  reviewViewsFreshness(root, warnings);

  if (options.changed) {
    const changedWarningsStart = warnings.length;
    changedReview = reviewChangedWork(root, docsRoot, watchRules, options.since ?? "HEAD", warnings);
    changedWarnings = warnings.slice(changedWarningsStart);
  }

  return formatReview({
    docsChecked,
    errors,
    warnings,
    changedWarnings,
    changedWorkStatus: changedReview?.status ?? "not_requested",
    changedFilesChecked: changedReview?.filesChecked,
  });
}

function reviewChangedWork(root: string, docsRoot: string, rules: WatchRule[], since: string, warnings: ReviewIssue[]): ChangedReviewResult {
  const changedResult = getChangedFiles(root, since);
  const changedFiles = changedResult.files;
  const docsChanged = changedFiles.filter((file) => isBenjaminSourceDoc(file, docsRoot));
  const sourceChanges = changedFiles.filter((file) => isReviewableSourceChange(file, docsRoot));
  const matchedRules = rules.filter((rule) => sourceChanges.some((file) => matchesAnyGlob(rule.paths, file)));

  if (!changedResult.ok) {
    warnings.push({
      message: "Changed-work review needs git history. Run it inside a git repository or pass a valid --since <git-ref>.",
    });
  }

  if (sourceChanges.length > 0 && docsChanged.length === 0) {
    warnings.push({
      message: "Source files changed, but no Benjamin Docs source files changed. Update project memory or state why no durable docs update is needed.",
    });
  }

  for (const doc of expectedRuleDocs(matchedRules)) {
    const areas = matchedRules.filter((rule) => rule.docs.includes(doc)).map((rule) => rule.label ?? "watched files");

    let fullPath;
    try {
      fullPath = rootPath(root, doc);
    } catch {
      warnings.push({ path: doc, message: "Watch rule references an unsafe doc path. Fix the watch rule in .benjamin-docs/config.json." });
      continue;
    }

    if (!existsSync(fullPath)) {
      warnings.push({ path: doc, message: "Watch rule expects this doc, but it does not exist. Create it or fix the watch rule in .benjamin-docs/config.json." });
      continue;
    }

    if (isInactiveDoc(root, doc)) {
      continue;
    }

    if (!docsChanged.includes(doc)) {
      warnings.push({ path: doc, message: `May need update because changed source files affect ${areas.join(", ")}.` });
    }
  }

  reviewStaleClaims(root, docsRoot, sourceChanges.length > 0, warnings);

  return { filesChecked: sourceChanges.length, status: changedResult.ok ? "available" : "unavailable" };
}

function expectedRuleDocs(rules: WatchRule[]): string[] {
  return [...new Set(rules.flatMap((rule) => rule.docs))].sort();
}

function reviewFreshnessCoverage(root: string, docsRoot: string, manifestDocs: string[], rules: WatchRule[], warnings: ReviewIssue[]): void {
  const coveredDocs = new Set(expectedRuleDocs(rules));

  for (const doc of manifestDocs) {
    if (!isBenjaminSourceDoc(doc, docsRoot)) continue;
    if (coveredDocs.has(doc)) continue;

    let parsed;
    try {
      parsed = parseMarkdown(readFileSync(rootPath(root, doc), "utf8"));
    } catch {
      continue;
    }

    if (parsed.frontmatter.status === "archived" || parsed.frontmatter.status === "stale") continue;
    if (!isFreshnessSensitiveDoc(docsRoot, doc, parsed.frontmatter)) continue;

    warnings.push({
      path: doc,
      message:
        "Freshness blind spot: status-bearing doc is not matched by any watch rule, so changed work can never be flagged stale. Add it to .benjamin-docs/config.json watch docs or mark it stale/archived when inactive.",
    });
  }
}

function isFreshnessSensitiveDoc(docsRoot: string, doc: string, frontmatter: ReturnType<typeof parseMarkdown>["frontmatter"]): boolean {
  if (frontmatter.freshness === "status") return true;
  if (
    [
      `${docsRoot}/project/brief.md`,
      `${docsRoot}/project/roadmap.md`,
      `${docsRoot}/handoff/human-brief.md`,
      `${docsRoot}/handoff/agent-brief.md`,
    ].includes(doc)
  ) {
    return true;
  }

  return frontmatter.scope === "feature" && doc.startsWith(`${docsRoot}/features/`) && !doc.endsWith("/index.md");
}

function isInactiveDoc(root: string, doc: string): boolean {
  try {
    const parsed = parseMarkdown(readFileSync(rootPath(root, doc), "utf8"));
    return parsed.frontmatter.status === "archived" || parsed.frontmatter.status === "stale";
  } catch {
    return false;
  }
}

function isBenjaminSourceDoc(file: string, docsRoot: string): boolean {
  return file.startsWith(`${docsRoot}/`) && file.endsWith(".md") && !file.startsWith(`${docsRoot}/views/`);
}

function reviewDocChurn(root: string, docsRoot: string, warnings: ReviewIssue[]): void {
  const workingChanges = getChangedFiles(root, "HEAD");
  if (!workingChanges.ok) return;

  for (const doc of [`${docsRoot}/engineering/architecture.md`, `${docsRoot}/engineering/code-map.md`]) {
    let fullPath;
    try {
      fullPath = rootPath(root, doc);
    } catch {
      continue;
    }

    if (!existsSync(fullPath) || !lstatSync(fullPath).isFile()) continue;
    if (workingChanges.files.includes(doc)) continue;

    const lastCommit = gitLastCommit(root, doc);
    if (!lastCommit) continue;

    const sinceDoc = getChangedFiles(root, lastCommit);
    if (!sinceDoc.ok) continue;

    const sources = sinceDoc.files.filter((file) => isReviewableSourceChange(file, docsRoot));
    if (sources.length >= DOC_CHURN_THRESHOLD) {
      warnings.push({
        path: doc,
        message: `${sources.length} source files changed since this doc last changed in git. Re-verify it against the current codebase, then update it or restate why it still holds.`,
      });
    }
  }
}

function reviewViewsFreshness(root: string, warnings: ReviewIssue[]): void {
  let rendered: RenderedMemoryView[];
  try {
    rendered = renderMemoryViews(root);
  } catch {
    return;
  }

  const existing = rendered.filter((view) => {
    try {
      return existsSync(rootPath(root, view.relativePath));
    } catch {
      return false;
    }
  });
  if (existing.length === 0) return;

  for (const view of rendered) {
    let fullPath;
    try {
      fullPath = rootPath(root, view.relativePath);
    } catch {
      continue;
    }

    if (!existsSync(fullPath)) {
      warnings.push({ path: view.relativePath, message: "Memory View is missing. Run: benjamin-docs views" });
      continue;
    }

    let currentBody: string;
    try {
      currentBody = parseMarkdown(readFileSync(fullPath, "utf8")).body;
    } catch {
      warnings.push({ path: view.relativePath, message: "Memory View cannot be parsed. Run: benjamin-docs views" });
      continue;
    }

    if (currentBody.trim() !== view.body.trim()) {
      warnings.push({ path: view.relativePath, message: "Memory View is stale. Run: benjamin-docs views" });
    }
  }
}

function reviewStaleClaims(root: string, docsRoot: string, hasSourceChanges: boolean, warnings: ReviewIssue[]): void {
  if (!hasSourceChanges) return;

  for (const doc of [`${docsRoot}/engineering/architecture.md`, `${docsRoot}/engineering/code-map.md`]) {
    const claim = findStaleClaim(root, doc, STALE_CLAIM_PATTERNS);
    if (claim) {
      warnings.push({ path: doc, message: `Possible stale claim while source files changed: "${claim}". Verify it still holds, then update or remove it.` });
    }
  }
}

function findStaleClaim(root: string, relativePath: string, patterns: RegExp[]): string | undefined {
  let fullPath;
  try {
    fullPath = rootPath(root, relativePath);
  } catch {
    return undefined;
  }

  if (!existsSync(fullPath) || !lstatSync(fullPath).isFile()) return undefined;

  let body: string;
  try {
    body = stripMentionedPhrases(stripFencedBlocks(parseMarkdown(readFileSync(fullPath, "utf8")).body));
  } catch {
    return undefined;
  }

  for (const pattern of patterns) {
    const match = pattern.exec(body);
    if (match?.[0]) return compactClaim(expandToSentence(body, match.index, match.index + match[0].length));
  }

  return undefined;
}

function stripMentionedPhrases(text: string): string {
  return text.replace(/`[^`\n]*`/g, "`...`").replace(/"[^"\n]{0,120}"/g, '"..."');
}

function expandToSentence(text: string, start: number, end: number): string {
  let from = start;
  while (from > 0 && text[from - 1] !== "\n" && !isSentenceTerminator(text[from - 1])) from -= 1;

  let to = end;
  while (to < text.length && text[to] !== "\n" && !isSentenceTerminator(text[to])) to += 1;
  if (to < text.length && isSentenceTerminator(text[to])) to += 1;

  return text.slice(from, to);
}

function isSentenceTerminator(char: string | undefined): boolean {
  return char === "." || char === "!" || char === "?";
}

function compactClaim(text: string): string {
  return text.replace(/\s+/g, " ").trim().replace(/^[-*]\s+/, "").slice(0, 180);
}

function reviewDoc(root: string, fullPath: string, relativePath: string, warnings: ReviewIssue[]): void {
  let body = "";
  let status = "";
  try {
    const parsed = parseMarkdown(readFileSync(fullPath, "utf8"));
    body = parsed.body;
    status = parsed.frontmatter.status;
  } catch {
    return;
  }

  if (status === "archived") return;

  if (STARTER_PHRASES.some((phrase) => body.includes(phrase))) {
    warnings.push({ path: relativePath, message: "Still looks like a starter template. Capture real project context." });
  }

  const basename = relativePath.split("/").at(-1) ?? relativePath;
  const minWords = MIN_WORDS_BY_BASENAME[basename];
  if (minWords && wordCount(body) < minWords) {
    warnings.push({ path: relativePath, message: `Looks thin for a baseline doc (${wordCount(body)} words). Add concrete context.` });
  }

  if (basename === "open-questions.md" && !body.includes("?")) {
    warnings.push({ path: relativePath, message: "Open questions doc has no question marks. Add concrete unresolved decisions." });
  }

  reviewContinuationSignals(body, relativePath, basename, warnings);
  reviewPathReferences(root, body, relativePath, basename, warnings);
}

function reviewPathReferences(root: string, body: string, relativePath: string, basename: string, warnings: ReviewIssue[]): void {
  if (!PATH_LIVENESS_BASENAMES.includes(basename)) return;

  for (const reference of extractInlinePathReferences(body)) {
    const firstSegment = reference.split("/", 1)[0] ?? "";

    let firstSegmentPath;
    try {
      firstSegmentPath = rootPath(root, firstSegment);
    } catch {
      continue;
    }

    if (!existsSync(firstSegmentPath)) continue;

    let fullPath;
    try {
      fullPath = rootPath(root, reference);
    } catch {
      continue;
    }

    if (!existsSync(fullPath)) {
      warnings.push({ path: relativePath, message: `References missing path \`${reference}\`. Update or remove the stale reference.` });
    }
  }
}

function extractInlinePathReferences(body: string): string[] {
  const references = new Set<string>();

  for (const match of stripFencedBlocks(body).matchAll(/`([^`\n]+)`/g)) {
    const candidate = (match[1] ?? "").trim();
    if (!isCheckablePathReference(candidate)) continue;
    references.add(normalizePathReference(candidate));
  }

  return [...references];
}

function isCheckablePathReference(candidate: string): boolean {
  if (!candidate || /\s/.test(candidate)) return false;
  if (!candidate.includes("/")) return false;
  if (/[*?<>|$(){}[\]\\]/.test(candidate)) return false;
  if (candidate.startsWith("/") || candidate.startsWith("~") || candidate.startsWith("-")) return false;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) return false;
  return true;
}

function normalizePathReference(candidate: string): string {
  return candidate
    .replace(/^\.\//, "")
    .replace(/:\d+(?:[-:]\d+)?$/, "")
    .replace(/\/+$/, "");
}

function stripFencedBlocks(text: string): string {
  const kept: string[] = [];
  let inFence = false;

  for (const line of text.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }

    if (!inFence) kept.push(line);
  }

  return kept.join("\n");
}

function reviewContinuationSignals(body: string, relativePath: string, basename: string, warnings: ReviewIssue[]): void {
  if (basename === "agent-brief.md") {
    const missing = AGENT_BRIEF_CONTINUATION_CHECKS.filter((check) => !hasAgentBriefContinuationSignal(body, check)).map((check) => check.label);
    if (missing.length > 0) {
      warnings.push({
        path: relativePath,
        message: `Agent brief should include continuation proof: read-first docs, current state, commands/checks, risks/hazards, and next actions. Missing: ${missing.join(", ")}.`,
      });
    }
  }

  if (basename === "code-map.md" && !hasPathLikeReference(body)) {
    warnings.push({ path: relativePath, message: "Code map should include concrete file or directory paths." });
  }

  if (basename === "architecture.md" && countMatches(body, ["runtime", "node", "browser", "server", "client", "boundary", "boundaries", "service", "data", "database", "api", "constraint", "metadata"]) < 2) {
    warnings.push({ path: relativePath, message: "Architecture should mention runtime, boundaries, services/data, or constraints." });
  }

  if (basename === "roadmap.md" && countMatches(body, ["now", "next", "later", "deferred", "non-goal", "out of scope", "risk"]) < 2) {
    warnings.push({ path: relativePath, message: "Roadmap should include now/next/later, deferred work, non-goals, or risks." });
  }

  if (isFeatureDoc(relativePath, "plan.md") && !hasAny(body, ["test", "check", "validate", "review", "verify", "manual", "acceptance"])) {
    warnings.push({ path: relativePath, message: "Feature plan should include validation, checks, or acceptance criteria." });
  }

  if (isFeatureDoc(relativePath, "decisions.md") && !hasAny(body, ["decision", "decided", "rejected", "option", "because", "reason"])) {
    warnings.push({ path: relativePath, message: "Feature decisions should include decisions, rejected options, or reasoning." });
  }

  if (isFeatureDoc(relativePath, "handoff.md") && !hasAny(body, ["status", "next", "open question", "risk", "todo", "remaining"])) {
    warnings.push({ path: relativePath, message: "Feature handoff should include status, risks/open questions, or next actions." });
  }
}

function reviewCodebaseDocs(docsRoot: string, manifestDocs: string[], warnings: ReviewIssue[]): void {
  const architecture = `${docsRoot}/engineering/architecture.md`;
  const codeMap = `${docsRoot}/engineering/code-map.md`;
  const humanBrief = `${docsRoot}/handoff/human-brief.md`;
  const agentBrief = `${docsRoot}/handoff/agent-brief.md`;

  for (const doc of [architecture, codeMap, humanBrief, agentBrief]) {
    if (!manifestDocs.includes(doc)) {
      warnings.push({ path: doc, message: "Codebase baseline should include this doc." });
    }
  }
}

function expectedDocs(docsRoot: string, mode: string): string[] {
  const base = [
    `${docsRoot}/project/brief.md`,
    `${docsRoot}/project/roadmap.md`,
    `${docsRoot}/project/open-questions.md`,
    `${docsRoot}/handoff/human-brief.md`,
    `${docsRoot}/handoff/agent-brief.md`,
  ];

  if (mode !== "codebase") return base;

  return [...base, `${docsRoot}/engineering/architecture.md`, `${docsRoot}/engineering/code-map.md`];
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function hasAny(text: string, terms: string[]): boolean {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function hasAgentBriefContinuationSignal(body: string, check: { headings: string[]; terms: string[] }): boolean {
  const sections = markdownSections(body);
  const section = sections.find((candidate) => check.headings.includes(normalizePhrase(candidate.heading)));
  if (section && hasConcreteContinuationContent(section.content)) return true;

  return hasAny(stripAgentBriefTemplateText(body), check.terms);
}

function markdownSections(text: string): Array<{ heading: string; content: string }> {
  const sections: Array<{ heading: string; content: string }> = [];
  let current: { heading: string; lines: string[] } | undefined;

  for (const line of text.split(/\r?\n/)) {
    const heading = line.match(/^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/);
    if (heading) {
      if (current) sections.push({ heading: current.heading, content: current.lines.join("\n") });
      current = { heading: heading[1] ?? "", lines: [] };
      continue;
    }

    current?.lines.push(line);
  }

  if (current) sections.push({ heading: current.heading, content: current.lines.join("\n") });
  return sections;
}

function hasConcreteContinuationContent(content: string): boolean {
  return content
    .split(/\r?\n/)
    .map(cleanContinuationLine)
    .filter(Boolean)
    .filter((line) => !isAgentBriefTemplateLine(line))
    .some((line) => wordCount(line) >= 4 || hasPathLikeReference(line) || /`[^`]+`/.test(line) || /\b(bd|benjamin-docs|pnpm|npm|node|test|validate|ready)\b/i.test(line));
}

function stripAgentBriefTemplateText(text: string): string {
  return text
    .split(/\r?\n/)
    .filter((line) => !/^\s{0,3}#{1,6}\s+/.test(line))
    .map(cleanContinuationLine)
    .filter(Boolean)
    .filter((line) => !isAgentBriefTemplateLine(line))
    .join("\n");
}

function cleanContinuationLine(line: string): string {
  return line.trim().replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "");
}

function isAgentBriefTemplateLine(line: string): boolean {
  return AGENT_BRIEF_TEMPLATE_LINES.includes(normalizePhrase(line));
}

function normalizePhrase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function countMatches(text: string, terms: string[]): number {
  const normalized = text.toLowerCase();
  return terms.filter((term) => normalized.includes(term)).length;
}

function hasPathLikeReference(text: string): boolean {
  return /(^|\s)([\w.-]+\/[\w./-]+|[\w.-]+\.(ts|tsx|js|jsx|json|md|css|html|py|rb|go|rs|java|php|sql|yml|yaml))(\s|$|[,:.)])/m.test(text);
}

function isFeatureDoc(relativePath: string, basename: string): boolean {
  return relativePath.includes("/features/") && relativePath.endsWith(`/${basename}`);
}

function formatReview(result: {
  docsChecked: number;
  errors: ReviewIssue[];
  warnings: ReviewIssue[];
  changedWarnings: ReviewIssue[];
  changedWorkStatus: ReviewResult["changedWorkStatus"];
  changedFilesChecked?: number;
}): ReviewResult {
  const ok = result.errors.length === 0;
  const status = result.errors.length > 0 ? "failed" : result.warnings.length > 0 ? "passed with warnings" : "passed";
  const lines = [
    "benjamin-docs review",
    "",
    `status: ${status}`,
    `docs checked: ${result.docsChecked}`,
    ...(result.changedFilesChecked === undefined ? [] : [`changed files checked: ${result.changedFilesChecked}`]),
    `errors: ${result.errors.length}`,
    `warnings: ${result.warnings.length}`,
  ];

  if (result.errors.length > 0) {
    lines.push("");
    lines.push("Errors");
    for (const issue of result.errors) lines.push(formatIssue(issue));
  }

  if (result.warnings.length > 0) {
    lines.push("");
    lines.push("Warnings");
    for (const issue of result.warnings) lines.push(formatIssue(issue));
  }

  if (result.errors.length === 0 && result.warnings.length === 0) {
    lines.push("");
    lines.push("No obvious structural or starter-template issues found.");
  } else {
    lines.push("");
    lines.push("Next");
    lines.push("  Update weak docs, then run: benjamin-docs validate && benjamin-docs review");
  }

  return {
    ok,
    output: lines.join("\n"),
    docsChecked: result.docsChecked,
    errors: result.errors,
    warnings: result.warnings,
    changedWarnings: result.changedWarnings,
    changedWorkStatus: result.changedWorkStatus,
  };
}

function formatIssue(issue: ReviewIssue): string {
  return issue.path ? `  - ${issue.path}: ${issue.message}` : `  - ${issue.message}`;
}
