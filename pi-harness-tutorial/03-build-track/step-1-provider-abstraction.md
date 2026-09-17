# Step 1 — Streaming LLM Call Behind a Provider Abstraction

## Concept card

pi-ai normalizes four different wire protocols (OpenAI Completions, OpenAI
Responses, Anthropic Messages, Google Generative AI) into one streaming
interface, because the agent loop (Step 2) should never know or care which
provider it's talking to. Two properties matter more than raw feature
coverage:

- **Abort must yield a usable partial result**, not nothing. A user
  interrupting a long tool call or response is a first-class operation
  (this is what makes pi's steering — pressing Enter mid-turn — possible),
  not an edge case bolted on later.
- **The event stream is the contract.** Everything downstream (the TUI, the
  session logger, the agent loop) consumes the same typed event stream
  regardless of provider, so provider-specific quirks get normalized here
  and nowhere else.

## Reading

Before writing code, read:
- ReAct (arXiv:2210.03629) — §2, for the reasoning/acting loop this
  provider layer ultimately serves.
- Anthropic, "Building Effective AI Agents" — the "workflows vs. agents"
  framing; a provider abstraction is infrastructure for the "agent" case.

Real source to compare against afterward: `packages/ai/src/openai-completions.ts`,
`stream-fn.ts`, `models.generated.ts` in `earendil-works/pi`.

## Exercise

Open [`../exercises/step-1-provider/provider.ts`](../exercises/step-1-provider/provider.ts).
Implement `mockStream()`: given a canned list of chunks and an
`AbortSignal`, yield `StreamEvent`s (`text_delta`, `tool_call`, `done`,
`error`) one at a time, respecting cooperative cancellation — if the signal
aborts partway through, stop yielding further chunks but do **not** discard
what was already yielded (the caller has already seen it; that's the
"usable partial result").

Then implement `collectStream()`, which drains an async generator of
`StreamEvent`s into a single `{ text, toolCalls, aborted }` result — this
is the shape the agent loop in Step 2 will consume.

Make [`provider.test.ts`](../exercises/step-1-provider/provider.test.ts) pass:

```sh
cd pi-harness-tutorial/exercises/step-1-provider
node --experimental-strip-types provider.test.ts
```

## Pitfalls

- **Providers report token/cache usage at different points in the SSE
  stream** — some send it as a final event, some interleave it. Design
  your `StreamEvent` union so a `usage` event can arrive at any point, not
  just at the end (the skeleton's union already reflects this — notice
  where `usage` sits).
- **Tool-call arguments arrive as fragments** in real streaming APIs
  (partial JSON deltas that only parse once complete). The mock provider
  in this exercise simplifies by emitting whole tool calls atomically —
  note this simplification explicitly if you extend the exercise to a real
  provider; don't assume `JSON.parse` on a partial buffer will succeed.
- **`AbortSignal` propagation is not automatic** — if you fetch a real
  provider's SSE endpoint later, you must pass the signal to `fetch()`
  yourself and also stop your own generator loop on `signal.aborted`;
  aborting the network request alone can leave your generator hung.

## Python parity note

mini-SWE-agent's model layer is deliberately not streaming — it makes one
blocking call per turn. If you're in the Python track, implement the
blocking version first (a single `complete(context) -> Response`) and treat
streaming as an optional extension once the loop in Step 2 works.
