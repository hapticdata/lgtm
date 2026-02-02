import React, { memo } from 'react';
import { Box, Text } from 'ink';
import type { Comment } from '../types';
import { CommentCard } from './comment-card';

interface CommentPanelProps {
  comments: Comment[];
  selectedIndex: number;
  visibleHeight: number;
  isFocused: boolean;
}

export const CommentPanel = memo(function CommentPanel({
  comments,
  selectedIndex,
  visibleHeight,
  isFocused,
}: CommentPanelProps) {
  const totalComments = comments.length;
  const maxVisible = visibleHeight - 4; // 1 row per comment, minus header/footer

  let startIndex = 0;
  if (totalComments > maxVisible) {
    startIndex = Math.max(0, selectedIndex - Math.floor(maxVisible / 2));
    startIndex = Math.min(startIndex, totalComments - maxVisible);
  }
  const endIndex = Math.min(startIndex + maxVisible, totalComments);
  const visibleComments = comments.slice(startIndex, endIndex);

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={isFocused ? 'cyan' : 'gray'}
      width={40}
      minWidth={40}
      flexShrink={0}
    >
      <Box paddingX={1} borderBottom>
        <Text bold color={isFocused ? 'cyan' : undefined}>
          COMMENTS
        </Text>
        <Text dimColor> ({comments.length})</Text>
      </Box>
      <Box flexDirection="column" paddingX={1} flexGrow={1}>
        {comments.length === 0 ? (
          <Text dimColor italic>
            No comments yet.{'\n'}
            Press 'c' to add one.
          </Text>
        ) : (
          visibleComments.map((comment, i) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              isSelected={startIndex + i === selectedIndex && isFocused}
            />
          ))
        )}
      </Box>
      {totalComments > maxVisible && (
        <Box paddingX={1} borderTop>
          <Text dimColor>
            {selectedIndex + 1}/{totalComments}
          </Text>
        </Box>
      )}
    </Box>
  );
});
