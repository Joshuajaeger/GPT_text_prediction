# Module 6 — Recommendations for Adapting This Into a Course/Workshop, and Caveats

## Recommendations

**Sequencing and gating.** Don't let students move on by vibes — gate each
step behind its own test suite, and additionally:
- Step 2 is "done" when the loop terminates correctly on a no-tool-call
  turn *and* preserves tool-result ordering under out-of-order completion
  (both are in the shipped test suite).
- Step 4 is "done" when a compacted session still resolves a task whose
  full history overflows the configured token budget, with recent turns
  provably untouched.
- Step 6 is "done" when `meanPassAt1` on a self-authored task slice (5–20
  tasks, ≥3 trials each) is non-trivially above zero, run against the
  student's own Step 1–3 code, not just against the exercise's mocks.

**Two tracks, one grading bar.** If you run both a TypeScript and a Python
track, don't let language choice change the bar — the "done" thresholds
above are language-agnostic and should be enforced identically.

**Make the Step 5 measurement the flagship exercise.** Having students
*measure* their own MCP-vs-CLI-vs-native-extension token cost (Step 5, part
3) is what turns Zechner's claim from an appeal to authority into an
empirical result the student produced themselves. Consider making this the
graded deliverable for the module even if the automated tests for Step 5
parts 1–2 are treated as lower-stakes warmups.

**Timebox realistically.** Each step is scoped to 1–3 hours for an
experienced engineer; treat the six steps as an afternoon-to-two-day
project. If you're running this as a bootcamp module, that's roughly a
one-day intensive plus a take-home for Step 6.

**Pin versions before publishing.** `earendil-works/pi` publishes every
few days. Any workshop materials, live demos, or scripted commands against
the real repo should pin a specific tag and be re-verified against
`pi.dev/docs/latest` shortly before delivery.

## Caveats

- **The source talk is a keynote, not a tutorial.** No code is built on
  screen in "Building pi in a World of Slop" — everything in
  `00-motivation.md`'s chapter breakdown is reconstructed from the AI
  Engineer summary and public written recaps, cross-checked against
  Zechner's own essays, not from a verified transcript. Timestamps are
  approximate; verify against the video directly before treating any
  specific timestamp as authoritative (e.g. for a clipped highlight reel).
- **Fast-moving target.** Version ~0.84.x and mcporter ~0.13.x were current
  at the time this tutorial was assembled and will have incremented by the
  time you read this — re-check the `earendil-works/pi` package tree and
  doc URLs at publish/delivery time, per `05-outdated-vs-current.md`.
- **Exa tool-name history.** Exa's current documentation centers on
  `web_search_exa` / `web_fetch_exa` (default) plus
  `web_search_advanced_exa` / `agent_run` (optional, and note: passing an
  explicit `tools` list to the endpoint *replaces* the default set rather
  than adding to it). Older documentation pages reference a different,
  now-deprecated tool set (`get_code_context_exa`, `company_research_exa`,
  `linkedin_search_exa`, `deep_researcher_start`/`check`, `crawling_exa`).
  If a source you find contradicts this tutorial's Step 5 material, prefer
  Exa's current docs over an older cached page.
- **Session path specificity.** `01-architecture-reference.md` states the
  session path as `~/.pi/agent/sessions/--<working-directory-path>--/
  <timestamp>_<session-id>.jsonl` (per-working-directory), which is more
  specific than some older third-party summaries describing a flat
  `sessions/<id>/` layout — the per-working-directory form is the one
  reflected in current docs.
- **Benchmark numbers are point-in-time and noisy, not fixed constants.**
  Any Terminal-Bench placement or case-study figure attributed to Zechner's
  own runs should be presented as *his* claim, with its source, rather than
  a verified fact this tutorial vouches for independently. SWE-bench's
  original 1.96% best-model figure (Claude 2, 2023) is real and citable,
  but is now vastly exceeded by current models — use it only as a
  historical anchor, never as a current baseline.
- **This tutorial's own exercises are a teaching simplification, not
  pi's actual implementation.** The `pi-harness-tutorial/exercises/`
  code intentionally omits real network I/O, real sandboxing, real
  provider SDKs, and TypeBox/AJV schema validation, so that every exercise
  runs with zero external dependencies via
  `node --experimental-strip-types`. Treat a passing exercise test suite as
  evidence you understand the *contract* pi's real subsystems implement,
  not as evidence your code is production-ready — Module 1's "reading
  order" pointers into the real `earendil-works/pi` source are where the
  production-grade version of each contract lives.
