import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseMarkdown, serializeMarkdown } from "../src/frontmatter.js";

describe("frontmatter", () => {
  it("parses markdown with yaml-like frontmatter", () => {
    const parsed = parseMarkdown(`---\ntitle: Test Doc\nscope: feature\nscope_id: booking-capacity\naudience: [developer, agent]\nstatus: draft\nvisibility: private\nupdated: 2026-06-03\nsource: session-capture\n---\n\n# Test Doc\n`);

    assert.equal(parsed.frontmatter.title, "Test Doc");
    assert.equal(parsed.frontmatter.scope, "feature");
    assert.deepEqual(parsed.frontmatter.audience, ["developer", "agent"]);
    assert.equal(parsed.body.trim(), "# Test Doc");
  });

  it("serializes markdown frontmatter deterministically", () => {
    const output = serializeMarkdown(
      {
        title: "Agent Brief",
        scope: "handoff",
        scope_id: "agent-brief",
        audience: ["agent"],
        status: "draft",
        visibility: "private",
        updated: "2026-06-03",
        source: "session-capture",
      },
      "# Agent Brief\n\nCurrent state.\n",
    );

    assert.match(output, /^---\ntitle: Agent Brief\nscope: handoff\n/);
    assert.match(output, /audience: \[agent\]/);
    assert.match(output, /\n---\n\n# Agent Brief/);
  });
});
