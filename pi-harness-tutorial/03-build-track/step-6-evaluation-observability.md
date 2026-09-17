# Step 6 — Evaluation & Observability

## Concept card

Two closing obligations for a harness that claims to be minimal-by-design:
you have to **prove** the minimalism didn't cost capability, and you have
to make every model interaction **inspectable** rather than trusting a
summary. This step builds a tiny evaluation harness (pass@k over a task
set) and a structured event log, both intentionally small enough that you
could point them at your Steps 1–5 code today.

- **pass@k**, not a single pass/fail run. Provider behavior is stochastic
  and (per Zechner's own Terminal-Bench notes) varies by time of day and
  load; a single trial tells you almost nothing. The standard estimator
  (from the Codex/HumanEval line of work) computes an unbiased pass@k from
  `n` trials with `c` correct, without needing to literally run `k`
  trials each time.
- **A structured event log**, not prose summaries. This is the
  observability half of Act 1's complaint: if you can't replay exactly
  what happened turn by turn, you can't debug a regression, and you
  can't build the `/review` sub-session pattern from Module 1's "no
  sub-agents" table.

## Reading

- SWE-bench (arXiv:2310.06770) — task/evaluation design for real repo
  issues; note the original 1.96% Claude 2 baseline as a "how far things
  have come" anchor, not a current number.
- Terminal-Bench 2.0 paper (arXiv:2601.11868) — the benchmark Zechner cites
  in the talk; note Terminus 2's no-file-tools design as the reference
  agent.
- Reflexion (arXiv:2303.11366) — self-critique as an alternative/complement
  to a black-box sub-agent review step.

## Exercise

Open [`../exercises/step-6-evaluation/evaluation.ts`](../exercises/step-6-evaluation/evaluation.ts).

Implement:

- `passAtK(n, c, k)` — the unbiased pass@k estimator:
  `1 - C(n-c, k) / C(n, k)` (using the combinatorial-ratio form that avoids
  overflow: `∏_{i=n-c+1}^{n} (1 - k / i)`). Return `1.0` if `n - c < k`
  (every remaining trial-subset is guaranteed to contain a pass).
- `runTaskSuite(tasks, trialsPerTask, runTrial)` — for each task, run
  `runTrial(task)` `trialsPerTask` times (each call independent — your mock
  `runTrial` may be stochastic), count how many trials passed, and return
  per-task `{ taskId, trials, passes, passAt1 }` plus an aggregate
  `meanPassAt1` across tasks.
- `EventLog` — a tiny structured logger: `log(event)` appends a
  `{ timestamp, ...event }` record; `toJson()` serializes the whole log;
  `filter(predicate)` returns matching entries. This is the minimum needed
  to replay "what did the harness actually do" after a run — wire it into
  Step 2's loop (`tool_execution_start`/`tool_execution_end`-shaped events)
  once this step's tests pass.

Make [`evaluation.test.ts`](../exercises/step-6-evaluation/evaluation.test.ts)
pass:

```sh
cd pi-harness-tutorial/exercises/step-6-evaluation
node --experimental-strip-types evaluation.test.ts
```

## "Done" bar for this step (and for the tutorial)

Wire your Steps 1–5 pieces together into one harness, define 5–20 tiny
tasks of your own (e.g. "read this file and report its line count," "fix
this off-by-one," "use the bash tool to list files matching a pattern"),
and run `runTaskSuite` with `trialsPerTask >= 3` against your real loop
(Step 2) with a real or mock provider (Step 1). The tutorial's threshold:
**mean pass@1 non-trivially above zero**, with a full `EventLog` export you
can read back and account for every tool call. That's the point at which
you've verified — not assumed — that four tools and a sub-1000-token
prompt are enough for your task slice.

## Pitfalls

- **Benchmark variance by time of day/provider load is real**, not an
  excuse — Zechner notes he ran his own Terminal-Bench comparison in a
  single timezone window for exactly this reason. If you're comparing two
  harness variants, run both in the same session, interleaved, not on
  different days.
- **Over-trusting a pass rate vs. actually reading the failures.** A task
  suite you wrote yourself can be gamed by an agent that pattern-matches
  your fixtures rather than solving the general problem — read a sample of
  the transcripts, don't just look at the number.
- **`C(n-c, k) / C(n, k)` computed with factorials directly overflows for
  even moderate `n`.** Use the product-of-ratios form specified above.

## Python parity note

Compare your `EventLog` format against mini-SWE-agent's own trajectory
format (a linear list of `{role, content}` turns saved as JSON) — it's
deliberately closer to a raw transcript than a rich event stream, which is
a legitimate simpler alternative if your harness doesn't need turn-level
tool lifecycle events.
