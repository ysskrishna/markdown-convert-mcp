# AGENTS.md

Operating manual for AI agents working in this repository.

## Stack

- **Runtime:** Node.js >= 22, ESM (`"type": "module"`)
- **Language:** TypeScript (`tsc` → `dist/`)
- **MCP:** `@modelcontextprotocol/server` v2, stdio transport via `serveStdio`
- **Validation:** Zod v4 (`zod/v4`)
- **Markdown:** `slackify-markdown` (Slack), `unified` + `remark-parse` + `remark-gfm` (Teams/Jira/plaintext), `strip-markdown` (plaintext)
- **Tests:** Vitest
- **CI:** GitHub Actions on `pull_request` and `push` to `main`

## Commands

| Command | Purpose |
|---------|---------|
| `npm ci` | Install from lockfile (CI and clean installs) |
| `npm run lint` | ESLint on `src` and `tests` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (`vitest run`) |
| `npm run build` | Compile `src/` → `dist/` |

Full checkpoint before merge:

```bash
npm ci && npm run lint && npm run typecheck && npm test && npm run build
```

## Always

- Run `npm test` (and the full checkpoint when changing behavior) before committing.
- Log diagnostics with `console.error` only. **Never** `console.log` — stdout is reserved for JSON-RPC on the MCP stdio transport.
- Return oversize input and converter failures as tool results with `isError: true`, not protocol/transport errors.
- Keep converters pure; use per-call `unified()` pipelines (no shared mutable processor).
- Use `.js` extensions in `src/` imports for NodeNext emit.
- Match existing code style and keep diffs minimal.

## Ask first

- Adding a new output dialect or MCP tool (e.g. WhatsApp, Telegram).
- Publishing to npm or changing `"private"` in `package.json`.
- Bumping `@modelcontextprotocol/server` across a major version.
- Large refactors that touch multiple converters or the MCP wiring.

## Never

- Add Docker or container-based distribution in v1.
- Add a second in-repo Slack converter alongside `slackify-markdown`.
- Commit secrets, tokens, or `.env` files.
- Emit MCP protocol errors for oversize markdown or converter throws (use `errorText` with `isError: true`).
- Post to Slack/Teams/Jira from this server — convert-only.
- Use `console.log` in server code.
- Lead README install instructions with `npx` until the package is published.
