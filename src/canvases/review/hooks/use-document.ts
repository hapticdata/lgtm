import { useState, useCallback, useEffect } from 'react';
import path from 'path';
import type { Document, DocumentLine } from '../types';

function parseMarkdownToLines(content: string): DocumentLine[] {
  const rawLines = content.split('\n');
  const lines: DocumentLine[] = [];
  let inCodeBlock = false;
  let codeLanguage: string | undefined;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i]!;

    // Check for code block start/end
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim() || undefined;
      } else {
        inCodeBlock = false;
        codeLanguage = undefined;
      }
    }

    lines.push({
      number: i + 1,
      content: line,
      isCodeBlock: inCodeBlock,
      codeLanguage: inCodeBlock ? codeLanguage : undefined,
    });
  }

  return lines;
}

export function useDocument(filePath: string | null) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocument = useCallback(async (fp: string) => {
    setLoading(true);
    setError(null);

    try {
      const file = Bun.file(fp);
      if (!(await file.exists())) {
        throw new Error(`File not found: ${fp}`);
      }

      const content = await file.text();
      const lines = parseMarkdownToLines(content);

      const doc: Document = {
        name: path.basename(fp),
        filePath: fp,
        content,
        lines,
        loadedAt: new Date(),
      };

      setDocument(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load document');
    } finally {
      setLoading(false);
    }
  }, []);

  const reloadDocument = useCallback(async () => {
    if (document?.filePath) {
      await loadDocument(document.filePath);
    }
  }, [document?.filePath, loadDocument]);

  useEffect(() => {
    if (filePath) {
      loadDocument(filePath);
    }
  }, [filePath, loadDocument]);

  return {
    document,
    loading,
    error,
    loadDocument,
    reloadDocument,
  };
}
