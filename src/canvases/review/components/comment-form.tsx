import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { FastTextInput } from './fast-text-input';

interface CommentFormProps {
  lineNumber: number;
  initialContent?: string;
  onSubmit: (content: string) => void;
  onCancel: () => void;
}

export function CommentForm({
  lineNumber,
  initialContent = '',
  onSubmit,
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState(initialContent);

  const handleSubmit = useCallback(() => {
    if (content.trim()) {
      onSubmit(content.trim());
    }
  }, [content, onSubmit]);

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    }
  });

  return (
    <>
      <Box marginBottom={1}>
        <Text>Line {lineNumber}</Text>
      </Box>

      <Box>
        <FastTextInput
          value={content}
          onChange={setContent}
          onSubmit={handleSubmit}
          placeholder="Enter comment..."
          showCursor={true}
        />
      </Box>
    </>
  );
}
