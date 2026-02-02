import React, { useMemo, memo } from 'react';
import { Box, Text } from 'ink';
import type { Document } from '../types';
import { LineRow } from './line-row';
import { getVisibleLineRange } from '../utils/line-height';

export const COMMENT_PANEL_WIDTH = 40;

interface DocumentViewerProps {
  document: Document;
  selectedLine: number;
  visibleHeight: number;
  scrollOffset: number;
  hasCommentOnLine: (lineNumber: number) => boolean;
  isFocused: boolean;
  width: number;
}

export const DocumentViewer = memo(function DocumentViewer({
  document,
  selectedLine,
  visibleHeight,
  scrollOffset,
  hasCommentOnLine,
  isFocused,
  width,
}: DocumentViewerProps) {
  const lineNumberWidth = String(document.lines.length).length;

  // Calculate available width for content inside borders and padding
  // Layout: border(1) + paddingX(1) + [content] + paddingX(1) + border(1)
  const availableWidth = width - 4;

  // Prefix before content: indicator(1) + space(1) + linenum(lineNumberWidth) + space(1)
  const prefixWidth = 1 + 1 + lineNumberWidth + 1;

  // Calculate visible window accounting for wrapped lines, centering selected line
  const { visibleLines, adjustedOffset, displayedLineCount } = useMemo(() => {
    const totalLines = document.lines.length;

    // Use roughly half of visible height as lines to keep above selected
    // This is approximate since lines can wrap, but works well in practice
    const linesAbove = Math.floor(visibleHeight / 3);
    let offset = Math.max(0, selectedLine - 1 - linesAbove);

    // Calculate what's visible at this offset
    let { endIndex } = getVisibleLineRange(
      document.lines,
      offset,
      visibleHeight,
      prefixWidth,
      availableWidth
    );

    // If selected line is not visible, adjust offset
    if (selectedLine > endIndex) {
      offset = selectedLine - 1;
      offset = Math.max(0, offset);
      ({ endIndex } = getVisibleLineRange(
        document.lines,
        offset,
        visibleHeight,
        prefixWidth,
        availableWidth
      ));
    }

    const actualEnd = Math.min(endIndex, totalLines);
    const lines = document.lines.slice(offset, actualEnd);

    return { visibleLines: lines, adjustedOffset: offset, displayedLineCount: actualEnd - offset };
  }, [document.lines, selectedLine, visibleHeight, prefixWidth, availableWidth]);

  return (
    <Box flexDirection="column" borderStyle="single" borderColor={isFocused ? 'cyan' : 'gray'} width={width}>
      <Box paddingX={1} borderBottom>
        <Text bold color={isFocused ? 'cyan' : undefined}>
          {document.name}
        </Text>
        <Text dimColor> ({document.lines.length} lines)</Text>
      </Box>
      <Box flexDirection="column" paddingX={1} height={visibleHeight} overflowY="hidden">
        {visibleLines.map((line) => (
          <LineRow
            key={line.number}
            line={line}
            isSelected={line.number === selectedLine}
            hasComment={hasCommentOnLine(line.number)}
            lineNumberWidth={lineNumberWidth}
            prefixWidth={prefixWidth}
            availableWidth={availableWidth}
          />
        ))}
      </Box>
      {document.lines.length > displayedLineCount && (
        <Box paddingX={1} borderTop>
          <Text dimColor>
            Lines {adjustedOffset + 1}-{adjustedOffset + displayedLineCount} of {document.lines.length}
          </Text>
        </Box>
      )}
    </Box>
  );
});
