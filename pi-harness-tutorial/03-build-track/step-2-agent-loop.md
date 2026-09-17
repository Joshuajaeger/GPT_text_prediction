# Step 2 — The Agent Loop With Tool-Call Parsing

## Concept card

The loop is the smallest possible thing: call the model, and if it asked
for tools, run them and call the model again — until it stops asking. No
max-steps knob. Two structural decisions matter more than the happy path:

- **Keep an internal message representation** (`AgentMessage`) distinct
  from whatever a specific provider's wire format wants, and convert only
  at the boundary. This is what let Step 1's provider swap happen without
  touching the loop, and it's what lets pi switch providers mid-session.
- **Preserve assistant-source order for tool results** even if you later
  parallelize tool *execution*. The model issued its tool calls in a
  specific order and expects results back matched to `toolCallId` — a
  faster-finishing tool call must not jump the queue in the context you
  send back.

## Reading

- ReAct (arXiv:2210.03629) — the loop this is a lineage descendant of.
- Anthropic, "Building Effective AI Agents" — "an agent is an LLM using
  tools based on environmental feedback, in a loop."
- Toolformer (arXiv:2302.04761) for the tool-call/tool-result framing.

Real source: `packages/agent/src/agent-loop.ts`, `agent.ts` in
`earendil-works/pi`. Note in particular the `beforeToolCall`/`afterToolCall`
hook points — you'll reuse this exact seam in Step 5 for extensions.

## Exercise

Open [`../exercises/step-2-agent-loop/agent-loop.ts`](../exercises/step-2-agent-loop/agent-loop.ts).

Implement `agentLoop(context, tools, modelFn)`:
1. Call `modelFn(context)` to get the model's response for this turn.
2. Append an assistant `AgentMessage` (with `text` and `toolCalls`) to the
   context.
3. If the response has no tool calls, return the final context — the turn
   is over.
4. Otherwise, execute each tool call **in the order the model issued
   them**, appending one `tool` message per result (matched by
   `toolCallId`) to the context.
5. Go back to step 1.

There's no step limit — the loop trusts the model (and the tools) to
terminate. The exercise's tests use a canned `modelFn` sequence that does
terminate; don't add an artificial cap.

Make [`agent-loop.test.ts`](../exercises/step-2-agent-loop/agent-loop.test.ts)
pass:

```sh
cd pi-harness-tutorial/exercises/step-2-agent-loop
node --experimental-strip-types agent-loop.test.ts
```

## Pitfalls

- **Don't reorder tool results by completion time.** If you parallelize
  execution later (a real optimization pi does support), you still send
  results back to the model matched by `toolCallId`, in an order the model
  can make sense of — not "whichever finished first." The tests check this
  directly by giving two tool calls where the second-issued tool resolves
  first.
- **A "no tool calls" response is not necessarily a short response.** Don't
  conflate "the model produced tool calls" detection with checking
  `text.length > 0` — a model can legitimately return empty text alongside
  tool calls, or a long text response with none. Key off `toolCalls`,
  never `text`.
- **Unknown tool name should fail loudly**, not silently no-op — a tool
  result message with an error string is correct; swallowing the call
  entirely desyncs the model's mental model of what happened. (Not covered
  by the shipped tests — add your own case if you want to harden this.)

## Python parity note

mini-SWE-agent's loop is a `while True` with a single `try/except` around
tool execution that turns exceptions into an observation the model sees
next turn, rather than a crash. That's the same "fail loudly, but *to the
model*" principle as the pitfall above — worth reading their `agent.py` for
how little code this actually takes.
