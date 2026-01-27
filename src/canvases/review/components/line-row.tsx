import React from 'react';
import { Box, Text } from 'ink';
import type { DocumentLine, CommentType } from '../types';
import { COMMENT_TYPE_CONFIG } from '../constants';

interface LineRowProps {
  line: DocumentLine;
  isSelected: boolean;
  commentType: CommentType | null;
  lineNumberWidth: number;
}

export function LineRow({ line, isSelected, commentType, lineNumberWidth }: LineRowProps) {
  const indicator = commentType ? COMMENT_TYPE_CONFIG[commentType].icon : ' ';
  const indicatorColor = commentType ? COMMENT_TYPE_CONFIG[commentType].color : undefined;

  return (
    <Box>
      <Text color={indicatorColor}>{indicator}</Text>
      <Text dimColor>{' '}</Text>
      <Text dimColor>{String(line.number).padStart(lineNumberWidth, ' ')}</Text>
      <Text dimColor>{' '}</Text>
      <Text inverse={isSelected} color={isSelected ? undefined : (line.isCodeBlock ? 'gray' : undefined)}>
        {isSelected ? '\u25B6' : ' '}
      </Text>
      <Text inverse={isSelected} color={line.isCodeBlock ? 'cyan' : undefined}>
        {' '}{line.content}
      </Text>
    </Box>
  );
}
