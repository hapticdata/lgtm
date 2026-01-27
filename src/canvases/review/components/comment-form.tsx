import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import type { CommentType } from '../types';
import { COMMENT_TYPE_CONFIG, COMMENT_TYPE_ORDER } from '../constants';

type FormField = 'typeSelector' | 'commentInput';

interface CommentFormProps {
  lineNumber: number;
  lineContent: string;
  initialType?: CommentType;
  initialContent?: string;
  onSubmit: (content: string, type: CommentType) => void;
  onCancel: () => void;
}

export function CommentForm({
  lineNumber,
  lineContent,
  initialType = 'question',
  initialContent = '',
  onSubmit,
  onCancel,
}: CommentFormProps) {
  const [selectedType, setSelectedType] = useState<CommentType>(initialType);
  const [content, setContent] = useState(initialContent);
  const [focusedField, setFocusedField] = useState<FormField>('commentInput');

  const handleSubmit = useCallback(() => {
    if (content.trim()) {
      onSubmit(content.trim(), selectedType);
    }
  }, [content, selectedType, onSubmit]);

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    // Tab navigation between fields
    if (key.tab) {
      if (key.shift) {
        // Shift+Tab: cycle backward
        setFocusedField((prev) => (prev === 'commentInput' ? 'typeSelector' : 'commentInput'));
      } else {
        // Tab: cycle forward
        setFocusedField((prev) => (prev === 'typeSelector' ? 'commentInput' : 'typeSelector'));
      }
      return;
    }

    // Number keys for type selection only when type selector is focused
    if (focusedField === 'typeSelector') {
      const typeIndex = parseInt(input, 10) - 1;
      if (typeIndex >= 0 && typeIndex < COMMENT_TYPE_ORDER.length) {
        setSelectedType(COMMENT_TYPE_ORDER[typeIndex]!);
        return;
      }
    }

    if (key.return && content.trim()) {
      handleSubmit();
    }
  });

  const truncatedLine = lineContent.length > 50
    ? lineContent.slice(0, 47) + '...'
    : lineContent;

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
    >
      <Box marginBottom={1}>
        <Text bold>Add Comment</Text>
        <Text dimColor> - Line {lineNumber}</Text>
      </Box>
      <Box marginBottom={1}>
        <Text dimColor italic>"{truncatedLine}"</Text>
      </Box>

      <Box marginBottom={1}>
        <Text color={focusedField === 'typeSelector' ? 'cyan' : undefined} dimColor={focusedField !== 'typeSelector'}>
          Type{focusedField === 'typeSelector' ? ' \u25B6' : ':'}{' '}
        </Text>
        {COMMENT_TYPE_ORDER.map((type, i) => {
          const config = COMMENT_TYPE_CONFIG[type];
          const isSelected = type === selectedType;
          return (
            <React.Fragment key={type}>
              {i > 0 && <Text> </Text>}
              <Text
                color={isSelected ? config.color : 'gray'}
                inverse={isSelected}
              >
                [{i + 1}]{config.label}
              </Text>
            </React.Fragment>
          );
        })}
      </Box>

      <Box marginBottom={1}>
        <Text color={focusedField === 'commentInput' ? 'cyan' : undefined} dimColor={focusedField !== 'commentInput'}>
          Comment{focusedField === 'commentInput' ? ' \u25B6' : ':'}{' '}
        </Text>
        <TextInput
          value={content}
          onChange={setContent}
          onSubmit={handleSubmit}
          placeholder="Enter your comment..."
          focus={focusedField === 'commentInput'}
          showCursor={true}
        />
      </Box>

      <Box>
        <Text dimColor>Press </Text>
        <Text color="cyan">Tab</Text>
        <Text dimColor> to switch fields, </Text>
        <Text color="cyan">Enter</Text>
        <Text dimColor> to submit, </Text>
        <Text color="yellow">Esc</Text>
        <Text dimColor> to cancel</Text>
      </Box>
    </Box>
  );
}
