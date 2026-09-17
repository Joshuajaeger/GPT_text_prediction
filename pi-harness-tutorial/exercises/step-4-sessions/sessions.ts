// Step 4 exercise: tree-structured sessions + compaction.

export type SessionEntry = {
  id: string;
  parentId: string | null;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

/**
 * TODO: a simple token-count heuristic. Character count / 4, rounded up,
 * is sufficient for this exercise (real providers give exact counts; this
 * only needs to be monotonic with text length so the tests' thresholds are
 * meaningful).
 */
export function estimateTokens(text: string): number {
  throw new Error("TODO: implement estimateTokens");
}

/**
 * TODO: given the full tree of entries and a target leaf id, walk the
 * `parentId` chain from `leafId` back to a root (`parentId === null`), and
 * return the path in ROOT-FIRST (chronological) order. Entries that are
 * not on this specific root->leaf path (e.g. sibling branches from a
 * `/fork`) must not appear in the result.
 *
 * Throw if `leafId` isn't found in `entries`.
 */
export function linearize(entries: SessionEntry[], leafId: string): SessionEntry[] {
  throw new Error("TODO: implement linearize");
}

/**
 * TODO:
 * 1. `linearize(entries, leafId)` to get the chronological history.
 * 2. If the first entry has role "system", it's always kept, separately
 *    from the recent/older split below.
 * 3. Walk backward from the end of the (non-system) history. Keep folding
 *    entries into the "recent" window one at a time, from most recent
 *    backward, as long as doing so keeps the running token total STRICTLY
 *    UNDER `keepRecentTokens`. The first entry (walking backward) whose
 *    inclusion would bring the running total to `keepRecentTokens` or
 *    higher is NOT included in "recent" — it, and everything before it,
 *    is "older". (So "recent" is the longest verbatim-kept suffix that
 *    still fits under the budget; the entry that would overflow it gets
 *    summarized instead of truncated.)
 * 4. If "older" is empty (the whole history already fits), return the
 *    linearized history UNCHANGED — nothing to compact.
 * 5. Otherwise, call `summarize(older)` to get a summary string, and
 *    return: [system entry if present, a new entry with
 *    `{ id: "summary", parentId: null, role: "user", content: summaryText }`,
 *    ...recent entries] — in that order.
 *
 * Must not mutate `entries`.
 */
export function compact(
  entries: SessionEntry[],
  leafId: string,
  keepRecentTokens: number,
  summarize: (older: SessionEntry[]) => string,
): SessionEntry[] {
  throw new Error("TODO: implement compact");
}
