import { useState, useCallback, useEffect } from 'react';
import path from 'path';
import type { Document, DocumentLine } from '../types';

/**
 * Maps file extensions to syntax highlighting language identifiers
 */
const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  // JavaScript/TypeScript
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.jsx': 'jsx',
  '.ts': 'typescript',
  '.mts': 'typescript',
  '.cts': 'typescript',
  '.tsx': 'tsx',
  // Python
  '.py': 'python',
  '.pyw': 'python',
  '.pyi': 'python',
  // Go
  '.go': 'go',
  // Rust
  '.rs': 'rust',
  // Shell
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'zsh',
  '.fish': 'shell',
  // SQL
  '.sql': 'sql',
  // CSS
  '.css': 'css',
  '.scss': 'scss',
  '.less': 'less',
  // HTML/XML
  '.html': 'html',
  '.htm': 'html',
  '.xml': 'xml',
  '.svg': 'svg',
  // Config/Data
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  // C/C++
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.hpp': 'cpp',
  '.hxx': 'cpp',
  // Java/Kotlin
  '.java': 'java',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  // Ruby
  '.rb': 'ruby',
  '.erb': 'ruby',
  // PHP
  '.php': 'php',
  // Swift
  '.swift': 'swift',
  // Markdown
  '.md': 'markdown',
  '.mdx': 'markdown',
  // Lua
  '.lua': 'lua',
  // Perl
  '.pl': 'perl',
  '.pm': 'perl',
  // R
  '.r': 'r',
  '.R': 'r',
  // Scala
  '.scala': 'scala',
  // Elixir/Erlang
  '.ex': 'elixir',
  '.exs': 'elixir',
  '.erl': 'erlang',
  // Haskell
  '.hs': 'haskell',
  // Clojure
  '.clj': 'clojure',
  '.cljs': 'clojure',
  // Vim
  '.vim': 'vim',
  // Docker
  '.dockerfile': 'dockerfile',
  // Makefile
  '.mk': 'makefile',
  // GraphQL
  '.graphql': 'graphql',
  '.gql': 'graphql',
  // Protobuf
  '.proto': 'protobuf',
};

/**
 * Gets the syntax highlighting language from a file path
 */
function getLanguageFromPath(filePath: string): string | undefined {
  const ext = path.extname(filePath).toLowerCase();
  if (ext && EXTENSION_TO_LANGUAGE[ext]) {
    return EXTENSION_TO_LANGUAGE[ext];
  }
  // Handle special filenames without extensions
  const basename = path.basename(filePath).toLowerCase();
  if (basename === 'dockerfile') return 'dockerfile';
  if (basename === 'makefile' || basename === 'gnumakefile') return 'makefile';
  if (basename === '.bashrc' || basename === '.bash_profile' || basename === '.zshrc') return 'bash';
  if (basename === '.gitignore' || basename === '.dockerignore') return 'gitignore';
  return undefined;
}

/**
 * Checks if a file is a markdown file
 */
function isMarkdownFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.md' || ext === '.mdx';
}

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

/**
 * Parses a code file where all lines get syntax highlighting
 */
function parseCodeFileToLines(content: string, language: string): DocumentLine[] {
  const rawLines = content.split('\n');
  return rawLines.map((line, i) => ({
    number: i + 1,
    content: line,
    isCodeBlock: true,
    codeLanguage: language,
  }));
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

      // Determine how to parse based on file type
      let lines: DocumentLine[];
      if (isMarkdownFile(fp)) {
        // For markdown, parse code blocks with their languages
        lines = parseMarkdownToLines(content);
      } else {
        // For other files, apply syntax highlighting based on extension
        const language = getLanguageFromPath(fp);
        if (language) {
          lines = parseCodeFileToLines(content, language);
        } else {
          // No known language - parse as plain text
          lines = content.split('\n').map((line, i) => ({
            number: i + 1,
            content: line,
            isCodeBlock: false,
            codeLanguage: undefined,
          }));
        }
      }

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
