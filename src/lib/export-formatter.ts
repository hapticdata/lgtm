import path from 'path';
import type { Comment, CommentType } from '../canvases/review/types';

const COMMENT_TYPE_ORDER: CommentType[] = [
  'blocker',
  'concern',
  'question',
  'suggestion',
  'praise',
  'acknowledge',
];

interface GroupedComments {
  type: CommentType;
  comments: Comment[];
}

function groupCommentsByType(comments: Comment[]): GroupedComments[] {
  const groups = new Map<CommentType, Comment[]>();

  for (const comment of comments) {
    const existing = groups.get(comment.type) || [];
    existing.push(comment);
    groups.set(comment.type, existing);
  }

  return COMMENT_TYPE_ORDER
    .filter((type) => groups.has(type))
    .map((type) => ({
      type,
      comments: groups.get(type)!.sort((a, b) => a.lineNumber - b.lineNumber),
    }));
}

function getTypeHeading(type: CommentType): string {
  const headings: Record<CommentType, string> = {
    blocker: 'BLOCKERS (Must Address)',
    concern: 'CONCERNS (Potential Issues)',
    question: 'QUESTIONS (Need Clarification)',
    suggestion: 'SUGGESTIONS (Improvements)',
    praise: 'PRAISE (Well Done)',
    acknowledge: 'ACKNOWLEDGED (Noted)',
  };
  return headings[type];
}

function escapeLineContent(content: string): string {
  const truncated = content.length > 80 ? content.slice(0, 77) + '...' : content;
  return truncated.replace(/`/g, '\\`');
}

function formatComment(comment: Comment): string {
  const resolvedMarker = comment.resolved ? ' [RESOLVED]' : '';
  const lineContent = escapeLineContent(comment.lineContent);
  return [
    `**Line ${comment.lineNumber}:**${resolvedMarker} \`${lineContent}\``,
    `> ${comment.content.replace(/\n/g, '\n> ')}`,
    '',
  ].join('\n');
}

export function formatFeedbackForExport(
  documentName: string,
  comments: Comment[]
): string {
  const unresolvedComments = comments.filter((c) => !c.resolved);
  const resolvedComments = comments.filter((c) => c.resolved);
  const grouped = groupCommentsByType(comments);

  const lines: string[] = [
    '## Document Feedback Summary',
    '',
    `**Document:** ${documentName}`,
    `**Total Comments:** ${comments.length}`,
    `**Unresolved:** ${unresolvedComments.length}`,
    `**Resolved:** ${resolvedComments.length}`,
    `**Exported:** ${new Date().toISOString()}`,
    '',
  ];

  for (const group of grouped) {
    lines.push(`### ${getTypeHeading(group.type)}`);
    lines.push('');
    for (const comment of group.comments) {
      lines.push(formatComment(comment));
    }
  }

  // Next steps
  lines.push('---');
  lines.push('');
  lines.push('## Next Steps');
  lines.push('');

  const hasBlockers = grouped.some((g) => g.type === 'blocker');
  const hasConcerns = grouped.some((g) => g.type === 'concern');
  const hasQuestions = grouped.some((g) => g.type === 'question');

  let stepNum = 1;
  if (hasBlockers) {
    lines.push(`${stepNum}. **Address blockers first** - These are critical issues that must be resolved.`);
    stepNum++;
  }
  if (hasConcerns) {
    lines.push(`${stepNum}. **Review concerns** - These are potential issues that should be evaluated.`);
    stepNum++;
  }
  if (hasQuestions) {
    lines.push(`${stepNum}. **Answer questions** - Clarification is needed on these points.`);
  }

  if (!hasBlockers && !hasConcerns && !hasQuestions) {
    lines.push('No critical issues found. Review suggestions for potential improvements.');
  }

  return lines.join('\n');
}

export function formatFeedbackForClaudeCode(
  documentName: string,
  comments: Comment[]
): string {
  const feedback = formatFeedbackForExport(documentName, comments);
  return [
    'I have reviewed the planning document and have the following feedback:',
    '',
    feedback,
    '',
    'Please address this feedback and update the document accordingly.',
  ].join('\n');
}

interface StoredComment {
  id: string;
  lineNumber: number;
  lineContent: string;
  content: string;
  type: string;
  createdAt: string;
  resolved: boolean;
}

function getStoragePath(filePath: string, session?: string): string {
  const basename = path.basename(filePath, path.extname(filePath));
  const dir = path.dirname(filePath);
  const sessionSuffix = session ? `-${session}` : '';
  return path.join(dir, `.lgtm-${basename}${sessionSuffix}.json`);
}

export async function exportComments(
  filePath: string,
  options: { session?: string; commentsFile?: string; format?: string }
): Promise<string> {
  const storagePath = options.commentsFile || getStoragePath(filePath, options.session);

  try {
    const file = Bun.file(storagePath);
    if (!(await file.exists())) {
      return options.format === 'json' ? '[]' : 'No comments found.';
    }

    const data = await file.json() as StoredComment[];
    const comments: Comment[] = data.map((c) => ({
      ...c,
      type: c.type as CommentType,
      createdAt: new Date(c.createdAt),
    }));

    if (options.format === 'json') {
      return JSON.stringify(comments, null, 2);
    }

    const documentName = path.basename(filePath);
    return formatFeedbackForExport(documentName, comments);
  } catch (err) {
    return `Error loading comments: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}
