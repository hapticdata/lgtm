import { mkdir } from 'node:fs/promises';
import path from 'path';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate that an export path is writable.
 * Creates parent directories if they don't exist.
 */
export async function validateExportPath(exportPath: string): Promise<ValidationResult> {
  try {
    const dir = path.dirname(exportPath);

    // Try to create the directory (no-op if exists)
    await mkdir(dir, { recursive: true });

    // Try to write a test file to verify writability
    const testPath = `${exportPath}.test-${Date.now()}`;
    try {
      await Bun.write(testPath, '');
      await Bun.file(testPath).exists() && await Bun.$`rm ${testPath}`.quiet();
    } catch (err) {
      return {
        valid: false,
        error: `Cannot write to directory: ${err instanceof Error ? err.message : 'Unknown error'}`,
      };
    }

    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: `Cannot create directory: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

/**
 * Safely write content to a file, logging errors to stderr instead of throwing.
 * Returns true on success, false on failure.
 */
export async function safeWrite(filePath: string, content: string): Promise<boolean> {
  try {
    // Ensure parent directory exists
    const dir = path.dirname(filePath);
    await mkdir(dir, { recursive: true });

    await Bun.write(filePath, content);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[lgtm] Export write failed: ${filePath}: ${message}`);
    return false;
  }
}

type ExportCallback = () => Promise<void>;

/**
 * Creates a debounced exporter that batches write operations.
 * Provides a flush() method to force pending writes immediately.
 */
export function createDebouncedExporter(delayMs: number = 750) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingCallback: ExportCallback | null = null;

  const flush = async (): Promise<void> => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (pendingCallback) {
      const callback = pendingCallback;
      pendingCallback = null;
      await callback();
    }
  };

  const schedule = (callback: ExportCallback): void => {
    pendingCallback = callback;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(async () => {
      timeoutId = null;
      if (pendingCallback) {
        const cb = pendingCallback;
        pendingCallback = null;
        await cb();
      }
    }, delayMs);
  };

  const cancel = (): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingCallback = null;
  };

  return { schedule, flush, cancel };
}
