import { test } from "node:test";
import assert from "node:assert/strict";
import { passAtK, runTaskSuite, EventLog, type Task } from "./evaluation.ts";

function approxEqual(actual: number, expected: number, tol = 1e-9) {
  assert.ok(
    Math.abs(actual - expected) < tol,
    `expected ${actual} to be within ${tol} of ${expected}`,
  );
}

test("passAtK: all trials passed -> probability 1", () => {
  approxEqual(passAtK(5, 5, 1), 1.0);
});

test("passAtK: no trials passed -> probability 0", () => {
  approxEqual(passAtK(5, 0, 1), 0.0);
});

test("passAtK: not enough failures to fill a k-subset -> guaranteed pass", () => {
  // n=5, c=4 means only 1 failing trial exists; any 2-subset must include a pass.
  approxEqual(passAtK(5, 4, 2), 1.0);
});

test("passAtK: matches the closed-form combinatorial ratio", () => {
  // n=5, c=1, k=1: 1 - C(4,1)/C(5,1) = 1 - 4/5 = 0.2
  approxEqual(passAtK(5, 1, 1), 0.2);
  // n=10, c=3, k=5: 1 - C(7,5)/C(10,5) = 1 - 21/252
  approxEqual(passAtK(10, 3, 5), 1 - 21 / 252);
});

test("runTaskSuite counts passes per task and computes passAt1 = passes/trials", async () => {
  const tasks: Task[] = [{ id: "t1" }, { id: "t2" }];
  // t1 passes on trials 1 and 3 (of 4); t2 always passes.
  const counters = new Map<string, number>();
  const runTrial = async (task: Task) => {
    const n = (counters.get(task.id) ?? 0) + 1;
    counters.set(task.id, n);
    if (task.id === "t1") return n === 1 || n === 3;
    return true;
  };

  const suite = await runTaskSuite(tasks, 4, runTrial);

  const t1 = suite.tasks.find((t) => t.taskId === "t1")!;
  const t2 = suite.tasks.find((t) => t.taskId === "t2")!;

  assert.equal(t1.trials, 4);
  assert.equal(t1.passes, 2);
  approxEqual(t1.passAt1, 0.5);

  assert.equal(t2.trials, 4);
  assert.equal(t2.passes, 4);
  approxEqual(t2.passAt1, 1.0);

  approxEqual(suite.meanPassAt1, (0.5 + 1.0) / 2);
});

test("EventLog appends timestamped entries, in order, via an injected clock", () => {
  let t = 1000;
  const clock = () => t++;
  const log = new EventLog(clock);

  log.log({ type: "tool_execution_start", tool: "read" });
  log.log({ type: "tool_execution_end", tool: "read", ok: true });

  const parsed = JSON.parse(log.toJson());
  assert.deepEqual(parsed, [
    { type: "tool_execution_start", tool: "read", timestamp: 1000 },
    { type: "tool_execution_end", tool: "read", ok: true, timestamp: 1001 },
  ]);
});

test("EventLog.filter returns matching entries in original order", () => {
  let t = 0;
  const log = new EventLog(() => t++);

  log.log({ type: "turn_start" });
  log.log({ type: "tool_execution_start", tool: "bash" });
  log.log({ type: "tool_execution_end", tool: "bash", ok: true });
  log.log({ type: "tool_execution_start", tool: "read" });
  log.log({ type: "turn_end" });

  const toolStarts = log.filter((e) => e.type === "tool_execution_start");
  assert.deepEqual(
    toolStarts.map((e) => e.tool),
    ["bash", "read"],
  );
});
