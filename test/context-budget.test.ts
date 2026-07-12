import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CONTEXT_BUDGETS, estimatedTokens, truncateAtBoundary } from "../src/context-budget.js";
import { SESSION_START_READ_FIRST_DOCS } from "../src/session-context.js";

describe("context budgets", () => {
  it("keeps the public budgets explicit", () => {
    assert.deepEqual(CONTEXT_BUDGETS, {
      sessionStartCharacters: 400,
      sessionStartEstimatedTokens: 100,
      memoryContextCharacters: 2400,
      memoryContextEstimatedTokens: 600,
      memorySearchSnippetCharacters: 300,
      memorySearchDefaultResults: 5,
      memorySearchMaxResults: 8,
      agentCompletionNoteCharacters: 120,
    });
  });

  it("uses a deterministic conservative token estimate", () => {
    assert.equal(estimatedTokens("a".repeat(401)), 101);
  });

  it("has exactly one compact routing document at session start", () => {
    assert.deepEqual(SESSION_START_READ_FIRST_DOCS, ["project/agent-context.md"]);
  });

  it("truncates at a word boundary and includes a retrieval hint", () => {
    const result = truncateAtBoundary("alpha beta gamma delta", 20, " Use search.");
    assert.equal(result, "alpha Use search.");
    assert.ok(result.length <= 20);
  });
});
