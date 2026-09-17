import { test } from "node:test";
import assert from "node:assert/strict";
import { agentLoop, type AgentMessage, type ModelFn, type ToolDef } from "./agent-loop.ts";

test("loop terminates immediately on a no-tool-call turn", async () => {
  const modelFn: ModelFn = async () => ({ text: "Hi there!", toolCalls: [] });
  const context: AgentMessage[] = [{ role: "user", content: "hello" }];

  const result = await agentLoop(context, [], modelFn);

  assert.equal(result.length, 2);
  assert.deepEqual(result[1], {
    role: "assistant",
    content: "Hi there!",
    toolCalls: [],
  });
  // caller's array must not be mutated
  assert.equal(context.length, 1);
});

test("a multi-turn tool-call/result cycle round-trips in order", async () => {
  const callOrder: string[] = [];

  const tools: ToolDef[] = [
    {
      name: "slow",
      execute: async (args) => {
        callOrder.push("slow:start");
        await new Promise((r) => setTimeout(r, 10));
        callOrder.push("slow:end");
        return `slow result for ${args.x}`;
      },
    },
    {
      name: "fast",
      execute: async (args) => {
        callOrder.push("fast:start");
        callOrder.push("fast:end");
        return `fast result for ${args.y}`;
      },
    },
  ];

  let call = 0;
  const modelFn: ModelFn = async () => {
    call++;
    if (call === 1) {
      return {
        text: "",
        toolCalls: [
          { id: "call-1", name: "slow", arguments: { x: 1 } },
          { id: "call-2", name: "fast", arguments: { y: 2 } },
        ],
      };
    }
    return { text: "All done.", toolCalls: [] };
  };

  const context: AgentMessage[] = [{ role: "user", content: "do two things" }];
  const result = await agentLoop(context, tools, modelFn);

  assert.equal(result.length, 5);
  assert.equal(result[0].role, "user");
  assert.deepEqual(result[1], {
    role: "assistant",
    content: "",
    toolCalls: [
      { id: "call-1", name: "slow", arguments: { x: 1 } },
      { id: "call-2", name: "fast", arguments: { y: 2 } },
    ],
  });
  // Results are matched back by toolCallId in the order the model issued
  // them, NOT by completion order, even though "fast" finishes first.
  assert.deepEqual(result[2], {
    role: "tool",
    toolCallId: "call-1",
    content: "slow result for 1",
  });
  assert.deepEqual(result[3], {
    role: "tool",
    toolCallId: "call-2",
    content: "fast result for 2",
  });
  assert.deepEqual(result[4], {
    role: "assistant",
    content: "All done.",
    toolCalls: [],
  });
});

test("an unknown tool name produces an error tool message, not a throw", async () => {
  let call = 0;
  const modelFn: ModelFn = async () => {
    call++;
    if (call === 1) {
      return {
        text: "",
        toolCalls: [{ id: "call-1", name: "does_not_exist", arguments: {} }],
      };
    }
    return { text: "recovered", toolCalls: [] };
  };

  const context: AgentMessage[] = [{ role: "user", content: "go" }];
  const result = await agentLoop(context, [], modelFn);

  const toolMsg = result[2];
  assert.equal(toolMsg.role, "tool");
  assert.match((toolMsg as { content: string }).content, /unknown tool/i);
});
