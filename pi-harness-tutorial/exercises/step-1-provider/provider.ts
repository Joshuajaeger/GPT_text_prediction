// Step 1 exercise: a provider-agnostic streaming interface.
//
// Fill in the two TODOs. Nothing here talks to a real network — `mockStream`
// simulates a provider's SSE stream from a canned list of chunks so you can
// focus on the interface contract (abort semantics, event shape) rather
// than HTTP plumbing.

export type ToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type StreamEvent =
  | { type: "text_delta"; text: string }
  | { type: "tool_call"; toolCall: ToolCall }
  | { type: "usage"; inputTokens: number; outputTokens: number }
  | { type: "done" }
  | { type: "error"; message: string };

// A canned "chunk" the mock provider will turn into one or more StreamEvents.
export type MockChunk =
  | { kind: "text"; text: string }
  | { kind: "tool_call"; toolCall: ToolCall }
  | { kind: "usage"; inputTokens: number; outputTokens: number };

/**
 * Simulates a provider's streaming response.
 *
 * TODO: yield one StreamEvent per chunk in `chunks`, in order, translating
 * each MockChunk to the matching StreamEvent variant. After the last chunk,
 * yield a final `{ type: "done" }` event.
 *
 * Respect `signal`: before yielding each chunk, check `signal.aborted`. If
 * it's true, stop the generator WITHOUT yielding a `done` event and without
 * yielding the remaining chunks — but do not throw, and do not retract
 * anything already yielded. (Cooperative cancellation: the caller keeps
 * whatever partial output it already received.)
 */
export async function* mockStream(
  chunks: MockChunk[],
  signal: AbortSignal,
): AsyncGenerator<StreamEvent> {
  throw new Error("TODO: implement mockStream");
}

export type CollectedResult = {
  text: string;
  toolCalls: ToolCall[];
  aborted: boolean;
};

/**
 * Drains a StreamEvent generator into a single result.
 *
 * TODO: concatenate all `text_delta` events' text (in order) into `text`,
 * collect all `tool_call` events' toolCall into `toolCalls` (in order), and
 * set `aborted: true` if the generator ended WITHOUT ever producing a
 * `done` event (i.e. it was cut short by an abort per mockStream's
 * contract above). Ignore `usage` and `error` events for this exercise.
 */
export async function collectStream(
  events: AsyncGenerator<StreamEvent>,
): Promise<CollectedResult> {
  throw new Error("TODO: implement collectStream");
}
