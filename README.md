# Markdown Convert MCP

A stdio MCP server that converts CommonMark/GFM Markdown into the markup dialects used by Slack, Microsoft Teams, Jira, and plain text. An agent calls a tool, gets back a string, and passes that string to the appropriate next hop (Slack API, Teams paste, Jira wiki field, etc.).

**This server converts only.** It does not post Slack messages, send Teams chat, create Jira issues, or call any external API. Use a separate Slack/Teams/Jira MCP or integration for delivery.

**Requirements:** Node.js **22** or newer (`engines.node >= 22`).

## Build from source

```bash
git clone https://github.com/ysskrishna/markdown-convert-mcp.git
cd markdown-convert-mcp
npm ci
npm run build
```

The entry point is `dist/index.js`. Host configs below must point at that file after a local build.

### Resolve absolute paths

MCP hosts often launch the server outside your shell, so `node` from `nvm` or `fnm` may not be on `PATH`. In a **Node 22** shell, run:

```bash
which node
```

Use that absolute path as `command`. Use the absolute path to this repo's `dist/index.js` as the sole `args` entry.

On Windows, `command` is the full path to `node.exe`; `args` is the full path to `dist/index.js`.

## Install in your MCP host

Replace the placeholders with your paths from the step above.

### Cursor

Add to `.cursor/mcp.json` (project) or your user MCP config:

```json
{
  "mcpServers": {
    "markdown-convert": {
      "command": "/absolute/path/to/node",
      "args": ["/absolute/path/to/markdown-convert-mcp/dist/index.js"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add markdown-convert -- /absolute/path/to/node /absolute/path/to/markdown-convert-mcp/dist/index.js
```

### Claude Desktop

In `claude_desktop_config.json`, use the same `command` and `args` as Cursor, then restart Claude Desktop.

## Tools and next hops

Each tool accepts `{ "markdown": "<source>" }` and returns converted text. Pick the tool that matches where the string will go next.

| Tool | Output | Use when the next hop expects | Do not use when |
|------|--------|------------------------------|-----------------|
| `markdown_to_slack` | Slack mrkdwn | Slack API or Slack MCP `text` (mrkdwn) | Composer clipboard paste; `markdown_text` fields (pass Markdown through instead) |
| `markdown_to_teams` | HTML with inline CSS | Teams paste or Graph `contentType: html` | Adaptive Cards; this tool does not send Teams messages |
| `markdown_to_jira` | Atlassian wiki markup (`h1.`, `{code}`, `\|\|header\|\|`) | Jira Server/Data Center or wiki markup fields | Jira Cloud REST v3 ADF; this tool does not create issues |
| `markdown_to_plaintext` | Plain text | Any destination that needs stripped text | — |

**Limits:** Whitespace-only input returns success with an empty string. Input over 200,000 characters returns a tool error (`isError: true`), not a transport failure. Slack may truncate around 40k characters in the `text` field.

**Caveats:** `slackify-markdown` may insert zero-width spaces around emphasis. Teams HTML is clipboard-oriented; Microsoft Graph may strip inline styles. Jira wiki output will look wrong if fed to Cloud v3 ADF APIs.

## After npm publish

> **Not available until publish.** The package is currently private and not on npm.

Once `@ysskrishna/markdown-convert-mcp` is published, hosts may use:

```bash
npx -y @ysskrishna/markdown-convert-mcp
```

Until then, use the local absolute-path install above.

## Development

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

See [AGENTS.md](./AGENTS.md) for contributor rules and file layout.

## License

MIT
