#!/usr/bin/env node
/**
 * Optional manual E2E: convert sample markdown → ADF → Jira Cloud REST v3 issue.
 * Not run in CI. Requires JIRA_* vars in .env or environment.
 */
import { markdownToJira } from '#dist/converters/jira.js';
import { die, loadEnvFile, SAMPLE_MARKDOWN } from './helpers.mjs';

loadEnvFile();

const baseUrl = process.env.JIRA_BASE_URL?.replace(/\/$/, '');
const email = process.env.JIRA_EMAIL;
const token = process.env.JIRA_API_TOKEN;
const projectKey = process.env.JIRA_PROJECT_KEY;

if (!baseUrl?.includes('atlassian.net')) {
  die('Set JIRA_BASE_URL (e.g. https://yoursite.atlassian.net) in .env');
}
if (!email || !token) {
  die('Set JIRA_EMAIL and JIRA_API_TOKEN in .env');
}
if (!projectKey) {
  die('Set JIRA_PROJECT_KEY (e.g. PROJ) in .env');
}

const description = JSON.parse(markdownToJira(SAMPLE_MARKDOWN));
console.error('ADF description:\n', JSON.stringify(description, null, 2));

const auth = Buffer.from(`${email}:${token}`).toString('base64');
const summary = `ADF E2E test ${new Date().toISOString()}`;

const res = await fetch(`${baseUrl}/rest/api/3/issue`, {
  method: 'POST',
  headers: {
    Authorization: `Basic ${auth}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    fields: {
      project: { key: projectKey },
      issuetype: { name: 'Task' },
      summary,
      description,
    },
  }),
});

const body = await res.json();
if (!res.ok) {
  console.error('Jira API error:', res.status, JSON.stringify(body, null, 2));
  process.exit(1);
}

const issueUrl = `${baseUrl}/browse/${body.key}`;
console.error(`Created ${body.key}: ${issueUrl}`);
