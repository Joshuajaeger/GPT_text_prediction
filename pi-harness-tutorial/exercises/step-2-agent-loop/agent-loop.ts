// Step 2 exercise: the agent loop.
//
// Fill in the one TODO. `modelFn` here is a simplified, blocking stand-in
// for Step 1's streaming provider (`collectStream` already gives you this
// shape) — the loop itself doesn't care whether the model call underneath
// was streamed or not.

export type ToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type AgentMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; toolCalls: ToolCall[] }
  | { role: "tool"; toolCallId: string; content: string };

export type ModelResponse = { text: string; toolCalls: ToolCall[] };
export type ModelFn = (context: AgentMessage[]) => Promise<ModelResponse>;

export type ToolDef = {
  name: string;
  execute: (args: Record<string, unknown>) => Promise<string>;
};

/**
 * Runs the agent loop to completion.
 *
 * TODO:
 * 1. Call `modelFn(context)`.
 * 2. Push an `{ role: "assistant", content: response.text, toolCalls: response.toolCalls }`
 *    message onto a COPY of `context` (don't mutate the caller's array).
 * 3. If `response.toolCalls.length === 0`, return the context as-is — done.
 * 4. Otherwise, for each tool call IN ORDER, look it up in `tools` by name,
 *    `await` its `execute(toolCall.arguments)`, and push a
 *    `{ role: "tool", toolCallId: toolCall.id, content: <result> }` message.
 *    If no tool with that name exists, push a tool message whose content
 *    is an error string (e.g. `"error: unknown tool <name>"`) instead of
 *    throwing.
 * 5. Go back to step 1 with the updated context. No iteration limit.
 */
export async function agentLoop(
  context: AgentMessage[],
  tools: ToolDef[],
  modelFn: ModelFn,
): Promise<AgentMessage[]> {
  throw new Error("TODO: implement agentLoop");
}
