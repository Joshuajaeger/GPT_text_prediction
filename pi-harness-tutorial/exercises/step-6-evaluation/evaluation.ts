// Step 6 exercise: a minimal pass@k evaluator and a structured event log.

/**
 * TODO: the unbiased pass@k estimator from the Codex/HumanEval line of
 * work: given `n` independent trials of which `c` passed, estimate the
 * probability that at least one of a random k-subset of those n trials
 * passes.
 *
 * - If `n - c < k` (there aren't enough failing trials to fill a whole
 *   k-subset with failures), return 1.0 — every k-subset is guaranteed to
 *   contain at least one pass.
 * - Otherwise, compute `1 - C(n-c, k) / C(n, k)` using the numerically
 *   stable product form:
 *
 *     1 - prod_{i = n-c+1}^{n} (1 - k / i)
 *
 *   (do NOT compute raw factorials/binomial coefficients — they overflow
 *   for even moderate n).
 */
export function passAtK(n: number, c: number, k: number): number {
  throw new Error("TODO: implement passAtK");
}

export type Task = { id: string };
export type TaskResult = { taskId: string; trials: number; passes: number; passAt1: number };
export type SuiteResult = { tasks: TaskResult[]; meanPassAt1: number };

/**
 * TODO: for each task in `tasks`, call `runTrial(task)` exactly
 * `trialsPerTask` times (sequentially or in parallel, your choice — each
 * call is independent), count how many resolved to `true`, and compute
 * `passAt1 = passAtK(trialsPerTask, passes, 1)` for that task. Return all
 * per-task results plus `meanPassAt1`, the unweighted average of each
 * task's `passAt1` across all tasks.
 */
export async function runTaskSuite(
  tasks: Task[],
  trialsPerTask: number,
  runTrial: (task: Task) => Promise<boolean>,
): Promise<SuiteResult> {
  throw new Error("TODO: implement runTaskSuite");
}

export type LogEvent = { type: string; [key: string]: unknown };
export type LoggedEntry = LogEvent & { timestamp: number };

/**
 * TODO: a minimal structured event log.
 * - log(event): append `{ ...event, timestamp: Date.now() }` (or an
 *   injected clock for testability — see the constructor) to an internal
 *   array.
 * - toJson(): return `JSON.stringify` of the full array of logged entries.
 * - filter(predicate): return the subset of logged entries matching
 *   `predicate`, preserving order.
 */
export class EventLog {
  private now: () => number;

  constructor(now: () => number = Date.now) {
    this.now = now;
  }

  log(event: LogEvent): void {
    throw new Error("TODO: implement log");
  }

  toJson(): string {
    throw new Error("TODO: implement toJson");
  }

  filter(predicate: (entry: LoggedEntry) => boolean): LoggedEntry[] {
    throw new Error("TODO: implement filter");
  }
}
