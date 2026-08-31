import { describe, expect, it } from 'vitest';
import { MAX_MARKDOWN_CHARS } from '../src/limits.ts';
import { createServer, runConvert, TOOL_NAMES } from '../src/server.ts';

describe('createServer', () => {
  it('is defined and returns an McpServer', () => {
    const server = createServer();
    expect(server).toBeDefined();
    expect(server.server).toBeDefined();
  });
});

describe('TOOL_NAMES', () => {
  it('lists four convert tools', () => {
    expect(TOOL_NAMES).toHaveLength(4);
    expect(TOOL_NAMES).toEqual([
      'markdown_to_slack',
      'markdown_to_teams',
      'markdown_to_jira',
      'markdown_to_plaintext',
    ]);
  });
});

describe('runConvert', () => {
  it('returns isError for oversize markdown', () => {
    const result = runConvert('a'.repeat(MAX_MARKDOWN_CHARS + 1), (s) => s);
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toBe(
      'Markdown exceeds 200000 characters.',
    );
  });

  it('returns empty text for whitespace-only input', () => {
    const result = runConvert('  \n', (s) => s);
    expect(result.isError).toBeUndefined();
    expect(result.content[0]?.text).toBe('');
  });

  it('returns conversion errors with prefix', () => {
    const result = runConvert('# hi', () => {
      throw new Error('boom');
    });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toBe('Conversion failed: boom');
  });
});
