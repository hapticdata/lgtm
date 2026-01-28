import { test, expect, describe } from 'bun:test';
import { formatFeedbackForExport, formatFeedbackForClaudeCode } from './export-formatter';
import type { Comment } from '../canvases/review/types';

function createComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'test-id',
    lineNumber: 1,
    lineContent: 'const x = 1;',
    content: 'Test comment',
    type: 'suggestion',
    createdAt: new Date('2024-01-01'),
    resolved: false,
    ...overrides,
  };
}

describe('formatFeedbackForExport', () => {
  test('includes document name in output', () => {
    const result = formatFeedbackForExport('test.md', []);
    expect(result).toContain('**Document:** test.md');
  });

  test('shows correct comment counts', () => {
    const comments = [
      createComment({ id: '1', resolved: false }),
      createComment({ id: '2', resolved: true }),
      createComment({ id: '3', resolved: false }),
    ];
    const result = formatFeedbackForExport('test.md', comments);
    expect(result).toContain('**Total Comments:** 3');
    expect(result).toContain('**Unresolved:** 2');
    expect(result).toContain('**Resolved:** 1');
  });

  test('groups comments by type with correct headings', () => {
    const comments = [
      createComment({ id: '1', type: 'blocker' }),
      createComment({ id: '2', type: 'suggestion' }),
    ];
    const result = formatFeedbackForExport('test.md', comments);
    expect(result).toContain('### BLOCKERS (Must Address)');
    expect(result).toContain('### SUGGESTIONS (Improvements)');
  });

  test('orders comment types correctly (blockers first)', () => {
    const comments = [
      createComment({ id: '1', type: 'praise' }),
      createComment({ id: '2', type: 'blocker' }),
      createComment({ id: '3', type: 'concern' }),
    ];
    const result = formatFeedbackForExport('test.md', comments);

    const blockerPos = result.indexOf('BLOCKERS');
    const concernPos = result.indexOf('CONCERNS');
    const praisePos = result.indexOf('PRAISE');

    expect(blockerPos).toBeLessThan(concernPos);
    expect(concernPos).toBeLessThan(praisePos);
  });

  test('sorts comments within a type by line number', () => {
    const comments = [
      createComment({ id: '1', type: 'suggestion', lineNumber: 50 }),
      createComment({ id: '2', type: 'suggestion', lineNumber: 10 }),
      createComment({ id: '3', type: 'suggestion', lineNumber: 30 }),
    ];
    const result = formatFeedbackForExport('test.md', comments);

    const line10Pos = result.indexOf('Line 10');
    const line30Pos = result.indexOf('Line 30');
    const line50Pos = result.indexOf('Line 50');

    expect(line10Pos).toBeLessThan(line30Pos);
    expect(line30Pos).toBeLessThan(line50Pos);
  });

  test('shows [RESOLVED] marker for resolved comments', () => {
    const comments = [
      createComment({ id: '1', resolved: true }),
    ];
    const result = formatFeedbackForExport('test.md', comments);
    expect(result).toContain('[RESOLVED]');
  });

  test('truncates long line content to 80 chars', () => {
    const longLine = 'a'.repeat(100);
    const comments = [
      createComment({ id: '1', lineContent: longLine }),
    ];
    const result = formatFeedbackForExport('test.md', comments);
    // Should have first 77 chars + '...'
    expect(result).toContain('a'.repeat(77) + '...');
    expect(result).not.toContain('a'.repeat(100));
  });

  test('escapes backticks in line content', () => {
    const comments = [
      createComment({ id: '1', lineContent: 'const x = `template`' }),
    ];
    const result = formatFeedbackForExport('test.md', comments);
    expect(result).toContain('\\`template\\`');
  });

  test('generates next steps for blockers', () => {
    const comments = [createComment({ type: 'blocker' })];
    const result = formatFeedbackForExport('test.md', comments);
    expect(result).toContain('## Next Steps');
    expect(result).toContain('Address blockers first');
  });

  test('generates next steps for concerns', () => {
    const comments = [createComment({ type: 'concern' })];
    const result = formatFeedbackForExport('test.md', comments);
    expect(result).toContain('Review concerns');
  });

  test('generates next steps for questions', () => {
    const comments = [createComment({ type: 'question' })];
    const result = formatFeedbackForExport('test.md', comments);
    expect(result).toContain('Answer questions');
  });

  test('shows no critical issues message when only suggestions/praise', () => {
    const comments = [
      createComment({ type: 'suggestion' }),
      createComment({ type: 'praise' }),
    ];
    const result = formatFeedbackForExport('test.md', comments);
    expect(result).toContain('No critical issues found');
  });

  test('handles empty comments array', () => {
    const result = formatFeedbackForExport('test.md', []);
    expect(result).toContain('**Total Comments:** 0');
    expect(result).toContain('No critical issues found');
  });
});

describe('formatFeedbackForClaudeCode', () => {
  test('wraps feedback with Claude Code instructions', () => {
    const comments = [createComment()];
    const result = formatFeedbackForClaudeCode('test.md', comments);
    expect(result).toContain('I have reviewed the planning document');
    expect(result).toContain('Please address this feedback');
  });

  test('includes the full feedback content', () => {
    const comments = [createComment({ type: 'blocker' })];
    const result = formatFeedbackForClaudeCode('test.md', comments);
    expect(result).toContain('BLOCKERS (Must Address)');
    expect(result).toContain('test.md');
  });
});
