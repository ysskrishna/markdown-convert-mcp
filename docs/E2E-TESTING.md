# End-to-end (E2E) testing

This MCP server is **convert-only** — it returns formatted strings. End-to-end
testing means verifying those strings work when a **platform MCP** or API actually
posts them.

You do **not** need credentials to develop or release this package. Unit tests
(`npm test`) are sufficient for CI. E2E is optional for maintainers and
integrators who want to validate real platform rendering.

## Testing levels

| Level | What it proves | Credentials | Command / method |
|-------|----------------|-------------|------------------|
| **Unit** | Converter output is correct | None | `npm test` |
| **MCP smoke** | Tools register and respond | None | MCP Inspector + `node dist/index.js` |
| **E2E** | Output renders after real post | Your sandbox tokens | Platform MCP or scripts below |

## Important: copy-paste is not E2E

Copying tool output from an agent chat and pasting into Slack/Teams UI is **not**
a valid test:

| Platform | Tool output | Why paste fails |
|----------|-------------|-----------------|
| **Slack** | mrkdwn (`*bold*`, `<url\|label>`) | Composer expects Markdown shortcuts or API post |
| **Teams** | HTML source string | Composer needs `text/html` on clipboard, not plain text |
| **Jira** | ADF JSON | Jira UI does not accept pasted ADF text |

E2E = **convert → platform MCP/API → message/issue appears**.

---

## Setup pattern

Run **two MCP servers** in your host (Cursor, Claude Desktop, etc.):

1. `markdown-convert` — this package
2. A platform server — Slack, Atlassian, Teams, etc.

Copy [docs/mcp.json.example](mcp.json.example) to `.cursor/mcp.json` (project)
or `~/.cursor/mcp.json` (global). **Never commit** files with real tokens.

Restart the host after config changes.

---

## Slack E2E (verified)

### Prerequisites

- Slack app with **Bot User OAuth Token** (`xoxb-...`)
- Bot scopes: `channels:read`, `channels:history`, `chat:write`, `users:read`
- Bot invited to target channel (`/invite @YourBot`)
- [Slack MCP server](https://www.npmjs.com/package/@modelcontextprotocol/server-slack)

### MCP config snippet

```json
{
  "mcpServers": {
    "markdown-convert": {
      "command": "npx",
      "args": ["-y", "@ysskrishna/markdown-convert-mcp"]
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-your-token",
        "SLACK_TEAM_ID": "T01234567",
        "SLACK_CHANNEL_IDS": "C01234567"
      }
    }
  }
}
```

For local development, point `markdown-convert` at your build:

```json
"markdown-convert": {
  "command": "node",
  "args": ["/absolute/path/to/markdown-convert-mcp/dist/index.js"]
}
```

### Agent prompt

```
Convert this markdown to Slack mrkdwn and post it to channel C01234567:

# E2E test

**bold** and _italic_

- item one
- item two

See [docs](https://example.com)
```

Expected agent flow:

1. `markdown_to_slack` → mrkdwn string
2. `slack_post_message` with `channel_id` + `text`

Verify in Slack: bold heading, italic, bullets, clickable link.

### Optional script (no MCP)

```bash
cp .env.example .env   # fill SLACK_BOT_TOKEN, SLACK_CHANNEL_ID
npm run build
node scripts/e2e/slack-post.mjs
```

---

## Jira Cloud E2E (ADF)

### Prerequisites

- Jira **Cloud** site (not Server/Data Center wiki markup)
- [Atlassian Rovo MCP](https://github.com/atlassian/atlassian-mcp-server) (OAuth or API token)
  or [sooperset/mcp-atlassian](https://github.com/sooperset/mcp-atlassian)
- `markdown_to_jira` returns **ADF JSON** (v1.1.0+)

### MCP config snippet (Atlassian official)

```json
{
  "mcpServers": {
    "markdown-convert": {
      "command": "npx",
      "args": ["-y", "@ysskrishna/markdown-convert-mcp"]
    },
    "atlassian": {
      "url": "https://mcp.atlassian.com/v1/sse"
    }
  }
}
```

Complete OAuth in the host UI on first connect.

### Agent prompt

```
Convert this markdown to Jira ADF and create a Task in MYPROJ with summary
"ADF E2E test" and this description:

# Release notes

**Fixed** the login bug.

- step one
- step two

See [ticket](https://example.com)
```

Expected agent flow:

1. `markdown_to_jira` → ADF JSON string
2. Atlassian MCP `jira_create_issue` (or equivalent) with `description` set to parsed ADF

### Optional script (no MCP)

```bash
cp .env.example .env   # fill JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, JIRA_PROJECT_KEY
npm run build
node scripts/e2e/jira-create.mjs
```

Creates a Task with an ADF description. Open the printed issue URL in Jira to verify rendering.

### Validate ADF without posting

1. Call `markdown_to_jira` via MCP Inspector or agent
2. Copy the JSON output
3. Paste into [ADF playground](https://developer.atlassian.com/cloud/jira/platform/apis/document/playground/)
4. Confirm rendering before live issue creation

### Caveats

- Some nodes are invalid in **comments** vs **description** (e.g. tables in comments)
- ADF field size limits apply — see Jira Cloud REST docs

---

## Microsoft Teams E2E (HTML)

### Prerequisites

- Microsoft 365 / Teams tenant
- Teams or Graph MCP server with `chat:write` (setup varies by server)
- `markdown_to_teams` output → Graph `body.contentType: "html"`

### MCP config

Depends on your Teams MCP package. Pair it with `markdown-convert` the same way
as Slack — two servers, one agent session.

### Agent prompt

```
Convert this markdown to Teams HTML and post it to channel CHAT_ID:

**Status update**

All checks passed.
```

### Caveats

- Graph may strip inline CSS from `markdown_to_teams` output
- UI paste of HTML source strings will not work — use API/MCP post
- Adaptive Cards are out of scope for this converter

---

## Environment variables (optional scripts)

See [.env.example](../.env.example). Scripts read from `.env` locally only.

| Variable | Used by | Required for |
|----------|---------|--------------|
| `SLACK_BOT_TOKEN` | `scripts/e2e/slack-post.mjs` | Slack script |
| `SLACK_CHANNEL_ID` | Slack script | Target channel (`C...`) |
| `JIRA_BASE_URL` | Future Jira script | `https://yoursite.atlassian.net` |
| `JIRA_EMAIL` | Future Jira script | Atlassian account email |
| `JIRA_API_TOKEN` | Future Jira script | API token from id.atlassian.com |

CI does **not** run E2E scripts — no secrets in GitHub Actions.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Platform MCP tools missing | Restart host; check MCP settings; verify config JSON |
| Slack `not_in_channel` | `/invite @Bot` in target channel |
| Slack `invalid_auth` | Regenerate bot token; reinstall app to workspace |
| Jira `INVALID_INPUT` on description | Validate ADF in playground; simplify markdown |
| Paste shows raw `*bold*` or `<p>` tags | Expected — use API E2E instead |
| Token leaked in git | Revoke token; use `.cursor/mcp.json` (gitignored) or env vars |

---

## For package maintainers

Before release:

```bash
npm ci && npm run lint && npm run typecheck && npm test && npm run build
```

Optional manual E2E after merge (your sandbox):

- [ ] Slack: convert + post (script or MCP)
- [ ] Jira: ADF playground + create test issue
- [ ] Teams: Graph post (when MCP available)

Document results in PR test plan; no live E2E required for merge if unit tests pass.
