import React from 'react';
import { Box, Text } from 'ink';
import type { Comment, CommentType } from '../types';
import { COMMENT_TYPE_CONFIG, COMMENT_TYPE_ORDER } from '../constants';

interface SummaryViewProps {
  documentName: string;
  comments: Comment[];
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + '...';
}

function groupCommentsByType(comments: Comment[]): Map<CommentType, Comment[]> {
  const groups = new Map<CommentType, Comment[]>();

  for (const type of COMMENT_TYPE_ORDER) {
    const typeComments = comments.filter((c) => c.type === type);
    if (typeComments.length > 0) {
      groups.set(type, typeComments.sort((a, b) => a.lineNumber - b.lineNumber));
    }
  }

  return groups;
}

export function SummaryView({ documentName, comments }: SummaryViewProps) {
  const unresolvedCount = comments.filter((c) => !c.resolved).length;
  const resolvedCount = comments.filter((c) => c.resolved).length;
  const grouped = groupCommentsByType(comments);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="cyan" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">Document Feedback Summary</Text>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        <Text><Text bold>Document:</Text> {documentName}</Text>
        <Text><Text bold>Total Comments:</Text> {comments.length}</Text>
        <Text><Text bold>Unresolved:</Text> <Text color={unresolvedCount > 0 ? 'yellow' : 'green'}>{unresolvedCount}</Text></Text>
        <Text><Text bold>Resolved:</Text> <Text color="green">{resolvedCount}</Text></Text>
      </Box>

      {Array.from(grouped.entries()).map(([type, typeComments]) => {
        const config = COMMENT_TYPE_CONFIG[type];
        return (
          <Box key={type} flexDirection="column" marginTop={1}>
            <Text bold color={config.color}>
              {config.label}S ({typeComments.length})
            </Text>
            {typeComments.map((comment) => (
              <Box key={comment.id} paddingLeft={2} flexDirection="column">
                <Text>
                  <Text dimColor>L{comment.lineNumber}:</Text>
                  {comment.resolved && <Text color="green"> [RESOLVED]</Text>}
                </Text>
                <Box paddingLeft={1}>
                  <Text dimColor italic>"{truncate(comment.lineContent.trim(), 60)}"</Text>
                </Box>
                <Text wrap="wrap">{comment.content}</Text>
              </Box>
            ))}
          </Box>
        );
      })}

      {comments.length === 0 && (
        <Text dimColor italic>No comments to summarize.</Text>
      )}

      <Box marginTop={2}>
        <Text dimColor>Press 'v' to return, 'y' to copy, 'E' to export to file</Text>
      </Box>
    </Box>
  );
}
