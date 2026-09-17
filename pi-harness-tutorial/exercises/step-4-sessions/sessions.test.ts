import { test } from "node:test";
import assert from "node:assert/strict";
import { estimateTokens, linearize, compact, type SessionEntry } from "./sessions.ts";

test("estimateTokens is positive and monotonic with length", () => {
  assert.ok(estimateTokens("hi") > 0);
  assert.ok(estimateTokens("a much longer piece of text here") > estimateTokens("hi"));
});

test("linearize walks parentId back to root, root-first, excluding sibling branches", () => {
  const entries: SessionEntry[] = [
    { id: "root", parentId: null, role: "system", content: "system prompt" },
    { id: "u1", parentId: "root", role: "user", content: "first question" },
    { id: "a1", parentId: "u1", role: "assistant", content: "first answer" },
    // a fork: two children of a1
    { id: "u2a", parentId: "a1", role: "user", content: "branch A follow-up" },
    { id: "u2b", parentId: "a1", role: "user", content: "branch B follow-up" },
    { id: "a2a", parentId: "u2a", role: "assistant", content: "branch A answer" },
  ];

  const path = linearize(entries, "a2a");
  assert.deepEqual(
    path.map((e) => e.id),
    ["root", "u1", "a1", "u2a", "a2a"],
  );
  // branch B must not appear
  assert.ok(!path.some((e) => e.id === "u2b"));
});

test("linearize throws for an unknown leaf id", () => {
  const entries: SessionEntry[] = [{ id: "root", parentId: null, role: "system", content: "x" }];
  assert.throws(() => linearize(entries, "does-not-exist"));
});

test("compact returns history unchanged when it already fits the budget", () => {
  const entries: SessionEntry[] = [
    { id: "root", parentId: null, role: "system", content: "sys" },
    { id: "u1", parentId: "root", role: "user", content: "short question" },
    { id: "a1", parentId: "u1", role: "assistant", content: "short answer" },
  ];

  let summarizeCalls = 0;
  const result = compact(entries, "a1", /* keepRecentTokens */ 100_000, () => {
    summarizeCalls++;
    return "should not be called";
  });

  assert.deepEqual(result.map((e) => e.id), ["root", "u1", "a1"]);
  assert.equal(summarizeCalls, 0);
});

test("compact summarizes older history and preserves recent entries verbatim", () => {
  const bigText = "x".repeat(400); // ~100 estimated tokens each, well over budget individually
  const entries: SessionEntry[] = [
    { id: "root", parentId: null, role: "system", content: "sys" },
    { id: "u1", parentId: "root", role: "user", content: bigText },
    { id: "a1", parentId: "u1", role: "assistant", content: bigText },
    { id: "u2", parentId: "a1", role: "user", content: bigText },
    { id: "a2", parentId: "u2", role: "assistant", content: bigText },
    { id: "u3", parentId: "a2", role: "user", content: "recent question" },
    { id: "a3", parentId: "u3", role: "assistant", content: "recent answer" },
  ];

  const originalTotal = entries.reduce((sum, e) => sum + estimateTokens(e.content), 0);

  const summarizedIds: string[] = [];
  const result = compact(entries, "a3", /* keepRecentTokens */ 20, (older) => {
    for (const e of older) summarizedIds.push(e.id);
    return `summary of ${older.length} entries`;
  });

  // system entry always kept
  assert.equal(result[0].id, "root");
  // a summary entry appears
  const summaryEntry = result.find((e) => e.id === "summary");
  assert.ok(summaryEntry, "expected a summary entry in the compacted result");
  assert.equal(summaryEntry!.content, `summary of ${summarizedIds.length} entries`);
  // the two most recent turns are preserved verbatim, in order, after the summary
  const tailIds = result.slice(result.indexOf(summaryEntry!) + 1).map((e) => e.id);
  assert.deepEqual(tailIds, ["u3", "a3"]);
  // older, large entries were summarized away, not carried verbatim
  assert.ok(!result.some((e) => e.id === "u1" || e.id === "a1"));

  const newTotal = result.reduce((sum, e) => sum + estimateTokens(e.content), 0);
  assert.ok(newTotal < originalTotal, `expected compacted total (${newTotal}) < original (${originalTotal})`);
});

test("compact does not mutate the original entries array", () => {
  const entries: SessionEntry[] = [
    { id: "root", parentId: null, role: "system", content: "sys" },
    { id: "u1", parentId: "root", role: "user", content: "x".repeat(400) },
    { id: "a1", parentId: "u1", role: "assistant", content: "x".repeat(400) },
    { id: "u2", parentId: "a1", role: "user", content: "recent" },
  ];
  const snapshot = JSON.stringify(entries);

  compact(entries, "u2", 5, () => "summary");

  assert.equal(JSON.stringify(entries), snapshot);
});
