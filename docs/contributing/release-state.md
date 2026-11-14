# Release state

For maintainers and coding agents. Update this file **after** each tagged release is pushed, npm publish succeeds, and registry/ClawHub steps are done.

| Field | Value |
| --- | --- |
| Last shipped version | 1.2.0 |
| Last tag | `v1.2.0` |
| Tagged from `main` at | `214d26e` |
| GitHub Release | https://github.com/ysskrishna/markdown-convert-mcp/releases/tag/v1.2.0 |
| npm | https://www.npmjs.com/package/@ysskrishna/markdown-convert-mcp/v/1.2.0 |
| MCP Registry | `io.github.ysskrishna/markdown-convert-mcp` `1.2.0` |
| ClawHub skill | `markdown-convert` `1.2.0` submitted, public after the security scan |
| ClawHub bundle | `@ysskrishna/markdown-convert-mcp` `1.2.0` submitted, public after the security scan |

`v1.2.0` still has ClawHub category `tools`. That slug is retired, so the publish used a local follow-up: skill browse categories `agents,knowledge`, and `openclaw.plugin.json` category `documents-files`. Those edits are on `main` and are not in the tag.

**Next release:** bump version in `package.json`, `server.json` (root and npm package entry), `src/server.ts`, `openclaw.plugin.json`, `plugin.json`, `gemini-extension.json`, `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, `.cursor-plugin/plugin.json`, `.kimi-plugin/plugin.json`, `skills/markdown-convert/SKILL.md`, and `.claude-plugin/marketplace.json`. Add a `CHANGELOG.md` section. Run `bash scripts/validate-release.sh` and the full checkpoint, merge to `main`, then `make release`. See [DEVELOPMENT.md](../../DEVELOPMENT.md#releasing) and [AGENTS.md](../../AGENTS.md#releases).
