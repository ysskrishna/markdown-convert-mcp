import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Sample markdown used by optional E2E scripts. */
export const SAMPLE_MARKDOWN = `# E2E test from markdown-convert-mcp

**bold** and _italic_

- item one
- item two

See [docs](https://example.com)`;

/** Load `.env` from cwd when vars are not already set in the environment. */
export function loadEnvFile() {
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

/** Log to stderr and exit with code 1. */
export function die(message) {
  console.error(message);
  process.exit(1);
}
