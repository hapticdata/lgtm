import React from 'react';
import { Text } from 'ink';
import type { Comment } from '../types';

interface CommentCardProps {
  comment: Comment;
  isSelected: boolean;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function CommentCard({ comment, isSelected }: CommentCardProps) {
  const lineNum = `L${comment.lineNumber}`.padEnd(5);

  return (
    <Text dimColor={comment.resolved} inverse={isSelected}>
      {lineNum}{truncate(comment.content, 30)}
    </Text>
  );
}
