import { useState, useCallback, useEffect, useRef } from 'react';
import path from 'path';
import crypto from 'crypto';
import type { Comment, CommentType, CommentFilter, Document } from '../types';
import { createDebouncedExporter, safeWrite } from '../../../lib/export-utils';
import { formatFeedbackForExport } from '../../../lib/export-formatter';

function generateId(): string {
  return crypto.randomUUID();
}

function getStoragePath(filePath: string, session?: string): string {
  const basename = path.basename(filePath, path.extname(filePath));
  const dir = path.dirname(filePath);
  const sessionSuffix = session ? `-${session}` : '';
  return path.join(dir, `.lgtm-${basename}${sessionSuffix}.json`);
}

interface StoredComment {
  id: string;
  lineNumber: number;
  lineContent: string;
  content: string;
  type: CommentType;
  createdAt: string;
  resolved: boolean;
}

async function loadFromFile(storagePath: string): Promise<Comment[]> {
  try {
    const file = Bun.file(storagePath);
    if (!(await file.exists())) {
      return [];
    }
    const data = await file.json() as StoredComment[];
    return data.map((c) => ({
      ...c,
      createdAt: new Date(c.createdAt),
    }));
  } catch {
    return [];
  }
}

async function saveToFile(storagePath: string, comments: Comment[]): Promise<void> {
  const data = comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));
  await Bun.write(storagePath, JSON.stringify(data, null, 2));
}

export function useComments(document: Document | null, session?: string, commentsFile?: string, exportOnQuit?: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [filter, setFilter] = useState<CommentFilter>('all');
  const [storagePath, setStoragePath] = useState<string | null>(null);

  // Debounced exporter for incremental markdown export
  const exporterRef = useRef(createDebouncedExporter(750));

  // Determine storage path
  useEffect(() => {
    if (commentsFile) {
      setStoragePath(commentsFile);
    } else if (document?.filePath) {
      setStoragePath(getStoragePath(document.filePath, session));
    }
  }, [document?.filePath, session, commentsFile]);

  // Load comments when storage path changes
  useEffect(() => {
    if (storagePath) {
      loadFromFile(storagePath).then(setComments);
    }
  }, [storagePath]);

  // Auto-save on changes
  useEffect(() => {
    if (storagePath && comments.length > 0) {
      saveToFile(storagePath, comments);
    }
  }, [storagePath, comments]);

  // Immediate initial export when document loads (ensures file exists right away)
  useEffect(() => {
    if (!exportOnQuit || !document) return;

    // Write immediately on first load - don't wait for comments
    const text = formatFeedbackForExport(document.name, comments);
    safeWrite(exportOnQuit, text);
    // Note: NOT including comments in deps - only runs on document load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportOnQuit, document]);

  // Incremental export to exportOnQuit path (debounced)
  useEffect(() => {
    if (!exportOnQuit || !document) return;

    // Schedule debounced write whenever comments change
    exporterRef.current.schedule(async () => {
      const text = formatFeedbackForExport(document.name, comments);
      await safeWrite(exportOnQuit, text);
    });
  }, [exportOnQuit, document, comments]);

  // Cleanup on unmount
  useEffect(() => {
    const exporter = exporterRef.current;
    return () => {
      exporter.cancel();
    };
  }, []);

  // Flush pending exports
  const flushExport = useCallback(async () => {
    await exporterRef.current.flush();
  }, []);

  const addComment = useCallback(
    (lineNumber: number, content: string, type: CommentType) => {
      if (!document) return;

      const line = document.lines.find((l) => l.number === lineNumber);
      const comment: Comment = {
        id: generateId(),
        lineNumber,
        lineContent: line?.content || '',
        content,
        type,
        createdAt: new Date(),
        resolved: false,
      };
      setComments((prev) => [...prev, comment]);
    },
    [document]
  );

  const updateComment = useCallback((id: string, updates: Partial<Comment>) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const deleteComment = useCallback((id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const toggleResolve = useCallback((id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c))
    );
  }, []);

  const getFilteredComments = useCallback((): Comment[] => {
    let filtered = [...comments];

    if (filter === 'unresolved') {
      filtered = filtered.filter((c) => !c.resolved);
    } else if (filter !== 'all') {
      filtered = filtered.filter((c) => c.type === filter);
    }

    return filtered.sort((a, b) => a.lineNumber - b.lineNumber);
  }, [comments, filter]);

  const getCommentsForLine = useCallback(
    (lineNumber: number): Comment[] => {
      return comments
        .filter((c) => c.lineNumber === lineNumber)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    },
    [comments]
  );

  const hasCommentsForLine = useCallback(
    (lineNumber: number): boolean => {
      return comments.some((c) => c.lineNumber === lineNumber);
    },
    [comments]
  );

  const getUnresolvedCount = useCallback((): number => {
    return comments.filter((c) => !c.resolved).length;
  }, [comments]);

  const getCommentTypeForLine = useCallback(
    (lineNumber: number): CommentType | null => {
      const lineComments = comments.filter((c) => c.lineNumber === lineNumber);
      if (lineComments.length === 0) return null;
      // Return highest priority type
      const priorities: CommentType[] = ['blocker', 'concern', 'question', 'suggestion', 'praise', 'acknowledge'];
      for (const type of priorities) {
        if (lineComments.some((c) => c.type === type)) {
          return type;
        }
      }
      return lineComments[0]?.type ?? null;
    },
    [comments]
  );

  const saveComments = useCallback(async () => {
    if (storagePath) {
      await saveToFile(storagePath, comments);
    }
  }, [storagePath, comments]);

  return {
    comments,
    filter,
    filteredComments: getFilteredComments(),
    setFilter,
    addComment,
    updateComment,
    deleteComment,
    toggleResolve,
    getCommentsForLine,
    hasCommentsForLine,
    getUnresolvedCount,
    getCommentTypeForLine,
    saveComments,
    flushExport,
  };
}
