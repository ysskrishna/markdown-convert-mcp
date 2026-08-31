import { describe, expect, it } from 'vitest';
import { markdownToPlaintext } from '../../src/converters/plaintext.ts';

describe('markdownToPlaintext', () => {
  it('strips heading markers', () => {
    const result = markdownToPlaintext('# Hi');
    expect(result).toContain('Hi');
    expect(result).not.toContain('#');
  });

  it('strips bold formatting', () => {
    expect(markdownToPlaintext('**b**')).toBe('b');
  });

  it('returns empty string for empty input', () => {
    expect(markdownToPlaintext('')).toBe('');
    expect(markdownToPlaintext('   ')).toBe('');
  });

  it('uses image alt text', () => {
    expect(markdownToPlaintext('![x](u)')).toContain('x');
  });
});
