import { useState, useCallback, useEffect, useRef } from 'react';
import crypto from 'crypto';
import type { Comment, CommentType, Document } from '../types';
import { COMMENT_TYPE_ORDER } from '../constants';
import { createDebouncedExporter, safeWrite } from '../../../lib/export-utils';
import { formatFeedbackForExport } from '../../../lib/export-formatter';
import { getStoragePath } from '../../../lib/storage-utils';
import { DEBOUNCE_DELAY_MS } from '../../../lib/constants';

function generateId(): string {
  return crypto.randomUUID();
}

function isValidCommentType(type: unknown): type is CommentType {
  return typeof type === 'string' && COMMENT_TYPE_ORDER.includes(type as CommentType);
}

interface StoredComment {
  id: string;
  lineNumber: number;
  lineContent: string;
  content: string;
  type?: string;
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
      type: isValidCommentType(c.type) ? c.type : 'question',
      createdAt: new Date(c.createdAt),
    }));
  } catch {
    return [];
  }
}

async function saveToFile(storagePath: string, comments: Comment[]): Promise<void> {
  const data = comments.map((c) => ({
    id: c.id,
    lineNumber: c.lineNumber,
    lineContent: c.lineContent,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    resolved: c.resolved,
  }));
  await Bun.write(storagePath, JSON.stringify(data, null, 2));
}

export function useComments(document: Document | null, session?: string, commentsFile?: string, exportOnQuit?: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [storagePath, setStoragePath] = useState<string | null>(null);

  const exporterRef = useRef(createDebouncedExporter(DEBOUNCE_DELAY_MS));

  useEffect(() => {
    if (commentsFile) {
      setStoragePath(commentsFile);
    } else if (document?.filePath) {
      setStoragePath(getStoragePath(document.filePath, session));
    }
  }, [document?.filePath, session, commentsFile]);

  useEffect(() => {
    if (storagePath) {
      loadFromFile(storagePath).then(setComments);
    }
  }, [storagePath]);

  useEffect(() => {
    if (storagePath && comments.length > 0) {
      saveToFile(storagePath, comments);
    }
  }, [storagePath, comments]);

  useEffect(() => {
    if (!exportOnQuit || !document) return;
    const text = formatFeedbackForExport(document.name, comments);
    safeWrite(exportOnQuit, text);
  }, [exportOnQuit, document]);

  useEffect(() => {
    if (!exportOnQuit || !document) return;
    exporterRef.current.schedule(async () => {
      const text = formatFeedbackForExport(document.name, comments);
      await safeWrite(exportOnQuit, text);
    });
  }, [exportOnQuit, document, comments]);

  useEffect(() => {
    const exporter = exporterRef.current;
    return () => {
      exporter.cancel();
    };
  }, []);

  const flushExport = useCallback(async () => {
    await exporterRef.current.flush();
  }, []);

  const addComment = useCallback(
    (lineNumber: number, content: string) => {
      if (!document) return;

      const line = document.lines.find((l) => l.number === lineNumber);
      const comment: Comment = {
        id: generateId(),
        lineNumber,
        lineContent: line?.content || '',
        content,
        type: 'question',
        createdAt: new Date(),
        resolved: false,
      };
      setComments((prev) => [...prev, comment].sort((a, b) => a.lineNumber - b.lineNumber));
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

  const hasCommentOnLine = useCallback(
    (lineNumber: number): boolean => {
      return comments.some((c) => c.lineNumber === lineNumber);
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
    addComment,
    updateComment,
    deleteComment,
    toggleResolve,
    hasCommentOnLine,
    saveComments,
    flushExport,
  };
}
