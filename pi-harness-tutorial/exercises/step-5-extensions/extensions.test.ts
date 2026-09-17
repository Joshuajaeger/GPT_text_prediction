import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ExtensionRegistry,
  estimateMcpContextTokens,
  mcpToolsToRegistrations,
  type McpToolDescriptor,
} from "./extensions.ts";

test("registerTool/getTools preserve registration order", () => {
  const registry = new ExtensionRegistry();
  registry.registerTool({ name: "read", execute: async () => "" });
  registry.registerTool({ name: "write", execute: async () => "" });
  registry.registerTool({ name: "bash", execute: async () => "" });

  assert.deepEqual(
    registry.getTools().map((t) => t.name),
    ["read", "write", "bash"],
  );
});

test("emitContext runs context handlers as a pipeline, in order", () => {
  const registry = new ExtensionRegistry();
  registry.on("context", (messages) => [...messages, { role: "system", content: "first" }]);
  registry.on("context", (messages) => [...messages, { role: "system", content: "second" }]);

  const result = registry.emitContext([{ role: "user", content: "hi" }]);

  assert.deepEqual(
    result.map((m) => m.content),
    ["hi", "first", "second"],
  );
});

test("emitToolCall lets an early handler block and stops later handlers from running", () => {
  const registry = new ExtensionRegistry();
  let secondHandlerCalled = false;

  registry.on("tool_call", (call) => {
    if (call.name === "bash" && String(call.arguments.command).includes("rm -rf")) {
      return { block: true, reason: "destructive command" };
    }
    return undefined;
  });
  registry.on("tool_call", () => {
    secondHandlerCalled = true;
    return undefined;
  });

  const decision = registry.emitToolCall({ name: "bash", arguments: { command: "rm -rf /" } });

  assert.deepEqual(decision, { block: true, reason: "destructive command" });
  assert.equal(secondHandlerCalled, false);
});

test("emitToolCall returns block:false when no handler objects", () => {
  const registry = new ExtensionRegistry();
  registry.on("tool_call", () => undefined);

  const decision = registry.emitToolCall({ name: "read", arguments: { path: "a.txt" } });

  assert.deepEqual(decision, { block: false });
});

test("estimateMcpContextTokens scales with the size of the tool descriptors", () => {
  const small: McpToolDescriptor[] = [
    { name: "ping", description: "ping", inputSchema: { type: "object", properties: {} } },
  ];
  const large: McpToolDescriptor[] = Array.from({ length: 20 }, (_, i) => ({
    name: `tool_${i}`,
    description: "A moderately detailed description of what this tool does and when to use it.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "the search query" },
        limit: { type: "number", description: "max results to return" },
      },
      required: ["query"],
    },
  }));

  const smallCost = estimateMcpContextTokens(small);
  const largeCost = estimateMcpContextTokens(large);

  assert.ok(smallCost > 0);
  assert.ok(largeCost > smallCost * 10, `expected large (${largeCost}) >> small (${smallCost})`);
});

test("mcpToolsToRegistrations namespaces tool names and delegates execution", async () => {
  const tools: McpToolDescriptor[] = [
    { name: "web_search_exa", description: "search the web", inputSchema: {} },
    { name: "web_fetch_exa", description: "fetch a url", inputSchema: {} },
  ];

  const calls: Array<{ name: string; args: Record<string, unknown> }> = [];
  const callTool = async (name: string, args: Record<string, unknown>) => {
    calls.push({ name, args });
    return `result for ${name}`;
  };

  const registrations = mcpToolsToRegistrations(tools, "exa", callTool);

  assert.deepEqual(
    registrations.map((t) => t.name),
    ["exa__web_search_exa", "exa__web_fetch_exa"],
  );

  const result = await registrations[0].execute({ query: "pi harness" });
  assert.equal(result, "result for web_search_exa");
  assert.deepEqual(calls, [{ name: "web_search_exa", args: { query: "pi harness" } }]);
});
