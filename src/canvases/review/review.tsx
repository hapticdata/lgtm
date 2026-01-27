import React, { useState, useCallback, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import type { CanvasOptions, CommentFilter, CommentType, ViewMode } from './types';
import { COMMENT_TYPE_ORDER, FILTER_OPTIONS } from './constants';
import { useDocument } from './hooks/use-document';
import { useComments } from './hooks/use-comments';
import { useNavigation } from './hooks/use-navigation';
import { useClipboard } from './hooks/use-clipboard';
import { DocumentViewer } from './components/document-viewer';
import { CommentPanel } from './components/comment-panel';
import { CommentForm } from './components/comment-form';
import { StatusBar } from './components/status-bar';
import { SummaryView } from './components/summary-view';
import { HelpOverlay } from './components/help-overlay';
import { formatFeedbackForExport } from '../../lib/export-formatter';

interface ReviewCanvasProps {
  filePath: string;
  options?: CanvasOptions;
  onExit?: () => void;
}

export function ReviewCanvas({ filePath, options, onExit }: ReviewCanvasProps) {
  const { stdout } = useStdout();
  const terminalHeight = stdout?.rows ?? 24;
  const visibleHeight = terminalHeight - 6; // Account for status bar and borders

  const { document, loading, error } = useDocument(filePath);
  const {
    comments,
    filter,
    filteredComments,
    setFilter,
    addComment,
    updateComment,
    deleteComment,
    toggleResolve,
    getCommentTypeForLine,
    getUnresolvedCount,
    saveComments,
  } = useComments(document, options?.session, options?.commentsFile);

  const {
    selectedLine,
    selectedCommentIndex,
    focusPanel,
    scrollOffset,
    scrollDown,
    scrollUp,
    goToTop,
    goToBottom,
    goToLine,
    nextComment,
    prevComment,
    togglePanel,
    jumpToSelectedComment,
    setScrollOffset,
  } = useNavigation(document?.lines.length ?? 0, filteredComments);

  const { copied, copyToClipboard } = useClipboard();

  const [viewMode, setViewMode] = useState<ViewMode>('document');
  const [showHelp, setShowHelp] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Adjust scroll offset when selected line changes
  useEffect(() => {
    if (selectedLine - 1 < scrollOffset) {
      setScrollOffset(selectedLine - 1);
    } else if (selectedLine > scrollOffset + visibleHeight) {
      setScrollOffset(selectedLine - visibleHeight);
    }
  }, [selectedLine, scrollOffset, visibleHeight, setScrollOffset]);

  const handleAddComment = useCallback((content: string, type: CommentType) => {
    addComment(selectedLine, content, type);
    setShowCommentForm(false);
  }, [addComment, selectedLine]);

  const handleEditComment = useCallback((content: string, type: CommentType) => {
    if (editingCommentId) {
      updateComment(editingCommentId, { content, type });
      setEditingCommentId(null);
    }
  }, [editingCommentId, updateComment]);

  const handleCopy = useCallback(async () => {
    if (document) {
      const text = formatFeedbackForExport(document.name, comments);
      await copyToClipboard(text);
    }
  }, [document, comments, copyToClipboard]);

  const cycleFilter = useCallback(() => {
    const currentIndex = FILTER_OPTIONS.findIndex((opt) => opt.value === filter);
    const nextIndex = (currentIndex + 1) % FILTER_OPTIONS.length;
    setFilter(FILTER_OPTIONS[nextIndex]!.value as CommentFilter);
  }, [filter, setFilter]);

  useInput((input, key) => {
    // Handle help overlay
    if (showHelp) {
      setShowHelp(false);
      return;
    }

    // Don't handle input when form is open
    if (showCommentForm || editingCommentId) {
      return;
    }

    // Handle delete confirmation
    if (confirmDelete) {
      if (input === 'y' || input === 'Y') {
        deleteComment(confirmDelete);
      }
      setConfirmDelete(null);
      return;
    }

    // Global keybindings
    if (input === '?' || (key.shift && input === '/')) {
      setShowHelp(true);
      return;
    }

    if (input === 'q' || key.escape) {
      onExit?.();
      return;
    }

    if (input === 'v') {
      setViewMode((prev) => (prev === 'document' ? 'summary' : 'document'));
      return;
    }

    if (input === 'y') {
      handleCopy();
      return;
    }

    if (input === 's') {
      saveComments();
      return;
    }

    if (input === 'f') {
      cycleFilter();
      return;
    }

    // Quick filter keys
    const filterNum = parseInt(input, 10);
    if (filterNum >= 0 && filterNum <= 6) {
      const opt = FILTER_OPTIONS.find((o) => o.key === input);
      if (opt) {
        setFilter(opt.value as CommentFilter);
      }
      return;
    }

    if (input === 'u') {
      setFilter('unresolved');
      return;
    }

    if (key.tab) {
      togglePanel();
      return;
    }

    // Panel-specific keybindings
    if (focusPanel === 'document') {
      if (input === 'j' || key.downArrow) {
        scrollDown();
      } else if (input === 'k' || key.upArrow) {
        scrollUp();
      } else if (input === 'g') {
        goToTop();
      } else if (input === 'G') {
        goToBottom();
      } else if (input === 'c' && !options?.readonly) {
        setShowCommentForm(true);
      }
    } else if (focusPanel === 'comments') {
      if (input === 'j' || key.downArrow) {
        nextComment();
      } else if (input === 'k' || key.upArrow) {
        prevComment();
      } else if (key.return) {
        jumpToSelectedComment();
      } else if (input === 'r' && !options?.readonly) {
        const comment = filteredComments[selectedCommentIndex];
        if (comment) {
          toggleResolve(comment.id);
        }
      } else if (input === 'e' && !options?.readonly) {
        const comment = filteredComments[selectedCommentIndex];
        if (comment) {
          setEditingCommentId(comment.id);
        }
      } else if (input === 'd' && !options?.readonly) {
        const comment = filteredComments[selectedCommentIndex];
        if (comment) {
          setConfirmDelete(comment.id);
        }
      }
    }
  });

  if (loading) {
    return (
      <Box>
        <Text>Loading {filePath}...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Text color="red">Error: {error}</Text>
      </Box>
    );
  }

  if (!document) {
    return (
      <Box>
        <Text color="red">No document loaded</Text>
      </Box>
    );
  }

  // Help overlay
  if (showHelp) {
    return <HelpOverlay onClose={() => setShowHelp(false)} />;
  }

  // Comment form
  if (showCommentForm) {
    const line = document.lines.find((l) => l.number === selectedLine);
    return (
      <CommentForm
        lineNumber={selectedLine}
        lineContent={line?.content ?? ''}
        onSubmit={handleAddComment}
        onCancel={() => setShowCommentForm(false)}
      />
    );
  }

  // Edit comment form
  if (editingCommentId) {
    const comment = comments.find((c) => c.id === editingCommentId);
    if (comment) {
      return (
        <CommentForm
          lineNumber={comment.lineNumber}
          lineContent={comment.lineContent}
          initialType={comment.type}
          initialContent={comment.content}
          onSubmit={handleEditComment}
          onCancel={() => setEditingCommentId(null)}
        />
      );
    }
  }

  // Delete confirmation
  if (confirmDelete) {
    return (
      <Box flexDirection="column" borderStyle="single" borderColor="red" padding={1}>
        <Text bold color="red">Delete Comment?</Text>
        <Text>Press 'y' to confirm, any other key to cancel</Text>
      </Box>
    );
  }

  // Summary view
  if (viewMode === 'summary') {
    return (
      <Box flexDirection="column">
        <StatusBar
          fileName={document.name}
          filter={filter}
          totalComments={comments.length}
          unresolvedCount={getUnresolvedCount()}
          copied={copied}
        />
        <SummaryView documentName={document.name} comments={comments} />
      </Box>
    );
  }

  // Main document view
  return (
    <Box flexDirection="column">
      <StatusBar
        fileName={document.name}
        filter={filter}
        totalComments={comments.length}
        unresolvedCount={getUnresolvedCount()}
        copied={copied}
      />
      <Box flexDirection="row" flexGrow={1}>
        <Box flexGrow={1}>
          <DocumentViewer
            document={document}
            selectedLine={selectedLine}
            visibleHeight={visibleHeight}
            scrollOffset={scrollOffset}
            getCommentTypeForLine={getCommentTypeForLine}
            isFocused={focusPanel === 'document'}
          />
        </Box>
        <CommentPanel
          comments={filteredComments}
          selectedIndex={selectedCommentIndex}
          visibleHeight={visibleHeight}
          isFocused={focusPanel === 'comments'}
        />
      </Box>
      <Box paddingX={1}>
        <Text dimColor>
          j/k scroll | c comment | Tab switch | v summary | ? help | q quit
        </Text>
      </Box>
    </Box>
  );
}
