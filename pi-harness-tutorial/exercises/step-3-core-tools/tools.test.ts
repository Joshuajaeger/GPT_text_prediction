import { test } from "node:test";
import assert from "node:assert/strict";
import {
  makeReadTool,
  makeWriteTool,
  makeEditTool,
  makeBashTool,
  type VirtualFs,
} from "./tools.ts";

test("read returns file content, respecting offset and limit", async () => {
  const fs: VirtualFs = new Map([["a.txt", "line0\nline1\nline2\nline3"]]);
  const read = makeReadTool(fs);

  const full = await read.execute({ path: "a.txt" });
  assert.equal(full.ok, true);
  assert.equal(full.content, "line0\nline1\nline2\nline3");

  const windowed = await read.execute({ path: "a.txt", offset: 1, limit: 2 });
  assert.equal(windowed.ok, true);
  assert.equal(windowed.content, "line1\nline2");
});

test("read on a missing path returns an error result, not a throw", async () => {
  const fs: VirtualFs = new Map();
  const read = makeReadTool(fs);
  const result = await read.execute({ path: "missing.txt" });
  assert.equal(result.ok, false);
});

test("write creates and overwrites files in the virtual fs", async () => {
  const fs: VirtualFs = new Map();
  const write = makeWriteTool(fs);

  await write.execute({ path: "b.txt", content: "hello" });
  assert.equal(fs.get("b.txt"), "hello");

  await write.execute({ path: "b.txt", content: "overwritten" });
  assert.equal(fs.get("b.txt"), "overwritten");
});

test("edit replaces a unique exact match", async () => {
  const fs: VirtualFs = new Map([["c.txt", "const x = 1;\nconst y = 2;"]]);
  const edit = makeEditTool(fs);

  const result = await edit.execute({
    path: "c.txt",
    oldText: "const x = 1;",
    newText: "const x = 100;",
  });

  assert.equal(result.ok, true);
  assert.equal(fs.get("c.txt"), "const x = 100;\nconst y = 2;");
});

test("edit fails when oldText is not found (no silent no-op)", async () => {
  const fs: VirtualFs = new Map([["c.txt", "const x = 1;"]]);
  const edit = makeEditTool(fs);

  const result = await edit.execute({
    path: "c.txt",
    oldText: "const z = 999;",
    newText: "const z = 1000;",
  });

  assert.equal(result.ok, false);
  assert.match(result.content, /not found/i);
  assert.equal(fs.get("c.txt"), "const x = 1;");
});

test("edit fails on a near-miss with different whitespace", async () => {
  const fs: VirtualFs = new Map([["c.txt", "if (x) {\n\tdoThing();\n}"]]);
  const edit = makeEditTool(fs);

  const result = await edit.execute({
    path: "c.txt",
    oldText: "if (x) {\n    doThing();\n}", // spaces, file has a tab
    newText: "if (x) {\n\tdoOtherThing();\n}",
  });

  assert.equal(result.ok, false);
});

test("edit fails when oldText matches more than once, and applies nothing", async () => {
  const fs: VirtualFs = new Map([["c.txt", "foo();\nfoo();"]]);
  const edit = makeEditTool(fs);

  const result = await edit.execute({
    path: "c.txt",
    oldText: "foo();",
    newText: "bar();",
  });

  assert.equal(result.ok, false);
  assert.equal(fs.get("c.txt"), "foo();\nfoo();");
});

test("bash returns stdout on success", async () => {
  const bash = makeBashTool(async (command) => {
    assert.equal(command, "echo hi");
    return { stdout: "hi\n", exitCode: 0 };
  });

  const result = await bash.execute({ command: "echo hi" });
  assert.equal(result.ok, true);
  assert.match(result.content, /hi/);
});

test("bash times out instead of hanging forever", async () => {
  const bash = makeBashTool(
    () => new Promise((resolve) => setTimeout(() => resolve({ stdout: "too late", exitCode: 0 }), 1000)),
  );

  const start = Date.now();
  const result = await bash.execute({ command: "sleep 1", timeoutMs: 50 });
  const elapsed = Date.now() - start;

  assert.equal(result.ok, false);
  assert.match(result.content, /timed out/i);
  assert.ok(elapsed < 500, `expected timeout well under 500ms, took ${elapsed}ms`);
});
