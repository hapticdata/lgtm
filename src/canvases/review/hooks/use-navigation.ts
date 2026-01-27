import { useState, useCallback } from 'react';
import type { FocusPanel, Comment } from '../types';

export interface NavigationState {
  selectedLine: number;
  selectedCommentIndex: number;
  focusPanel: FocusPanel;
  scrollOffset: number;
}

export function useNavigation(totalLines: number, filteredComments: Comment[]) {
  const [selectedLine, setSelectedLine] = useState(1);
  const [selectedCommentIndex, setSelectedCommentIndex] = useState(0);
  const [focusPanel, setFocusPanel] = useState<FocusPanel>('document');
  const [scrollOffset, setScrollOffset] = useState(0);

  const scrollDown = useCallback(() => {
    setSelectedLine((prev) => Math.min(prev + 1, totalLines));
  }, [totalLines]);

  const scrollUp = useCallback(() => {
    setSelectedLine((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToTop = useCallback(() => {
    setSelectedLine(1);
    setScrollOffset(0);
  }, []);

  const goToBottom = useCallback(() => {
    setSelectedLine(totalLines);
  }, [totalLines]);

  const goToLine = useCallback((lineNumber: number) => {
    setSelectedLine(Math.max(1, Math.min(lineNumber, totalLines)));
    setFocusPanel('document');
  }, [totalLines]);

  const nextComment = useCallback(() => {
    setSelectedCommentIndex((prev) =>
      Math.min(prev + 1, filteredComments.length - 1)
    );
  }, [filteredComments.length]);

  const prevComment = useCallback(() => {
    setSelectedCommentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const selectComment = useCallback((index: number) => {
    setSelectedCommentIndex(Math.max(0, Math.min(index, filteredComments.length - 1)));
  }, [filteredComments.length]);

  const togglePanel = useCallback(() => {
    setFocusPanel((prev) => (prev === 'document' ? 'comments' : 'document'));
  }, []);

  const jumpToSelectedComment = useCallback(() => {
    const comment = filteredComments[selectedCommentIndex];
    if (comment) {
      setSelectedLine(comment.lineNumber);
      setFocusPanel('document');
    }
  }, [filteredComments, selectedCommentIndex]);

  return {
    selectedLine,
    selectedCommentIndex,
    focusPanel,
    scrollOffset,
    setSelectedLine,
    setSelectedCommentIndex,
    setFocusPanel,
    setScrollOffset,
    scrollDown,
    scrollUp,
    goToTop,
    goToBottom,
    goToLine,
    nextComment,
    prevComment,
    selectComment,
    togglePanel,
    jumpToSelectedComment,
  };
}
