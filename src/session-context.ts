import { CONTEXT_BUDGETS } from "./context-budget.js";

export const SESSION_START_HEADER = "Benjamin Docs memory is active.";
export const SESSION_START_DOCS_ROOT_PREFIX = "Docs root: ";
export const SESSION_START_READ_FIRST_PREFIX = "Read first: ";
export const SESSION_START_READ_FIRST_DOCS = ["project/agent-context.md"] as const;
export const SESSION_START_CLOSEOUT = "Use task-scoped retrieval; update memory only for durable facts.";
export const SESSION_START_OVERFLOW_SUFFIX = " Run bd status for details.";

const REQUIRED_SESSION_CONTEXT_WITHOUT_DOCS_ROOT = [
  SESSION_START_HEADER,
  `${SESSION_START_DOCS_ROOT_PREFIX}/`,
  `${SESSION_START_READ_FIRST_PREFIX}${SESSION_START_READ_FIRST_DOCS.join(", ")}`,
  SESSION_START_CLOSEOUT,
  SESSION_START_OVERFLOW_SUFFIX,
].join("\n").length;

export const MAX_DOCS_ROOT_CHARACTERS =
  CONTEXT_BUDGETS.sessionStartCharacters - REQUIRED_SESSION_CONTEXT_WITHOUT_DOCS_ROOT;
