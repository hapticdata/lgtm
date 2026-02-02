import React, { useState, useCallback, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import path from 'path';
import type { CanvasOptions, ViewMode } from './types';
import { useDocument } from './hooks/use-document';
import { useComments } from './hooks/use-comments';
import { useNavigation } from './hooks/use-navigation';
import { useClipboard } from './hooks/use-clipboard';
import { DocumentViewer, COMMENT_PANEL_WIDTH } from './components/document-viewer';
import { CommentPanel } from './components/comment-panel';
import { CommentForm } from './components/comment-form';
import { SummaryView } from './components/summary-view';
import { HelpOverlay } from './components/help-overlay';
import { formatFeedbackForExport } from '../../lib/export-formatter';
import { getErrorMessage } from '../../lib/errors';

interface ReviewCanvasProps {
  filePath: string;
  options?: CanvasOptions;
  onExit?: () => void;
}

export function ReviewCanvas({ filePath, options, onExit }: ReviewCanvasProps) {
  const { stdout } = useStdout();
  const terminalHeight = stdout?.rows ?? 24;
  const terminalWidth = stdout?.columns ?? 80;
  // Account for UI chrome: borders (2) + header (1) + footer (2) + keybindings (1)
  const visibleHeight = terminalHeight - 6;
  const documentPanelWidth = terminalWidth - COMMENT_PANEL_WIDTH;

  const { document, loading, error } = useDocument(filePath);
  const {
    comments,
    addComment,
    updateComment,
    deleteComment,
    toggleResolve,
    hasCommentOnLine,
    saveComments,
    flushExport,
  } = useComments(document, options?.session, options?.commentsFile, options?.exportOnQuit);

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
  } = useNavigation(document?.lines.length ?? 0, comments);

  const { copied, copyToClipboard } = useClipboard();

  const [viewMode, setViewMode] = useState<ViewMode>('document');
  const [showHelp, setShowHelp] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [exportedPath, setExportedPath] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  const handleAddComment = useCallback((content: string) => {
    addComment(selectedLine, content);
    setShowCommentForm(false);
  }, [addComment, selectedLine]);

  const handleEditComment = useCallback((content: string) => {
    if (editingCommentId) {
      updateComment(editingCommentId, { content });
      setEditingCommentId(null);
    }
  }, [editingCommentId, updateComment]);

  const handleCopy = useCallback(async () => {
    if (document) {
      const text = formatFeedbackForExport(document.name, comments);
      await copyToClipboard(text);
    }
  }, [document, comments, copyToClipboard]);

  const handleExport = useCallback(async (exportPath?: string) => {
    if (!document) return;

    const text = formatFeedbackForExport(document.name, comments);
    const targetPath = exportPath ?? path.join(
      path.dirname(filePath),
      `${path.basename(filePath, path.extname(filePath))}-feedback.md`
    );

    try {
      await Bun.write(targetPath, text);
      if (!exportPath) {
        setExportedPath(targetPath);
        setTimeout(() => setExportedPath(null), 3000);
      }
    } catch (err) {
      setExportError(getErrorMessage(err, 'Export failed'));
      setTimeout(() => setExportError(null), 5000);
    }
  }, [document, comments, filePath]);

  // Handle exit with async export - triggered by isExiting state
  useEffect(() => {
    if (!isExiting) return;

    const doExit = async () => {
      // Flush any pending debounced writes first
      await flushExport();
      // Final write for safety (in case no debounced write was pending)
      if (options?.exportOnQuit) {
        await handleExport(options.exportOnQuit);
      }
      // Clear screen on exit
      process.stdout.write('\x1b[2J\x1b[H');
      onExit?.();
    };

    doExit();
  }, [isExiting, options?.exportOnQuit, handleExport, onExit, flushExport]);

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
      setIsExiting(true);
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

    if (input === 'E') {
      handleExport(undefined);
      return;
    }

    if (input === 's') {
      saveComments();
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
        const comment = comments[selectedCommentIndex];
        if (comment) {
          toggleResolve(comment.id);
        }
      } else if (input === 'e' && !options?.readonly) {
        const comment = comments[selectedCommentIndex];
        if (comment) {
          setEditingCommentId(comment.id);
        }
      } else if (input === 'd' && !options?.readonly) {
        const comment = comments[selectedCommentIndex];
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

  // Help is fullscreen
  if (showHelp) {
    return <HelpOverlay />;
  }

  // Determine what to show in the right panel
  let rightPanel: React.ReactNode;
  const formActive = showCommentForm || editingCommentId !== null || confirmDelete !== null;

  if (showCommentForm) {
    rightPanel = (
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="cyan"
        width={40}
        minWidth={40}
        flexShrink={0}
      >
        <Box paddingX={1} borderBottom>
          <Text bold color="cyan">ADD COMMENT</Text>
        </Box>
        <Box flexDirection="column" paddingX={1} flexGrow={1}>
          <CommentForm
            lineNumber={selectedLine}
            onSubmit={handleAddComment}
            onCancel={() => setShowCommentForm(false)}
          />
        </Box>
      </Box>
    );
  } else if (editingCommentId) {
    const comment = comments.find((c) => c.id === editingCommentId);
    if (comment) {
      rightPanel = (
        <Box
          flexDirection="column"
          borderStyle="single"
          borderColor="cyan"
          width={40}
          minWidth={40}
          flexShrink={0}
        >
          <Box paddingX={1} borderBottom>
            <Text bold color="cyan">EDIT COMMENT</Text>
          </Box>
          <Box flexDirection="column" paddingX={1} flexGrow={1}>
            <CommentForm
              lineNumber={comment.lineNumber}
              initialContent={comment.content}
              onSubmit={handleEditComment}
              onCancel={() => setEditingCommentId(null)}
            />
          </Box>
        </Box>
      );
    }
  } else if (confirmDelete) {
    rightPanel = (
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor="red"
        width={40}
        minWidth={40}
        flexShrink={0}
      >
        <Box paddingX={1} borderBottom>
          <Text bold color="red">DELETE COMMENT?</Text>
        </Box>
        <Box flexDirection="column" paddingX={1} paddingY={1} flexGrow={1}>
          <Text>Press 'y' to confirm</Text>
          <Text dimColor>Any other key to cancel</Text>
        </Box>
      </Box>
    );
  } else {
    rightPanel = (
      <CommentPanel
        comments={comments}
        selectedIndex={selectedCommentIndex}
        visibleHeight={visibleHeight}
        isFocused={focusPanel === 'comments'}
      />
    );
  }

  // Summary view
  if (viewMode === 'summary') {
    return (
      <Box flexDirection="column">
        <SummaryView documentName={document.name} comments={comments} />
        <Box paddingX={1}>
          <Text dimColor>
            v back | y copy | q quit
          </Text>
        </Box>
      </Box>
    );
  }

  // Main document view
  return (
    <Box flexDirection="column">
      <Box flexDirection="row" flexGrow={1}>
        <DocumentViewer
          document={document}
          selectedLine={selectedLine}
          visibleHeight={visibleHeight}
          scrollOffset={scrollOffset}
          hasCommentOnLine={hasCommentOnLine}
          isFocused={focusPanel === 'document' && !formActive}
          width={documentPanelWidth}
        />
        {rightPanel}
      </Box>
      <Box paddingX={1}>
        <Text dimColor>
          {showCommentForm || editingCommentId
            ? 'Enter submit | Esc cancel'
            : confirmDelete
              ? 'y confirm | any key cancel'
              : focusPanel === 'comments'
                ? 'j/k navigate | e edit | d delete | r resolve | Enter jump | Tab switch | q quit'
                : 'j/k scroll | c comment | Tab switch | v summary | ? help | q quit'}
        </Text>
      </Box>
    </Box>
  );
}
