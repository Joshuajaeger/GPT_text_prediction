// Step 3 exercise: the four core tools, sandboxed against an in-memory
// virtual filesystem and an injectable exec function instead of real
// disk/shell access.

export type VirtualFs = Map<string, string>;

export type ExecFn = (command: string) => Promise<{ stdout: string; exitCode: number }>;

export type ToolResult = { ok: boolean; content: string };

function makeResult(ok: boolean, content: string): ToolResult {
  return { ok, content };
}

/**
 * TODO: return up to `limit` lines (default 2000) starting at `offset`
 * (default 0, 0-indexed) from `fs.get(path)`, joined with "\n". If the
 * path isn't in `fs`, return an error result (ok: false) rather than
 * throwing — tools report failure to the model, they don't crash the loop.
 */
export function makeReadTool(fs: VirtualFs) {
  return {
    name: "read",
    execute: async (params: { path: string; offset?: number; limit?: number }): Promise<ToolResult> => {
      throw new Error("TODO: implement read");
    },
  };
}

/**
 * TODO: set fs.set(path, content) and return an ok result confirming the
 * write (content can be anything human-readable, e.g. "wrote N bytes to <path>").
 */
export function makeWriteTool(fs: VirtualFs) {
  return {
    name: "write",
    execute: async (params: { path: string; content: string }): Promise<ToolResult> => {
      throw new Error("TODO: implement write");
    },
  };
}

/**
 * TODO:
 * - If `path` isn't in `fs`, return an error result.
 * - Count occurrences of `oldText` in the file content (exact substring match).
 * - If it occurs zero times, return an error result mentioning "not found".
 * - If it occurs more than once, return an error result mentioning "not unique"
 *   (or similar) — do NOT apply the edit.
 * - If it occurs exactly once, replace that occurrence with `newText`,
 *   write the result back into `fs`, and return an ok result.
 */
export function makeEditTool(fs: VirtualFs) {
  return {
    name: "edit",
    execute: async (params: { path: string; oldText: string; newText: string }): Promise<ToolResult> => {
      throw new Error("TODO: implement edit");
    },
  };
}

/**
 * TODO: call `exec(command)`, but race it against a timeout of
 * `timeoutMs` (default 5000). If the timeout wins, return an error result
 * mentioning "timed out" — do NOT let the returned promise hang forever.
 * On success, return an ok result whose content includes the command's
 * stdout (and, if exitCode !== 0, note the nonzero exit code — still as
 * an `ok: true` tool result, since a nonzero exit is useful information
 * for the model, not a harness-level failure).
 */
export function makeBashTool(exec: ExecFn) {
  return {
    name: "bash",
    execute: async (params: { command: string; timeoutMs?: number }): Promise<ToolResult> => {
      throw new Error("TODO: implement bash");
    },
  };
}
