import React from 'react';
import { Box, Text } from 'ink';
import type { Comment } from '../types';
import { COMMENT_TYPE_CONFIG } from '../constants';

interface CommentCardProps {
  comment: Comment;
  isSelected: boolean;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function CommentCard({ comment, isSelected }: CommentCardProps) {
  const config = COMMENT_TYPE_CONFIG[comment.type];
  const resolvedMarker = comment.resolved ? ' [RESOLVED]' : '';

  return (
    <Box
      flexDirection="column"
      borderStyle={isSelected ? 'double' : 'single'}
      borderColor={isSelected ? config.color : 'gray'}
      paddingX={1}
      marginBottom={1}
    >
      <Box>
        <Text color={config.color} bold>
          {config.label}
        </Text>
        <Text dimColor> L{comment.lineNumber}</Text>
        {comment.resolved && (
          <Text color="green" dimColor>
            {resolvedMarker}
          </Text>
        )}
      </Box>
      <Text dimColor italic>
        "{truncate(comment.lineContent, 30)}"
      </Text>
      <Text wrap="truncate-end">
        {comment.content}
      </Text>
    </Box>
  );
}
