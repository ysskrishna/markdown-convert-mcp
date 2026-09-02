#!/usr/bin/env node
/**
 * Optional manual E2E: convert sample markdown → Slack mrkdwn → chat.postMessage.
 * Not run in CI. Requires SLACK_BOT_TOKEN and SLACK_CHANNEL_ID in .env or env.
 */
import { markdownToSlack } from '#dist/converters/slack.js';
import { die, loadEnvFile, SAMPLE_MARKDOWN } from './helpers.mjs';

loadEnvFile();

const token = process.env.SLACK_BOT_TOKEN;
const channel = process.env.SLACK_CHANNEL_ID;

if (!token?.startsWith('xoxb-')) {
  die('Set SLACK_BOT_TOKEN (xoxb-...) in .env or environment.');
}
if (!channel?.startsWith('C')) {
  die('Set SLACK_CHANNEL_ID (C...) in .env or environment.');
}

const text = markdownToSlack(SAMPLE_MARKDOWN);
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
  die(`Slack API error: ${body.error}`);
}

console.error(`Posted ts=${body.ts} channel=${body.channel}`);
