# Build Track — Build Your Own Pi Harness in Six Steps

Six incremental stages, each with a design-decision writeup, a reading, a
code exercise with a failing test to make pass, a pitfall list, and a
pointer into pi's real source. Do them in order — each step's exercise
imports from the previous one.

| Step | Subsystem | "Done" when... |
|---|---|---|
| [1](./step-1-provider-abstraction.md) | Streaming LLM call behind a provider abstraction | The loop terminates correctly on a no-tool-call turn, against a mock provider |
| [2](./step-2-agent-loop.md) | The agent loop with tool-call parsing | A multi-turn tool-call/tool-result cycle round-trips without dropping ordering |
| [3](./step-3-core-tools.md) | `read`/`write`/`edit`/`bash` with sandboxing | All four tools pass their contract tests, including the `edit` exact-match failure case |
| [4](./step-4-sessions-compaction.md) | JSONL session trees + compaction | A compacted session still resolves a task whose history overflows the context window |
| [5](./step-5-extensions-mcp-exa.md) | Extensions + MCP/Exa integration | A registered extension tool is callable by the loop, and you've measured MCP's context cost yourself |
| [6](./step-6-evaluation-observability.md) | Evaluation & observability | pass@1 on a small task slice is non-trivially above zero, with a full event log |

## Two tracks

- **TypeScript** (recommended) — mirrors pi's own implementation, lets you
  diff your code against the real source line-for-line.
- **Python / mini-SWE-agent parity** — noted per step for readers who'd
  rather work in Python; mini-SWE-agent is ~100 lines and a good target to
  imitate structurally.

This tutorial's exercise skeletons are TypeScript, runnable with **zero
external dependencies** via `node --experimental-strip-types` (Node ≥ 22).
Real production code would add `tsx`, TypeBox, and a proper test runner —
the exercises avoid that so anyone can `git clone` and start immediately.

## Running an exercise

```sh
cd pi-harness-tutorial/exercises/step-1-provider
node --experimental-strip-types provider.test.ts
```

Each `*.test.ts` file is self-contained (uses only `node:test` and
`node:assert/strict`) and fails until you fill in the corresponding
`*.ts` skeleton's `TODO`s.

## Design rubric to apply at every step

Carried over from Module 0: for every capability you're tempted to add,
ask **(a) does this hide information from the developer**, the way Claude
Code's silent context management did, and **(b) does this let the agent
outrun the developer's review capacity**, per the Act 3 argument. If the
answer to either is yes, it belongs in an opt-in extension (Step 5), not
the core loop.
