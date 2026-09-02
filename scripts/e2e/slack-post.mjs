#!/usr/bin/env node
/**
 * Optional manual E2E: convert sample markdown → Slack mrkdwn → chat.postMessage.
 * Not run in CI. Requires SLACK_BOT_TOKEN and SLACK_CHANNEL_ID in .env or env.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { markdownToSlack } from '../../dist/converters/slack.js';

function loadEnvFile() {
  const path = resolve(process.cwd(), '.env');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile();

const token = process.env.SLACK_BOT_TOKEN;
const channel = process.env.SLACK_CHANNEL_ID;

if (!token?.startsWith('xoxb-')) {
  console.error('Set SLACK_BOT_TOKEN (xoxb-...) in .env or environment.');
  process.exit(1);
}
if (!channel?.startsWith('C')) {
  console.error('Set SLACK_CHANNEL_ID (C...) in .env or environment.');
  process.exit(1);
}

const markdown = `# E2E test from markdown-convert-mcp

**bold** and _italic_

- item one
- item two

See [docs](https://example.com)`;

const text = markdownToSlack(markdown);
console.error('Posting mrkdwn:\n', text);

const res = await fetch('https://slack.com/api/chat.postMessage', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: JSON.stringify({ channel, text, mrkdwn: true }),
});

const body = await res.json();
if (!body.ok) {
  console.error('Slack API error:', body.error);
  process.exit(1);
}

console.error(`Posted ts=${body.ts} channel=${body.channel}`);
