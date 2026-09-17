# Module 4 — Responsible-Use Capstone: "Slow the F*** Down"

This module closes the loop on Module 0's Act 3. You've now built (or at
least worked through) a harness capable of running unattended across a
multi-turn loop with no step limit. That capability is exactly what makes
the compounding-error argument concrete rather than abstract.

## The argument, formalized

Let `e` be the (roughly constant) per-unit-of-output error rate of an
agent on a given class of task, and let `r` be a human reviewer's
throughput — units of output they can carefully review per unit time.

- A human generating code is also rate-limited by `r` (roughly), so
  historically, output volume and review capacity were coupled.
- An agent's output volume is bounded by compute and parallelism, not by
  `r`. Once you can run `p` agents in parallel, total output scales with
  `p`, but review capacity does not.
- Expected undetected errors ≈ `e × output − r × (review time available)`.
  As `p` grows, the first term grows linearly with `p`; the second does
  not. The gap is Zechner's "booo" errors: individually plausible mistakes
  that pass a shallow review and compound into damage no single diff shows.

This is not an argument against agents, or against parallelism — it's an
argument that **review capacity, not generation capacity, is the actual
bottleneck**, and a harness (or a workflow) that doesn't account for that
is borrowing against a debt it can't see accruing.

## Hands-on exercise: feel the friction

1. Using the harness you built in `03-build-track/`, write a deliberately
   under-specified task prompt — e.g. "add caching to this function" with
   no detail on invalidation, key shape, or concurrency behavior.
2. Run it against your loop, letting it complete without interrupting.
3. Before reading the diff casually, review it **line by line**, as if you
   were about to deploy it to production and were personally on call for
   the consequences. Time yourself.
4. Now write a second version of the same task, this time as a
   "sufficiently detailed spec" — invalidation policy, key shape,
   concurrency assumptions, and a test you expect to pass, all stated up
   front. Run it, and review that diff with the same rigor.
5. Compare: review time, number of issues found, and (if you're honest
   with yourself) how much the *first* review would have caught if you'd
   skimmed it instead of reading every line.

The point of the exercise isn't that spec-writing is free — it visibly
isn't, you just spent time on it — it's that **the time moved**, from
error-hunting during review to disambiguation during specification, and
the second kind of time is cheaper and catches issues earlier.

## Applying the rubric to your own harness

Revisit the six build-track steps with this lens:
- Step 3 (`bash` with no permission gate) — YOLO-by-default only makes
  sense paired with containment (sandboxing) *and* with the discipline
  this module describes. A harness that removes permission friction without
  also demanding review discipline has removed a safeguard without
  replacing it.
- Step 5 (extensions/sub-agents) — a sub-agent call you don't read the
  transcript of is a place where review capacity silently drops to zero
  for that unit of output. If you build a `/review` sub-session pattern,
  make sure *you* still read its output, not just its verdict.
- Step 6 (evaluation) — a pass@1 number is a generation-capability metric,
  not a review-safety metric. Passing your own task suite says nothing
  about whether you'd catch a subtle bug in a *real* task the suite didn't
  cover.
