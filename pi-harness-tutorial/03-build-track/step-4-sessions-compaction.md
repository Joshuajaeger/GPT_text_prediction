# Step 4 — Context & Session Management: JSONL Trees + Compaction

## Concept card

Two ideas, both direct responses to Act 1's "context managed behind your
back" complaint:

- **Sessions are trees, not a single linear transcript.** Every entry
  records its `parentId`; "the current conversation" is just one path
  through that tree, selected by which leaf you're resumed on. This is
  what makes `/tree` (rewind to any point) and `/fork` (branch into a new
  file) possible without any special-casing — they're just "pick a
  different leaf" and "pick a different leaf, in a new file."
- **Compaction is a visible, overridable transformation, not a memory
  leak you can't inspect.** It summarizes older history to stay under a
  token budget while keeping the most recent turns verbatim, but it never
  deletes the underlying JSONL — you can always walk back past a
  compaction boundary via `/tree`. The transformation itself
  (`session_before_compact`) is a hook an extension can fully replace.

## Reading

- Anthropic, "Effective context engineering for AI agents" (2025-09-29) —
  context as a finite, degrading resource; read this before deciding *what*
  to keep verbatim vs. summarize.
- Anthropic, "Effective harnesses for long-running agents" (2025-11-26) —
  a different mechanism (progress files) for the same underlying problem;
  useful contrast once you've built compaction.

Real source: `packages/coding-agent/src/core/compaction/{compaction,utils,
branch-summarization}.ts`, `session-manager.ts` in `earendil-works/pi`; docs
at `pi.dev/docs/latest/{sessions,compaction}`.

## Exercise

Open [`../exercises/step-4-sessions/sessions.ts`](../exercises/step-4-sessions/sessions.ts).

Implement:

- `linearize(entries, leafId)` — given the full tree of `SessionEntry`
  (each with `id`/`parentId`) and a target leaf, walk the `parentId` chain
  back to the root and return the path **root-first** (chronological
  order). Entries on sibling branches must not appear.
- `estimateTokens(text)` — a token-count heuristic (character count / 4 is
  fine; real providers give you exact counts, this exercise doesn't need
  precision, just monotonicity).
- `compact(entries, leafId, keepRecentTokens, summarize)` — walking
  backward from the leaf, accumulate `estimateTokens` until you've set
  aside at least `keepRecentTokens` worth of the most recent history
  untouched. Everything older than that cut point gets passed to
  `summarize()` (a caller-supplied function — in production this calls an
  LLM; in the exercise it's a plain string function) and replaced by a
  single summary entry. If the whole linearized history already fits
  under `keepRecentTokens`, return it unchanged — there's nothing to
  compact.

Make [`sessions.test.ts`](../exercises/step-4-sessions/sessions.test.ts)
pass:

```sh
cd pi-harness-tutorial/exercises/step-4-sessions
node --experimental-strip-types sessions.test.ts
```

**"Done" bar for this step** (per the tutorial's overall thresholds): a
session whose full history overflows your token budget should, after
`compact()`, have every recent turn preserved byte-for-byte and a total
estimated token count strictly less than the un-compacted history — while
the original `entries` array remains untouched (compaction produces a new
view, it doesn't destroy history).

## Pitfalls

- **Compacting away a file the agent still needs to remember it touched.**
  pi's real compaction tracks `<read-files>`/`<modified-files>`
  cumulatively across compactions specifically so this doesn't happen —
  this exercise doesn't require you to implement that tracking, but note
  it as the production-grade fix if you extend the exercise.
- **Compacting mid-turn busts the provider's prompt cache.** pi checks for
  compaction *after* a turn ends, not mid-stream, for exactly this reason.
  If you wire `compact()` into Step 2's loop, only call it between calls to
  `modelFn`, never inside one.
- **An off-by-one in the backward walk** is the easiest way to either (a)
  drop the boundary turn entirely or (b) double-count it in both the
  summary and the recent window. Write the boundary case as its own test
  before trusting the general case.

## Python parity note

mini-SWE-agent doesn't implement compaction at all — its whole design bet
is that with `bash`-only tool use and short, focused tasks, you mostly
don't need it. That's a legitimate alternative point in the design space;
if you're in the Python track, treat this step as optional and instead
write a note on when a linear-history-only agent would start failing.
