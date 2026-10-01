import { test } from "node:test";
import assert from "node:assert/strict";
import { mockStream, collectStream, type MockChunk } from "./provider.ts";

test("mockStream yields events in order and terminates with done", async () => {
  const chunks: MockChunk[] = [
    { kind: "text", text: "Hello, " },
    { kind: "text", text: "world" },
    { kind: "usage", inputTokens: 10, outputTokens: 5 },
  ];
  const controller = new AbortController();
  const events = [];
  for await (const event of mockStream(chunks, controller.signal)) {
    events.push(event);
  }
  assert.deepEqual(events, [
    { type: "text_delta", text: "Hello, " },
    { type: "text_delta", text: "world" },
    { type: "usage", inputTokens: 10, outputTokens: 5 },
    { type: "done" },
  ]);
});

test("mockStream carries a tool_call chunk through as a tool_call event", async () => {
  const toolCall = { id: "1", name: "read", arguments: { path: "a.txt" } };
  const chunks: MockChunk[] = [{ kind: "tool_call", toolCall }];
  const controller = new AbortController();
  const events = [];
  for await (const event of mockStream(chunks, controller.signal)) {
    events.push(event);
  }
  assert.deepEqual(events, [{ type: "tool_call", toolCall }, { type: "done" }]);
});

test("aborting mid-stream stops further events without a done event", async () => {
  const chunks: MockChunk[] = [
    { kind: "text", text: "part 1 " },
    { kind: "text", text: "part 2 " },
    { kind: "text", text: "part 3" },
  ];
  const controller = new AbortController();
  const events = [];
  let i = 0;
  for await (const event of mockStream(chunks, controller.signal)) {
    events.push(event);
    i++;
    if (i === 1) controller.abort();
  }
  assert.equal(events.length, 1);
  assert.deepEqual(events[0], { type: "text_delta", text: "part 1 " });
});

test("collectStream concatenates text and collects tool calls", async () => {
  const toolCall = { id: "1", name: "bash", arguments: { command: "ls" } };
  const chunks: MockChunk[] = [
    { kind: "text", text: "Running " },
    { kind: "text", text: "ls..." },
    { kind: "tool_call", toolCall },
  ];
  const controller = new AbortController();
  const result = await collectStream(mockStream(chunks, controller.signal));
  assert.deepEqual(result, {
    text: "Running ls...",
    toolCalls: [toolCall],
    aborted: false,
  });
});

test("collectStream marks aborted:true when the stream was cut short", async () => {
  const chunks: MockChunk[] = [
    { kind: "text", text: "will be cut " },
    { kind: "text", text: "off" },
  ];
  const controller = new AbortController();

  async function* abortAfterFirst() {
    let n = 0;
    for await (const event of mockStream(chunks, controller.signal)) {
      yield event;
      n++;
      if (n === 1) controller.abort();
    }
  }

  const result = await collectStream(abortAfterFirst());
  assert.equal(result.aborted, true);
  assert.equal(result.text, "will be cut ");
});
