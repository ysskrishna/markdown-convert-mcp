import { describe, expect, it } from 'vitest';
import { MAX_MARKDOWN_CHARS, prepareMarkdown } from '../src/limits.ts';

describe('prepareMarkdown', () => {
  it('treats whitespace-only as empty', () => {
    expect(prepareMarkdown('  \n\t')).toEqual({ kind: 'empty' });
  });

  it('rejects oversize by UTF-16 length', () => {
    expect(prepareMarkdown('a'.repeat(MAX_MARKDOWN_CHARS + 1))).toEqual({
      kind: 'too_large',
    });
  });
});
