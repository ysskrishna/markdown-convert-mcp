import { describe, expect, it } from 'vitest';
import { markdownToSlack } from '../../src/converters/slack.ts';

describe('markdownToSlack', () => {
  it('converts bold to Slack mrkdwn', () => {
    expect(markdownToSlack('**bold**')).toMatch(/\*bold\*/);
  });

  it('converts links to Slack mrkdwn', () => {
    expect(markdownToSlack('[x](https://e.com)')).toContain('<https://e.com|x>');
  });

  it('converts headings to bold Slack mrkdwn', () => {
    expect(markdownToSlack('# Hi')).toContain('*Hi*');
  });
});
