import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import type { Document, CommentType } from '../types';
import { LineRow } from './line-row';

interface DocumentViewerProps {
  document: Document;
  selectedLine: number;
  visibleHeight: number;
  scrollOffset: number;
  getCommentTypeForLine: (lineNumber: number) => CommentType | null;
  isFocused: boolean;
}

export function DocumentViewer({
  document,
  selectedLine,
  visibleHeight,
  scrollOffset,
  getCommentTypeForLine,
  isFocused,
}: DocumentViewerProps) {
  const lineNumberWidth = String(document.lines.length).length;

  // Calculate visible window
  const { visibleLines, adjustedOffset } = useMemo(() => {
    const totalLines = document.lines.length;
    const maxOffset = Math.max(0, totalLines - visibleHeight);

    // Adjust scroll to keep selected line visible
    let offset = scrollOffset;
    if (selectedLine - 1 < offset) {
      offset = selectedLine - 1;
    } else if (selectedLine - 1 >= offset + visibleHeight) {
      offset = selectedLine - visibleHeight;
    }
    offset = Math.max(0, Math.min(offset, maxOffset));

    const start = offset;
    const end = Math.min(start + visibleHeight, totalLines);
    const lines = document.lines.slice(start, end);

    return { visibleLines: lines, adjustedOffset: offset };
  }, [document.lines, selectedLine, visibleHeight, scrollOffset]);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={isFocused ? 'cyan' : 'gray'}>
      <Box paddingX={1} borderBottom>
        <Text bold color={isFocused ? 'cyan' : undefined}>
          {document.name}
        </Text>
        <Text dimColor> ({document.lines.length} lines)</Text>
      </Box>
      <Box flexDirection="column" paddingX={1}>
        {visibleLines.map((line) => (
          <LineRow
            key={line.number}
            line={line}
            isSelected={line.number === selectedLine}
            commentType={getCommentTypeForLine(line.number)}
            lineNumberWidth={lineNumberWidth}
          />
        ))}
      </Box>
      {document.lines.length > visibleHeight && (
        <Box paddingX={1} borderTop>
          <Text dimColor>
            Lines {adjustedOffset + 1}-{Math.min(adjustedOffset + visibleHeight, document.lines.length)} of {document.lines.length}
          </Text>
        </Box>
      )}
    </Box>
  );
}
