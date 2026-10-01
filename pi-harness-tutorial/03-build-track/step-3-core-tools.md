# Step 3 — Core Tools: `read` / `write` / `edit` / `bash`

## Concept card

Four atomic tools, each doing exactly one thing, is pi's answer to the
Agent-Computer Interface (ACI) problem: don't wrap a human-oriented CLI for
the agent, design the interface *for* the agent. Two decisions to internalize:

- **`edit` uses exact-string match**, not a diff/patch format or fuzzy
  matching. This is a deliberate simplicity/robustness tradeoff: an exact
  match either unambiguously succeeds or unambiguously fails — there's no
  "it sort of applied" state for the model (or you) to have to reason
  about. The cost is that the model must `read` before it `edit`s, which
  is exactly the behavior you want anyway.
- **Every tool is defined against an `Operations` interface**, not
  hard-coded to the local filesystem/shell. The same `read`/`write`/`edit`/
  `bash` tool definitions should work unchanged whether the backing
  implementation is local disk, an SSH connection, or a container — only
  the `Operations` implementation changes. This is also your sandboxing
  seam: swap in a container-backed `Operations` and the tools (and the
  model's understanding of them) don't change at all.

## Reading

- SWE-agent (arXiv:2405.15793) — the ACI concept in full.
- CodeAct (arXiv:2402.01030) — why `bash` alone covers a surprising amount
  of what specialized tools would otherwise need to.
- Anthropic, "Writing effective tools for AI agents" — schema and
  description quality; read this before naming your own `execute`
  parameters.

Real source: the tool definitions under `packages/coding-agent` in
`earendil-works/pi`; the containerization docs for Gondolin/Docker/OpenShell
patterns (read after this exercise, when you're ready to sandbox `bash` for
real).

## Exercise

Open [`../exercises/step-3-core-tools/tools.ts`](../exercises/step-3-core-tools/tools.ts).

This exercise sandboxes everything in memory — a `VirtualFs` map instead of
real disk, and an injectable `exec` function instead of a real shell — so
you can focus purely on each tool's *contract* without needing (or risking)
real file/process access. Implement:

- `readTool.execute({ path, offset?, limit? })` — return up to `limit`
  lines (default 2000) starting at `offset` (default 0) from the virtual
  file; throw if the path doesn't exist.
- `writeTool.execute({ path, content })` — create or overwrite the virtual
  file.
- `editTool.execute({ path, oldText, newText })` — replace the **first**
  exact occurrence of `oldText` with `newText`; throw a descriptive error
  if `oldText` doesn't appear in the file **exactly once** (both "not
  found" and "found more than once" are errors — an ambiguous match is as
  bad as no match).
- `bashTool.execute({ command, timeoutMs? })` — call the injected `exec`
  function with a timeout (default 5000ms); if it doesn't resolve in time,
  return an error result rather than hanging the loop forever.

Make [`tools.test.ts`](../exercises/step-3-core-tools/tools.test.ts) pass:

```sh
cd pi-harness-tutorial/exercises/step-3-core-tools
node --experimental-strip-types tools.test.ts
```

## Pitfalls

- **Exact-match `edit` failing on whitespace** is the single most common
  real-world failure mode of this tool — a model that read a file with
  tabs and writes back spaces (or vice versa) will get a "not found"
  error. That's a feature, not a bug: it forces a fresh `read` rather than
  silently corrupting the file. Don't be tempted to add fuzzy whitespace
  normalization — the test suite explicitly checks that a near-miss with
  different whitespace fails.
- **An ambiguous match (`oldText` appears twice) is not safer to just
  "apply to the first occurrence."** Silently picking one is how an agent
  edits the wrong one of two near-identical functions. Fail loudly instead.
- **Unbounded `read` blows the context window.** The 2000-line default
  isn't arbitrary — it's a context-budget decision as much as a tool
  decision. If you extend this exercise to real files, don't remove the
  default limit "to be helpful."
- **`bash` with no timeout can hang the entire agent loop** — Step 2's loop
  has no external step limit, so a tool call that never resolves means the
  harness never terminates. The timeout here is not a nicety.

## Python parity note

mini-SWE-agent's *entire* tool surface is `bash` — no separate
`read`/`write`/`edit` at all, because a model with `cat`, `sed`, and
heredocs can already do everything those three tools do. If you're
following the Python track, try implementing this step both ways (bespoke
tools vs. `bash`-only) and compare how much the exact-match `edit`
guarantee is worth giving up.
