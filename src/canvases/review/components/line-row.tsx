import React, { memo } from 'react';
import { Box, Text } from 'ink';
import type { DocumentLine } from '../types';
import { tokenizeLine, renderHighlightedLine } from '../../../lib/syntax-highlight';

interface LineRowProps {
  line: DocumentLine;
  isSelected: boolean;
  hasComment: boolean;
  lineNumberWidth: number;
  prefixWidth: number;
  availableWidth: number;
}

function wrapText(text: string, width: number): string[] {
  if (width <= 0 || text.length === 0) return [text];
  const lines: string[] = [];
  let remaining = text;
  while (remaining.length > width) {
    lines.push(remaining.slice(0, width));
    remaining = remaining.slice(width);
  }
  if (remaining.length > 0 || lines.length === 0) {
    lines.push(remaining);
  }
  return lines;
}

export const LineRow = memo(function LineRow({ line, isSelected, hasComment, lineNumberWidth, prefixWidth, availableWidth }: LineRowProps) {
  const indicator = hasComment ? '●' : ' ';

  // Content width: availableWidth - prefix - leading space
  const contentWidth = availableWidth - prefixWidth - 1;
  const wrappedLines = wrapText(line.content, contentWidth);
  const indent = ' '.repeat(prefixWidth + 1);

  const renderFirstLine = () => {
    const content = wrappedLines[0] ?? '';
    if (isSelected) {
      return <Text inverse>{' '}{content}</Text>;
    }
    if (line.isCodeBlock && line.codeLanguage) {
      const tokens = tokenizeLine(content, line.codeLanguage);
      return (
        <>
          <Text>{' '}</Text>
          {renderHighlightedLine(tokens)}
        </>
      );
    }
    return (
      <Text color={line.isCodeBlock ? 'cyan' : undefined}>
        {' '}{content}
      </Text>
    );
  };

  const renderContinuationLine = (content: string, idx: number) => {
    if (isSelected) {
      return (
        <Box key={idx}>
          <Text inverse>{indent}{content}</Text>
        </Box>
      );
    }
    if (line.isCodeBlock && line.codeLanguage) {
      const tokens = tokenizeLine(content, line.codeLanguage);
      return (
        <Box key={idx}>
          <Text>{indent}</Text>
          {renderHighlightedLine(tokens)}
        </Box>
      );
    }
    return (
      <Box key={idx}>
        <Text color={line.isCodeBlock ? 'cyan' : undefined}>
          {indent}{content}
        </Text>
      </Box>
    );
  };

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={hasComment ? 'yellow' : undefined}>{indicator}</Text>
        <Text dimColor>{' '}</Text>
        <Text dimColor>{String(line.number).padStart(lineNumberWidth, ' ')}</Text>
        <Text dimColor>{' '}</Text>
        {renderFirstLine()}
      </Box>
      {wrappedLines.slice(1).map((content, idx) => renderContinuationLine(content, idx))}
    </Box>
  );
});
