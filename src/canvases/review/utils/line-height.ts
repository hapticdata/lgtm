export function calculateVisualRows(
  lineContent: string,
  prefixWidth: number,
  availableWidth: number
): number {
  const totalLineWidth = prefixWidth + 1 + lineContent.length;
  return Math.max(1, Math.ceil(totalLineWidth / availableWidth));
}

export interface VisibleLineRange {
  endIndex: number;
  totalVisualRows: number;
}

export function getVisibleLineRange(
  lines: { content: string }[],
  startOffset: number,
  visibleHeight: number,
  prefixWidth: number,
  availableWidth: number
): VisibleLineRange {
  let visualRowsUsed = 0;
  let endIndex = startOffset;

  for (let i = startOffset; i < lines.length; i++) {
    const rowsForLine = calculateVisualRows(lines[i].content, prefixWidth, availableWidth);
    if (visualRowsUsed + rowsForLine > visibleHeight) {
      break;
    }
    visualRowsUsed += rowsForLine;
    endIndex = i + 1;
  }

  return { endIndex, totalVisualRows: visualRowsUsed };
}
