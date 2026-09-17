# Step 5 — Extensions, and Integrating MCP/Exa Without Baking It Into the Core

## Concept card

Everything beyond the four core tools is an **extension**: a function that
registers tools and hooks into a small number of well-defined seams
(`registerTool`, `on("context", ...)`, `on("tool_call", ...)`, ...). This
step builds the minimal version of that registration API, then uses it to
answer the actual empirical question behind pi's "no MCP by default"
stance: **how many tokens does an MCP server's tool schema cost you, every
single session, whether or not you use it?**

Zechner's own measurement (from "What if you don't need MCP at all?"):

> Playwright MCP has 21 tools using 13.7k tokens (6.8% of Claude's
> context). Chrome DevTools MCP has 26 tools using 18.0k tokens (9.0%).

That's not a claim about MCP being architecturally bad — the protocol is
fine for what it does. It's a claim about a specific, measurable context
tax that a "dump every tool schema into every session" integration pattern
imposes, compared to alternatives (a CLI-with-README the model reads on
demand via `bash`, or `mcporter`-generated bindings) that only pay that cost
when the tool is actually used.

## Reading

- The Model Context Protocol spec (`modelcontextprotocol.io`) — read the
  actual `tools/list` response shape before building `estimateMcpContextTokens`
  below; don't take the token-cost claim on faith, verify the shape that
  produces it.
- Anthropic, "Writing effective tools for AI agents" — informs
  `promptSnippet`/`promptGuidelines` design for your own registered tools.
- `mcporter` (`github.com/openclaw/mcporter`) and Exa's MCP docs
  (`exa.ai/docs/reference/exa-mcp`, endpoint `https://mcp.exa.ai/mcp`) for
  the integration you'll model in part 2.

Real source: `packages/coding-agent/docs/extensions.md` in
`earendil-works/pi`.

## Exercise, part 1 — the extension registry

Open [`../exercises/step-5-extensions/extensions.ts`](../exercises/step-5-extensions/extensions.ts).

Implement `ExtensionRegistry`:
- `registerTool(tool)` / `getTools()` — tools are returned in registration
  order.
- `on(event, handler)` — subscribe a handler to `"context"` or
  `"tool_call"`.
- `emitContext(messages)` — runs every `"context"` handler **in
  registration order**, each getting the *previous* handler's output as its
  input (a pipeline, not independent calls on the original messages).
- `emitToolCall(call)` — runs every `"tool_call"` handler in registration
  order; if any handler returns `{ block: true, reason }`, stop
  immediately and return that decision (later handlers don't run); if none
  block, return `{ block: false }`.

## Exercise, part 2 — measuring the MCP tax

Implement `estimateMcpContextTokens(tools)`: given an array of MCP-shaped
tool descriptors (`{ name, description, inputSchema }`), estimate how many
tokens their combined JSON schema would cost in context (character count of
the serialized descriptors, divided by 4, matching the same heuristic
Step 4 used for `estimateTokens`).

Then implement `mcpToolsToRegistrations(tools, namespace, callTool)`: adapt
each MCP tool descriptor into a `ToolDef` compatible with your registry,
namespacing the name as `${namespace}__${tool.name}` (matching the pattern
real pi MCP-bridge extensions use, e.g. `exa__web_search_exa`), whose
`execute` delegates to the supplied `callTool(name, args)` function.

Make [`extensions.test.ts`](../exercises/step-5-extensions/extensions.test.ts)
pass:

```sh
cd pi-harness-tutorial/exercises/step-5-extensions
node --experimental-strip-types extensions.test.ts
```

## Exercise, part 3 (no test — do this by hand)

Pick a real MCP server you can reach (Exa's hosted endpoint,
`https://mcp.exa.ai/mcp`, is a good choice — it needs no local install).
Call its `tools/list` and feed the real response through
`estimateMcpContextTokens`. Compare that number, as a fraction of your
target model's context window, against:

1. **The native-extension route**: register just the one or two Exa tools
   you'd actually use as `ToolDef`s directly (as in Step 5 part 1) — no
   schema dump, no unused tools.
2. **The CLI-with-README route**: `npx mcporter generate-cli --command
   https://mcp.exa.ai/mcp` to get a standalone CLI, then give the agent a
   short README via `bash` and let it invoke the CLI on demand — paying
   the token cost only in the turn it actually searches, not on every
   session start.

Write down the three numbers. This is the exercise that turns Zechner's
claim from an assertion into something you've verified yourself — and per
the tutorial's own recommendations, **the numbers, not the rule, should
decide your default**: if your measured overhead for a given MCP server is
negligible for your context budget, that's a legitimate reason to use it
directly instead of routing around it.

## Pitfalls

- **A "context" hook that returns `undefined` instead of the (possibly
  unmodified) message array** will silently drop all later messages if you
  don't guard for it — decide explicitly whether a handler that returns
  nothing means "no change" or is a bug, and enforce whichever you pick in
  your `emitContext` implementation.
- **Namespacing collisions**: two MCP servers can both expose a tool named
  `search`. The `${namespace}__${name}` pattern exists specifically to
  avoid this — don't skip it "because there's only one server for now."
- **The token-overhead number is dominated by `inputSchema` JSON, not the
  `description` text.** If your part-3 measurement comes out surprisingly
  low, double check you're serializing the full descriptor including
  `inputSchema`, not just the human-readable description.

## Python parity note

mini-SWE-agent has no extension system at all — everything is the
`bash` tool. If you're in the Python track, implement part 1 as a decorator
registry (`@register_tool`) and part 2 identically; the measurement in
part 3 is language-independent.
