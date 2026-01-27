import { useCallback } from 'react';
import path from 'path';
import type { Comment, ReviewSession } from '../types';

function getSessionPath(filePath: string, sessionName?: string): string {
  const basename = path.basename(filePath, path.extname(filePath));
  const dir = path.dirname(filePath);
  const sessionSuffix = sessionName ? `-${sessionName}` : '';
  return path.join(dir, `.lgtuim-${basename}${sessionSuffix}.json`);
}

interface StoredSession {
  id: string;
  filePath: string;
  comments: Array<{
    id: string;
    lineNumber: number;
    lineContent: string;
    content: string;
    type: string;
    createdAt: string;
    resolved: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

export function usePersistence(filePath: string | null, sessionName?: string) {
  const loadSession = useCallback(async (): Promise<ReviewSession | null> => {
    if (!filePath) return null;

    const sessionPath = getSessionPath(filePath, sessionName);
    try {
      const file = Bun.file(sessionPath);
      if (!(await file.exists())) {
        return null;
      }
      const data = await file.json() as StoredSession;
      return {
        id: data.id,
        filePath: data.filePath,
        comments: data.comments.map((c) => ({
          ...c,
          type: c.type as Comment['type'],
          createdAt: new Date(c.createdAt),
        })),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    } catch {
      return null;
    }
  }, [filePath, sessionName]);

  const saveSession = useCallback(
    async (comments: Comment[]): Promise<void> => {
      if (!filePath) return;

      const sessionPath = getSessionPath(filePath, sessionName);
      const session: StoredSession = {
        id: sessionName || 'default',
        filePath,
        comments: comments.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await Bun.write(sessionPath, JSON.stringify(session, null, 2));
    },
    [filePath, sessionName]
  );

  const deleteSession = useCallback(async (): Promise<void> => {
    if (!filePath) return;

    const sessionPath = getSessionPath(filePath, sessionName);
    try {
      const file = Bun.file(sessionPath);
      if (await file.exists()) {
        await Bun.$`rm ${sessionPath}`;
      }
    } catch {
      // Ignore errors
    }
  }, [filePath, sessionName]);

  return {
    loadSession,
    saveSession,
    deleteSession,
  };
}
