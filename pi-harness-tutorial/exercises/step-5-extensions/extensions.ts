// Step 5 exercise: a minimal extension registry, plus tools for measuring
// (and paying) the context cost of an MCP-style tool integration.

export type ToolDef = {
  name: string;
  execute: (args: Record<string, unknown>) => Promise<string>;
};

export type ContextMessage = { role: string; content: string };

export type ToolCallEvent = { name: string; arguments: Record<string, unknown> };
export type ToolCallDecision = { block: true; reason: string } | { block: false };

export type ContextHandler = (messages: ContextMessage[]) => ContextMessage[];
export type ToolCallHandler = (call: ToolCallEvent) => ToolCallDecision | undefined;

/**
 * TODO: implement a minimal pub-sub + tool registry.
 *
 * - registerTool/getTools: tools come back in registration order.
 * - on("context", handler) / on("tool_call", handler): store handlers per
 *   event name, in registration order.
 * - emitContext(messages): run every registered "context" handler in
 *   registration order, PIPELINE style — each handler receives the
 *   PREVIOUS handler's return value (not always the original `messages`).
 *   Start the pipeline with `messages` itself. Return the final result.
 * - emitToolCall(call): run every registered "tool_call" handler in
 *   registration order. The first one that returns `{ block: true, ... }`
 *   wins immediately — do not run any handlers after it. If a handler
 *   returns undefined, treat it as "no opinion" and continue to the next
 *   handler. If no handler blocks, return `{ block: false }`.
 */
export class ExtensionRegistry {
  registerTool(tool: ToolDef): void {
    throw new Error("TODO: implement registerTool");
  }

  getTools(): ToolDef[] {
    throw new Error("TODO: implement getTools");
  }

  on(event: "context", handler: ContextHandler): void;
  on(event: "tool_call", handler: ToolCallHandler): void;
  on(event: "context" | "tool_call", handler: ContextHandler | ToolCallHandler): void {
    throw new Error("TODO: implement on");
  }

  emitContext(messages: ContextMessage[]): ContextMessage[] {
    throw new Error("TODO: implement emitContext");
  }

  emitToolCall(call: ToolCallEvent): ToolCallDecision {
    throw new Error("TODO: implement emitToolCall");
  }
}

export type McpToolDescriptor = {
  name: string;
  description: string;
  inputSchema: unknown;
};

/**
 * TODO: estimate the context-token cost of dumping `tools`' full schemas
 * into a session, using the same heuristic as Step 4's estimateTokens
 * (serialized character length / 4, rounded up) applied to
 * JSON.stringify(tools).
 */
export function estimateMcpContextTokens(tools: McpToolDescriptor[]): number {
  throw new Error("TODO: implement estimateMcpContextTokens");
}

/**
 * TODO: adapt each MCP tool descriptor into a ToolDef whose `name` is
 * `${namespace}__${descriptor.name}` (e.g. "exa__web_search_exa") and
 * whose `execute(args)` calls `callTool(descriptor.name, args)` — note:
 * callTool takes the ORIGINAL (non-namespaced) tool name.
 */
export function mcpToolsToRegistrations(
  tools: McpToolDescriptor[],
  namespace: string,
  callTool: (name: string, args: Record<string, unknown>) => Promise<string>,
): ToolDef[] {
  throw new Error("TODO: implement mcpToolsToRegistrations");
}
